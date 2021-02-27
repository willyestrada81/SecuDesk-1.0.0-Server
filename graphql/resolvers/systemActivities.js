const { UserInputError } = require('apollo-server')
const checkAuth = require('../../util/check-auth')

const Activity = require('../../models/Activities')

module.exports = {
  Query: {
    async getSystemActivities (_, {}, context) {
      checkAuth(context)
      try {
        const activities = await Activity.find()
        return activities
      } catch (err) {
        throw new Error(err)
      }
    },
    async getSystemActivityById (_, { activityId }, context) {
      checkAuth(context)
      try {
        const activity = await Activity.findById(activityId)
        if (activity) {
          return activity
        } else {
          throw new UserInputError('Activity not found')
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
