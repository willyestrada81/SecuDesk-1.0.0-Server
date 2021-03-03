const { model, Schema } = require('mongoose')

const PackagesSchema = new Schema({
  receivedDate: String,
  receivedByEmployeeId: {
    type: Schema.Types.ObjectId,
    ref: 'employees'
  },
  receivedByEmployee: String,
  recipientName: String,
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'tenants'
  },
  notes: String,
  isDelivered: Boolean,
  delivery: {
    deliveredByEmployeeId: {
      type: Schema.Types.ObjectId,
      ref: 'employees'
    },
    receivedByTenantId: {
      type: Schema.Types.ObjectId,
      ref: 'tenants'
    },
    deliveryDate: String,
    notes: String,
    receivedByEmployee: String,
    receivedByTenant: String
  }
})

module.exports = model('PackagesSchema', PackagesSchema)
