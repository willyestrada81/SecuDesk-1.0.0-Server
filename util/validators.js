module.exports.validateRegisterInput = (
  username,
  email,
  password,
  confirmPassword
) => {
  const errors = {};
  if (username.trim() === '') {
    errors.username = 'Username must not be empty';
  }
  if (email.trim() === '') {
    errors.email = 'Email must not be empty';
  } else {
    const regEx = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
    if (!email.match(regEx)) {
      errors.email = 'Email must be a valid email address';
    }
  }
  if (password === '') {
    errors.password = 'Password must not empty';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords must match';
  }

  return {
    errors,
    valid: Object.keys(errors).length < 1
  };
};

module.exports.validateInputs = (inputs = {}) => {
  const errors = {};

  for(const error of Object.keys(inputs)) {
      if (inputs[error].trim() === '') {
          errors[error] = `${error} cannot be empty`;
        }
  }
  return {
    errors,
    valid: Object.keys(errors).length < 1
  };
};

module.exports.validateLoginInput = (username, password) => {
  const errors = {};
  if (username.trim() === '') {
    errors.username = 'Username must not be empty';
  }
  if (password.trim() === '') {
    errors.password = 'Password must not be empty';
  }

  return {
    errors,
    valid: Object.keys(errors).length < 1
  };
};

module.exports.validateGetTenant = (fistName, tenantNumber) => {
  const errors = {};
  if (fistName.trim() === '') {
    errors.fistName = 'Tenant name must not be empty';
  }
  if (tenantNumber.trim() === '') {
    errors.tenantNumber = 'Tenant number must not be empty';
  }

  return {
    errors,
    valid: Object.keys(errors).length < 1
  };
};
