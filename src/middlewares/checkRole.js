/**
 * Middleware para verificar roles de usuario
 * Debe usarse después del middleware auth
 * @param {...string} allowedRoles - Roles permitidos para acceder a la ruta
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado (debe venir del middleware auth)
      if (!req.user) {
        return res.status(401).json({
          error: 'Usuario no autenticado. Use el middleware auth antes de checkRole.'
        });
      }

      // Verificar si el rol del usuario está en los roles permitidos
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Acceso denegado. No tiene permisos para realizar esta acción.',
          requiredRoles: allowedRoles,
          userRole: req.user.role
        });
      }

      // Si el usuario tiene el rol adecuado, continuar
      next();
    } catch (error) {
      console.error('Error en middleware checkRole:', error);
      return res.status(500).json({
        error: 'Error al verificar permisos.'
      });
    }
  };
};

module.exports = checkRole;
