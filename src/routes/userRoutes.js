const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getUserProfile } = require('../controllers/userController');

/**
 * @route   GET /api/users/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile', auth, getUserProfile);

module.exports = router;
