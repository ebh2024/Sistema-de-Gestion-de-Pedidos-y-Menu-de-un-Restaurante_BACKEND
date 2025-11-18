const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { sendEmail, generatePasswordResetEmail } = require('../utils/emailService');

// Role mapping constants
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

/**
 * Controller para registrar un nuevo usuario
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, username, password, role } = req.body;

    // Validar campos requeridos
    if (!firstName || !lastName || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos (firstName, lastName, email, username, password)'
      });
    }

    // Map frontend roles to backend roles
    const backendRole = FRONTEND_TO_BACKEND_ROLES[role] || 'waiter';

    // Verificar si el usuario ya existe (por email o username)
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email },
          { name: username } // Using name field to store username
        ]
      }
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El email o nombre de usuario ya está registrado'
      });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el usuario
    const newUser = await User.create({
      name: username, // Store username in name field
      email,
      password: hashedPassword,
      role: backendRole
    });

    // Map backend role to frontend role for response
    const frontendRole = BACKEND_TO_FRONTEND_ROLES[newUser.role] || 'user';

    // Generar token JWT
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    // Respuesta exitosa (formato esperado por el frontend)
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.name,
        firstName: firstName,
        lastName: lastName,
        email: newUser.email,
        role: frontendRole
      },
      token
    });
  } catch (error) {
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

    // Validar campos requeridos
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de usuario y contraseña son requeridos'
      });
    }

    // Buscar el usuario por username (almacenado en el campo name)
    const user = await User.findOne({ where: { name: username } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador'
      });
    }

    // Verificar la contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Map backend roles to frontend roles
    const frontendRole = BACKEND_TO_FRONTEND_ROLES[user.role] || 'user';

    // Generar token JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Respuesta exitosa (formato esperado por el frontend)
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.name,
        firstName: user.name, // Using username as firstName for compatibility
        lastName: '',
        email: user.email,
        role: frontendRole
      },
      token
    });
  } catch (error) {
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

    // Validar email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }

    // Buscar el usuario
    const user = await User.findOne({ where: { email } });
    
    // Por seguridad, no revelamos si el email existe o no
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Si el email existe, recibirás un enlace para recuperar tu contraseña'
      });
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en la base de datos
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires
    });

    // Generar y enviar email
    const resetEmailHtml = generatePasswordResetEmail(resetToken);
    
    try {
      await sendEmail(
        user.email,
        'Recuperación de Contraseña - Sistema de Restaurante',
        resetEmailHtml
      );
    } catch (emailError) {
      console.error('Error al enviar email:', emailError);
      // No revelamos error de email por seguridad
    }

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
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Validar campos requeridos
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña son requeridos'
      });
    }

    // Buscar usuario con el token válido
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Actualizar contraseña y limpiar tokens
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
};
