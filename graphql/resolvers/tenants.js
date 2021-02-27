const { UserInputError } = require('apollo-server')
const checkAuth = require('../../util/check-auth')

const { validateInputs } = require('../../util/validators')

const Tenant = require('../../models/Tenants')
const Activity = require('../../models/Activities')

module.exports = {
  Query: {
    async getTenants (_, {}, context) {
      checkAuth(context)
      try {
        const tenants = await Tenant.find()
        return tenants
      } catch (err) {
        throw new Error(err)
      }
    },
    async getTenantById (_, { tenantId }, context) {
      checkAuth(context)
      try {
        const tenant = await Tenant.findById(tenantId)
        if (tenant) {
          return tenant
        } else {
          throw new UserInputError('Tenant not found')
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    async registerTenant (
      _,
      {
        registerTenantInput: {
          tenantFirstName,
          tenantLastName,
          tenantDateOfBirth,
          apartment,
          moveinDate,
          tenantPhone,
          tenantEmail,
          tenantProfilePhoto
        }
      },
      context
    ) {
      const { id, firstName, lastName } = checkAuth(context)
      // TODO: Validate Tenant Inputs and Only Super Admin can Add Tenants

      // Validate new tenant inputs
      const { valid, errors } = validateInputs({
        tenantFirstName,
        tenantLastName,
        tenantDateOfBirth,
        apartment,
        moveinDate,
        tenantPhone,
        tenantEmail
      })
      if (!valid) {
        throw new UserInputError('Errors', { errors })
      }

      const newTenant = new Tenant({
        tenantFirstName,
        tenantLastName,
        tenantDateOfBirth,
        apartment,
        moveinDate: new Date(moveinDate).toISOString(),
        tenantPhone,
        tenantEmail,
        createdAt: new Date().toISOString(),
        createdBy: `${firstName} ${lastName}`,
        employeeId: id,
        tenantProfilePhoto: tenantProfilePhoto || 'https://secu-desk.s3.amazonaws.com/defaultProfile.png' // eslint-disable-line
      })

      const tenant = await newTenant.save()

      const newActivity = new Activity({
        activityType: 'NEW_TENANT_REGISTERED',
        createdBy: `${firstName} ${lastName}`,
        createdAt: new Date().toISOString(),
        employeeId: id,
        message: 'New resident registered'
      })

      await newActivity.save()

      context.pubsub.publish('NEW_TENANT', {
        registerTenant: tenant
      })

      return tenant
    },
    async getTenantByApartment (_, { apartment }, context) {
      checkAuth(context)
      try {
        const tenant = await Tenant.findOne({ apartment })
        if (tenant) {
          return tenant
        } else {
          throw new UserInputError('Tenant not found')
        }
      } catch (err) {
        throw new Error(err)
      }
    },
    async searchTenants (_, { filter }, context) {
      checkAuth(context)
      try {
        const tenant = await Tenant.find({ $text: { $search: filter } })
          .limit(10)
        if (tenant) {
          return tenant
        } else {
          throw new UserInputError('Tenant not found')
        }
      } catch (err) {
        throw new Error(err)
      }
    },
    async deleteTenant (_, { tenantId }, context) {
      // TODO: Only Super Admins can delete tenants
      const { firstName, lastName, isAdmin, id } = checkAuth(context)

      if (isAdmin) {
        try {
          const tenant = await Tenant.findById(tenantId)

          if (tenant) {
            await tenant.delete()

            const newActivity = new Activity({
              activityType: 'TENANT_DELETED',
              createdBy: `${firstName} ${lastName}`,
              createdAt: new Date().toISOString(),
              employeeId: id,
              message: `Resident "${tenant.tenantFirstName} ${tenant.tenantLastName}" Deleted`
            })

            await newActivity.save()

            return 'Tenant deleted successfully'
          } else {
            throw new UserInputError('No tenant found with the Id provided')
          }
        } catch (err) {
          throw new Error(err)
        }
      } else {
        throw new UserInputError('Unauthorized. Operation is forbidden')
      }
    },
    async updateTenantSelf (_, { tenantId, registerTenantInput }, context) {
      const { firstName, lastName, id } = checkAuth(context)

      let tenant = await Tenant.findById(tenantId)

      if (tenant.id !== id) throw new UserInputError('Unauthorized. Operation is forbidden')

      try {
        const update = registerTenantInput
        tenant = await Tenant.findByIdAndUpdate(tenantId, update, {
          new: true, useFindAndModify: false
        })

        const newActivity = new Activity({
          activityType: 'RESIDENT_UPDATED',
          createdBy: `${firstName} ${lastName}`,
          createdAt: new Date().toISOString(),
          employeeId: '',
          message: `Resident "${tenant.firstName} ${tenant.lastName}" Updated`
        })

        await newActivity.save()

        return tenant
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Subscription: {
    registerTenant: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator('NEW_TENANT')
    }
  }
}
