const { model, Schema } = require('mongoose');

const incidentLogsSchema = new Schema({
  incidentType: String,
  notes: String,
  createdAt: String,
  createdBy: String,
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'tenants'
  },
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'employees'
  }
});

module.exports = model('incidentLogsSchema', incidentLogsSchema);
