const { Dish } = require('../../src/models');
const { Op } = require('sequelize');
const {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
  dishExists,
  isDishAvailable
} = require('../../src/services/dishService');

// Mock dependencies
jest.mock('../../src/models');
jest.mock('../../src/constants/dishConstants', () => ({
  DISH_DEFAULTS: {
    DESCRIPTION: null,
    AVAILABLE: true
  }
}));

describe('Dish Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDishes', () => {
    test('should return all dishes without filters', async () => {
      const mockDishes = [
        { id: 1, name: 'Pizza', price: 10.99, available: true },
        { id: 2, name: 'Burger', price: 8.99, available: false }
      ];

      Dish.findAll.mockResolvedValue(mockDishes);

      const result = await getDishes();

      expect(Dish.findAll).toHaveBeenCalledWith({
        where: {},
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockDishes);
    });

    test('should filter dishes by availability', async () => {
      const mockDishes = [
        { id: 1, name: 'Pizza', price: 10.99, available: true }
      ];

      Dish.findAll.mockResolvedValue(mockDishes);

      const result = await getDishes({ available: true });

      expect(Dish.findAll).toHaveBeenCalledWith({
        where: { available: true },
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockDishes);
    });

    test('should search dishes by name', async () => {
      const mockDishes = [
        { id: 1, name: 'Margherita Pizza', price: 10.99, available: true }
      ];

      Dish.findAll.mockResolvedValue(mockDishes);

      const result = await getDishes({ search: 'pizza' });

      expect(Dish.findAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { name: { [Op.like]: '%pizza%' } },
            { description: { [Op.like]: '%pizza%' } }
          ]
        },
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockDishes);
    });

    test('should combine availability and search filters', async () => {
      const mockDishes = [
        { id: 1, name: 'Chicken Pizza', price: 12.99, available: true }
      ];

      Dish.findAll.mockResolvedValue(mockDishes);

      const result = await getDishes({ available: true, search: 'chicken' });

      expect(Dish.findAll).toHaveBeenCalledWith({
        where: {
          available: true,
          [Op.or]: [
            { name: { [Op.like]: '%chicken%' } },
            { description: { [Op.like]: '%chicken%' } }
          ]
        },
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockDishes);
    });
  });

  describe('getDishById', () => {
    test('should return dish when found', async () => {
      const mockDish = { id: 1, name: 'Pizza', price: 10.99, available: true };

      Dish.findByPk.mockResolvedValue(mockDish);

      const result = await getDishById(1);

      expect(Dish.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDish);
    });

    test('should throw error when dish not found', async () => {
      Dish.findByPk.mockResolvedValue(null);

      await expect(getDishById(999)).rejects.toThrow('Plato no encontrado');
      expect(Dish.findByPk).toHaveBeenCalledWith(999);
    });
  });

  describe('createDish', () => {
    test('should create dish with all fields provided', async () => {
      const dishData = {
        name: 'Pizza Margherita',
        description: 'Classic Italian pizza',
        price: 12.99,
        available: true
      };

      const mockCreatedDish = {
        id: 1,
        ...dishData,
        created_at: new Date(),
        updated_at: new Date()
      };

      Dish.create.mockResolvedValue(mockCreatedDish);

      const result = await createDish(dishData);

      expect(Dish.create).toHaveBeenCalledWith({
        name: 'Pizza Margherita',
        description: 'Classic Italian pizza',
        price: 12.99,
        available: true
      });
      expect(result).toEqual(mockCreatedDish);
    });

    test('should create dish with default values when optional fields not provided', async () => {
      const dishData = {
        name: 'Burger',
        price: 8.99
      };

      const mockCreatedDish = {
        id: 2,
        name: 'Burger',
        description: null,
        price: 8.99,
        available: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      Dish.create.mockResolvedValue(mockCreatedDish);

      const result = await createDish(dishData);

      expect(Dish.create).toHaveBeenCalledWith({
        name: 'Burger',
        description: null,
        price: 8.99,
        available: true
      });
      expect(result).toEqual(mockCreatedDish);
    });

    test('should parse price to float', async () => {
      const dishData = {
        name: 'Pasta',
        price: '15.50'
      };

      Dish.create.mockResolvedValue({ id: 3, ...dishData, price: 15.50 });

      await createDish(dishData);

      expect(Dish.create).toHaveBeenCalledWith({
        name: 'Pasta',
        description: null,
        price: 15.50,
        available: true
      });
    });
  });

  describe('updateDish', () => {
    test('should update dish with provided fields', async () => {
      const updatedDish = {
        id: 1,
        name: 'New Pizza',
        price: 12.99,
        available: true
      };

      const mockDish = {
        id: 1,
        name: 'Old Pizza',
        price: 10.99,
        available: true,
        update: jest.fn().mockImplementation(function(fields) {
          // Update the object in place
          Object.assign(this, fields);
          return this;
        })
      };

      Dish.findByPk.mockResolvedValue(mockDish);

      const result = await updateDish(1, { name: 'New Pizza', price: 12.99 });

      expect(Dish.findByPk).toHaveBeenCalledWith(1);
      expect(mockDish.update).toHaveBeenCalledWith({
        name: 'New Pizza',
        price: 12.99
      });
      expect(result).toBe(mockDish);
      expect(result.name).toBe('New Pizza');
      expect(result.price).toBe(12.99);
    });

    test('should throw error when dish not found', async () => {
      Dish.findByPk.mockResolvedValue(null);

      await expect(updateDish(999, { name: 'Test' })).rejects.toThrow('Plato no encontrado');
      expect(Dish.findByPk).toHaveBeenCalledWith(999);
    });

    test('should parse price to float when updating', async () => {
      const mockDish = {
        id: 1,
        name: 'Pizza',
        price: 10.99,
        update: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Pizza',
          price: 15.99
        })
      };

      Dish.findByPk.mockResolvedValue(mockDish);

      await updateDish(1, { price: '15.99' });

      expect(mockDish.update).toHaveBeenCalledWith({
        price: 15.99
      });
    });

    test('should only update provided fields', async () => {
      const mockDish = {
        id: 1,
        name: 'Pizza',
        description: 'Original description',
        price: 10.99,
        available: true,
        update: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Pizza',
          description: 'New description',
          price: 10.99,
          available: true
        })
      };

      Dish.findByPk.mockResolvedValue(mockDish);

      await updateDish(1, { description: 'New description' });

      expect(mockDish.update).toHaveBeenCalledWith({
        description: 'New description'
      });
    });
  });

  describe('deleteDish', () => {
    test('should delete dish successfully', async () => {
      const mockDish = {
        id: 1,
        name: 'Pizza',
        destroy: jest.fn().mockResolvedValue(undefined)
      };

      Dish.findByPk.mockResolvedValue(mockDish);

      await expect(deleteDish(1)).resolves.not.toThrow();

      expect(Dish.findByPk).toHaveBeenCalledWith(1);
      expect(mockDish.destroy).toHaveBeenCalled();
    });

    test('should throw error when dish not found', async () => {
      Dish.findByPk.mockResolvedValue(null);

      await expect(deleteDish(999)).rejects.toThrow('Plato no encontrado');
      expect(Dish.findByPk).toHaveBeenCalledWith(999);
    });
  });

  describe('dishExists', () => {
    test('should return true when dish exists', async () => {
      Dish.findByPk.mockResolvedValue({ id: 1, name: 'Pizza' });

      const result = await dishExists(1);

      expect(Dish.findByPk).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    test('should return false when dish does not exist', async () => {
      Dish.findByPk.mockResolvedValue(null);

      const result = await dishExists(999);

      expect(Dish.findByPk).toHaveBeenCalledWith(999);
      expect(result).toBe(false);
    });
  });

  describe('isDishAvailable', () => {
    test('should return true when dish exists and is available', async () => {
      Dish.findByPk.mockResolvedValue({ id: 1, name: 'Pizza', available: true });

      const result = await isDishAvailable(1);

      expect(Dish.findByPk).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    test('should return false when dish exists but is not available', async () => {
      Dish.findByPk.mockResolvedValue({ id: 1, name: 'Pizza', available: false });

      const result = await isDishAvailable(1);

      expect(Dish.findByPk).toHaveBeenCalledWith(1);
      expect(result).toBe(false);
    });

    test('should return false when dish does not exist', async () => {
      Dish.findByPk.mockResolvedValue(null);

      const result = await isDishAvailable(999);

      expect(Dish.findByPk).toHaveBeenCalledWith(999);
      expect(result).toBe(false);
    });
  });
});
