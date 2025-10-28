// Middleware para proteger rutas según el rol del usuario
// Uso: router.get('/ruta', authenticateJWT, checkRole('admin'), handler)

module.exports = function checkRole(role) {
  return function (req, res, next) {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Acceso denegado: requiere rol ' + role });
    }
    next();
  };
};
