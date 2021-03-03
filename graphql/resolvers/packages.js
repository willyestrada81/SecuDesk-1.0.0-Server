const { UserInputError } = require('apollo-server')

const Packages = require('../../models/Packages')
const Tenant = require('../../models/Tenants')
const Activity = require('../../models/Activities')
const checkAuth = require('../../util/check-auth')

module.exports = {
  Query: {
    async getPackages (_, { }, context) {
      checkAuth(context)
      try {
        const packages = await Packages.find().sort({ receivedDate: -1 })
        return packages
      } catch (err) {
        throw new Error(err)
      }
    },
    async getPackageById(_, { packageId }, context) {
      checkAuth(context)
      try {
        const singlePackage = await Packages.findById(packageId)
        if (singlePackage) {
          return singlePackage
        } else throw new UserInputError('Package not found')
      } catch (err) {
        throw new Error(err)
      }
    },
    async getPackagesByTenantId (_, { tenantId }, context) {
      checkAuth(context)

      const tenant = await Tenant.findById(tenantId)
      if (tenant) {
        const tenantPackages = await Packages.find({
          recipientId: tenantId
        })
        if (tenantPackages) return tenantPackages
      } else throw new UserInputError('Tenant not found')
    }
  },
  Mutation: {
    async createNewPackage (_, { tenantId, isDelivered, notes }, context) {
      const { id, firstName, lastName } = checkAuth(context)

      if (tenantId.trim() === '') {
        throw new UserInputError('Tenant Id must not be empty')
      }

      const tenant = await Tenant.findById(tenantId)
      if (tenant) {
        const newPackage = new Packages({
          receivedDate: new Date().toISOString(),
          receivedByEmployeeId: id,
          receivedByEmployee: `${firstName} ${lastName}`,
          recipientName: `${tenant.tenantFirstName} ${tenant.tenantLastName}`,
          recipientId: tenant.id,
          notes,
          isDelivered: isDelivered || false,
          delivery: isDelivered && {
            isDelivered: true,
            deliveredByEmployeeId: id,
            receivedByTenantId: tenant.id,
            deliveryDate: new Date().toISOString(),
            receivedByEmployee: `${firstName} ${lastName}`,
            receivedByTenant: `${tenant.tenantFirstName} ${tenant.tenantLastName}`,
            notes
          }
        })
        await newPackage.save()

        const newActivity = new Activity({
          activityType: 'NEW_PACKAGE_RECEIVED',
          createdBy: `${firstName} ${lastName}`,
          createdAt: new Date().toISOString(),
          employeeId: id,
          message: 'New package received'
        })

        await newActivity.save()
        return newPackage
      }
    },
    async deliverPackage (_, { packageId, tenantId, notes }, context) {
      const { id, firstName, lastName } = checkAuth(context)

      if (packageId.trim() === '') {
        throw new UserInputError('Package Id must not be empty')
      }
      if (tenantId.trim() === '') {
        throw new UserInputError('Tenant Id must not be empty')
      }

      const tenant = await Tenant.findById(tenantId)
      let singlePackage = await Packages.findById(packageId)
      if (singlePackage && tenant) {
        const isDelivered = await Packages.findOne({
          _id: packageId,
          isDelivered: true
        })

        if (isDelivered) throw new UserInputError('Error: Package already Deliverd')

        if (!singlePackage.recipientId.equals(tenantId)) throw new UserInputError('Error: Cannot deliver a package that does not belong to the provided tenant id')

        singlePackage = await Packages.findByIdAndUpdate(packageId, {
          isDelivered: true,
          delivery: {
            deliveredByEmployeeId: id,
            receivedByTenantId: tenant.id,
            deliveryDate: new Date().toISOString(),
            receivedByEmployee: `${firstName} ${lastName}`,
            receivedByTenant: `${tenant.tenantFirstName} ${tenant.tenantLastName}`,
            notes
          }
        }, {
          new: true, useFindAndModify: false
        })

        const newActivity = new Activity({
          activityType: 'PACKAGE_DELIVERED',
          createdBy: `${firstName} ${lastName}`,
          createdAt: new Date().toISOString(),
          employeeId: id,
          message: 'Package Delivered'
        })

        await newActivity.save()
        return singlePackage
      }
    }
  }
}
