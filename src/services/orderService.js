/**
 * Business logic service for order operations
 */

const { Order, OrderDetail, Dish, Table, User } = require('../models');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { ORDER_STATUSES, ORDER_STATUS_TRANSITIONS, ORDER_FILTERS_BY_ROLE } = require('../constants/orderConstants');

/**
 * Create a new order with validation and business logic
 * @param {Object} orderData - Order creation data
 * @param {number} userId - User ID creating the order
 * @returns {Promise<Object>} - Created order with details
 */
const createOrder = async (orderData, userId) => {
  const transaction = await sequelize.transaction();

  try {
    const { tableId, items } = orderData;

    // Validate table exists and is available
    const table = await Table.findByPk(tableId, { transaction });
    if (!table) {
      throw new Error('Mesa no encontrada');
    }

    if (table.status !== 'available') {
      throw new Error(`La mesa ${table.number} no está disponible. Estado actual: ${table.status}`);
    }

    // Validate items and calculate total
    let total = 0;
    const orderDetails = [];

    for (const item of items) {
      const { dishId, quantity } = item;

      const dish = await Dish.findByPk(dishId, { transaction });
      if (!dish) {
        throw new Error(`Plato con ID ${dishId} no encontrado`);
      }

      if (!dish.available) {
        throw new Error(`El plato "${dish.name}" no está disponible`);
      }

      const itemPrice = parseFloat(dish.price);
      const itemSubtotal = itemPrice * quantity;
      total += itemSubtotal;

      orderDetails.push({
        dishId,
        quantity,
        price: itemPrice
      });
    }

    // Create order
    const newOrder = await Order.create({
      userId,
      tableId,
      total: parseFloat(total.toFixed(2)),
      status: ORDER_STATUSES.PENDING
    }, { transaction });

    // Create order details
    await Promise.all(
      orderDetails.map(detail =>
        OrderDetail.create({
          orderId: newOrder.id,
          ...detail
        }, { transaction })
      )
    );

    // Update table status
    await table.update({ status: 'occupied' }, { transaction });

    await transaction.commit();

    // Return complete order with relations
    return await getOrderById(newOrder.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get orders with role-based filtering
 * @param {Object} filters - Query filters
 * @param {string} userRole - User role for filtering
 * @returns {Promise<Array>} - Orders array
 */
const getOrders = async (filters, userRole) => {
  const where = {};

  // Apply filters
  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.tableId) {
    where.tableId = filters.tableId;
  }

  if (filters.startDate || filters.endDate) {
    where.created_at = {};
    if (filters.startDate) {
      where.created_at[Op.gte] = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.created_at[Op.lte] = new Date(filters.endDate);
    }
  }

  // Apply role-based filters
  if (userRole === 'cook') {
    where.status = ORDER_FILTERS_BY_ROLE.cook.status;
  }

  const orders = await Order.findAll({
    where,
    include: [
      {
        model: User,
        attributes: ['id', 'name', 'email', 'role']
      },
      {
        model: Table,
        attributes: ['id', 'number', 'capacity', 'status']
      },
      {
        model: OrderDetail,
        include: [{
          model: Dish,
          attributes: ['id', 'name', 'description', 'price']
        }]
      }
    ],
    order: [['created_at', 'DESC']]
  });

  return orders;
};

/**
 * Get order by ID with role-based access control
 * @param {number} orderId - Order ID
 * @param {string} userRole - User role
 * @returns {Promise<Object>} - Order object
 */
const getOrderById = async (orderId, userRole) => {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: User,
        attributes: ['id', 'name', 'email', 'role']
      },
      {
        model: Table,
        attributes: ['id', 'number', 'capacity', 'status']
      },
      {
        model: OrderDetail,
        include: [{
          model: Dish,
          attributes: ['id', 'name', 'description', 'price']
        }]
      }
    ]
  });

  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  // Role-based access control
  if (userRole === 'cook' && ![ORDER_STATUSES.PENDING, ORDER_STATUSES.IN_PROGRESS].includes(order.status)) {
    throw new Error('No tienes permisos para ver este pedido');
  }

  return order;
};

/**
 * Update order status with role-based transition validation
 * @param {number} orderId - Order ID
 * @param {string} newStatus - New status
 * @param {string} userRole - User role
 * @returns {Promise<Object>} - Updated order
 */
const updateOrderStatus = async (orderId, newStatus, userRole) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findByPk(orderId, {
      include: [{ model: Table }],
      transaction
    });

    if (!order) {
      throw new Error('Pedido no encontrado');
    }

    // Validate status transition based on role
    if (!isValidStatusTransition(order.status, newStatus, userRole)) {
      throw new Error(`No puedes cambiar el estado de "${order.status}" a "${newStatus}". Transición no permitida para tu rol.`);
    }

    // Update status
    await order.update({ status: newStatus }, { transaction });

    // Handle table status changes
    if ([ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(newStatus)) {
      const table = await Table.findByPk(order.tableId, { transaction });
      if (table) {
        await table.update({ status: 'available' }, { transaction });
      }
    }

    await transaction.commit();

    // Return updated order
    return await getOrderById(orderId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Generate PDF ticket for an order
 * @param {number} orderId - Order ID
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateOrderTicketPDF = async (orderId) => {
  const order = await Order.findByPk(orderId, {
    include: [
      { model: User, attributes: ['id', 'name', 'email', 'role'] },
      { model: Table, attributes: ['id', 'number'] },
      {
        model: OrderDetail,
        include: [{ model: Dish, attributes: ['id', 'name', 'price'] }]
      }
    ]
  });

  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  return new Promise((resolve, reject) => {
    const chunks = [];

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc
      .fontSize(20)
      .text('Restaurante - Ticket de Pedido', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .text(`Pedido #${order.id}`)
      .text(`Fecha: ${new Date(order.created_at || order.createdAt).toLocaleString()}`)
      .text(`Mesa: ${order.Table?.number ?? order.tableId}`)
      .text(`Atendido por: ${order.User?.name ?? 'N/A'}`)
      .moveDown();

    // Separator
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown();

    // Items detail
    doc.fontSize(14).text('Detalle', { underline: true }).moveDown(0.5);

    doc.fontSize(12);
    let subtotal = 0;
    order.OrderDetails.forEach((detail) => {
      const name = detail.Dish?.name || `Plato ${detail.dishId}`;
      const qty = detail.quantity;
      const price = Number(detail.price);
      const lineTotal = qty * price;
      subtotal += lineTotal;

      doc.text(`${name}  x${qty}  -  $${price.toFixed(2)}  =  $${lineTotal.toFixed(2)}`);
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(0.5);

    // Totals
    const total = Number(order.total ?? subtotal);
    doc
      .fontSize(12)
      .text(`Subtotal: $${subtotal.toFixed(2)}`, { align: 'right' })
      .text(`Total: $${total.toFixed(2)}`, { align: 'right' })
      .moveDown();

    doc.text('¡Gracias por su visita!', { align: 'center' });

    doc.end();
  });
};

/**
 * Delete order (admin only)
 * @param {number} orderId - Order ID
 * @param {string} userRole - User role
 * @returns {Promise<void>}
 */
const deleteOrder = async (orderId, userRole) => {
  if (userRole !== 'admin') {
    throw new Error('Solo los administradores pueden eliminar pedidos');
  }

  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findByPk(orderId, {
      include: [{ model: Table }],
      transaction
    });

    if (!order) {
      throw new Error('Pedido no encontrado');
    }

    if (order.status === ORDER_STATUSES.COMPLETED) {
      throw new Error('No se puede eliminar un pedido completado');
    }

    // Free table if occupied
    if (order.Table && order.Table.status === 'occupied') {
      await order.Table.update({ status: 'available' }, { transaction });
    }

    // Delete order details first
    await OrderDetail.destroy({
      where: { orderId },
      transaction
    });

    // Delete order
    await order.destroy({ transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Validate if a status transition is allowed for a role
 * @param {string} currentStatus - Current order status
 * @param {string} newStatus - New status to transition to
 * @param {string} userRole - User role
 * @returns {boolean} - Whether transition is allowed
 */
const isValidStatusTransition = (currentStatus, newStatus, userRole) => {
  const transitions = ORDER_STATUS_TRANSITIONS[userRole];

  if (!transitions) {
    return userRole === 'admin'; // Admin can do any transition
  }

  if (typeof transitions.allowedTransitions === 'function') {
    return transitions.allowedTransitions(currentStatus, newStatus);
  }

  return transitions[currentStatus]?.includes(newStatus) || false;
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  generateOrderTicketPDF,
  deleteOrder,
  isValidStatusTransition
};
