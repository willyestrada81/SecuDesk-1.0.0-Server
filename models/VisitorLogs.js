const { model, Schema } = require('mongoose')

const VisitorLogsSchema = new Schema({
  visitorName: String,
  visitorLastName: String,
  createdAt: String,
  notes: String,
  visitsLogs: [
    {
      visitDate: String,
      createdBy: String,
      employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'employee'
      },
      tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'tenants'
      }
    }
  ]
})

VisitorLogsSchema.index({ visitorName: 'text', visitorLastName: 'text' })

module.exports = model('VisitorLogsSchema', VisitorLogsSchema)
