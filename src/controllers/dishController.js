const { getDishes, getDishById, createDish, updateDish, deleteDish } = require('../services/dishService');
const { validateDishCreation, validateDishUpdate, validateDishFilters } = require('../validators/dishValidators');

/**
 * Obtener todos los platos
 * GET /api/dishes
 */
const getAllDishes = async (req, res, next) => {
  try {
    const { available, search } = req.query;

    // Validate filters
    const filterValidation = validateDishFilters({ available, search });
    if (!filterValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: filterValidation.errors.join(', ')
      });
    }

    // Get dishes using service
    const filters = {};
    if (available !== undefined) {
      filters.available = available === 'true';
    }
    if (search !== undefined) {
      filters.search = search;
    }
    const dishes = await getDishes(filters);

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
const getDishByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get dish using service
    const dish = await getDishById(id);

    res.status(200).json({
      success: true,
      data: dish
    });
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
 * Crear un nuevo plato
 * POST /api/dishes
 */
const createDishController = async (req, res, next) => {
  try {
    const { name, description, price, available } = req.body;

    // Validate input
    const validation = validateDishCreation({ name, description, price, available });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }

    // Create dish using service
    const dish = await createDish({ name, description, price, available });

    res.status(201).json({
      success: true,
      message: 'Plato creado exitosamente',
      data: dish
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar un plato
 * PUT /api/dishes/:id
 */
const updateDishController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, available } = req.body;

    // Validate input
    const validation = validateDishUpdate({ name, description, price, available });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }

    // Update dish using service
    const dish = await updateDish(id, { name, description, price, available });

    res.status(200).json({
      success: true,
      message: 'Plato actualizado exitosamente',
      data: dish
    });
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
 * Eliminar un plato
 * DELETE /api/dishes/:id
 */
const deleteDishController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete dish using service
    await deleteDish(id);

    res.status(200).json({
      success: true,
      message: 'Plato eliminado exitosamente'
    });
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

module.exports = {
  getAllDishes,
  getDishById: getDishByIdController,
  createDish: createDishController,
  updateDish: updateDishController,
  deleteDish: deleteDishController
};
