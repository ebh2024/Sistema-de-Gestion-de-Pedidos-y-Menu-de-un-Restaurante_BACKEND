const {
  validateDishCreation,
  validateDishUpdate,
  validateDishFilters
} = require('../../src/validators/dishValidators');

describe('Dish Validators - Unit Tests', () => {
  describe('validateDishCreation', () => {
    test('should validate valid dish creation data', () => {
      const validData = {
        name: 'Pizza Margherita',
        description: 'Classic Italian pizza with tomato sauce and mozzarella',
        price: 12.99,
        available: true
      };

      const result = validateDishCreation(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate dish creation with minimal required fields', () => {
      const minimalData = {
        name: 'Burger',
        price: 8.99
      };

      const result = validateDishCreation(minimalData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject when name is missing', () => {
      const invalidData = {
        price: 10.99
      };

      const result = validateDishCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name es requerido y debe tener entre 2 y 100 caracteres');
    });

    test('should reject when name is too short', () => {
      const invalidData = {
        name: 'A',
        price: 10.99
      };

      const result = validateDishCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name es requerido y debe tener entre 2 y 100 caracteres');
    });

    test('should reject when name is too long', () => {
      const invalidData = {
        name: 'A'.repeat(101),
        price: 10.99
      };

      const result = validateDishCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name es requerido y debe tener entre 2 y 100 caracteres');
    });

    test('should reject when name is not a string', () => {
      const invalidData = {
        name: 123,
        price: 10.99
      };

      const result = validateDishCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name es requerido y debe tener entre 2 y 100 caracteres');
    });

    test('should reject when price is missing', () => {
      const invalidData = {
        name: 'Pizza'
      };

      const result = validateDishCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('price es requerido y debe ser un número positivo');
    });

    test('should reject when price is zero', () => {
      const invalidData = {
        name: 'Pizza',
        price: 0
      };

      const result = validateDishCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('price es requerido y debe ser un número positivo');
    });

    test('should reject when price is negative', () => {
      const invalidData = {
        name: 'Pizza',
        price: -5.99
      };

      const result = validateDishCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('price es requerido y debe ser un número positivo');
    });

    test('should reject when price is not a number', () => {
      const invalidData = {
        name: 'Pizza',
        price: 'not-a-number'
      };

      const result = validateDishCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('price es requerido y debe ser un número positivo');
    });

    test('should reject when description is too long', () => {
      const invalidData = {
        name: 'Pizza',
        description: 'A'.repeat(256),
        price: 10.99
      };

      const result = validateDishCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('description debe ser texto de hasta 255 caracteres');
    });

    test('should reject when description is not a string', () => {
      const invalidData = {
        name: 'Pizza',
        description: 123,
        price: 10.99
      };

      const result = validateDishCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('description debe ser texto de hasta 255 caracteres');
    });

    test('should reject when available is not a boolean', () => {
      const invalidData = {
        name: 'Pizza',
        price: 10.99,
        available: 'true'
      };

      const result = validateDishCreation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('available debe ser booleano (true/false)');
    });

    test('should accept null description', () => {
      const validData = {
        name: 'Pizza',
        description: null,
        price: 10.99
      };

      const result = validateDishCreation(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should accept undefined description', () => {
      const validData = {
        name: 'Pizza',
        price: 10.99
      };

      const result = validateDishCreation(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateDishUpdate', () => {
    test('should validate valid dish update data', () => {
      const validData = {
        name: 'Updated Pizza',
        description: 'Updated description',
        price: 15.99,
        available: false
      };

      const result = validateDishUpdate(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate partial update data', () => {
      const partialData = {
        price: 12.99
      };

      const result = validateDishUpdate(partialData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate empty update data', () => {
      const emptyData = {};

      const result = validateDishUpdate(emptyData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject when name is too short', () => {
      const invalidData = {
        name: 'A'
      };

      const result = validateDishUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name debe tener entre 2 y 100 caracteres');
    });

    test('should reject when name is too long', () => {
      const invalidData = {
        name: 'A'.repeat(101)
      };

      const result = validateDishUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name debe tener entre 2 y 100 caracteres');
    });

    test('should reject when name is not a string', () => {
      const invalidData = {
        name: 123
      };

      const result = validateDishUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name debe tener entre 2 y 100 caracteres');
    });

    test('should reject when price is zero', () => {
      const invalidData = {
        price: 0
      };

      const result = validateDishUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('price debe ser un número positivo');
    });

    test('should reject when price is negative', () => {
      const invalidData = {
        price: -10.99
      };

      const result = validateDishUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('price debe ser un número positivo');
    });

    test('should reject when price is not a number', () => {
      const invalidData = {
        price: 'invalid'
      };

      const result = validateDishUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('price debe ser un número positivo');
    });

    test('should reject when description is too long', () => {
      const invalidData = {
        description: 'A'.repeat(256)
      };

      const result = validateDishUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('description debe ser texto de hasta 255 caracteres');
    });

    test('should reject when description is not a string', () => {
      const invalidData = {
        description: 123
      };

      const result = validateDishUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('description debe ser texto de hasta 255 caracteres');
    });

    test('should reject when available is not a boolean', () => {
      const invalidData = {
        available: 'false'
      };

      const result = validateDishUpdate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('available debe ser booleano (true/false)');
    });

    test('should accept null description in update', () => {
      const validData = {
        description: null
      };

      const result = validateDishUpdate(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateDishFilters', () => {
    test('should validate valid filter data', () => {
      const validFilters = {
        available: 'true',
        search: 'pizza'
      };

      const result = validateDishFilters(validFilters);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate partial filter data', () => {
      const partialFilters = {
        available: 'false'
      };

      const result = validateDishFilters(partialFilters);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate empty filter data', () => {
      const emptyFilters = {};

      const result = validateDishFilters(emptyFilters);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject when available is not a string', () => {
      const invalidFilters = {
        available: true
      };

      const result = validateDishFilters(invalidFilters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('available debe ser una cadena');
    });

    test('should reject when available is not "true" or "false"', () => {
      const invalidFilters = {
        available: 'maybe'
      };

      const result = validateDishFilters(invalidFilters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('available debe ser "true" o "false"');
    });

    test('should accept "true" for available filter', () => {
      const validFilters = {
        available: 'true'
      };

      const result = validateDishFilters(validFilters);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should accept "false" for available filter', () => {
      const validFilters = {
        available: 'false'
      };

      const result = validateDishFilters(validFilters);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject when search is not a string', () => {
      const invalidFilters = {
        search: 123
      };

      const result = validateDishFilters(invalidFilters);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('search debe ser una cadena');
    });

    test('should accept empty string for search', () => {
      const validFilters = {
        search: ''
      };

      const result = validateDishFilters(validFilters);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
