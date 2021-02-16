const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError } = require("apollo-server");
const checkAuth = require("../../util/check-auth");

const {
  validateRegisterInput,
  validateLoginInput,
} = require("../../util/validators");
const SECRET_KEY = process.env.SECRET_KEY;
const Employee = require("../../models/Employees");

function generateToken(employee) {
  return jwt.sign(
    {
      id: employee.id,
      email: employee.email,
      username: employee.username,
      firstName: employee.firstName,
      lastName: employee.lastName,
      isAdmin: employee.isAdmin,
      employee_profilePhoto: employee.employee_profilePhoto
    },
    SECRET_KEY,
    { expiresIn: "3h" }
  );
}

module.exports = {
  Mutation: {
    async getEmployeeById(_, { employeeId }, context) {
      checkAuth(context);
      try {
        const employee = await Employee.findById(employeeId);
        if (employee) {
          return employee;
        } else {
          throw new UserInputError("No employee found ");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
    async login(_, { username, password }) {
      const { errors, valid } = validateLoginInput(username, password);

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const employee = await Employee.findOne({ username });

      if (!employee) {
        errors.general = "Invalid Username";
        throw new UserInputError("Invalid Username", { errors });
      }

      const match = await bcrypt.compare(password, employee.password);
      if (!match) {
        errors.general = "Invalid Password";
        throw new UserInputError("Invalid Password", { errors });
      }

      const token = generateToken(employee);

      return {
        ...employee._doc,
        id: employee._id,
        token,
      };
    },
    async registerEmployee(
      _,
      {
        RegisterEmployeeInput: {
          firstName,
          lastName,
          organization,
          username,
          email,
          password,
          confirmPassword,
          isAdmin,
          employee_profilePhoto,
          gender,
          hireDate,
          bio,
          jobTitle,
          address,
          city,
          state,
          zip,
        },
      }
    ) {
      // Validate user data
      const { valid, errors } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword
      );
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }
      // TODO: Make sure user doesnt already exist
      const employee = await Employee.findOne({ username });
      if (employee) {
        throw new UserInputError("Username is taken", {
          errors: {
            username: "This username is taken",
          },
        });
      }
      // hash password and create an auth token
      password = await bcrypt.hash(password, 12);

      const newEmployee = new Employee({
        firstName,
        lastName,
        organization,
        username,
        email,
        password,
        confirmPassword,
        employee_profilePhoto:
        employee_profilePhoto ||
          "https://secu-desk.s3.amazonaws.com/defaultProfile.png",
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
      });

      const res = await newEmployee.save();

      return {
        ...res._doc,
        id: res._id,
      };
    },
    async updateEmployee (_, { employeeId, RegisterEmployeeInput: RegisterEmployeeInput }, context) {
      checkAuth(context);
      try {
        const update = RegisterEmployeeInput;
        const employee = await Employee.findByIdAndUpdate(employeeId, update, {
          new: true
        });
        return employee
      } catch (err) {
        throw new Error(err);
      }
    }
  },
};
