const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  generateOrderTicketPDF
} = require('../controllers/orderController');

/**
 * @route   POST /api/orders
 * @desc    Crear un nuevo pedido
 * @access  Private (waiter, admin)
 */
router.post('/', auth, checkRole('waiter', 'admin'), createOrder);

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
 * @route   GET /api/orders/:id/ticket
 * @desc    Generar y devolver el PDF del ticket del pedido
 * @access  Private
 */
router.get('/:id/ticket', auth, generateOrderTicketPDF);

/**
 * @route   PUT /api/orders/:id
 * @desc    Actualizar estado de un pedido
 * @access  Private (cook, waiter, admin)
 */
router.put('/:id', auth, checkRole('cook', 'waiter', 'admin'), updateOrderStatus);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Eliminar un pedido (solo admin)
 * @access  Private (admin only)
 */
router.delete('/:id', auth, checkRole('admin'), deleteOrder);

module.exports = router;
