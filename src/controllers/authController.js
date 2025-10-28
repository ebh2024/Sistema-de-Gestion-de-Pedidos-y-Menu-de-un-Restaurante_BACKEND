const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken, verifyToken } = require('../utils/jwt');

/**
 * Controller para registrar un nuevo usuario
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validar campos requeridos
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos (name, email, password, role)'
      });
    }

    // Validar que el rol sea válido
    const validRoles = ['admin', 'cook', 'waiter'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Roles válidos: admin, cook, waiter'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el usuario
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    // Generar token JWT
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        },
        token
      }
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
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar el usuario por email
    const user = await User.findOne({ where: { email } });
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

    // Generar token JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para solicitar reset de contraseña
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email es requerido' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Para no filtrar si el email existe, devolver mensaje genérico
      return res.status(200).json({ success: true, message: 'Si el email está registrado, recibirás instrucciones para recuperar la contraseña' });
    }

    // Generar un token temporal con expiración corta (ej. 1h)
    const resetToken = generateToken({ id: user.id, email: user.email }, process.env.JWT_EXPIRES_RESET || '1h');

    // En un sistema real deberíamos enviar un correo con el token. Aquí devolvemos el token en la respuesta para pruebas
    return res.status(200).json({ success: true, message: 'Token de reseteo generado', data: { resetToken } });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para resetear la contraseña usando el token
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token y nueva contraseña son requeridos' });
    }

    // Verificar token
    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }

    const user = await User.findByPk(payload.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Encriptar nueva contraseña y actualizar
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
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

