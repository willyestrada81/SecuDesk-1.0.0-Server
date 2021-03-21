require('dotenv').config()

const { v4: uuidv4 } = require('uuid')
const sgMail = require('@sendgrid/mail')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { UserInputError, AuthenticationError } = require('apollo-server')
const checkAuth = require('../../util/check-auth')

const {
  validateEmail,
  validateLoginInput,
  validateInputs
} = require('../../util/validators')
const SECRET_KEY = process.env.SECRET_KEY
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
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
    async getEmployees (_, { }, context) { // eslint-disable-line
      checkAuth(context)
      try {
        const employees = await Employee.find()
        return employees
      } catch (err) {
        throw new Error(err)
      }
    },
    async getEmployeeById (_, { employeeId }, context) {
      checkAuth(context)
      try {
        const employee = await Employee.findById(employeeId)
        if (employee) {
          return employee
        } else {
          throw new UserInputError('No employee found')
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

      if (employee && employee.status.isInactive) {
        errors.general = 'User is Inactive.'
        throw new UserInputError('Unable to login. Please contact your system administrator.', { errors })
      }

      if (!employee) {
        errors.general = 'Invalid Email'
        throw new UserInputError('Invalid Email', { errors })
      }

      if (employee && !employee.isActivated) {
        errors.general = 'Please Activate your Account by following the instructions on the email. If no email, contact your system administartor'
        throw new UserInputError('Please Activate your Account by following the instructions on the email. If no email, contact your system administartor.', { errors })
      }

      if (employee && employee.mustResetPassword) {
        errors.general = 'Please setup a password'
        throw new UserInputError('Please setup a password.', { errors })
      }

      const match = employee.password && await bcrypt.compare(password, employee.password)
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

      if (!isEmployeeSuperAdmin) throw new AuthenticationError('Unauthorized. Operation is forbidden')
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
        throw new UserInputError('Cannot use that email.', {
          errors: {
            email: 'Cannot use that email.'
          }
        })
      }
      const activationCode = uuidv4()
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
        activationUrl: `/activate-user/${activationCode}`,
        isActivated: false,
        isInactive: null
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

      sgMail.setApiKey(SENDGRID_API_KEY)
      const msg = {
        to: newEmployee.email, // Change to your recipient
        from: 'william.estrada003@mymdc.net', // Change to your verified sender
        subject: 'Activate account',
        template_id: 'd-0a186e857a124151aba98877e0bdbd45',
        dynamic_template_data: {
          employee_firstName: newEmployee.firstName,
          activation_url: newEmployee.activationUrl
        }
      }
      sgMail
        .send(msg)
        .then(() => {
          console.log('Email sent')
        })
        .catch((error) => {
          console.error(error)
        })

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
        if (employee.email !== email) throw new UserInputError('Errors', { errors: { code: 'Email is not valid. Please enter a valid email.' } })

        await Employee.findByIdAndUpdate(employee._id, { isActivated: true, mustResetPassword: false }, {
          new: true, useFindAndModify: false
        })
        return 'Success, employee is activated'
      } else {
        throw new UserInputError('Errors', { errors: { code: 'Invalid Activation Code or Employee already Activated. Please try again, if error percists, contact your system administrator.' } })
      }
    },
    async deactivateEmployee (_, { employeeId, employeeEmail }, context) {
      const { email, isAdmin, id } = checkAuth(context)

      if (!isAdmin) throw new UserInputError('Unauthorized. Operation is forbidden')

      const employee = await Employee.findById(employeeId)
      if (employee && !employee.status.isInactive) {
        if (email !== employeeEmail) throw new UserInputError('Errors', { errors: { code: 'Email is not valid. Please enter your email.' } })

        await Employee.findByIdAndUpdate(employee._id, { status: { isInactive: true, deactivatedBy: id } }, {
          new: true, useFindAndModify: false
        })
        return employee
      } else {
        throw new UserInputError('Errors', { errors: { code: 'Invalid Activation Code or Employee already Activated. Please try again, if error percists, contact your system administrator.' } })
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
      const activationCode = uuidv4()
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
