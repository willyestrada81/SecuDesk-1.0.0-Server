const logsResolvers = require('./incidentLogs')
const employeesResolvers = require('./employees')
const tenantsResolvers = require('./tenants')
const dashboardResolvers = require('./dashboard')
const fileResolvers = require('./file')
const messageResolvers = require('./messages')
const systemActivitiesResolvers = require('./systemActivities')
const visitorLogsResolvers = require('./visitorLogs')
const packagesResolvers = require('./packages')
const customIncidentFields = require('./customIncidentFields')

module.exports = {
  Tenant: {
    incidentCount: parent => parent.incidentLogs.length,
    visitorCount: parent => parent.visitorsLogs.length
  },
  Query: {
    ...logsResolvers.Query,
    ...tenantsResolvers.Query,
    ...dashboardResolvers.Query,
    ...messageResolvers.Query,
    ...employeesResolvers.Query,
    ...systemActivitiesResolvers.Query,
    ...visitorLogsResolvers.Query,
    ...packagesResolvers.Query,
    ...customIncidentFields.Query
  },
  Mutation: {
    ...employeesResolvers.Mutation,
    ...logsResolvers.Mutation,
    ...tenantsResolvers.Mutation,
    ...fileResolvers.Mutation,
    ...messageResolvers.Mutation,
    ...visitorLogsResolvers.Mutation,
    ...packagesResolvers.Mutation,
    ...customIncidentFields.Mutation

  },
  Subscription: {
    ...tenantsResolvers.Subscription
  }
}
