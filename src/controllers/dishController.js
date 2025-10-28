const { Dish } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener todos los platos
 * GET /api/dishes
 */
const getAllDishes = async (req, res, next) => {
  try {
    const { available, search } = req.query;

    // Construir condiciones de búsqueda
    const where = {};
    
    // Filtrar por disponibilidad si se especifica
    if (available !== undefined) {
      where.available = available === 'true';
    }

    // Buscar por nombre o descripción
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Obtener todos los platos
    const dishes = await Dish.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: dishes.length,
      data: dishes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un plato por ID
 * GET /api/dishes/:id
 */
const getDishById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const dish = await Dish.findByPk(id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Plato no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: dish
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear un nuevo plato
 * POST /api/dishes
 */
const createDish = async (req, res, next) => {
  try {
    const { name, description, price, available } = req.body;

    // Validar campos requeridos
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y el precio son requeridos'
      });
    }

    // Validar que el precio sea un número positivo
    if (isNaN(price) || parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser un número positivo'
      });
    }

    // Crear el plato
    const newDish = await Dish.create({
      name,
      description: description || null,
      price: parseFloat(price),
      available: available !== undefined ? available : true
    });

    res.status(201).json({
      success: true,
      message: 'Plato creado exitosamente',
      data: newDish
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar un plato
 * PUT /api/dishes/:id
 */
const updateDish = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, available } = req.body;

    // Buscar el plato
    const dish = await Dish.findByPk(id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Plato no encontrado'
      });
    }

    // Validar precio si se proporciona
    if (price !== undefined) {
      if (isNaN(price) || parseFloat(price) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio debe ser un número positivo'
        });
      }
    }

    // Actualizar el plato
    await dish.update({
      name: name || dish.name,
      description: description !== undefined ? description : dish.description,
      price: price ? parseFloat(price) : dish.price,
      available: available !== undefined ? available : dish.available
    });

    res.status(200).json({
      success: true,
      message: 'Plato actualizado exitosamente',
      data: dish
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar un plato
 * DELETE /api/dishes/:id
 */
const deleteDish = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Buscar el plato
    const dish = await Dish.findByPk(id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Plato no encontrado'
      });
    }

    // Eliminar el plato
    await dish.destroy();

    res.status(200).json({
      success: true,
      message: 'Plato eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish
};

