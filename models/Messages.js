const { model, Schema } = require('mongoose')

const messagesSchema = new Schema({
  messageSubject: String,
  messageBody: String,
  createdAt: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'tenants'
  },
  isNewMessage: Boolean,
  isRead: Boolean,
  isReplied: Boolean,
  replies: [
    {
      createdAt: String,
      replyBody: String,
      employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'employees'
      },
      repliedBy: String
    }
  ]
})

module.exports = model('MessagesSchema', messagesSchema)
