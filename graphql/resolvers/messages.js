const { UserInputError } = require('apollo-server')
const checkAuth = require('../../util/check-auth')

const { validateInputs } = require('../../util/validators')

const Tenant = require('../../models/Tenants')
const Activity = require('../../models/Activities')
const Message = require('../../models/Messages')

module.exports = {
  Query: {
    async getMessages (_, {}, context) {
      checkAuth(context)
      try {
        const messages = await Message.find()
        return messages
      } catch (err) {
        throw new Error(err)
      }
    },
    async getMessageById (_, { messageId }, context) {
      checkAuth(context)
      try {
        const message = await Message.findById(messageId)
        if (message) {
          return message
        } else {
          throw new UserInputError('Message not found')
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    async createMessage (
      _,
      { NewMessageInput: { messageSubject, messageBody }, tenantId },
      context
    ) {
      const { id } = checkAuth(context)

      const { valid, errors } = validateInputs({
        messageSubject,
        messageBody
      })

      const tenant = await Tenant.findById(tenantId)

      if (valid && tenant) {
        const newMessage = new Message({
          messageSubject,
          messageBody,
          createdAt: new Date().toISOString(),
          createdBy: tenantId,
          isNewMessage: true,
          isRead: false,
          isReplied: false
        })

        const message = await newMessage.save()

        const newActivity = new Activity({
          activityType: 'NEW_MESSAGE',
          createdAt: new Date().toISOString(),
          createdBy: `${tenant.tenantFirstName} ${tenant.tenantLastName}`,
          message: `New message from resident "${tenant.tenantFirstName} ${tenant.tenantLastName}"`
        })

        await newActivity.save()

        return message
      } else {
        throw new UserInputError('Errors', { errors })
      }
    },
    async replyMessage (_, { messageId, replyBody }, context) {
      const { id, firstName, lastName } = checkAuth(context)

      const { valid, errors } = validateInputs({
        replyBody
      })

      const message = await Message.findById(messageId)

      if (valid && message) {
        try {
          message.replies.push({
            replyBody,
            createdAt: new Date().toISOString(),
            repliedBy: `${firstName} ${lastName}`,
            employeeId: id
          })
          message.isNewMessage = false
          message.isRead = true
          message.isReplied = true

          const savedMessage = await message.save()

          const newActivity = new Activity({
            activityType: 'MESSAGE_REPLIED',
            createdAt: new Date().toISOString(),
            createdBy: `${firstName} ${lastName}`,
            employeeId: id,
            message: `${firstName} ${lastName} replied a message`
          })

          await newActivity.save()
          return savedMessage
        } catch (err) {
          throw new Error(err)
        }
      } else {
        throw new UserInputError('Errors', { errors })
      }
    }
  }
}
