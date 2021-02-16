const { gql } = require("apollo-server");

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
    tenant_firstName: String!
    tenant_lastName: String!
    tenant_DOB: String!
    apartment: String!
    moveinDate: String
    tenant_phone: String!
    tenant_email: String!
    createdAt: String!
    createdBy: String!
    employeeId: ID!
    tenant_profilePhoto: String
    householdMembers: [HouseholdMembers]!
    incident_logs: [IncidentLog]!
    incidentCount: Int!
  }
  type HouseholdMembers {
    relationship: String!
    member_firstName: String!
    member_lastName: String!
    member_DOB: String!
    member_phone: String!
  }
  type Comment {
    id: ID!
    createdAt: String!
    username: String!
    body: String!
  }
  type Like {
    id: ID!
    createdAt: String!
    username: String!
  }
  type Employee {
    firstName: String!
    lastName: String!
    organization: String!
    id: ID!
    email: String!
    token: String!
    username: String!
    isAdmin: Boolean!
    createdAt: String!
    gender: String!
    hireDate: String!
    bio: String
    jobTitle: String!
    address: String
    city: String
    state: String
    zip: String
    employee_profilePhoto: String
  }

  input RegisterEmployeeInput {
    firstName: String
    lastName: String
    organization: String
    username: String
    password: String
    confirmPassword: String
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
    employee_profilePhoto: String
  }

  input RegisterTenantInput {
    tenant_firstName: String!
    tenant_lastName: String!
    tenant_DOB: String!
    apartment: String!
    moveinDate: String
    tenant_phone: String!
    tenant_email: String!
    tenant_profilePhoto: String
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

  type Query {
    getIncidentLogs: [IncidentLogs]
    getIncidentLog(tenantId: ID!, incidentLogId: ID!): IncidentLog
    getTenant(tenantId: ID!): Tenant
    getTenants: [Tenant]
    getDashboard: Dashboard
  }
  type Mutation {
    registerEmployee(RegisterEmployeeInput: RegisterEmployeeInput): Employee!
    login(username: String!, password: String!): Employee!
    createIncidentLog(tenantId: String!, incidentType: String!, notes: String): Tenant!
    deleteLog(logId: ID!): String!
    createComment(logId: String!, body: String!): IncidentLog!
    deleteComment(logId: ID!, commentId: ID!): IncidentLog!
    likePost(logId: ID!): IncidentLog!
    registerTenant(registerTenantInput: RegisterTenantInput): Tenant!
    deleteTenant(tenantId: String!): String!
    getTenantByApartment(apartment: String!): Tenant
    searchTenants(filter: String!): [Tenant]
    singleUpload(file: Upload!): File
    getEmployeeById(employeeId: ID!): Employee
    updateEmployee(employeeId: ID!, RegisterEmployeeInput: RegisterEmployeeInput): Employee
  }
  type Subscription {
    registerTenant: Tenant!
  }
`;
