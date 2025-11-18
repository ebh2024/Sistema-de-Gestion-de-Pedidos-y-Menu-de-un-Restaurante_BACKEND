/**
 * Constants for authentication and user management
 */

// Role mappings between frontend and backend
const FRONTEND_TO_BACKEND_ROLES = {
  'user': 'waiter',
  'moderator': 'cook',
  'admin': 'admin'
};

const BACKEND_TO_FRONTEND_ROLES = {
  'waiter': 'user',
  'cook': 'moderator',
  'admin': 'admin'
};

// Password reset token expiration (1 hour in milliseconds)
const PASSWORD_RESET_EXPIRATION = 3600000;

// Salt rounds for bcrypt
const SALT_ROUNDS = 10;

// User validation rules
const USER_VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

module.exports = {
  FRONTEND_TO_BACKEND_ROLES,
  BACKEND_TO_FRONTEND_ROLES,
  PASSWORD_RESET_EXPIRATION,
  SALT_ROUNDS,
  USER_VALIDATION
};
