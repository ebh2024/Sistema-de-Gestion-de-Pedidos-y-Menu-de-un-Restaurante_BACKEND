const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../utils/jwt');
const checkRole = require('../utils/checkRole');
const {
  getAllDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish
} = require('../controllers/dishController');

/**
 * @route   GET /api/dishes
 * @desc    Obtener todos los platos
 * @access  Public
 * @query   available, search
 */
router.get('/', getAllDishes);

/**
 * @route   GET /api/dishes/:id
 * @desc    Obtener un plato por ID
 * @access  Public
 */
router.get('/:id', getDishById);

/**
 * @route   POST /api/dishes
 * @desc    Crear un nuevo plato
 * @access  Public
 */
router.post('/', authenticateJWT, checkRole('admin'), createDish);

/**
 * @route   PUT /api/dishes/:id
 * @desc    Actualizar un plato
 * @access  Public
 */
router.put('/:id', authenticateJWT, checkRole('admin'), updateDish);

/**
 * @route   DELETE /api/dishes/:id
 * @desc    Eliminar un plato
 * @access  Public
 */
router.delete('/:id', authenticateJWT, checkRole('admin'), deleteDish);

module.exports = router;

