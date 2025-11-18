const { Order, OrderDetail, Dish, Table, User } = require('../models');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Import services and validators
const { createOrder, getOrders, getOrderById, updateOrderStatus, generateOrderTicketPDF, deleteOrder } = require('../services/orderService');
const { validateOrderCreation, validateOrderStatus, validateOrderFilters } = require('../validators/orderValidators');

/**
 * Crear un nuevo pedido
 * POST /api/orders
 * - Calcula el total server-side
 * - Crea registros en order_details
 * - Valida disponibilidad de platos y mesa
 */
const createOrderController = async (req, res, next) => {
  try {
    const { tableId, items } = req.body;
    const userId = req.user.id;

    // Validate input
    const validation = validateOrderCreation({ tableId, items });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }

    // Create order using service
    const order = await createOrder({ tableId, items }, userId);

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: order
    });
  } catch (error) {
    if (error.message.includes('no encontrada') || error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('no está disponible')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
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

    // Validate filters
    const filterValidation = validateOrderFilters({ status, tableId, startDate, endDate });
    if (!filterValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: filterValidation.errors.join(', ')
      });
    }

    // Get orders using service
    const orders = await getOrders({ status, tableId, startDate, endDate }, userRole);

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
const getOrderByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    // Get order using service
    const order = await getOrderById(id, userRole);

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('permisos')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Actualizar el estado de un pedido
 * PUT /api/orders/:id
 * - Valida transiciones de estado según rol
 */
const updateOrderStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    // Validate status
    const validation = validateOrderStatus(status);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }

    // Update order status using service
    const updatedOrder = await updateOrderStatus(id, status, userRole);

    res.status(200).json({
      success: true,
      message: 'Estado del pedido actualizado exitosamente',
      data: updatedOrder
    });
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('permisos') || error.message.includes('cambiar')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Generar PDF de ticket para un pedido
 * GET /api/orders/:id/ticket
 */
const generateOrderTicketPDFController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Generate PDF using service
    const pdfBuffer = await generateOrderTicketPDF(id);

    // Set headers and send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="ticket-pedido-${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Cancelar/eliminar un pedido (solo admin)
 * DELETE /api/orders/:id
 */
const deleteOrderController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    // Delete order using service
    await deleteOrder(id, userRole);

    res.status(200).json({
      success: true,
      message: 'Pedido eliminado exitosamente'
    });
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('Solo los administradores') || error.message.includes('eliminar un pedido completado')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  createOrder: createOrderController,
  getAllOrders,
  getOrderById: getOrderByIdController,
  updateOrderStatus: updateOrderStatusController,
  deleteOrder: deleteOrderController,
  generateOrderTicketPDF: generateOrderTicketPDFController
};
