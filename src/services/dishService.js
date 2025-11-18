/**
 * Business logic service for dish operations
 */

const { Dish } = require('../models');
const { Op } = require('sequelize');
const { DISH_DEFAULTS } = require('../constants/dishConstants');

/**
 * Get all dishes with optional filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} - Dishes array
 */
const getDishes = async (filters = {}) => {
  const { available, search } = filters;

  const where = {};

  // Filter by availability
  if (available !== undefined) {
    where.available = available;
  }

  // Search by name or description
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  const dishes = await Dish.findAll({
    where,
    order: [['created_at', 'DESC']]
  });

  return dishes;
};

/**
 * Get dish by ID
 * @param {number} dishId - Dish ID
 * @returns {Promise<Object>} - Dish object
 */
const getDishById = async (dishId) => {
  const dish = await Dish.findByPk(dishId);

  if (!dish) {
    throw new Error('Plato no encontrado');
  }

  return dish;
};

/**
 * Create a new dish
 * @param {Object} dishData - Dish creation data
 * @returns {Promise<Object>} - Created dish
 */
const createDish = async (dishData) => {
  const { name, description, price, available } = dishData;

  const newDish = await Dish.create({
    name,
    description: description || DISH_DEFAULTS.DESCRIPTION,
    price: parseFloat(price),
    available: available !== undefined ? available : DISH_DEFAULTS.AVAILABLE
  });

  return newDish;
};

/**
 * Update an existing dish
 * @param {number} dishId - Dish ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} - Updated dish
 */
const updateDish = async (dishId, updateData) => {
  const dish = await Dish.findByPk(dishId);

  if (!dish) {
    throw new Error('Plato no encontrado');
  }

  const { name, description, price, available } = updateData;

  // Update only provided fields
  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (description !== undefined) updateFields.description = description;
  if (price !== undefined) updateFields.price = parseFloat(price);
  if (available !== undefined) updateFields.available = available;

  await dish.update(updateFields);

  return dish;
};

/**
 * Delete a dish
 * @param {number} dishId - Dish ID
 * @returns {Promise<void>}
 */
const deleteDish = async (dishId) => {
  const dish = await Dish.findByPk(dishId);

  if (!dish) {
    throw new Error('Plato no encontrado');
  }

  await dish.destroy();
};

/**
 * Check if dish exists
 * @param {number} dishId - Dish ID
 * @returns {Promise<boolean>} - Whether dish exists
 */
const dishExists = async (dishId) => {
  const dish = await Dish.findByPk(dishId);
  return !!dish;
};

/**
 * Check if dish is available
 * @param {number} dishId - Dish ID
 * @returns {Promise<boolean>} - Whether dish is available
 */
const isDishAvailable = async (dishId) => {
  const dish = await Dish.findByPk(dishId);
  return dish && dish.available;
};

module.exports = {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
  dishExists,
  isDishAvailable
};
