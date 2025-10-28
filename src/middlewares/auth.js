const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware de autenticación
 * Verifica que el token JWT sea válido y extrae la información del usuario
 */
const auth = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Acceso denegado. No se proporcionó token de autenticación.'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_default');

    // Buscar el usuario en la base de datos
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        error: 'Token inválido. Usuario no encontrado.'
      });
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Usuario inactivo. Contacte al administrador.'
      });
    }

    // Agregar el usuario al objeto request para usarlo en las rutas
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado. Por favor, inicie sesión nuevamente.'
      });
    }

    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      error: 'Error en la autenticación.'
    });
  }
};

module.exports = auth;
