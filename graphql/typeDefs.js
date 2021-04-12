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
    isSuperAdmin: Boolean!
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
    activationUrl: String
    activationCode: String
    password: String
    isActivated: Boolean
    status: EmployeeStatus
  }

  type EmployeeStatus {
    isInactive: Boolean
    deactivatedBy: ID
  }

  input RegisterEmployeeInput {
    firstName: String
    lastName: String
    organization: String
    email: String
    isAdmin: Boolean
    isSuperAdmin:Boolean
    gender: String
    hireDate: String
    bio: String
    jobTitle: String
    address: String
    city: String
    state: String
    zip: String
    employeeProfilePhoto: String
    mustResetPassword: Boolean
    password: String
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
    incidentsLastHour: [IncidentLogs]
    incidentsBeforeLastHour: [IncidentLogs]
    incidentsLast24Hours: [IncidentLogs]
    incidentsBeforeLast24Hours: [IncidentLogs]
    percentageOfIncreaseByHour: Float
    percentageOfIncreaseBy24Hours: Float
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

  type Packages {
    id: ID!
    receivedDate: String!
    receivedByEmployeeId: ID!
    receivedByEmployee: String!
    recipientName: String!
    recipientId: ID!
    notes: String
    isDelivered: Boolean!
    delivery: Delivery
  }

  type Delivery {
    deliveredByEmployeeId: ID
    receivedByTenantId: ID
    deliveryDate: String
    receivedByEmployee: String
    receivedByTenant: String
    notes: String
  }

  type CustomFields {
    id: ID
    createdBy: String
    createdAt: String
    employeeId: ID
    fieldName: String
  }

  type Query {
    getEmployees: [Employee]
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
    getTenantVisitLogs(tenantId: ID!, visitorId: ID!): VisitorLog
    getPackages: [Packages]
    getPackageById(packageId: ID!): Packages
    getPackagesByTenantId(tenantId: ID!): [Packages]
    getCustomFields: [CustomFields]
  }

  type Mutation {
    registerEmployee(RegisterEmployeeInput: RegisterEmployeeInput): Employee!
    registerEmployeeSuperAdmin(RegisterEmployeeInput: RegisterEmployeeInput): Employee!
    login(email: String!, password: String!): Employee!
    createIncidentLog(tenantId: String!, incidentType: String!, notes: String): [IncidentLog]
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
    createNewPackage(tenantId: ID!, isDelivered: Boolean, notes: String): Packages
    deliverPackage(packageId: ID!, tenantId: ID!, notes: String): Packages
    createCustomField(fieldName: String!): CustomFields
    deleteCustomField(fieldName: String!): String
    resetPassword(email: String!, password: String!, confirmPassword: String!): Employee!
    activateEmployee(activationCode: String!, email: String!): String!
    deactivateEmployee(employeeId: ID!, employeeEmail: String!): Employee!
  }

  type Subscription {
    registerTenant: Tenant!
  }
`
