const IncidentLog = require('../../models/Incident_logs');
const Tenant = require('../../models/Tenants');
const checkAuth = require('../../util/check-auth');

module.exports = {
  Query: {
    async getIncidentLogs(_, {}, context) {
      checkAuth(context);
      try {
        const tenantLogs = await IncidentLog.find().sort({ createdAt: -1 });
        return tenantLogs
      } catch (err) {
        throw new Error(err);
      }
    },
    async getIncidentLog(_, { tenantId, incidentLogId }) {
      try {
        const tenant = await Tenant.findById(tenantId);
        if (tenant) {
          const incidentLog = await IncidentLog.findById(incidentLogId);
        if (incidentLog) {
          return incidentLog;
        } else {
          throw new Error('Log not found');
        }
        } else throw new Error('Tenant not found');
      } catch (err) {
        throw new Error(err);
      }
    }
  },
  Mutation: {
    async createIncidentLog(_, { tenantId, incidentType, notes }, context) {
      const { id, firstName, lastName } = checkAuth(context);

      if (tenantId.trim() === '') {
        throw new Error('Tenant Id must not be empty');
      }
      if (incidentType.trim() === '') {
        throw new Error('Log type must not be empty');
      }

      const tenant = await Tenant.findById(tenantId);
      if (tenant) {
        const log = {
          incidentType,
          notes,
          createdAt: new Date().toISOString(),
          createdBy: `${firstName} ${lastName}`,
          employeeId: id
        }
        tenant.incident_logs.unshift(log)
  
        await tenant.save();

        const newIncident = new IncidentLog({
          incidentType: log.incidentType,
          notes: log.notes,
          createdAt: log.createdAt,
          createdBy: log.createdBy,
          employeeId: log.employeeId,
          tenant
        });
        newIncident.save();
        return tenant;
      }
    }
    // async deleteLog(_, { logId }, context) {
    //   const employee = checkAuth(context);

    //   try {
    //     const log = await Log.findById(logId);
    //     if (employee.username === log.username) {
    //       await log.delete();
    //       return 'Log deleted successfully';
    //     } else {
    //       throw new AuthenticationError('Action not allowed');
    //     }
    //   } catch (err) {
    //     throw new Error(err);
    //   }
    // }
  }
};
