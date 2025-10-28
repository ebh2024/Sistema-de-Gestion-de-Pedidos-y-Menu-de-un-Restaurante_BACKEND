const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT con los datos del usuario
 * @param {Object} payload - Datos a incluir en el token (id, email, role)
 * @returns {string} Token JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

module.exports = {
  generateToken
};

