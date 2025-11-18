const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
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
 * @access  Private (Admin)
 */
router.post('/', auth, checkRole('admin'), createDish);

/**
 * @route   PUT /api/dishes/:id
 * @desc    Actualizar un plato
 * @access  Private (Admin)
 */
router.put('/:id', auth, checkRole('admin'), updateDish);

/**
 * @route   DELETE /api/dishes/:id
 * @desc    Eliminar un plato
 * @access  Private (Admin)
 */
router.delete('/:id', auth, checkRole('admin'), deleteDish);

module.exports = router;
