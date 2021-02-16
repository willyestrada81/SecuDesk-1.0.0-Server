const logsResolvers = require('./incident_logs');
const usersResolvers = require('./employees');
const commentsResolvers = require('./comments');
const tenantsResolvers = require('./tenants');
const dashboardResolvers = require('./dashboard')
const fileResolvers = require('./file')

module.exports = {
  Tenant: {
    incidentCount: parent => parent.incident_logs.length
  },
  Query: {
    ...logsResolvers.Query,
    ...tenantsResolvers.Query,
    ...dashboardResolvers.Query
  },
  Mutation: {
    ...usersResolvers.Mutation,
    ...logsResolvers.Mutation,
    ...commentsResolvers.Mutation,
    ...tenantsResolvers.Mutation,
    ...fileResolvers.Mutation
  },
  Subscription: {
    ...tenantsResolvers.Subscription
  }
};
