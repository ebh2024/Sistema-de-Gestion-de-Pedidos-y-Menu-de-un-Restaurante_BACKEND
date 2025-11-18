// Mock the database models and operations
jest.mock('../../src/models', () => ({
  OrderDetail: {
    findAll: jest.fn()
  },
  Order: {
    findByPk: jest.fn()
  },
  Dish: {}
}));

// Mock middlewares
jest.mock('../../src/middlewares/auth', () => jest.fn((req, res, next) => {
  // Mock authenticated admin user
  req.user = { id: 1, role: 'admin' };
  next();
}));

const request = require('supertest');
const express = require('express');
const { OrderDetail, Order } = require('../../src/models');
const orderDetailRoutes = require('../../src/routes/orderDetailRoutes');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/order_details', orderDetailRoutes);

// Mock environment variables
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

describe('OrderDetail Routes Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/order_details/:orderId', () => {
    test('should return order details successfully', async () => {
      const mockOrder = {
        id: 1,
        status: 'pending'
      };

      const mockOrderDetails = [
        {
          id: 1,
          orderId: 1,
          dishId: 1,
          quantity: 2,
          price: 10.99,
          created_at: new Date('2023-01-01T10:00:00Z'),
          Dish: {
            id: 1,
            name: 'Pizza Margherita',
            description: 'Delicious pizza',
            price: 10.99,
            available: true
          }
        },
        {
          id: 2,
          orderId: 1,
          dishId: 2,
          quantity: 1,
          price: 8.99,
          created_at: new Date('2023-01-01T10:05:00Z'),
          Dish: {
            id: 2,
            name: 'Burger',
            description: 'Juicy burger',
            price: 8.99,
            available: true
          }
        }
      ];

      Order.findByPk.mockResolvedValue(mockOrder);
      OrderDetail.findAll.mockResolvedValue(mockOrderDetails);

      const response = await request(app)
        .get('/api/order_details/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({
        id: 1,
        orderId: 1,
        dishId: 1,
        quantity: 2,
        price: 10.99,
        Dish: {
          id: 1,
          name: 'Pizza Margherita',
          description: 'Delicious pizza',
          price: 10.99,
          available: true
        }
      });

      expect(Order.findByPk).toHaveBeenCalledWith('1');
      expect(OrderDetail.findAll).toHaveBeenCalledWith({
        where: { orderId: '1' },
        include: [
          {
            model: expect.any(Object), // Dish model
            attributes: ['id', 'name', 'description', 'price', 'available']
          }
        ],
        order: [['created_at', 'ASC']]
      });
    });

    test('should return 404 when order not found', async () => {
      Order.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/order_details/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Pedido no encontrado');

      expect(Order.findByPk).toHaveBeenCalledWith('999');
      expect(OrderDetail.findAll).not.toHaveBeenCalled();
    });

    test('should return empty array when order has no details', async () => {
      const mockOrder = {
        id: 1,
        status: 'pending'
      };

      Order.findByPk.mockResolvedValue(mockOrder);
      OrderDetail.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/order_details/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });

    test('should return 401 when not authenticated', async () => {
      // Temporarily override the auth middleware to simulate unauthenticated request
      const authMiddleware = require('../../src/middlewares/auth');
      authMiddleware.mockImplementationOnce((req, res, next) => {
        return res.status(401).json({ success: false, message: 'Token no proporcionado' });
      });

      const response = await request(app)
        .get('/api/order_details/1')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token no proporcionado');
    });

    test('should handle database errors gracefully', async () => {
      const databaseError = new Error('Database connection failed');
      Order.findByPk.mockRejectedValue(databaseError);

      // Since the controller calls next() with errors, and we don't have error handling middleware in this test,
      // Express's default error handler will return a 500 status
      const response = await request(app)
        .get('/api/order_details/1')
        .expect(500);

      expect(response.text).toContain('Database connection failed');
    });
  });
});
