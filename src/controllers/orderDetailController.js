const { OrderDetail, Order, Dish } = require('../models');

/**
 * Obtener detalles de un pedido específico
 * GET /api/order_details/:orderId
 */
const getOrderDetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Verificar que el pedido existe
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Obtener los detalles del pedido con información del plato
    const orderDetails = await OrderDetail.findAll({
      where: { orderId },
      include: [
        {
          model: Dish,
          attributes: ['id', 'name', 'description', 'price', 'available']
        }
      ],
      order: [['created_at', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: orderDetails.length,
      data: orderDetails
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrderDetails
};
