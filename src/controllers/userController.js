const { User } = require('../models');

/**
 * Obtener perfil del usuario autenticado
 * GET /api/users/profile
 */
const getUserProfile = async (req, res, next) => {
  try {
    // El usuario ya está disponible en req.user gracias al middleware auth
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Excluir la contraseña por seguridad
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile
};
