const moment = require("moment");
const { UserInputError } = require("apollo-server");
const checkAuth = require("../../util/check-auth");

const { validateInputs } = require("../../util/validators");

const Tenant = require("../../models/Tenants");

module.exports = {
  Query: {
    async getTenants(_, {}, context) {
      checkAuth(context);
      try {
        const tenants = await Tenant.find();
        return tenants;
      } catch (err) {
        throw new Error(err);
      }
    },
    async getTenant(_, { tenantId }, context) {
      checkAuth(context);
      try {
        const tenant = await Tenant.findById(tenantId);
        if (tenant) {
          return tenant;
        } else {
          throw new UserInputError("Tenant not found");
        }
      } catch (err) {
        throw new Error(err);
      }
    }
  },
  Mutation: {
    async registerTenant(
      _,
      {
        registerTenantInput: {
          tenant_firstName,
          tenant_lastName,
          tenant_DOB,
          apartment,
          moveinDate,
          tenant_phone,
          tenant_email,
          tenant_profilePhoto
        }
      },
      context
    ) {
      const { id, firstName, lastName } = checkAuth(context);
      // TODO: Validate Tenant Inputs and Only Super Admin can Add Tenants

      // Validate new tenant inputs
      const { valid, errors } = validateInputs({
        tenant_firstName,
        tenant_lastName,
        tenant_DOB,
        apartment,
        moveinDate,
        tenant_phone,
        tenant_email
      });
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const newTenant = new Tenant({
        tenant_firstName,
        tenant_lastName,
        tenant_DOB,
        apartment,
        moveinDate: new Date(moveinDate).toISOString(),
        tenant_phone,
        tenant_email,
        createdAt: new Date().toISOString(),
        createdBy: `${firstName} ${lastName}`,
        employeeId: id,
        tenant_profilePhoto: tenant_profilePhoto || "https://secu-desk.s3.amazonaws.com/defaultProfile.png"
      });

      const tenant = await newTenant.save();
      context.pubsub.publish("NEW_TENANT", {
        registerTenant: tenant
      });

      return tenant;
    },
    async getTenantByApartment(_, { apartment }, context) {
      checkAuth(context);
      try {
        const tenant = await Tenant.findOne({apartment});
        if (tenant) {
          return tenant;
        } else {
          throw new UserInputError("Tenant not found");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
    async searchTenants(_, { filter }, context) {
      // checkAuth(context);
      try {
        const tenant = await Tenant.find({$text: {$search: filter}})
        .limit(10)
        if (tenant) {
          return tenant;
        } else {
          throw new UserInputError("Tenant not found");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
    async deleteTenant(_, { tenantId }, context) {
      // TODO: Only Super Admins can delete tenants
      const employee = checkAuth(context);

      try {
        const tenant = await Tenant.findById(tenantId);

        if (tenant) {
          await tenant.delete();
          return "Log deleted successfully";
        } else {
          throw new UserInputError("No tenant found with the Id provided");
        }
      } catch (err) {
        throw new Error(err);
      }
    }
  },
  Subscription: {
    registerTenant: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator("NEW_TENANT")
    }
  }
};
