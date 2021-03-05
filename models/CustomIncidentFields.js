const { model, Schema } = require('mongoose')

const CustomIncidentFields = new Schema({
  createdBy: String,
  createdAt: String,
  fieldName: String,
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'employees'
  }
})

module.exports = model('CustomIncidentFields', CustomIncidentFields)
