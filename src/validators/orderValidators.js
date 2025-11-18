/**
 * Validation functions for order operations
 */

const { VALID_ORDER_STATUSES } = require('../constants/orderConstants');

/**
 * Validate order creation data
 * @param {Object} data - Order creation data
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateOrderCreation = (data) => {
  const errors = [];
  const { tableId, items } = data;

  // Validate required fields
  if (!tableId) {
    errors.push('tableId es requerido');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('items debe ser un array no vacío');
  }

  // Validate items if provided
  if (items && Array.isArray(items)) {
    items.forEach((item, index) => {
      const { dishId, quantity } = item;

      if (!dishId) {
        errors.push(`El item ${index + 1} debe tener dishId`);
      }

      if (!quantity || quantity <= 0) {
        errors.push(`El item ${index + 1} debe tener quantity mayor a 0`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate order status update
 * @param {string} status - New status
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateOrderStatus = (status) => {
  const errors = [];

  if (!status) {
    errors.push('El campo status es requerido');
  } else if (!VALID_ORDER_STATUSES.includes(status)) {
    errors.push(`Estado inválido. Estados válidos: ${VALID_ORDER_STATUSES.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate order filters
 * @param {Object} filters - Filter object
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateOrderFilters = (filters) => {
  const errors = [];
  const { status, tableId, startDate, endDate } = filters;

  // Validate status filter
  if (status && !VALID_ORDER_STATUSES.includes(status)) {
    errors.push(`Filtro de estado inválido: ${status}`);
  }

  // Validate tableId filter
  if (tableId !== undefined && tableId !== null && (isNaN(tableId) || parseInt(tableId) <= 0)) {
    errors.push('tableId debe ser un número positivo');
  }

  // Validate date filters
  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push('startDate debe ser una fecha válida');
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push('endDate debe ser una fecha válida');
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push('startDate no puede ser posterior a endDate');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateOrderCreation,
  validateOrderStatus,
  validateOrderFilters
};
