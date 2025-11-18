// Mock the database models and operations
jest.mock('../../src/models', () => ({
  Dish: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  User: {
    findOne: jest.fn()
  }
}));

// Mock middlewares
jest.mock('../../src/middlewares/auth', () => jest.fn((req, res, next) => {
  // Mock authenticated admin user
  req.user = { id: 1, role: 'admin' };
  next();
}));

jest.mock('../../src/middlewares/checkRole', () => jest.fn(() => (req, res, next) => {
  // Mock role check passing
  next();
}));

const request = require('supertest');
const express = require('express');
const { Dish, User } = require('../../src/models');
const dishRoutes = require('../../src/routes/dishRoutes');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/dishes', dishRoutes);

// Mock environment variables
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

describe('Dish Routes Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/dishes', () => {
    test('should return all dishes successfully', async () => {
      const mockDishes = [
        {
          id: 1,
          name: 'Margherita Pizza',
          description: 'Classic Italian pizza',
          price: 12.99,
          available: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'Chicken Burger',
          description: 'Juicy chicken burger',
          price: 9.99,
          available: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      Dish.findAll.mockResolvedValue(mockDishes);

      const response = await request(app)
        .get('/api/dishes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({
        id: 1,
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza',
        price: 12.99,
        available: true
      });

      expect(Dish.findAll).toHaveBeenCalledWith({
        where: {},
        order: [['created_at', 'DESC']]
      });
    });

    test('should filter dishes by availability', async () => {
      const mockDishes = [
        {
          id: 1,
          name: 'Margherita Pizza',
          description: 'Classic Italian pizza',
          price: 12.99,
          available: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      Dish.findAll.mockResolvedValue(mockDishes);

      const response = await request(app)
        .get('/api/dishes?available=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: 1,
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza',
        price: 12.99,
        available: true
      });

      expect(Dish.findAll).toHaveBeenCalledWith({
        where: { available: true },
        order: [['created_at', 'DESC']]
      });
    });

    test('should search dishes by name', async () => {
      const mockDishes = [
        {
          id: 1,
          name: 'Margherita Pizza',
          description: 'Classic Italian pizza',
          price: 12.99,
          available: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      Dish.findAll.mockResolvedValue(mockDishes);

      const response = await request(app)
        .get('/api/dishes?search=pizza')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: 1,
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza',
        price: 12.99,
        available: true
      });

      expect(Dish.findAll).toHaveBeenCalledWith({
        where: {
          [require('sequelize').Op.or]: [
            { name: { [require('sequelize').Op.like]: '%pizza%' } },
            { description: { [require('sequelize').Op.like]: '%pizza%' } }
          ]
        },
        order: [['created_at', 'DESC']]
      });
    });

    test('should return 400 for invalid available filter', async () => {
      const response = await request(app)
        .get('/api/dishes?available=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('available debe ser "true" o "false"');
    });

    test('should handle empty results', async () => {
      Dish.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/dishes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/dishes/:id', () => {
    test('should return dish by id successfully', async () => {
      const mockDish = {
        id: 1,
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza',
        price: 12.99,
        available: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      Dish.findByPk.mockResolvedValue(mockDish);

      const response = await request(app)
        .get('/api/dishes/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 1,
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza',
        price: 12.99,
        available: true
      });

      expect(Dish.findByPk).toHaveBeenCalledWith('1');
    });

    test('should return 404 when dish not found', async () => {
      Dish.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/dishes/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Plato no encontrado');

      expect(Dish.findByPk).toHaveBeenCalledWith('999');
    });
  });

  describe('POST /api/dishes', () => {
    test('should create dish successfully', async () => {
      const dishData = {
        name: 'New Pizza',
        description: 'Delicious new pizza',
        price: 14.99,
        available: true
      };

      const mockCreatedDish = {
        id: 3,
        ...dishData,
        created_at: new Date(),
        updated_at: new Date()
      };

      Dish.create.mockResolvedValue(mockCreatedDish);

      const response = await request(app)
        .post('/api/dishes')
        .send(dishData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Plato creado exitosamente');
      expect(response.body.data).toMatchObject({
        id: 3,
        name: 'New Pizza',
        description: 'Delicious new pizza',
        price: 14.99,
        available: true
      });

      expect(Dish.create).toHaveBeenCalledWith({
        name: 'New Pizza',
        description: 'Delicious new pizza',
        price: 14.99,
        available: true
      });
    });

    test('should create dish with default values', async () => {
      const dishData = {
        name: 'Simple Burger',
        price: 8.99
      };

      const mockCreatedDish = {
        id: 4,
        name: 'Simple Burger',
        description: null,
        price: 8.99,
        available: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      Dish.create.mockResolvedValue(mockCreatedDish);

      const response = await request(app)
        .post('/api/dishes')
        .send(dishData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 4,
        name: 'Simple Burger',
        description: null,
        price: 8.99,
        available: true
      });

      expect(Dish.create).toHaveBeenCalledWith({
        name: 'Simple Burger',
        description: null,
        price: 8.99,
        available: true
      });
    });

    test('should return 400 for missing required fields', async () => {
      const incompleteData = {
        description: 'Missing name and price'
      };

      const response = await request(app)
        .post('/api/dishes')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('name es requerido');
      expect(response.body.message).toContain('price es requerido');
    });

    test('should return 400 for invalid name length', async () => {
      const invalidData = {
        name: 'A',
        price: 10.99
      };

      const response = await request(app)
        .post('/api/dishes')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('name es requerido y debe tener entre 2 y 100 caracteres');
    });

    test('should return 400 for invalid price', async () => {
      const invalidData = {
        name: 'Pizza',
        price: -5.99
      };

      const response = await request(app)
        .post('/api/dishes')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('price es requerido y debe ser un número positivo');
    });

    test('should return 400 for invalid description length', async () => {
      const invalidData = {
        name: 'Pizza',
        description: 'A'.repeat(256),
        price: 10.99
      };

      const response = await request(app)
        .post('/api/dishes')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('description debe ser texto de hasta 255 caracteres');
    });
  });

  describe('PUT /api/dishes/:id', () => {
    test('should update dish successfully', async () => {
      const updateData = {
        name: 'Updated Pizza',
        price: 16.99
      };

      const mockDish = {
        id: 1,
        name: 'Original Pizza',
        description: 'Original description',
        price: 12.99,
        available: true,
        update: jest.fn().mockImplementation(function(fields) {
          // Update the object in place
          Object.assign(this, fields);
          return this;
        })
      };

      Dish.findByPk.mockResolvedValue(mockDish);

      const response = await request(app)
        .put('/api/dishes/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Plato actualizado exitosamente');
      expect(response.body.data.name).toBe('Updated Pizza');
      expect(response.body.data.price).toBe(16.99);

      expect(Dish.findByPk).toHaveBeenCalledWith('1');
      expect(mockDish.update).toHaveBeenCalledWith({
        name: 'Updated Pizza',
        price: 16.99
      });
    });

    test('should update only provided fields', async () => {
      const updateData = {
        available: false
      };

      const mockDish = {
        id: 1,
        name: 'Pizza',
        description: 'Description',
        price: 12.99,
        available: true,
        update: jest.fn().mockImplementation(function(fields) {
          // Update the object in place
          Object.assign(this, fields);
          return this;
        })
      };

      Dish.findByPk.mockResolvedValue(mockDish);

      const response = await request(app)
        .put('/api/dishes/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(false);

      expect(mockDish.update).toHaveBeenCalledWith({
        available: false
      });
    });

    test('should return 404 when dish not found', async () => {
      Dish.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/dishes/999')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Plato no encontrado');
    });

    test('should return 400 for invalid update data', async () => {
      const invalidData = {
        price: -10
      };

      const response = await request(app)
        .put('/api/dishes/1')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('price debe ser un número positivo');
    });
  });

  describe('DELETE /api/dishes/:id', () => {
    test('should delete dish successfully', async () => {
      const mockDish = {
        id: 1,
        name: 'Pizza',
        destroy: jest.fn().mockResolvedValue(undefined)
      };

      Dish.findByPk.mockResolvedValue(mockDish);

      const response = await request(app)
        .delete('/api/dishes/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Plato eliminado exitosamente');

      expect(Dish.findByPk).toHaveBeenCalledWith('1');
      expect(mockDish.destroy).toHaveBeenCalled();
    });

    test('should return 404 when dish not found', async () => {
      Dish.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/dishes/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Plato no encontrado');
    });
  });
});
