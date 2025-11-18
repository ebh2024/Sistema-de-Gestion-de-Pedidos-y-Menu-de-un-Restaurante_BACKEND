const { getOrderDetails } = require('../../src/controllers/orderDetailController');

// Mock models
jest.mock('../../src/models', () => ({
  OrderDetail: {
    findAll: jest.fn()
  },
  Order: {
    findByPk: jest.fn()
  },
  Dish: {}
}));

const { OrderDetail, Order } = require('../../src/models');

describe('OrderDetail Controller - Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      params: {},
      user: { id: 1, role: 'admin' }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('getOrderDetails', () => {
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
          created_at: new Date(),
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
          created_at: new Date(),
          Dish: {
            id: 2,
            name: 'Burger',
            description: 'Juicy burger',
            price: 8.99,
            available: true
          }
        }
      ];

      mockReq.params.orderId = '1';
      Order.findByPk.mockResolvedValue(mockOrder);
      OrderDetail.findAll.mockResolvedValue(mockOrderDetails);

      await getOrderDetails(mockReq, mockRes, mockNext);

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
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockOrderDetails
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 404 when order not found', async () => {
      mockReq.params.orderId = '999';
      Order.findByPk.mockResolvedValue(null);

      await getOrderDetails(mockReq, mockRes, mockNext);

      expect(Order.findByPk).toHaveBeenCalledWith('999');
      expect(OrderDetail.findAll).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Pedido no encontrado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return empty array when order has no details', async () => {
      const mockOrder = {
        id: 1,
        status: 'pending'
      };

      mockReq.params.orderId = '1';
      Order.findByPk.mockResolvedValue(mockOrder);
      OrderDetail.findAll.mockResolvedValue([]);

      await getOrderDetails(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: []
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');

      mockReq.params.orderId = '1';
      Order.findByPk.mockRejectedValue(unexpectedError);

      await getOrderDetails(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});
