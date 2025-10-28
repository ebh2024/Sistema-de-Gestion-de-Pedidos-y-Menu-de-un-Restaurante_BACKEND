const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT con los datos del usuario
 * @param {Object} payload - Datos a incluir en el token (id, email, role)
 * @returns {string} Token JWT
 */
const generateToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

/**
 * Verifica y decodifica un token JWT
 * @param {string} token
 * @returns {Object} payload decodificado
 */
const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Lanzar error para que el controlador/middleware lo maneje
    const error = new Error('Token inválido o expirado');
    error.status = 401;
    throw error;
  }
};

/**
 * Middleware de Express para autenticar peticiones usando Authorization: Bearer <token>
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload; // attach decoded payload to request
    return next();
  } catch (err) {
    return res.status(err.status || 401).json({ message: err.message || 'Unauthorized' });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateJWT
};

