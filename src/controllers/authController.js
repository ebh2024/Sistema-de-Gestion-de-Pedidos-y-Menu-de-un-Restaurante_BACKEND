const { registerUser, loginUser, initiatePasswordReset, resetPassword } = require('../services/authService');
const { validateRegistration, validateLogin, validateForgotPassword, validateResetPassword } = require('../validators/authValidators');

/**
 * Controller para registrar un nuevo usuario
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, username, password, role } = req.body;

    // Validate input
    const validation = validateRegistration({ firstName, lastName, email, username, password });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }

    // Register user using service
    const result = await registerUser({ firstName, lastName, email, username, password, role });

    res.status(201).json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    if (error.message.includes('ya está registrado')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Controller para iniciar sesión
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate input
    const validation = validateLogin({ username, password });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }

    // Login user using service
    const result = await loginUser({ username, password });

    res.status(200).json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    if (error.message.includes('Credenciales inválidas')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('Usuario inactivo')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Controller para solicitar recuperación de contraseña
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate input
    const validation = validateForgotPassword({ email });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }

    // Initiate password reset using service
    await initiatePasswordReset(email);

    res.status(200).json({
      success: true,
      message: 'Si el email existe, recibirás un enlace para recuperar tu contraseña'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para restablecer la contraseña
 * POST /api/auth/reset-password
 */
const resetPasswordController = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Validate input
    const validation = validateResetPassword({ token, password });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }

    // Reset password using service
    await resetPassword({ token, password });

    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });
  } catch (error) {
    if (error.message.includes('Token inválido o expirado')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword: resetPasswordController
};
