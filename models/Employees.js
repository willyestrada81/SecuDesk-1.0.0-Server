const { model, Schema } = require('mongoose')

const employeesSchema = new Schema({
  firstName: String,
  lastName: String,
  organization: String,
  token: String,
  password: String,
  mustResetPassword: Boolean,
  email: String,
  isAdmin: Boolean,
  isSuperAdmin: Boolean,
  createdAt: String,
  gender: String,
  hireDate: String,
  bio: String,
  jobTitle: String,
  address: String,
  employeeProfilePhoto: String,
  city: String,
  state: String,
  zip: String,
  activationCode: String,
  activationUrl: String,
  isActivated: Boolean
})

module.exports = model('EmployeesSchema', employeesSchema)
