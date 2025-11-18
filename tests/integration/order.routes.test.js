// Mock the database models and operations
jest.mock('../../src/models', () => ({
  Order: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  OrderDetail: {
    create: jest.fn(),
    destroy: jest.fn()
  },
  Dish: {
    findByPk: jest.fn()
  },
  Table: {
    findByPk: jest.fn(),
    update: jest.fn()
  },
  User: {
    findOne: jest.fn()
  }
}));

// Mock database config for transactions
jest.mock('../../src/config/database', () => ({
  sequelize: {
    transaction: jest.fn()
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
const { Order, OrderDetail, Dish, Table, User } = require('../../src/models');
const { sequelize } = require('../../src/config/database');
const orderRoutes = require('../../src/routes/orderRoutes');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

// Mock environment variables
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

describe('Order Routes Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock transaction
    const mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe('POST /api/orders', () => {
    test('should create order successfully', async () => {
      const orderData = {
        tableId: 1,
        items: [
          { dishId: 1, quantity: 2 },
          { dishId: 2, quantity: 1 }
        ]
      };

      const mockTable = {
        id: 1,
        number: 5,
        status: 'available',
        update: jest.fn()
      };

      const mockDishes = [
        { id: 1, name: 'Pizza', price: 10.99, available: true },
        { id: 2, name: 'Burger', price: 8.99, available: true }
      ];

      const mockOrder = {
        id: 1,
        userId: 1,
        tableId: 1,
        total: 30.97,
        status: 'pending',
        OrderDetails: [
          { orderId: 1, dishId: 1, quantity: 2, price: 10.99 },
          { orderId: 1, dishId: 2, quantity: 1, price: 8.99 }
        ],
        User: { id: 1, name: 'Test User' },
        Table: { id: 1, number: 5 }
      };

      Table.findByPk.mockResolvedValue(mockTable);
      Dish.findByPk
        .mockResolvedValueOnce(mockDishes[0])
        .mockResolvedValueOnce(mockDishes[1]);
      Order.create.mockResolvedValue({
        id: 1,
        userId: 1,
        tableId: 1,
        total: 30.97,
        status: 'pending'
      });
      OrderDetail.create
        .mockResolvedValueOnce({ orderId: 1, dishId: 1, quantity: 2, price: 10.99 })
        .mockResolvedValueOnce({ orderId: 1, dishId: 2, quantity: 1, price: 8.99 });
      Order.findByPk.mockResolvedValue(mockOrder);

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Pedido creado exitosamente');
      expect(response.body.data).toMatchObject({
        id: 1,
        userId: 1,
        tableId: 1,
        total: 30.97,
        status: 'pending'
      });

      expect(Table.findByPk).toHaveBeenCalledWith(1, { transaction: expect.any(Object) });
      expect(Dish.findByPk).toHaveBeenCalledWith(1, { transaction: expect.any(Object) });
      expect(Dish.findByPk).toHaveBeenCalledWith(2, { transaction: expect.any(Object) });
      expect(Order.create).toHaveBeenCalledWith({
        userId: 1,
        tableId: 1,
        total: 30.97,
        status: 'pending'
      }, { transaction: expect.any(Object) });
      expect(mockTable.update).toHaveBeenCalledWith({ status: 'occupied' }, { transaction: expect.any(Object) });
    });

    test('should return 400 for missing tableId', async () => {
      const incompleteData = {
        items: [{ dishId: 1, quantity: 1 }]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('tableId es requerido');
    });

    test('should return 400 for empty items array', async () => {
      const invalidData = {
        tableId: 1,
        items: []
      };

      const response = await request(app)
        .post('/api/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('items debe ser un array no vacío');
    });

    test('should return 400 for invalid item data', async () => {
      const invalidData = {
        tableId: 1,
        items: [
          { quantity: 2 }, // missing dishId
          { dishId: 2, quantity: 0 } // invalid quantity
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('El item 1 debe tener dishId');
      expect(response.body.message).toContain('El item 2 debe tener quantity mayor a 0');
    });

    test('should return 404 for non-existent table', async () => {
      const orderData = {
        tableId: 999,
        items: [{ dishId: 1, quantity: 1 }]
      };

      Table.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Mesa no encontrada');
    });

    test('should return 400 for unavailable table', async () => {
      const orderData = {
        tableId: 1,
        items: [{ dishId: 1, quantity: 1 }]
      };

      const mockTable = {
        id: 1,
        number: 5,
        status: 'occupied'
      };

      Table.findByPk.mockResolvedValue(mockTable);

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('La mesa 5 no está disponible. Estado actual: occupied');
    });

    test('should return 404 for non-existent dish', async () => {
      const orderData = {
        tableId: 1,
        items: [{ dishId: 999, quantity: 1 }]
      };

      const mockTable = {
        id: 1,
        number: 5,
        status: 'available'
      };

      Table.findByPk.mockResolvedValue(mockTable);
      Dish.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Plato con ID 999 no encontrado');
    });

    test('should return 400 for unavailable dish', async () => {
      const orderData = {
        tableId: 1,
        items: [{ dishId: 1, quantity: 1 }]
      };

      const mockTable = {
        id: 1,
        number: 5,
        status: 'available'
      };

      const mockDish = {
        id: 1,
        name: 'Pizza',
        available: false
      };

      Table.findByPk.mockResolvedValue(mockTable);
      Dish.findByPk.mockResolvedValue(mockDish);

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('El plato "Pizza" no está disponible');
    });
  });

  describe('GET /api/orders', () => {
    test('should return all orders successfully', async () => {
      const mockOrders = [
        {
          id: 1,
          status: 'pending',
          total: 25.99,
          User: { id: 1, name: 'Test User' },
          Table: { id: 1, number: 5 },
          OrderDetails: []
        },
        {
          id: 2,
          status: 'completed',
          total: 15.50,
          User: { id: 2, name: 'Another User' },
          Table: { id: 2, number: 3 },
          OrderDetails: []
        }
      ];

      Order.findAll.mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({
        id: 1,
        status: 'pending',
        total: 25.99
      });

      expect(Order.findAll).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Array),
        order: [['created_at', 'DESC']]
      });
    });

    test('should filter orders by status', async () => {
      const mockOrders = [
        {
          id: 1,
          status: 'pending',
          total: 25.99,
          User: { id: 1, name: 'Test User' },
          Table: { id: 1, number: 5 },
          OrderDetails: []
        }
      ];

      Order.findAll.mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/orders?status=pending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].status).toBe('pending');

      expect(Order.findAll).toHaveBeenCalledWith({
        where: { status: 'pending' },
        include: expect.any(Array),
        order: [['created_at', 'DESC']]
      });
    });

    test('should filter orders by tableId', async () => {
      const mockOrders = [
        {
          id: 1,
          status: 'pending',
          total: 25.99,
          User: { id: 1, name: 'Test User' },
          Table: { id: 1, number: 5 },
          OrderDetails: []
        }
      ];

      Order.findAll.mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/orders?tableId=1')
        .expect(200);

      expect(Order.findAll).toHaveBeenCalledWith({
        where: { tableId: "1" },
        include: expect.any(Array),
        order: [['created_at', 'DESC']]
      });
    });

    test('should filter orders by date range', async () => {
      const mockOrders = [
        {
          id: 1,
          status: 'pending',
          total: 25.99,
          User: { id: 1, name: 'Test User' },
          Table: { id: 1, number: 5 },
          OrderDetails: []
        }
      ];

      Order.findAll.mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/api/orders?startDate=2023-01-01&endDate=2023-12-31')
        .expect(200);

      expect(Order.findAll).toHaveBeenCalledWith({
        where: {
          created_at: {
            [require('sequelize').Op.gte]: expect.any(Date),
            [require('sequelize').Op.lte]: expect.any(Date)
          }
        },
        include: expect.any(Array),
        order: [['created_at', 'DESC']]
      });
    });

    test('should return 400 for invalid status filter', async () => {
      const response = await request(app)
        .get('/api/orders?status=invalid_status')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Filtro de estado inválido');
    });

    test('should return 400 for invalid tableId filter', async () => {
      const response = await request(app)
        .get('/api/orders?tableId=abc')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('tableId debe ser un número positivo');
    });

    test('should return 400 for invalid date filters', async () => {
      const response = await request(app)
        .get('/api/orders?startDate=invalid-date')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('startDate debe ser una fecha válida');
    });

    test('should handle empty results', async () => {
      Order.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/orders/:id', () => {
    test('should return order by id successfully', async () => {
      const mockOrder = {
        id: 1,
        status: 'pending',
        total: 25.99,
        User: { id: 1, name: 'Test User' },
        Table: { id: 1, number: 5 },
        OrderDetails: [
          {
            dishId: 1,
            quantity: 2,
            price: 10.99,
            Dish: { id: 1, name: 'Pizza', description: 'Delicious pizza', price: 10.99 }
          }
        ]
      };

      Order.findByPk.mockResolvedValue(mockOrder);

      const response = await request(app)
        .get('/api/orders/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 1,
        status: 'pending',
        total: 25.99
      });

      expect(Order.findByPk).toHaveBeenCalledWith('1', {
        include: expect.any(Array)
      });
    });

    test('should return 404 when order not found', async () => {
      Order.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/orders/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Pedido no encontrado');

      expect(Order.findByPk).toHaveBeenCalledWith('999', {
        include: expect.any(Array)
      });
    });
  });

  describe('PUT /api/orders/:id', () => {
    test('should update order status successfully', async () => {
      const mockOrder = {
        id: 1,
        status: 'pending',
        tableId: 1,
        update: jest.fn()
      };

      const mockTable = {
        id: 1,
        status: 'occupied',
        update: jest.fn()
      };

      const mockUpdatedOrder = {
        id: 1,
        status: 'in_progress',
        total: 25.99,
        User: { id: 1, name: 'Test User' },
        Table: { id: 1, number: 5 },
        OrderDetails: []
      };

      Order.findByPk
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockUpdatedOrder);
      Table.findByPk.mockResolvedValue(mockTable);

      const response = await request(app)
        .put('/api/orders/1')
        .send({ status: 'in_progress' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Estado del pedido actualizado exitosamente');
      expect(response.body.data.status).toBe('in_progress');

      expect(Order.findByPk).toHaveBeenCalledWith('1', {
        include: [{ model: Table }],
        transaction: expect.any(Object)
      });
      expect(mockOrder.update).toHaveBeenCalledWith({ status: 'in_progress' }, { transaction: expect.any(Object) });
    });

    test('should free table when order is completed', async () => {
      const mockOrder = {
        id: 1,
        status: 'in_progress',
        tableId: 1,
        update: jest.fn()
      };

      const mockTable = {
        id: 1,
        status: 'occupied',
        update: jest.fn()
      };

      const mockUpdatedOrder = {
        id: 1,
        status: 'completed',
        total: 25.99,
        User: { id: 1, name: 'Test User' },
        Table: { id: 1, number: 5 },
        OrderDetails: []
      };

      Order.findByPk
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockUpdatedOrder);
      Table.findByPk.mockResolvedValue(mockTable);

      await request(app)
        .put('/api/orders/1')
        .send({ status: 'completed' })
        .expect(200);

      expect(mockTable.update).toHaveBeenCalledWith({ status: 'available' }, { transaction: expect.any(Object) });
    });

    test('should return 400 for invalid status', async () => {
      const response = await request(app)
        .put('/api/orders/1')
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Estado inválido');
    });

    test('should return 404 when order not found', async () => {
      Order.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/orders/999')
        .send({ status: 'completed' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Pedido no encontrado');
    });
  });

  describe('DELETE /api/orders/:id', () => {
    test('should delete order successfully', async () => {
      const mockTable = {
        id: 1,
        status: 'occupied',
        update: jest.fn()
      };

      const mockOrder = {
        id: 1,
        status: 'pending',
        tableId: 1,
        Table: mockTable,
        destroy: jest.fn()
      };

      Order.findByPk.mockResolvedValue(mockOrder);
      OrderDetail.destroy.mockResolvedValue();

      const response = await request(app)
        .delete('/api/orders/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Pedido eliminado exitosamente');

      expect(OrderDetail.destroy).toHaveBeenCalledWith({
        where: { orderId: '1' },
        transaction: expect.any(Object)
      });
      expect(mockOrder.destroy).toHaveBeenCalledWith({ transaction: expect.any(Object) });
      expect(mockTable.update).toHaveBeenCalledWith({ status: 'available' }, { transaction: expect.any(Object) });
    });

    test('should return 404 when order not found', async () => {
      Order.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/orders/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Pedido no encontrado');
    });
  });

  describe('GET /api/orders/:id/ticket', () => {
    test('should generate PDF ticket successfully', async () => {
      const mockPdfBuffer = Buffer.from('PDF content');

      // Mock PDFDocument
      const mockDoc = {
        fontSize: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        moveDown: jest.fn().mockReturnThis(),
        moveTo: jest.fn().mockReturnThis(),
        lineTo: jest.fn().mockReturnThis(),
        stroke: jest.fn().mockReturnThis(),
        on: jest.fn(),
        end: jest.fn()
      };

      // Mock the PDFDocument constructor
      jest.doMock('pdfkit', () => {
        return jest.fn().mockImplementation(() => {
          setTimeout(() => {
            mockDoc.on.mock.calls.find(call => call[0] === 'data')[1](mockPdfBuffer);
            mockDoc.on.mock.calls.find(call => call[0] === 'end')[1]();
          }, 0);
          return mockDoc;
        });
      });

      const mockOrder = {
        id: 1,
        status: 'pending',
        total: 25.99,
        created_at: new Date(),
        User: { id: 1, name: 'Test User' },
        Table: { id: 1, number: 5 },
        OrderDetails: [
          {
            dishId: 1,
            quantity: 2,
            price: 10.99,
            Dish: { id: 1, name: 'Pizza', price: 10.99 }
          }
        ]
      };

      Order.findByPk.mockResolvedValue(mockOrder);

      const response = await request(app)
        .get('/api/orders/1/ticket')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toBe('inline; filename="ticket-pedido-1.pdf"');

      expect(Order.findByPk).toHaveBeenCalledWith('1', {
        include: expect.any(Array)
      });
    });

    test('should return 404 when order not found for PDF', async () => {
      Order.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/orders/999/ticket')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Pedido no encontrado');
    });
  });
});
