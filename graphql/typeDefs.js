const { gql } = require('apollo-server')

module.exports = gql`
  type IncidentLog {
    id: ID!
    incidentType: String!
    createdAt: String!
    createdBy: String!
    notes: String
    employeeId: ID!
  }
  type IncidentLogs {
    id: ID!
    incidentType: String!
    notes: String
    createdAt: String!
    createdBy: String!
    tenant: ID!
    employeeId: ID!
    lastHourIncidents: Boolean!
    last2HourIncidents: Boolean!
    last24HoursIncidents: Boolean!
    last48HoursIncidents: Boolean!
  }
  type Tenant {
    id: ID!
    tenantFirstName: String!
    tenantLastName: String!
    tenantDateOfBirth: String!
    apartment: String!
    moveinDate: String
    tenantPhone: String!
    tenantEmail: String!
    createdAt: String!
    createdBy: String!
    employeeId: ID!
    tenantProfilePhoto: String
    incidentLogs: [IncidentLog]!
    incidentCount: Int!
    visitorCount: Int!
    bannedVisitors: [Visitor]
    permanentVisitors: [Visitor]
  }
  
  type Visitor {
    visitorName: String!
    visitorId: ID!
    changedDate: String!
    changedBy: ID!
  }

  type VisitsLogs {
    id: ID!
    visitDate: String!
    createdBy: String!
    employeeId: ID!
    tenantId: ID!
  }

  type VisitorLog {
    id: ID!
    visitorName: String
    visitorLastName: String
    createdAt: String
    notes: String
    visitsLogs: [VisitsLogs]!
  }

input NewVisitorInputs {
  visitorName: String!
  visitorLastName: String!
  isBanned: Boolean
  isPermanent: Boolean
  notes: String
}

  type Employee {
    firstName: String!
    lastName: String!
    organization: String!
    id: ID!
    email: String!
    token: String!
    mustResetPassword: Boolean!
    isAdmin: Boolean!
    createdAt: String!
    gender: String!
    hireDate: String!
    bio: String
    jobTitle: String!
    address: String!
    city: String
    state: String
    zip: String
    employeeProfilePhoto: String
    setPasswordUrl: String
  }

  input RegisterEmployeeInput {
    firstName: String
    lastName: String
    organization: String
    email: String
    isAdmin: Boolean
    gender: String
    hireDate: String
    bio: String
    jobTitle: String
    address: String
    city: String
    state: String
    zip: String
    employeeProfilePhoto: String
  }

  input RegisterTenantInput {
    tenantFirstName: String!
    tenantLastName: String!
    tenantDateOfBirth: String!
    apartment: String!
    moveinDate: String
    tenantPhone: String!
    tenantEmail: String!
    tenantProfilePhoto: String
  }

  input NewMessageInput {
    messageSubject: String!
    messageBody: String!
  }

  type Dashboard {
    visitor: [IncidentLogs]
    repairs: [IncidentLogs]
    delivery: [IncidentLogs]
    incidentsLastHour: [IncidentLogs]
    incidentsBeforeLastHour: [IncidentLogs]
    incidentsLast24Hours: [IncidentLogs]
    incidentsBeforeLast24Hours: [IncidentLogs]
    percentageOfIncreaseByHour: Float
    percentageOfIncreaseBy24Hours: Float
    percentageDelivery: Float
    percentageVisitor: Float
    percentageRepairs: Float
  }

  type File {
    _id: ID!
    location: String!
    filename: String!
    mimetype: String!
    encoding: String!
  }

  type Replies {
    id: ID!
    createdAt: String
    replyBody: String
    employeeIdBy: ID!
    repliedBy: String
  }

  type Message {
    id: ID!
    messageSubject: String!
    messageBody: String!
    createdAt: String
    createdBy: ID
    isNewMessage: Boolean
    isRead: Boolean
    isReplied: Boolean
    replyBody: Boolean
    replies: [Replies]
  }

  type SystemActivity {
    id: ID!
    activityType: String!
    createdBy: String!
    createdAt: String!
    message: String!
    employeeId: ID
  }

  type Query {
    getIncidentLogs: [IncidentLogs]
    getIncidentLog(tenantId: ID!, incidentLogId: ID!): IncidentLog
    getTenants: [Tenant]
    getDashboard: Dashboard
    getTenantById(tenantId: ID!): Tenant
    getMessages: [Message]
    getMessageById(messageId: ID!): [Message]
    getSystemActivities: [SystemActivity]
    getSystemActivityById(activityId: ID!): SystemActivity
    getEmployeeById(employeeId: ID!): Employee
    getVisitorLogs: [VisitorLog]
    getVisitorLog(tenantId: ID!, visitorLogId: ID!): VisitorLog
    getVisitorsByTenantId(tenantId: ID!): [VisitorLog]
  }

  type Mutation {
    registerEmployee(RegisterEmployeeInput: RegisterEmployeeInput): Employee!
    registerEmployeeSuperAdmin(RegisterEmployeeInput: RegisterEmployeeInput): Employee!
    login(email: String!, password: String!): Employee!
    createIncidentLog(tenantId: String!, incidentType: String!, notes: String): Tenant!
    deleteLog(logId: ID!): String!
    registerTenant(registerTenantInput: RegisterTenantInput): Tenant!
    deleteTenant(tenantId: String!): String!
    getTenantByApartment(apartment: String!): Tenant
    searchTenants(filter: String!): [Tenant]
    singleUpload(file: Upload!): File
    updateEmployee(employeeId: ID!, RegisterEmployeeInput: RegisterEmployeeInput): Employee
    createMessage(NewMessageInput: NewMessageInput, tenantId: ID!): Message
    replyMessage(messageId: ID!, replyBody: String!): Message
    createVisitorLog(tenantId: ID!, NewVisitorInputs: NewVisitorInputs): VisitorLog
    updateTenantSelf(tenantId: ID!, registerTenantInput: RegisterTenantInput) : Tenant
    logVisit(tenantId: ID!, visitorId: ID!): VisitorLog
    banVisitor(tenantId: ID!, visitorId: ID!): Tenant
    makeVisitorPermanent(tenantId: ID!, visitorId: ID!): Tenant
    removePermanentVisitor(tenantId: ID!, visitorId: ID!): Tenant
    removeBannedVisitor(tenantId: ID!, visitorId: ID!): Tenant
    searchVisitors(filter: String!): [VisitorLog]
  }

  type Subscription {
    registerTenant: Tenant!
  }
`
