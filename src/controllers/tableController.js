const { Table } = require('../models');

/**
 * Obtener todas las mesas con filtros opcionales
 * GET /api/tables?number=1&status=available&minCapacity=2
 */
const getAllTables = async (req, res, next) => {
  try {
    const { number, status, minCapacity, maxCapacity } = req.query;

    const where = {};

    if (number !== undefined) {
      const num = parseInt(number, 10);
      if (isNaN(num)) {
        return res.status(400).json({ success: false, message: 'Número inválido' });
      }
      where.number = num;
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (minCapacity !== undefined || maxCapacity !== undefined) {
      where.capacity = {};
      if (minCapacity !== undefined) {
        const min = parseInt(minCapacity, 10);
        if (isNaN(min)) return res.status(400).json({ success: false, message: 'minCapacity inválido' });
        where.capacity['$gte'] = min; // sequelize will translate correctly via where object
      }
      if (maxCapacity !== undefined) {
        const max = parseInt(maxCapacity, 10);
        if (isNaN(max)) return res.status(400).json({ success: false, message: 'maxCapacity inválido' });
        where.capacity['$lte'] = max;
      }
    }

    const tables = await Table.findAll({ where });

    res.status(200).json({ success: true, count: tables.length, data: tables });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener mesa por ID
 */
const getTableById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const table = await Table.findByPk(id);
    if (!table) return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
    return res.status(200).json({ success: true, data: table });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear mesa
 */
const createTable = async (req, res, next) => {
  try {
    const { number, capacity, status } = req.body;

    if (number === undefined || capacity === undefined) {
      return res.status(400).json({ success: false, message: 'number y capacity son requeridos' });
    }

    const num = parseInt(number, 10);
    const cap = parseInt(capacity, 10);
    if (isNaN(num) || num <= 0) return res.status(400).json({ success: false, message: 'number debe ser entero positivo' });
    if (isNaN(cap) || cap <= 0) return res.status(400).json({ success: false, message: 'capacity debe ser entero positivo' });

    const validStatuses = ['available', 'occupied', 'reserved'];
    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status inválido. Valores permitidos: ${validStatuses.join(', ')}` });
    }

    const newTable = await Table.create({ number: num, capacity: cap, status: status || 'available' });

    return res.status(201).json({ success: true, message: 'Mesa creada', data: newTable });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar mesa
 */
const updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { number, capacity, status } = req.body;

    const table = await Table.findByPk(id);
    if (!table) return res.status(404).json({ success: false, message: 'Mesa no encontrada' });

    if (number !== undefined) {
      const num = parseInt(number, 10);
      if (isNaN(num) || num <= 0) return res.status(400).json({ success: false, message: 'number debe ser entero positivo' });
      table.number = num;
    }

    if (capacity !== undefined) {
      const cap = parseInt(capacity, 10);
      if (isNaN(cap) || cap <= 0) return res.status(400).json({ success: false, message: 'capacity debe ser entero positivo' });
      table.capacity = cap;
    }

    if (status !== undefined) {
      const validStatuses = ['available', 'occupied', 'reserved'];
      if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: `status inválido. Valores permitidos: ${validStatuses.join(', ')}` });
      table.status = status;
    }

    await table.save();
    return res.status(200).json({ success: true, message: 'Mesa actualizada', data: table });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar mesa
 */
const deleteTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const table = await Table.findByPk(id);
    if (!table) return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
    await table.destroy();
    return res.status(200).json({ success: true, message: 'Mesa eliminada' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable
};
