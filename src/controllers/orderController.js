const { Order, OrderDetail, Dish, Table, User } = require('../models');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Crear un nuevo pedido
 * POST /api/orders
 * - Calcula el total server-side
 * - Crea registros en order_details
 * - Valida disponibilidad de platos y mesa
 */
const createOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { tableId, items } = req.body;
    const userId = req.user.id; // Usuario autenticado

    // Validar campos requeridos
    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'tableId y items (array no vacío) son requeridos'
      });
    }

    // Validar que la mesa existe y está disponible
    const table = await Table.findByPk(tableId, { transaction });
    if (!table) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Mesa no encontrada'
      });
    }

    if (table.status !== 'available') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `La mesa ${table.number} no está disponible. Estado actual: ${table.status}`
      });
    }

    // Validar items y calcular total
    let total = 0;
    const orderDetails = [];

    for (const item of items) {
      const { dishId, quantity } = item;

      // Validar campos del item
      if (!dishId || !quantity || quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cada item debe tener dishId y quantity (mayor a 0)'
        });
      }

      // Buscar el plato
      const dish = await Dish.findByPk(dishId, { transaction });
      if (!dish) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Plato con ID ${dishId} no encontrado`
        });
      }

      // Validar disponibilidad del plato
      if (!dish.available) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `El plato "${dish.name}" no está disponible`
        });
      }

      // Calcular subtotal del item
      const itemPrice = parseFloat(dish.price);
      const itemSubtotal = itemPrice * quantity;
      total += itemSubtotal;

      // Preparar detalle del pedido
      orderDetails.push({
        dishId,
        quantity,
        price: itemPrice
      });
    }

    // Crear el pedido
    const newOrder = await Order.create({
      userId,
      tableId,
      total: parseFloat(total.toFixed(2)),
      status: 'pending'
    }, { transaction });

    // Crear los detalles del pedido
    const createdDetails = await Promise.all(
      orderDetails.map(detail =>
        OrderDetail.create({
          orderId: newOrder.id,
          ...detail
        }, { transaction })
      )
    );

    // Actualizar estado de la mesa a "occupied"
    await table.update({ status: 'occupied' }, { transaction });

    // Confirmar transacción
    await transaction.commit();

    // Obtener el pedido completo con relaciones
    const orderWithDetails = await Order.findByPk(newOrder.id, {
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

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: orderWithDetails
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Obtener todos los pedidos con filtros por rol
 * GET /api/orders
 * - Admin: ve todos los pedidos
 * - Cook: ve pedidos en 'pending' o 'in_progress'
 * - Waiter: ve pedidos de sus mesas o todos si no hay filtro
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { status, tableId, startDate, endDate } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Construir condiciones de búsqueda
    const where = {};

    // Filtro por estado
    if (status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (validStatuses.includes(status)) {
        where.status = status;
      }
    }

    // Filtro por mesa
    if (tableId) {
      where.tableId = tableId;
    }

    // Filtro por fecha
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.created_at[Op.lte] = new Date(endDate);
      }
    }

    // Filtros según el rol
    if (userRole === 'cook') {
      // Cocineros solo ven pedidos pendientes o en progreso
      where.status = {
        [Op.in]: ['pending', 'in_progress']
      };
    } else if (userRole === 'waiter') {
      // Meseros ven todos los pedidos (pueden filtrar por mesa)
      // No se aplica filtro adicional
    }
    // Admin ve todos los pedidos sin filtro adicional

    // Obtener pedidos
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

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un pedido por ID
 * GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    const order = await Order.findByPk(id, {
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
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Validación por rol: cocineros solo ven pedidos pendientes o en progreso
    if (userRole === 'cook' && !['pending', 'in_progress'].includes(order.status)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este pedido'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar el estado de un pedido
 * PUT /api/orders/:id
 * - Valida transiciones de estado según rol
 */
const updateOrderStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    // Validar campos requeridos
    if (!status) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El campo status es requerido'
      });
    }

    // Validar estado válido
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}`
      });
    }

    // Buscar el pedido
    const order = await Order.findByPk(id, {
      include: [
        {
          model: Table
        }
      ],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Validar transiciones de estado según rol
    if (userRole === 'cook') {
      // Cocineros solo pueden cambiar: pending -> in_progress -> completed
      const allowedTransitions = {
        'pending': ['in_progress'],
        'in_progress': ['completed'],
        'completed': [],
        'cancelled': []
      };

      if (!allowedTransitions[order.status]?.includes(status)) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: `No puedes cambiar el estado de "${order.status}" a "${status}". Transición no permitida para tu rol.`
        });
      }
    } else if (userRole === 'waiter') {
      // Meseros pueden cambiar: pending -> in_progress, cualquier estado -> cancelled
      if (status === 'cancelled') {
        // Permitir cancelación desde cualquier estado
      } else if (order.status === 'pending' && status === 'in_progress') {
        // Permitir
      } else {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: `No puedes cambiar el estado de "${order.status}" a "${status}". Transición no permitida para tu rol.`
        });
      }
    }
    // Admin puede cambiar cualquier estado

    // Actualizar estado
    await order.update({ status }, { transaction });

    // Si el pedido se completa o cancela, liberar la mesa
    if (status === 'completed' || status === 'cancelled') {
      const table = await Table.findByPk(order.tableId, { transaction });
      if (table) {
        await table.update({ status: 'available' }, { transaction });
      }
    }

    // Confirmar transacción
    await transaction.commit();

    // Obtener el pedido actualizado con relaciones
    const updatedOrder = await Order.findByPk(id, {
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

    res.status(200).json({
      success: true,
      message: 'Estado del pedido actualizado exitosamente',
      data: updatedOrder
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Generar PDF de ticket para un pedido
 * GET /api/orders/:id/ticket
 */
const generateOrderTicketPDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
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
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Configurar headers para PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="ticket-pedido-${order.id}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Encabezado
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

    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown();

    // Detalle de items
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

    // Totales
    const total = Number(order.total ?? subtotal);
    doc
      .fontSize(12)
      .text(`Subtotal: $${subtotal.toFixed(2)}`, { align: 'right' })
      .text(`Total: $${total.toFixed(2)}`, { align: 'right' })
      .moveDown();

    doc.text('¡Gracias por su visita!', { align: 'center' });

    // Finalizar PDF
    doc.end();
  } catch (error) {
    next(error);
  }
};

/**
 * Cancelar/eliminar un pedido (solo admin)
 * DELETE /api/orders/:id
 */
const deleteOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const userRole = req.user.role;

    // Solo admin puede eliminar pedidos
    if (userRole !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden eliminar pedidos'
      });
    }

    // Buscar el pedido
    const order = await Order.findByPk(id, {
      include: [
        {
          model: Table
        }
      ],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // No permitir eliminar pedidos completados
    if (order.status === 'completed') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un pedido completado'
      });
    }

    // Liberar la mesa si estaba ocupada por este pedido
    if (order.Table && order.Table.status === 'occupied') {
      await order.Table.update({ status: 'available' }, { transaction });
    }

    // Eliminar los detalles del pedido primero (por foreign key)
    await OrderDetail.destroy({
      where: { orderId: id },
      transaction
    });

    // Eliminar el pedido
    await order.destroy({ transaction });

    // Confirmar transacción
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Pedido eliminado exitosamente'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  generateOrderTicketPDF
};
