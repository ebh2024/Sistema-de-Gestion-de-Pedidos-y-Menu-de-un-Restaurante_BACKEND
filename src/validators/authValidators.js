/**
 * Validation functions for authentication operations
 */

const { USER_VALIDATION } = require('../constants/authConstants');

/**
 * Validate user registration data
 * @param {Object} data - Registration data
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateRegistration = (data) => {
  const errors = [];
  const { firstName, lastName, email, username, password } = data;

  // Check if any required fields are missing (original controller behavior)
  if (!firstName || !lastName || !email || !username || !password) {
    return {
      isValid: false,
      errors: ['Todos los campos son requeridos (firstName, lastName, email, username, password)']
    };
  }

  // Validate individual fields
  if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
    errors.push('firstName es requerido');
  }

  if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
    errors.push('lastName es requerido');
  }

  if (!email || typeof email !== 'string' || !USER_VALIDATION.EMAIL_REGEX.test(email)) {
    errors.push('email debe ser un email válido');
  }

  if (!username || typeof username !== 'string' ||
      username.trim().length < USER_VALIDATION.NAME_MIN_LENGTH ||
      username.trim().length > USER_VALIDATION.NAME_MAX_LENGTH) {
    errors.push(`username debe tener entre ${USER_VALIDATION.NAME_MIN_LENGTH} y ${USER_VALIDATION.NAME_MAX_LENGTH} caracteres`);
  }

  if (!password || typeof password !== 'string' || password.length < USER_VALIDATION.PASSWORD_MIN_LENGTH) {
    errors.push(`password debe tener al menos ${USER_VALIDATION.PASSWORD_MIN_LENGTH} caracteres`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate login data
 * @param {Object} data - Login data
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateLogin = (data) => {
  const errors = [];
  const { username, password } = data;

  // Check if either field is missing (original controller behavior)
  if (!username || !password) {
    return {
      isValid: false,
      errors: ['Nombre de usuario y contraseña son requeridos']
    };
  }

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    errors.push('username es requerido');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('password es requerido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate forgot password data
 * @param {Object} data - Forgot password data
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateForgotPassword = (data) => {
  const errors = [];
  const { email } = data;

  if (!email || typeof email !== 'string' || !USER_VALIDATION.EMAIL_REGEX.test(email)) {
    errors.push('email debe ser un email válido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate reset password data
 * @param {Object} data - Reset password data
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateResetPassword = (data) => {
  const errors = [];
  const { token, password } = data;

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    errors.push('token es requerido');
  }

  if (!password || typeof password !== 'string' || password.length < USER_VALIDATION.PASSWORD_MIN_LENGTH) {
    errors.push(`password debe tener al menos ${USER_VALIDATION.PASSWORD_MIN_LENGTH} caracteres`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
};
