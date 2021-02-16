const { model, Schema } = require('mongoose');

const tenantsSchema = new Schema({
  tenant_firstName: String,
  tenant_lastName: String,
  tenant_number: Number,
  tenant_DOB: String,
  apartment: String,
  moveinDate: String,
  tenant_phone: String,
  tenant_email: String,
  createdAt: String,
  createdBy: String,
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'employees'
  },
  tenant_profilePhoto: String,
  householdMembers: [
    {
      relationship: String,
      member_firstName: String,
      member_lastName: String,
      member_DOB: String,
      member_phone: String,
    }
  ],
  incident_logs: [
    {
      incidentType: String,
      notes: String,
      createdAt: String,
      createdBy: String,
      employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'employees'
      }
    }
  ]
});

tenantsSchema.index({'$**': 'text'});

module.exports = model('TenantsSchema', tenantsSchema);
