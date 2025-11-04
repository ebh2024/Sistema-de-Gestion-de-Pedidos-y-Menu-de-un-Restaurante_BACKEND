const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/orderController');

/**
 * @route   POST /api/orders
 * @desc    Crear un nuevo pedido
 * @access  Private (waiter, admin)
 */
router.post('/', auth, createOrder);

/**
 * @route   GET /api/orders
 * @desc    Obtener todos los pedidos (con filtros por rol)
 * @access  Private
 */
router.get('/', auth, getAllOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Obtener un pedido por ID
 * @access  Private
 */
router.get('/:id', auth, getOrderById);

/**
 * @route   PUT /api/orders/:id
 * @desc    Actualizar estado de un pedido
 * @access  Private
 */
router.put('/:id', auth, updateOrderStatus);

module.exports = router;

