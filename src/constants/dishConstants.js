/**
 * Constants for dish management
 */

// Dish validation rules
const DISH_VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 255,
  PRICE_MIN: 0
};

// Default values
const DISH_DEFAULTS = {
  AVAILABLE: true,
  DESCRIPTION: null
};

module.exports = {
  DISH_VALIDATION,
  DISH_DEFAULTS
};
