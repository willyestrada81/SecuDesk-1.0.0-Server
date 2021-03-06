const { UserInputError, AuthenticationError } = require('apollo-server')
const CustomFields = require('../../models/CustomIncidentFields')
const checkAuth = require('../../util/check-auth')

module.exports = {
  Query: {
    async getCustomFields (_, { }, context) { // eslint-disable-line
      checkAuth(context)
      try {
        const fields = await CustomFields.find()
        if (fields.length) {
          return fields
        } else {
          const newField = new CustomFields({
            createdBy: 'Default',
            createdAt: new Date().toISOString(),
            employeeId: null,
            fieldName: 'Repairs'
          })
          const res = await newField.save()
          return [res]
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    async createCustomField (_, { fieldName }, context) {
      const { id, firstName, lastName, isSuperAdmin } = checkAuth(context)

      if (!isSuperAdmin) throw new AuthenticationError('Unauthorized. Operation not allowed')

      if (fieldName.trim() === '') {
        throw new UserInputError('Field name is required')
      }

      const fields = await CustomFields.findOne({ fieldName })
      if (fields) {
        throw new UserInputError('A filed with that name already exists')
      } else {
        if (!fields) {
          const newField = new CustomFields({
            createdBy: `${firstName} ${lastName}`,
            createdAt: new Date().toISOString(),
            employeeId: id,
            fieldName
          })
          await newField.save()
          return newField
        }
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
