/**
 * Business logic service for order operations
 */

const { Order, OrderDetail, Dish, Table, User } = require('../models');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { ORDER_STATUSES, ORDER_STATUS_TRANSITIONS, ORDER_FILTERS_BY_ROLE } = require('../constants/orderConstants');

/**
 * Mapear roles del frontend a roles del dominio de órdenes
 * - user     -> waiter (mesero)
 * - moderator/chef -> cook (cocinero)
 * - admin    -> admin
 * - otros    -> tal cual
 */
const mapRole = (role) => {
  if (!role) return role;
  const r = String(role).toLowerCase();
  if (r === 'user' || r === 'waiter') return 'waiter';
  if (r === 'moderator' || r === 'chef' || r === 'cook') return 'cook';
  if (r === 'admin') return 'admin';
  return r;
};

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
 * @param {number} [userId] - Current user id (for waiter filtering)
 * @returns {Promise<Array>} - Orders array
 */
const getOrders = async (filters, userRole, userId) => {
  const where = {};
  const normalizedRole = mapRole(userRole);

  // Apply filters
  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.tableId) {
    where.tableId = filters.tableId;
  }

  if (filters.startDate || filters.endDate) {
    where.created_at = {};
    if (filters.startDate) where.created_at[Op.gte] = new Date(filters.startDate);
    if (filters.endDate) where.created_at[Op.lte] = new Date(filters.endDate);
  }

  // Role-based filtering
  if (normalizedRole === 'cook') {
    // Solo ver pedidos de cocina activos
    where.status = { [Op.in]: [ORDER_STATUSES.PENDING, ORDER_STATUSES.IN_PROGRESS] };
  }
  if (normalizedRole === 'waiter' && userId) {
    // Mesero ve solo sus pedidos
    where.userId = userId;
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
        required: true, // Excluir pedidos sin detalles
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
  const normalizedRole = mapRole(userRole);
  if (normalizedRole === 'cook' && ![ORDER_STATUSES.PENDING, ORDER_STATUSES.IN_PROGRESS].includes(order.status)) {
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
    const normalizedRole = mapRole(userRole);
    if (!isValidStatusTransition(order.status, newStatus, normalizedRole)) {
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

    // Datos de cabecera del restaurante (configurables por env)
    const RESTO_NAME = process.env.RESTAURANT_NAME || 'Restaurante';
    const RESTO_ADDRESS = process.env.RESTAURANT_ADDRESS || 'Dirección del local';
    const RESTO_PHONE = process.env.RESTAURANT_PHONE || 'Tel: -';
    // Logo: ENV o fallbacks locales
    const candidates = [];
    if (process.env.RESTAURANT_LOGO_PATH) candidates.push(process.env.RESTAURANT_LOGO_PATH);
    // relativo al archivo actual: src/services -> src/assets
    candidates.push(path.join(__dirname, '..', 'assets', 'pdf-logo.png'));
    // relativo al cwd del proceso
    candidates.push(path.join(process.cwd(), 'src', 'assets', 'pdf-logo.png'));
    candidates.push(path.join(process.cwd(), 'assets', 'pdf-logo.png'));

    let RESTO_LOGO = null;
    for (const p of candidates) {
      try {
        if (p && fs.existsSync(p)) { RESTO_LOGO = p; break; }
      } catch {}
    }
    const PRIMARY_COLOR = process.env.RESTAURANT_PRIMARY_COLOR || '#222222';

    // Paleta y helpers visuales
    const BORDER_COLOR = '#e6e6e6';
    const TEXT_MUTED = '#666666';
    const ROW_ALT = '#fafafa';

    // Header (logo opcional)
    try {
      if (RESTO_LOGO && fs.existsSync(RESTO_LOGO)) {
        const maxW = 160; const maxH = 70;
        const imgX = (doc.page.width - maxW) / 2;
        doc.image(RESTO_LOGO, imgX, 40, { fit: [maxW, maxH] });
        doc.moveDown(2);
      } else {
        // eslint-disable-next-line no-console
        console.warn('[PDF] Logo no encontrado en ninguna ruta candidata:', candidates);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[PDF] No se pudo renderizar el logo:', e?.message);
    }

    doc.fillColor(PRIMARY_COLOR)
      .fontSize(22)
      .text(RESTO_NAME, { align: 'center' })
      .moveDown(0.2)
      .fillColor('black');

    doc
      .fontSize(10)
      .fillColor(TEXT_MUTED)
      .text(RESTO_ADDRESS, { align: 'center' })
      .text(RESTO_PHONE, { align: 'center' })
      .fillColor('black')
      .moveDown(0.6);

    // Datos del pedido
    doc
      .fontSize(12)
      .text(`Pedido #${order.id}`)
      .fillColor(TEXT_MUTED)
      .text(`Fecha: ${new Date(order.created_at || order.createdAt).toLocaleString()}`)
      .text(`Mesa: ${order.Table?.number ?? order.tableId}`)
      .text(`Atendido por: ${order.User?.name ?? 'N/A'}`)
      .fillColor('black')
      .moveDown(0.5);

    // Chip de estado
    const statusLabelMap = { pending: 'Pendiente', in_progress: 'En preparación', completed: 'Servido', cancelled: 'Cancelado' };
    const statusColorMap = { pending: '#ed6c02', in_progress: '#1976d2', completed: '#2e7d32', cancelled: '#c62828' };
    const chipW = 140, chipH = 18; const cx = 50, cy = doc.y;
    doc.roundedRect(cx, cy, chipW, chipH, 4).fillOpacity(0.1).fill(statusColorMap[order.status] || PRIMARY_COLOR).fillOpacity(1);
    doc.fillColor(statusColorMap[order.status] || PRIMARY_COLOR).font('Helvetica-Bold').fontSize(10)
      .text(statusLabelMap[order.status] || order.status, cx, cy + 3, { width: chipW, align: 'center' })
      .font('Helvetica').fillColor('black');
    doc.moveDown(1.2);

    // Separator
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown();

    // Items detail con tabla
    doc.font('Helvetica-Bold').fontSize(13).text('Detalle del Pedido').font('Helvetica').moveDown(0.4);

    // Encabezado de tabla
    const col = { name: { x: 50, w: 270 }, qty: { x: 330, w: 60 }, price: { x: 400, w: 80 }, total: { x: 490, w: 55 } };
    const headerY = doc.y;
    doc.rect(50, headerY - 2, 495, 20).fillColor(ROW_ALT).fill().fillColor('black');
    doc.font('Helvetica-Bold').fontSize(10)
      .text('Plato', col.name.x, headerY, { width: col.name.w })
      .text('Cant', col.qty.x, headerY, { width: col.qty.w, align: 'right' })
      .text('Precio', col.price.x, headerY, { width: col.price.w, align: 'right' })
      .text('Subtotal', col.total.x, headerY, { width: col.total.w, align: 'right' });
    doc.moveDown(1);
    doc.strokeColor(BORDER_COLOR).moveTo(50, doc.y).lineTo(545, doc.y).stroke().strokeColor('black');

    // Filas con zebra
    let subtotal = 0; let rowIndex = 0;
    order.OrderDetails.forEach((detail) => {
      const name = detail.Dish?.name || `Plato ${detail.dishId}`;
      const qty = Number(detail.quantity);
      const price = Number(detail.price);
      const lineTotal = qty * price;
      subtotal += lineTotal;

      const y = doc.y + 2;
      if (rowIndex % 2 === 0) {
        // zebra background
        doc.rect(50, y - 2, 495, 18).fillColor(ROW_ALT).fill().fillColor('black');
      }
      doc.font('Helvetica').fontSize(10)
        .text(name, col.name.x, y, { width: col.name.w })
        .text(String(qty), col.qty.x, y, { width: col.qty.w, align: 'right' })
        .text(`$${price.toFixed(2)}`, col.price.x, y, { width: col.price.w, align: 'right' })
        .text(`$${lineTotal.toFixed(2)}`, col.total.x, y, { width: col.total.w, align: 'right' });
      doc.moveDown(1);
      rowIndex += 1;
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(0.5);

    // Notas del pedido
    if (order.notes) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Notas', 50).font('Helvetica');
      doc.fillColor(TEXT_MUTED).fontSize(10).text(String(order.notes), { width: 495 }).fillColor('black');
      doc.moveDown(0.5);
    }

    // Totals block a la derecha
    const total = Number(order.total ?? subtotal);
    const boxW = 220, boxH = 50; const bx = 545 - boxW, by = doc.y + 6;
    doc.roundedRect(bx, by, boxW, boxH, 6).strokeColor(BORDER_COLOR).stroke().strokeColor('black');
    doc.font('Helvetica').fontSize(11)
      .text('Subtotal:', bx + 12, by + 10)
      .text('Total:', bx + 12, by + 28);
    doc.font('Helvetica-Bold')
      .text(`$${subtotal.toFixed(2)}`, bx + boxW - 12 - 100, by + 10, { width: 100, align: 'right' })
      .text(`$${total.toFixed(2)}`, bx + boxW - 12 - 100, by + 28, { width: 100, align: 'right' })
      .font('Helvetica');
    doc.moveDown(3);

    // Footer
    const WEBSITE = process.env.RESTAURANT_WEBSITE || '';
    doc.moveDown(1);
    doc.fontSize(10).fillColor(TEXT_MUTED)
      .text('¡Gracias por su visita!', { align: 'center' })
      .moveDown(0.2)
      .text(WEBSITE, { align: 'center' })
      .fillColor('black');

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
