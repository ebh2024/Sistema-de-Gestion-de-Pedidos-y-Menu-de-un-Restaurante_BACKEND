const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getOrderDetails } = require('../controllers/orderDetailController');

/**
 * @route   GET /api/order_details/:orderId
 * @desc    Obtener detalles de un pedido específico
 * @access  Private
 */
router.get('/:orderId', auth, getOrderDetails);

module.exports = router;
