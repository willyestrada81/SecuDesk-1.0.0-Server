const { model, Schema } = require('mongoose')

const activitiesSchema = new Schema({
  activityType: String,
  createdBy: String,
  createdAt: String,
  message: String,
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'employees'
  }
})

module.exports = model('ActivitiesSchema', activitiesSchema)
