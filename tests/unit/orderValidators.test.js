const {
  validateOrderCreation,
  validateOrderStatus,
  validateOrderFilters
} = require('../../src/validators/orderValidators');

describe('Order Validators - Unit Tests', () => {
  describe('validateOrderCreation', () => {
    test('should validate correct order creation data', () => {
      const validData = {
        tableId: 1,
        items: [
          { dishId: 1, quantity: 2 },
          { dishId: 2, quantity: 1 }
        ]
      };

      const result = validateOrderCreation(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject when tableId is missing', () => {
      const invalidData = {
        items: [{ dishId: 1, quantity: 1 }]
      };

      const result = validateOrderCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('tableId es requerido');
    });

    test('should reject when items array is missing', () => {
      const invalidData = {
        tableId: 1
      };

      const result = validateOrderCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('items debe ser un array no vacío');
    });

    test('should reject when items array is empty', () => {
      const invalidData = {
        tableId: 1,
        items: []
      };

      const result = validateOrderCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('items debe ser un array no vacío');
    });

    test('should reject when items is not an array', () => {
      const invalidData = {
        tableId: 1,
        items: 'not an array'
      };

      const result = validateOrderCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('items debe ser un array no vacío');
    });

    test('should reject when item is missing dishId', () => {
      const invalidData = {
        tableId: 1,
        items: [
          { quantity: 2 },
          { dishId: 2, quantity: 1 }
        ]
      };

      const result = validateOrderCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El item 1 debe tener dishId');
    });

    test('should reject when item has invalid quantity', () => {
      const invalidData = {
        tableId: 1,
        items: [
          { dishId: 1, quantity: 0 },
          { dishId: 2, quantity: 1 }
        ]
      };

      const result = validateOrderCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El item 1 debe tener quantity mayor a 0');
    });

    test('should reject when item has negative quantity', () => {
      const invalidData = {
        tableId: 1,
        items: [
          { dishId: 1, quantity: -1 },
          { dishId: 2, quantity: 1 }
        ]
      };

      const result = validateOrderCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El item 1 debe tener quantity mayor a 0');
    });

    test('should validate multiple invalid items', () => {
      const invalidData = {
        tableId: 1,
        items: [
          { dishId: 1, quantity: 0 }, // invalid quantity
          { quantity: 2 }, // missing dishId
          { dishId: 3, quantity: -1 } // negative quantity
        ]
      };

      const result = validateOrderCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('El item 1 debe tener quantity mayor a 0');
      expect(result.errors).toContain('El item 2 debe tener dishId');
      expect(result.errors).toContain('El item 3 debe tener quantity mayor a 0');
    });
  });

  describe('validateOrderStatus', () => {
    test('should validate valid status', () => {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];

      validStatuses.forEach(status => {
        const result = validateOrderStatus(status);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    test('should reject missing status', () => {
      const result = validateOrderStatus(undefined);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El campo status es requerido');
    });

    test('should reject empty status', () => {
      const result = validateOrderStatus('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El campo status es requerido');
    });

    test('should reject invalid status', () => {
      const result = validateOrderStatus('invalid_status');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Estado inválido. Estados válidos: pending, in_progress, completed, cancelled');
    });

    test('should reject null status', () => {
      const result = validateOrderStatus(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El campo status es requerido');
    });
  });

  describe('validateOrderFilters', () => {
    test('should validate empty filters', () => {
      const result = validateOrderFilters({});

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate valid status filter', () => {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];

      validStatuses.forEach(status => {
        const result = validateOrderFilters({ status });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    test('should reject invalid status filter', () => {
      const result = validateOrderFilters({ status: 'invalid_status' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Filtro de estado inválido: invalid_status');
    });

    test('should validate valid tableId filter', () => {
      const result = validateOrderFilters({ tableId: 5 });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate valid tableId filter as string', () => {
      const result = validateOrderFilters({ tableId: '5' });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject invalid tableId filter - not a number', () => {
      const result = validateOrderFilters({ tableId: 'abc' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('tableId debe ser un número positivo');
    });

    test('should reject invalid tableId filter - zero', () => {
      const result = validateOrderFilters({ tableId: 0 });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('tableId debe ser un número positivo');
    });

    test('should reject invalid tableId filter - negative', () => {
      const result = validateOrderFilters({ tableId: -1 });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('tableId debe ser un número positivo');
    });

    test('should validate valid date filters', () => {
      const result = validateOrderFilters({
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate valid startDate only', () => {
      const result = validateOrderFilters({
        startDate: '2023-01-01'
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate valid endDate only', () => {
      const result = validateOrderFilters({
        endDate: '2023-12-31'
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject invalid startDate', () => {
      const result = validateOrderFilters({
        startDate: 'invalid-date'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('startDate debe ser una fecha válida');
    });

    test('should reject invalid endDate', () => {
      const result = validateOrderFilters({
        endDate: 'invalid-date'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('endDate debe ser una fecha válida');
    });

    test('should reject when startDate is after endDate', () => {
      const result = validateOrderFilters({
        startDate: '2023-12-31',
        endDate: '2023-01-01'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('startDate no puede ser posterior a endDate');
    });

    test('should validate multiple filters together', () => {
      const result = validateOrderFilters({
        status: 'pending',
        tableId: 5,
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should handle multiple validation errors', () => {
      const result = validateOrderFilters({
        status: 'invalid',
        tableId: 'abc',
        startDate: 'invalid-date',
        endDate: 'invalid-end-date'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContain('Filtro de estado inválido: invalid');
      expect(result.errors).toContain('tableId debe ser un número positivo');
      expect(result.errors).toContain('startDate debe ser una fecha válida');
      expect(result.errors).toContain('endDate debe ser una fecha válida');
    });
  });
});
