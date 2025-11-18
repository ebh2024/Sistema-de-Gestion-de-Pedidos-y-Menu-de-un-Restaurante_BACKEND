const {
  getAllDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish
} = require('../../src/controllers/dishController');

// Mock dependencies
jest.mock('../../src/services/dishService');
jest.mock('../../src/validators/dishValidators');

const dishService = require('../../src/services/dishService');
const dishValidators = require('../../src/validators/dishValidators');

describe('Dish Controller - Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      query: {},
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
  });

  describe('getAllDishes', () => {
    test('should return dishes successfully', async () => {
      const mockDishes = [
        { id: 1, name: 'Pizza', price: 10.99 },
        { id: 2, name: 'Burger', price: 8.99 }
      ];

      mockReq.query = { available: 'true', search: 'pizza' };

      dishValidators.validateDishFilters.mockReturnValue({
        isValid: true,
        errors: []
      });

      dishService.getDishes.mockResolvedValue(mockDishes);

      await getAllDishes(mockReq, mockRes, mockNext);

      expect(dishValidators.validateDishFilters).toHaveBeenCalledWith({
        available: 'true',
        search: 'pizza'
      });

      expect(dishService.getDishes).toHaveBeenCalledWith({
        available: true,
        search: 'pizza'
      });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockDishes
      });

      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle empty query parameters', async () => {
      const mockDishes = [
        { id: 1, name: 'Pizza', price: 10.99 }
      ];

      dishValidators.validateDishFilters.mockReturnValue({
        isValid: true,
        errors: []
      });

      dishService.getDishes.mockResolvedValue(mockDishes);

      await getAllDishes(mockReq, mockRes, mockNext);

      expect(dishValidators.validateDishFilters).toHaveBeenCalledWith({
        available: undefined,
        search: undefined
      });
      expect(dishService.getDishes).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockDishes
      });
    });

    test('should return 400 for invalid filters', async () => {
      mockReq.query = { available: 'invalid' };

      dishValidators.validateDishFilters.mockReturnValue({
        isValid: false,
        errors: ['available debe ser "true" o "false"']
      });

      await getAllDishes(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'available debe ser "true" o "false"'
      });

      expect(dishService.getDishes).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with error when service throws', async () => {
      const error = new Error('Database error');

      dishValidators.validateDishFilters.mockReturnValue({
        isValid: true,
        errors: []
      });

      dishService.getDishes.mockRejectedValue(error);

      await getAllDishes(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('getDishById', () => {
    test('should return dish successfully', async () => {
      const mockDish = { id: 1, name: 'Pizza', price: 10.99 };

      mockReq.params.id = '1';

      dishService.getDishById.mockResolvedValue(mockDish);

      await getDishById(mockReq, mockRes, mockNext);

      expect(dishService.getDishById).toHaveBeenCalledWith('1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDish
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 404 when dish not found', async () => {
      const error = new Error('Plato no encontrado');

      mockReq.params.id = '999';

      dishService.getDishById.mockRejectedValue(error);

      await getDishById(mockReq, mockRes, mockNext);

      expect(dishService.getDishById).toHaveBeenCalledWith('999');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Plato no encontrado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with other errors', async () => {
      const error = new Error('Database connection error');

      mockReq.params.id = '1';

      dishService.getDishById.mockRejectedValue(error);

      await getDishById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('createDish', () => {
    test('should create dish successfully', async () => {
      const dishData = {
        name: 'New Pizza',
        description: 'Delicious pizza',
        price: 12.99,
        available: true
      };

      const mockCreatedDish = {
        id: 1,
        ...dishData,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockReq.body = dishData;

      dishValidators.validateDishCreation.mockReturnValue({
        isValid: true,
        errors: []
      });

      dishService.createDish.mockResolvedValue(mockCreatedDish);

      await createDish(mockReq, mockRes, mockNext);

      expect(dishValidators.validateDishCreation).toHaveBeenCalledWith(dishData);
      expect(dishService.createDish).toHaveBeenCalledWith(dishData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Plato creado exitosamente',
        data: mockCreatedDish
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid data', async () => {
      const invalidData = {
        name: 'A',
        price: -5
      };

      mockReq.body = invalidData;

      dishValidators.validateDishCreation.mockReturnValue({
        isValid: false,
        errors: ['name es requerido y debe tener entre 2 y 100 caracteres', 'price es requerido y debe ser un número positivo']
      });

      await createDish(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'name es requerido y debe tener entre 2 y 100 caracteres, price es requerido y debe ser un número positivo'
      });

      expect(dishService.createDish).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with error when service throws', async () => {
      const error = new Error('Database error');

      mockReq.body = { name: 'Pizza', price: 10.99 };

      dishValidators.validateDishCreation.mockReturnValue({
        isValid: true,
        errors: []
      });

      dishService.createDish.mockRejectedValue(error);

      await createDish(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('updateDish', () => {
    test('should update dish successfully', async () => {
      const updateData = {
        name: 'Updated Pizza',
        price: 15.99
      };

      const mockUpdatedDish = {
        id: 1,
        name: 'Updated Pizza',
        description: 'Original description',
        price: 15.99,
        available: true,
        updated_at: new Date()
      };

      mockReq.params.id = '1';
      mockReq.body = updateData;

      dishValidators.validateDishUpdate.mockReturnValue({
        isValid: true,
        errors: []
      });

      dishService.updateDish.mockResolvedValue(mockUpdatedDish);

      await updateDish(mockReq, mockRes, mockNext);

      expect(dishValidators.validateDishUpdate).toHaveBeenCalledWith(updateData);
      expect(dishService.updateDish).toHaveBeenCalledWith('1', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Plato actualizado exitosamente',
        data: mockUpdatedDish
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid update data', async () => {
      const invalidData = {
        price: -10
      };

      mockReq.params.id = '1';
      mockReq.body = invalidData;

      dishValidators.validateDishUpdate.mockReturnValue({
        isValid: false,
        errors: ['price debe ser un número positivo']
      });

      await updateDish(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'price debe ser un número positivo'
      });

      expect(dishService.updateDish).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 404 when dish not found', async () => {
      const error = new Error('Plato no encontrado');

      mockReq.params.id = '999';
      mockReq.body = { name: 'Updated Name' };

      dishValidators.validateDishUpdate.mockReturnValue({
        isValid: true,
        errors: []
      });

      dishService.updateDish.mockRejectedValue(error);

      await updateDish(mockReq, mockRes, mockNext);

      expect(dishService.updateDish).toHaveBeenCalledWith('999', { name: 'Updated Name' });
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Plato no encontrado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with other errors', async () => {
      const error = new Error('Database connection error');

      mockReq.params.id = '1';
      mockReq.body = { name: 'Updated Name' };

      dishValidators.validateDishUpdate.mockReturnValue({
        isValid: true,
        errors: []
      });

      dishService.updateDish.mockRejectedValue(error);

      await updateDish(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('deleteDish', () => {
    test('should delete dish successfully', async () => {
      mockReq.params.id = '1';

      dishService.deleteDish.mockResolvedValue(undefined);

      await deleteDish(mockReq, mockRes, mockNext);

      expect(dishService.deleteDish).toHaveBeenCalledWith('1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Plato eliminado exitosamente'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 404 when dish not found', async () => {
      const error = new Error('Plato no encontrado');

      mockReq.params.id = '999';

      dishService.deleteDish.mockRejectedValue(error);

      await deleteDish(mockReq, mockRes, mockNext);

      expect(dishService.deleteDish).toHaveBeenCalledWith('999');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Plato no encontrado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with other errors', async () => {
      const error = new Error('Database connection error');

      mockReq.params.id = '1';

      dishService.deleteDish.mockRejectedValue(error);

      await deleteDish(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});
