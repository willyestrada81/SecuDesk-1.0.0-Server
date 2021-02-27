const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { UserInputError } = require('apollo-server')
const checkAuth = require('../../util/check-auth')

const {
  validateEmail,
  validateLoginInput,
  generateInitialPassword
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

      // const match = await bcrypt.compare(password, employee.password)
      // if (!match) {
      //   errors.general = 'Invalid Password'
      //   throw new UserInputError('Invalid Password', { errors })
      // }

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
      const { firstName: userFirstName, lastName: userLastName, isAdmin: isUserAdmin, id } = checkAuth(context)

      if (!isUserAdmin) throw new UserInputError('Unauthorized. operation is forbidden')
      // Validate user data
      const { valid, errors } = validateEmail(
        email
      )
      if (!valid) {
        throw new UserInputError('Errors', { errors })
      }
      // TODO: Make sure user doesnt already exist
      const employee = await Employee.findOne({ email })
      if (employee) {
        throw new UserInputError('Username is taken', {
          errors: {
            username: 'This username is taken'
          }
        })
      }

      const hashedPassword = await bcrypt.hash(generateInitialPassword, 10)

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
        createdAt: new Date().toISOString(),
        mustResetPassword: true
        // password: hashedPassword,
        // setPasswordUrl: `/reset-password${hashedPassword}`
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
    async registerEmployeeSuperAdmin (
      _,
      {
        RegisterEmployeeInput: {
          firstName,
          lastName,
          organization,
          email,
          isAdmin,
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
      // TODO: Make sure user doesnt already exist
      const employee = await Employee.findOne({ email })
      if (employee) {
        throw new UserInputError('Username is taken', {
          errors: {
            username: 'This username is taken'
          }
        })
      }

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
        createdAt: new Date().toISOString(),
        mustResetPassword: true,
        password: generateInitialPassword
      })

      const res = await newEmployee.save()
      return {
        ...res._doc,
        id: res._id
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
    }
  }
}
