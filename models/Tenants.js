const { model, Schema } = require('mongoose')

const tenantsSchema = new Schema({
  tenantFirstName: String,
  tenantLastName: String,
  tenant_number: Number,
  tenantDateOfBirth: String,
  apartment: String,
  moveinDate: String,
  tenantPhone: String,
  tenantEmail: String,
  createdAt: String,
  createdBy: String,
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'employees'
  },
  tenantProfilePhoto: String,
  assignedParkingSpaces: String,
  bannedVisitors: [
    {
      visitorName: String,
      visitorId: {
        type: Schema.Types.ObjectId,
        ref: 'visitorLogs'
      },
      changedDate: String,
      changedBy: {
        type: Schema.Types.ObjectId,
        ref: 'employees'
      }
    }
  ],
  permanentVisitors: [
    {
      visitorName: String,
      visitorId: {
        type: Schema.Types.ObjectId,
        ref: 'visitorLogs'
      },
      changedDate: String,
      changedBy: {
        type: Schema.Types.ObjectId,
        ref: 'employees'
      }
    }
  ],
  incidentLogs: [
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
})

tenantsSchema.index({ '$**': 'text' })

module.exports = model('TenantsSchema', tenantsSchema)
