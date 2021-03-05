const { UserInputError, AuthenticationError } = require('apollo-server')
const CustomFields = require('../../models/CustomIncidentFields')
const checkAuth = require('../../util/check-auth')

module.exports = {
  Query: {
    async getCustomFields (_, { }, context) { // eslint-disable-line
      checkAuth(context)
      try {
        const fields = await CustomFields.find()
        return fields
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    async createCustomField (_, { fieldName }, context) {
      const { id, firstName, lastName, superAdmin } = checkAuth(context)

      if (!superAdmin) throw new AuthenticationError('Unauthorized. Operation not allowed')

      if (fieldName.trim() === '') {
        throw new UserInputError('Field name is required')
      }

      const fields = await CustomFields.find()
      if (!fields.length) {
        const newField = new CustomFields({
          createdBy: `${firstName} ${lastName}`,
          createdAt: new Date().toISOString(),
          employeeId: id,
          fieldName: 'Repairs'
        })
        await newField.save()
        return newField
      }
    },
    async deleteCustomField (_, { fieldId }, context) {
      const { superAdmin } = checkAuth(context)

      if (!superAdmin) throw new AuthenticationError('Unauthorized. Operation not allowed')

      try {
        const field = await CustomFields.findById(fieldId)
        if (field) {
          await CustomFields.delete()
          return 'Field deleted successfully'
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
