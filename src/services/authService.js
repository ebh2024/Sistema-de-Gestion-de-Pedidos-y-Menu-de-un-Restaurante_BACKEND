/**
 * Business logic service for authentication operations
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { sendEmail, generatePasswordResetEmail } = require('../utils/emailService');
const {
  FRONTEND_TO_BACKEND_ROLES,
  BACKEND_TO_FRONTEND_ROLES,
  PASSWORD_RESET_EXPIRATION,
  SALT_ROUNDS
} = require('../constants/authConstants');

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - User data and token
 */
const registerUser = async (userData) => {
  const { firstName, lastName, email, username, password, role } = userData;

  // Map frontend role to backend role
  const backendRole = FRONTEND_TO_BACKEND_ROLES[role] || 'waiter';

  // Check if user already exists
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [
        { email },
        { name: username }
      ]
    }
  });

  if (existingUser) {
    throw new Error('El email o nombre de usuario ya está registrado');
  }

  // Hash password
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const newUser = await User.create({
    name: username,
    email,
    password: hashedPassword,
    role: backendRole
  });

  // Map backend role to frontend role for response
  const frontendRole = BACKEND_TO_FRONTEND_ROLES[newUser.role] || 'user';

  // Generate token
  const token = generateToken({
    id: newUser.id,
    email: newUser.email,
    role: newUser.role
  });

  return {
    user: {
      id: newUser.id,
      username: newUser.name,
      firstName: firstName,
      lastName: lastName,
      email: newUser.email,
      role: frontendRole
    },
    token
  };
};

/**
 * Authenticate user login
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} - User data and token
 */
const loginUser = async (credentials) => {
  const { username, password } = credentials;

  // Find user by username
  const user = await User.findOne({ where: { name: username } });
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  // Check if user is active
  if (!user.is_active) {
    throw new Error('Usuario inactivo. Contacte al administrador');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Credenciales inválidas');
  }

  // Map backend role to frontend role
  const frontendRole = BACKEND_TO_FRONTEND_ROLES[user.role] || 'user';

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  return {
    user: {
      id: user.id,
      username: user.name,
      firstName: user.name, // Using username as firstName for compatibility
      lastName: '',
      email: user.email,
      role: frontendRole
    },
    token
  };
};

/**
 * Initiate password reset process
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
const initiatePasswordReset = async (email) => {
  // Find user by email
  const user = await User.findOne({ where: { email } });

  // For security, don't reveal if email exists
  if (!user) {
    return; // Silently return
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetPasswordExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRATION);

  // Save token to database
  await user.update({
    resetPasswordToken: resetToken,
    resetPasswordExpires
  });

  // Generate and send email
  const resetEmailHtml = generatePasswordResetEmail(resetToken);

  try {
    await sendEmail(
      user.email,
      'Recuperación de Contraseña - Sistema de Restaurante',
      resetEmailHtml
    );
  } catch (emailError) {
    console.error('Error al enviar email:', emailError);
    // Don't throw error for security
  }
};

/**
 * Reset user password using token
 * @param {Object} resetData - Reset data with token and new password
 * @returns {Promise<void>}
 */
const resetPassword = async (resetData) => {
  const { token, password } = resetData;

  // Find user with valid token
  const user = await User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: {
        [Op.gt]: new Date()
      }
    }
  });

  if (!user) {
    throw new Error('Token inválido o expirado');
  }

  // Hash new password
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update password and clear tokens
  await user.update({
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpires: null
  });
};

/**
 * Check if user exists by email or username
 * @param {string} email - User email
 * @param {string} username - Username
 * @returns {Promise<boolean>} - Whether user exists
 */
const userExists = async (email, username) => {
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [
        { email },
        { name: username }
      ]
    }
  });

  return !!existingUser;
};

module.exports = {
  registerUser,
  loginUser,
  initiatePasswordReset,
  resetPassword,
  userExists
};
