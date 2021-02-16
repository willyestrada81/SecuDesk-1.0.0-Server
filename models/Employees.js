const { model, Schema } = require("mongoose");

const employeesSchema = new Schema({
  firstName: String,
  lastName: String,
  organization: String,
  username: String,
  password: String,
  email: String,
  isAdmin: Boolean,
  createdAt: String,
  gender: String,
  hireDate: String,
  bio: String,
  jobTitle: String,
  address: String,
  employee_profilePhoto: String,
  city: String,
  state: String,
  zip: String,
});

module.exports = model("EmployeesSchema", employeesSchema);
