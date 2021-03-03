const { UserInputError } = require('apollo-server')

const VisitorLogs = require('../../models/VisitorLogs')
const Tenant = require('../../models/Tenants')
const Activity = require('../../models/Activities')
const checkAuth = require('../../util/check-auth')

module.exports = {
  Query: {
    async getVisitorLogs (_, {}, context) {
      checkAuth(context)
      try {
        const visitorLogs = await VisitorLogs.find().sort({ createdAt: -1 })
        return visitorLogs
      } catch (err) {
        throw new Error(err)
      }
    },
    async getVisitorLog (_, { tenantId, visitorLogId }) {
      try {
        const tenant = await Tenant.findById(tenantId)
        if (tenant) {
          const visitorLog = await VisitorLogs.findById(visitorLogId)
          if (visitorLog) {
            return visitorLog
          } else {
            throw new Error('Visitor not found')
          }
        } else throw new Error('Tenant not found')
      } catch (err) {
        throw new Error(err)
      }
    },
    async getVisitorsByTenantId (_, { tenantId }, context) {
      checkAuth(context)

      const tenant = await Tenant.findById(tenantId)
      if (tenant) {
        const tenantsVisitors = await VisitorLogs.find({
          visitsLogs: { $elemMatch: { tenantId } }
        })

        return tenantsVisitors
      } else {
        throw new UserInputError('Visitor or Tenant does not exist')
      }
    },
    async getTenantVisitLogs (_, { tenantId, visitorId }, context) {
      checkAuth(context)

      const tenant = await Tenant.findById(tenantId)
      const visitor = await VisitorLogs.findById(visitorId)
      if (tenant && visitor) {
        const visitLogs = await VisitorLogs.findOne({
          _id: visitorId,
          visitsLogs: { $elemMatch: { tenantId: tenantId } }
        })

        return visitLogs
      } else {
        throw new UserInputError('Visitor or Tenant does not exist')
      }
    }
  },
  Mutation: {
    async createVisitorLog (
      _,
      { tenantId, NewVisitorInputs: { visitorName, visitorLastName, notes } },
      context
    ) {
      const { id, firstName, lastName } = checkAuth(context)
      if (visitorName.trim() === '') {
        throw new Error("Visitor's name cannot be empty")
      }
      if (visitorLastName.trim() === '') {
        throw new Error("Visitor's last name cannot be empty")
      }

      const visitorLog = {
        visitorName,
        visitorLastName,
        createdAt: new Date().toISOString(),
        notes,
        visitsLogs: [
          {
            visitDate: new Date().toISOString(),
            createdBy: `${firstName} ${lastName}`,
            employeeId: id,
            tenantId
          }
        ]
      }
      const newVisitor = new VisitorLogs(visitorLog)
      newVisitor.save()
      const newActivity = new Activity({
        activityType: 'NEW_VISITOR_CREATED',
        createdBy: `${firstName} ${lastName}`,
        createdAt: new Date().toISOString(),
        employeeId: id,
        message: `Visitor "${visitorName} ${visitorLastName}" created`
      })
      await newActivity.save()
      return newVisitor
    },
    async logVisit (_, { tenantId, visitorId }, context) {
      const { id, firstName, lastName } = checkAuth(context)

      if (tenantId.trim() === '') {
        throw new Error('A Tenant Id is required')
      }
      if (visitorId.trim() === '') {
        throw new Error('A Visitor Id is required')
      }

      const tenant = await Tenant.findById(tenantId)
      const visitor = await VisitorLogs.findById(visitorId)
      if (tenant && visitor) {
        const isBanned = await Tenant.findOne({
          _id: tenantId,
          bannedVisitors: { $elemMatch: { visitorId: visitorId } }
        })

        if (isBanned) {
          throw new UserInputError(
            'Visitor is Banned, please contact resident'
          )
        }

        const visit = {
          visitDate: new Date().toISOString(),
          createdBy: `${firstName} ${lastName}`,
          employeeId: id,
          tenantId
        }
        visitor.visitsLogs.unshift(visit)
        await visitor.save()
        const newActivity = new Activity({
          activityType: 'NEW_VISITOR_LOGGED',
          createdBy: `${firstName} ${lastName}`,
          createdAt: new Date().toISOString(),
          employeeId: id,
          message: `Visitor "${visitor.visitorName} ${visitor.visitorLastName}" just checked in`
        })
        await newActivity.save()
        return visitor
      }
    },
    async banVisitor (_, { tenantId, visitorId }, context) {
      const { firstName, lastName, id } = checkAuth(context)

      const tenant = await Tenant.findById(tenantId)
      const visitor = await VisitorLogs.findById(visitorId)
      if (tenant && visitor) {
        const isBanned = await Tenant.findOne({
          _id: tenantId,
          bannedVisitors: { $elemMatch: { visitorId: visitorId } }
        })

        if (isBanned) {
          throw new UserInputError(
            'Visitor is already banned by this resident, please contact the resident'
          )
        }

        tenant.bannedVisitors.push({
          visitorName: visitor.visitorName,
          visitorId,
          changedDate: new Date().toISOString(),
          changedBy: id
        })

        await Tenant.updateOne(
          { _id: tenantId },
          {
            $pull: {
              permanentVisitors: { $elemMatch: { visitorId: visitorId } }
            }
          }
        )

        tenant.save()

        const newActivity = new Activity({
          activityType: 'VISITOR_BANNED',
          createdBy: `${firstName} ${lastName}`,
          createdAt: new Date().toISOString(),
          employeeId: id,
          message: `Visitor "${visitor.visitorName} ${visitor.visitorLastName}" was just banned for resident ${tenant.tenantFirstName}`
        })

        await newActivity.save()

        return tenant
      } else {
        throw new UserInputError('Visitor or Tenant does not exist')
      }
    },
    async makeVisitorPermanent (_, { tenantId, visitorId }, context) {
      const { firstName, lastName, id } = checkAuth(context)

      const tenant = await Tenant.findById(tenantId)
      const visitor = await VisitorLogs.findById(visitorId)
      if (tenant && visitor) {
        const isPermanent = await Tenant.findOne({
          _id: tenantId,
          permanentVisitors: { $elemMatch: { visitorId: visitorId } }
        })

        if (isPermanent) {
          throw new UserInputError(
            'Visitor is already a permanent visitor for this resident, please contact the resident'
          )
        }

        tenant.permanentVisitors.push({
          visitorName: visitor.visitorName,
          visitorId,
          changedDate: new Date().toISOString(),
          changedBy: id
        })
        tenant.save()

        await Tenant.updateOne(
          { _id: tenantId },
          {
            $pull: {
              bannedVisitors: { $elemMatch: { visitorId: visitorId } }
            }
          }
        )

        const newActivity = new Activity({
          activityType: 'VISITOR_TURNED_PERMANENT',
          createdBy: `${firstName} ${lastName}`,
          createdAt: new Date().toISOString(),
          employeeId: id,
          message: `Visitor "${visitor.visitorName} ${visitor.visitorLastName}" is now permanent for resident ${tenant.tenantFirstName}`
        })

        await newActivity.save()

        return tenant
      } else {
        throw new UserInputError('Visitor or Tenant does not exist')
      }
    },
    async removePermanentVisitor (_, { tenantId, visitorId }, context) {
      const { firstName, lastName, id } = checkAuth(context)

      const tenant = await Tenant.findById(tenantId)
      const visitor = await VisitorLogs.findById(visitorId)
      if (tenant && visitor) {
        const isPermanent = await Tenant.findOne({
          _id: tenantId,
          permanentVisitors: { $elemMatch: { visitorId: visitorId } }
        })

        if (isPermanent) {
          await Tenant.updateOne(
            { _id: tenantId },
            {
              $pull: {
                permanentVisitors: { $elemMatch: { visitorId: visitorId } }
              }
            }
          )
        }

        const newActivity = new Activity({
          activityType: 'PERMANENT_VISITOR_REMOVED',
          createdBy: `${firstName} ${lastName}`,
          createdAt: new Date().toISOString(),
          employeeId: id,
          message: `Visitor "${visitor.visitorName}" is NOT a permanent visitor for resident ${tenant.tenantFirstName}`
        })

        await newActivity.save()

        return tenant
      } else {
        throw new UserInputError('Visitor or Tenant does not exist')
      }
    },
    async removeBannedVisitor (_, { tenantId, visitorId }, context) {
      const { firstName, lastName, id } = checkAuth(context)

      const tenant = await Tenant.findById(tenantId)
      const visitor = await VisitorLogs.findById(visitorId)
      if (tenant && visitor) {
        const isBanned = await Tenant.findOne({
          _id: tenantId,
          bannedVisitors: { $elemMatch: { visitorId: visitorId } }
        })

        if (isBanned) {
          await Tenant.updateOne(
            { _id: tenantId },
            {
              $pull: {
                bannedVisitors: { $elemMatch: { visitorId: visitorId } }
              }
            }
          )
        }

        const newActivity = new Activity({
          activityType: 'BANNED_VISITOR_REMOVED',
          createdBy: `${firstName} ${lastName}`,
          createdAt: new Date().toISOString(),
          employeeId: id,
          message: `Visitor "${visitor.visitorName}" is NOT banned by resident ${tenant.tenantFirstName} anymore`
        })

        await newActivity.save()

        return tenant
      } else {
        throw new UserInputError('Visitor or Tenant does not exist')
      }
    },
    async searchVisitors (_, { filter }, context) {
      checkAuth(context)
      try {
        const visitor = await VisitorLogs.find({ $text: { $search: filter } })
          .limit(10)
        if (visitor) {
          return visitor
        } else {
          throw new UserInputError('No visitor found by the search term.')
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
