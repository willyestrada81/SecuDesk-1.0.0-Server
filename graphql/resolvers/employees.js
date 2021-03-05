require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { UserInputError, AuthenticationError } = require('apollo-server')
const checkAuth = require('../../util/check-auth')

const {
  validateEmail,
  validateLoginInput,
  generateInitialPassword,
  validateInputs
} = require('../../util/validators')
const SECRET_KEY = process.env.SECRET_KEY
const Employee = require('../../models/Employees')
const Activity = require('../../models/Activities')

function generateToken (employee) {
  return jwt.sign(
    {
      id: employee.id,
      email: employee.email,
      username: employee.username,
      firstName: employee.firstName,
      lastName: employee.lastName,
      isAdmin: employee.isAdmin,
      isSuperAdmin: employee.isSuperAdmin,
      employeeProfilePhoto: employee.employeeProfilePhoto
    },
    SECRET_KEY,
    { expiresIn: '3h' }
  )
}

module.exports = {
  Query: {
    async getEmployeeById (_, { employeeId }, context) {
      checkAuth(context)
      try {
        const employee = await Employee.findById(employeeId)
        if (employee) {
          return employee
        } else {
          throw new UserInputError('No employee found ')
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    async login (_, { email, password }) {
      const { errors, valid } = validateLoginInput(email, password)

      if (!valid) {
        throw new UserInputError('Errors', { errors })
      }

      const employee = await Employee.findOne({ email })

      if (!employee) {
        errors.general = 'Invalid Email'
        throw new UserInputError('Invalid Email', { errors })
      }

      const match = await bcrypt.compare(password, employee.password)
      if (!match) {
        errors.general = 'Invalid Password'
        throw new UserInputError('Invalid Password', { errors })
      }

      const token = generateToken(employee)

      const { firstName, lastName, id } = employee

      const newActivity = new Activity({
        activityType: 'USER_LOGIN',
        createdBy: `${firstName} ${lastName}`,
        createdAt: new Date().toISOString(),
        employeeId: id,
        message: `Employee "${firstName} ${lastName}" Logged in`
      })

      await newActivity.save()

      return {
        ...employee._doc,
        id: employee._id,
        token
      }
    },
    async registerEmployee (
      _,
      {
        RegisterEmployeeInput: {
          firstName,
          lastName,
          organization,
          email,
          isAdmin,
          isSuperAdmin,
          employeeProfilePhoto,
          gender,
          hireDate,
          bio,
          jobTitle,
          address,
          city,
          state,
          zip
        }
      },
      context
    ) {
      const { firstName: userFirstName, lastName: userLastName, isSuperAdmin: isEmployeeSuperAdmin, id } = checkAuth(context)

      if (!isEmployeeSuperAdmin) throw new AuthenticationError('Unauthorized. operation is forbidden')
      // Validate user data
      const { valid, errors } = validateEmail(
        email
      )
      if (!valid) {
        throw new UserInputError('Errors', { errors })
      }
      // TODO: Make sure user doesn't already exist
      const employee = await Employee.findOne({ email })
      if (employee) {
        throw new UserInputError('Username is taken', {
          errors: {
            username: 'This username is taken'
          }
        })
      }
      const activationCode = generateInitialPassword
      const newEmployee = new Employee({
        firstName,
        lastName,
        organization,
        email,
        employeeProfilePhoto:
          employeeProfilePhoto ||
          'https://secu-desk.s3.amazonaws.com/defaultProfile.png',
        gender,
        hireDate: new Date(hireDate).toISOString(),
        bio,
        jobTitle,
        address,
        city,
        state,
        zip,
        isAdmin: isAdmin || false,
        isSuperAdmin: isSuperAdmin || false,
        createdAt: new Date().toISOString(),
        mustResetPassword: true,
        activationCode,
        password: null,
        activationUrl: `/activate-user/${activationCode}`
      })

      const res = await newEmployee.save()

      const newActivity = new Activity({
        activityType: 'EMPLOYEE_REGISTERED',
        createdBy: `${userFirstName} ${userLastName}`,
        createdAt: new Date().toISOString(),
        employeeId: id,
        message: `New Employee "${firstName} ${lastName}" Registered`
      })

      await newActivity.save()

      return {
        ...res._doc,
        id: res._id
      }
    },
    async activateEmployee (_, { activationCode, email }) {
      const { valid, errors } = validateEmail(
        email
      )
      if (!valid) {
        throw new UserInputError('Errors', { errors })
      }
      const employee = await Employee.findOne({ activationCode })
      if (employee && !employee.isActivated) {
        if (employee.email !== email) throw new UserInputError('Error. Email is not valid. Please enter a valid email.')

        await Employee.findByIdAndUpdate(employee._id, { isActivated: true }, {
          new: true, useFindAndModify: false
        })
        return 'Success, employee is activated'
      } else {
        throw new UserInputError('Invalid Activation Code or Employee already Activated. Please try again, if error percists, contact your system administrator.')
      }
    },
    async resetPassword (_, { email, password, confirmPassword }) {
      const { valid, errors } = validateInputs({
        email,
        password,
        confirmPassword
      })
      if (!valid) {
        throw new UserInputError('Errors', { errors })
      }

      if (password !== confirmPassword) {
        throw new UserInputError('Errors', { errors: { password: 'Passwords do not match' } })
      }

      const employee = await Employee.findOne({ email })

      if (!employee) throw new UserInputError('Invalid email')

      password = await bcrypt.hash(password, 12)
      try {
        await Employee.findByIdAndUpdate(employee._id, { password }, {
          new: true, useFindAndModify: false
        })

        return employee
      } catch (err) {
        throw new Error(err)
      }
    },
    async updateEmployee (_, { employeeId, RegisterEmployeeInput }, context) {
      const { firstName, lastName, isAdmin, id } = checkAuth(context)

      if (!isAdmin) throw new UserInputError('Unauthorized. Operation is forbidden')

      try {
        const update = RegisterEmployeeInput
        const employee = await Employee.findByIdAndUpdate(employeeId, update, {
          new: true, useFindAndModify: false
        })

        const newActivity = new Activity({
          activityType: 'EMPLOYEE_UPDATED',
          createdBy: `${firstName} ${lastName}`,
          createdAt: new Date().toISOString(),
          employeeId: id,
          message: `Employee "${employee.firstName} ${employee.lastName}" Updated`
        })

        await newActivity.save()

        return employee
      } catch (err) {
        throw new Error(err)
      }
    },
    async registerEmployeeSuperAdmin (
      _,
      {
        RegisterEmployeeInput: {
          firstName,
          lastName,
          organization,
          email,
          employeeProfilePhoto,
          gender,
          hireDate,
          bio,
          jobTitle,
          address,
          city,
          state,
          zip
        }
      }
    ) {
      const { valid, errors } = validateEmail(
        email
      )
      if (!valid) {
        throw new UserInputError('Errors', { errors })
      }
      const employee = await Employee.findOne({ email })
      if (employee) {
        throw new UserInputError('Username is taken', {
          errors: {
            username: 'This username is taken'
          }
        })
      }
      const activationCode = generateInitialPassword
      const newEmployee = new Employee({
        firstName,
        lastName,
        organization,
        email,
        employeeProfilePhoto:
          employeeProfilePhoto ||
          'https://secu-desk.s3.amazonaws.com/defaultProfile.png',
        gender,
        hireDate: new Date(hireDate).toISOString(),
        bio,
        jobTitle,
        address,
        city,
        state,
        zip,
        isAdmin: true,
        isSuperAdmin: true,
        createdAt: new Date().toISOString(),
        mustResetPassword: true,
        activationCode,
        password: null,
        activationUrl: `/activate-user/${activationCode}`,
        isActivated: false
      })

      const res = await newEmployee.save()

      return {
        ...res._doc,
        id: res._id
      }
    }
  }
}
