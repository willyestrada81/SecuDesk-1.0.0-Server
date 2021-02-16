const { model, Schema } = require('mongoose');

const dashboardSchema = new Schema({
  firstName: String,
  lastName: String,
  organization: String,
  username: String,
  password: String,
  email: String,
  isAdmin: Boolean,
  createdAt: String,
});

module.exports = model('DashboardSchema', dashboardSchema);
