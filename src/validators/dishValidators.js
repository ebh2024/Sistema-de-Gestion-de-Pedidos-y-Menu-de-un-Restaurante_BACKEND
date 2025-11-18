/**
 * Validation functions for dish operations
 */

const { DISH_VALIDATION } = require('../constants/dishConstants');

/**
 * Validate dish creation data
 * @param {Object} data - Dish creation data
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateDishCreation = (data) => {
  const errors = [];
  const { name, description, price, available } = data;

  // Validate name
  if (!name || typeof name !== 'string' ||
      name.trim().length < DISH_VALIDATION.NAME_MIN_LENGTH ||
      name.trim().length > DISH_VALIDATION.NAME_MAX_LENGTH) {
    errors.push(`name es requerido y debe tener entre ${DISH_VALIDATION.NAME_MIN_LENGTH} y ${DISH_VALIDATION.NAME_MAX_LENGTH} caracteres`);
  }

  // Validate description (optional)
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string' || description.length > DISH_VALIDATION.DESCRIPTION_MAX_LENGTH) {
      errors.push(`description debe ser texto de hasta ${DISH_VALIDATION.DESCRIPTION_MAX_LENGTH} caracteres`);
    }
  }

  // Validate price
  if (price === undefined || price === null || isNaN(price) || parseFloat(price) <= DISH_VALIDATION.PRICE_MIN) {
    errors.push('price es requerido y debe ser un número positivo');
  }

  // Validate available (optional)
  if (available !== undefined && typeof available !== 'boolean') {
    errors.push('available debe ser booleano (true/false)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate dish update data
 * @param {Object} data - Dish update data
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateDishUpdate = (data) => {
  const errors = [];
  const { name, description, price, available } = data;

  // Validate name if provided
  if (name !== undefined) {
    if (!name || typeof name !== 'string' ||
        name.trim().length < DISH_VALIDATION.NAME_MIN_LENGTH ||
        name.trim().length > DISH_VALIDATION.NAME_MAX_LENGTH) {
      errors.push(`name debe tener entre ${DISH_VALIDATION.NAME_MIN_LENGTH} y ${DISH_VALIDATION.NAME_MAX_LENGTH} caracteres`);
    }
  }

  // Validate description if provided
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string' || description.length > DISH_VALIDATION.DESCRIPTION_MAX_LENGTH) {
      errors.push(`description debe ser texto de hasta ${DISH_VALIDATION.DESCRIPTION_MAX_LENGTH} caracteres`);
    }
  }

  // Validate price if provided
  if (price !== undefined) {
    if (isNaN(price) || parseFloat(price) <= DISH_VALIDATION.PRICE_MIN) {
      errors.push('price debe ser un número positivo');
    }
  }

  // Validate available if provided
  if (available !== undefined && typeof available !== 'boolean') {
    errors.push('available debe ser booleano (true/false)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate dish filters
 * @param {Object} filters - Filter object
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateDishFilters = (filters) => {
  const errors = [];
  const { available, search } = filters;

  // Validate available filter
  if (available !== undefined && typeof available !== 'string') {
    errors.push('available debe ser una cadena');
  } else if (available !== undefined && !['true', 'false'].includes(available)) {
    errors.push('available debe ser "true" o "false"');
  }

  // Validate search filter
  if (search !== undefined && typeof search !== 'string') {
    errors.push('search debe ser una cadena');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateDishCreation,
  validateDishUpdate,
  validateDishFilters
};
