// Mock dependencies first
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

const { Order, OrderDetail, Dish, Table, User } = require('../../src/models');
const { Op } = require('sequelize');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  generateOrderTicketPDF,
  deleteOrder,
  isValidStatusTransition
} = require('../../src/services/orderService');
jest.mock('../../src/constants/orderConstants', () => ({
  ORDER_STATUSES: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  VALID_ORDER_STATUSES: ['pending', 'in_progress', 'completed', 'cancelled'],
  ORDER_STATUS_TRANSITIONS: {
    cook: {
      pending: ['in_progress'],
      in_progress: ['completed'],
      completed: [],
      cancelled: []
    },
    waiter: {
      allowedTransitions: (currentStatus, newStatus) => {
        if (newStatus === 'cancelled') return true;
        if (currentStatus === 'pending' && newStatus === 'in_progress') return true;
        return false;
      }
    },
    admin: {
      allowedTransitions: () => true
    }
  },
  ORDER_FILTERS_BY_ROLE: {
    cook: {
      status: {
        [require('sequelize').Op.in]: ['pending', 'in_progress']
      }
    }
  }
}));

// Mock sequelize transaction
const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn()
};

jest.mock('../../src/config/database', () => ({
  sequelize: {
    transaction: jest.fn(() => mockTransaction)
  }
}));

describe('Order Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    test('should validate and prepare order data correctly', async () => {
      const orderData = {
        tableId: 1,
        items: [
          { dishId: 1, quantity: 2 },
          { dishId: 2, quantity: 1 }
        ]
      };
      const userId = 1;

      const mockTable = {
        id: 1,
        number: 5,
        status: 'available',
        update: jest.fn().mockResolvedValue()
      };

      const mockDishes = [
        { id: 1, name: 'Pizza', price: 10.99, available: true },
        { id: 2, name: 'Burger', price: 8.99, available: true }
      ];

      Table.findByPk.mockResolvedValue(mockTable);
      Dish.findByPk
        .mockResolvedValueOnce(mockDishes[0])
        .mockResolvedValueOnce(mockDishes[1]);
      Order.create.mockRejectedValue(new Error('Test error'));

      // Test will fail at Order.create but we can verify the setup
      await expect(createOrder(orderData, userId)).rejects.toThrow();

      expect(Table.findByPk).toHaveBeenCalledWith(1, { transaction: mockTransaction });
      expect(Dish.findByPk).toHaveBeenCalledWith(1, { transaction: mockTransaction });
      expect(Dish.findByPk).toHaveBeenCalledWith(2, { transaction: mockTransaction });
      expect(Order.create).toHaveBeenCalledWith({
        userId: 1,
        tableId: 1,
        total: 30.97,
        status: 'pending'
      }, { transaction: mockTransaction });
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('should throw error when table not found', async () => {
      const orderData = { tableId: 999, items: [{ dishId: 1, quantity: 1 }] };
      const userId = 1;

      Table.findByPk.mockResolvedValue(null);

      await expect(createOrder(orderData, userId)).rejects.toThrow('Mesa no encontrada');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('should throw error when table is not available', async () => {
      const orderData = { tableId: 1, items: [{ dishId: 1, quantity: 1 }] };
      const userId = 1;

      const mockTable = {
        id: 1,
        number: 5,
        status: 'occupied'
      };

      Table.findByPk.mockResolvedValue(mockTable);

      await expect(createOrder(orderData, userId)).rejects.toThrow('La mesa 5 no está disponible');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('should throw error when dish not found', async () => {
      const orderData = { tableId: 1, items: [{ dishId: 999, quantity: 1 }] };
      const userId = 1;

      const mockTable = {
        id: 1,
        number: 5,
        status: 'available'
      };

      Table.findByPk.mockResolvedValue(mockTable);
      Dish.findByPk.mockResolvedValue(null);

      await expect(createOrder(orderData, userId)).rejects.toThrow('Plato con ID 999 no encontrado');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('should throw error when dish is not available', async () => {
      const orderData = { tableId: 1, items: [{ dishId: 1, quantity: 1 }] };
      const userId = 1;

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

      await expect(createOrder(orderData, userId)).rejects.toThrow('El plato "Pizza" no está disponible');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getOrders', () => {
    test('should return orders without filters', async () => {
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

      const result = await getOrders({}, 'admin');

      expect(Order.findAll).toHaveBeenCalledWith({
        where: {},
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'role']
          },
          {
            model: Table,
            attributes: ['id', 'number', 'capacity', 'status']
          },
          {
            model: OrderDetail,
            include: [{
              model: Dish,
              attributes: ['id', 'name', 'description', 'price']
            }]
          }
        ],
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockOrders);
    });

    test('should filter orders by status', async () => {
      const filters = { status: 'pending' };
      const mockOrders = [{ id: 1, status: 'pending' }];

      Order.findAll.mockResolvedValue(mockOrders);

      const result = await getOrders(filters, 'admin');

      expect(Order.findAll).toHaveBeenCalledWith({
        where: { status: 'pending' },
        include: expect.any(Array),
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockOrders);
    });

    test('should apply role-based filters for cook', async () => {
      const mockOrders = [{ id: 1, status: 'pending' }];

      Order.findAll.mockResolvedValue(mockOrders);

      const result = await getOrders({}, 'cook');

      expect(Order.findAll).toHaveBeenCalledWith({
        where: { status: { [Op.in]: ['pending', 'in_progress'] } },
        include: expect.any(Array),
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockOrders);
    });
  });

  describe('getOrderById', () => {
    test('should return order when found', async () => {
      const mockOrder = {
        id: 1,
        status: 'pending',
        User: { id: 1, name: 'Test User' },
        Table: { id: 1, number: 5 },
        OrderDetails: []
      };

      Order.findByPk.mockResolvedValue(mockOrder);

      const result = await getOrderById(1, 'admin');

      expect(Order.findByPk).toHaveBeenCalledWith(1, {
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'role']
          },
          {
            model: Table,
            attributes: ['id', 'number', 'capacity', 'status']
          },
          {
            model: OrderDetail,
            include: [{
              model: Dish,
              attributes: ['id', 'name', 'description', 'price']
            }]
          }
        ]
      });
      expect(result).toEqual(mockOrder);
    });

    test('should throw error when order not found', async () => {
      Order.findByPk.mockResolvedValue(null);

      await expect(getOrderById(999, 'admin')).rejects.toThrow('Pedido no encontrado');
    });

    test('should restrict access for cook role', async () => {
      const mockOrder = {
        id: 1,
        status: 'completed',
        User: { id: 1, name: 'Test User' },
        Table: { id: 1, number: 5 },
        OrderDetails: []
      };

      Order.findByPk.mockResolvedValue(mockOrder);

      await expect(getOrderById(1, 'cook')).rejects.toThrow('No tienes permisos para ver este pedido');
    });
  });

  describe('updateOrderStatus', () => {
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
        update: jest.fn().mockResolvedValue()
      };

      Order.findByPk.mockResolvedValue(mockOrder);
      Table.findByPk.mockResolvedValue(mockTable);

      await updateOrderStatus(1, 'in_progress', 'admin');

      expect(Order.findByPk).toHaveBeenCalledWith(1, {
        include: [{ model: Table }],
        transaction: mockTransaction
      });
      expect(mockOrder.update).toHaveBeenCalledWith({ status: 'in_progress' }, { transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
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
        update: jest.fn().mockResolvedValue()
      };

      Order.findByPk.mockResolvedValue(mockOrder);
      Table.findByPk.mockResolvedValue(mockTable);

      await updateOrderStatus(1, 'completed', 'admin');

      expect(mockTable.update).toHaveBeenCalledWith({ status: 'available' }, { transaction: mockTransaction });
    });

    test('should throw error when order not found', async () => {
      Order.findByPk.mockResolvedValue(null);

      await expect(updateOrderStatus(1, 'in_progress', 'admin')).rejects.toThrow('Pedido no encontrado');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('should throw error for invalid status transition', async () => {
      const mockOrder = {
        id: 1,
        status: 'pending'
      };

      Order.findByPk.mockResolvedValue(mockOrder);

      await expect(updateOrderStatus(1, 'completed', 'cook')).rejects.toThrow('No puedes cambiar el estado de "pending" a "completed"');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('deleteOrder', () => {
    test('should delete order successfully for admin', async () => {
      const mockTable = {
        id: 1,
        status: 'occupied',
        update: jest.fn().mockResolvedValue()
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

      await deleteOrder(1, 'admin');

      expect(OrderDetail.destroy).toHaveBeenCalledWith({
        where: { orderId: 1 },
        transaction: mockTransaction
      });
      expect(mockOrder.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(mockTable.update).toHaveBeenCalledWith({ status: 'available' }, { transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('should throw error for non-admin user', async () => {
      await expect(deleteOrder(1, 'waiter')).rejects.toThrow('Solo los administradores pueden eliminar pedidos');
    });

    test('should throw error when trying to delete completed order', async () => {
      const mockOrder = {
        id: 1,
        status: 'completed'
      };

      Order.findByPk.mockResolvedValue(mockOrder);

      await expect(deleteOrder(1, 'admin')).rejects.toThrow('No se puede eliminar un pedido completado');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('isValidStatusTransition', () => {
    test('should allow valid transitions for cook', () => {
      expect(isValidStatusTransition('pending', 'in_progress', 'cook')).toBe(true);
      expect(isValidStatusTransition('in_progress', 'completed', 'cook')).toBe(true);
      expect(isValidStatusTransition('pending', 'completed', 'cook')).toBe(false);
    });

    test('should allow valid transitions for waiter', () => {
      expect(isValidStatusTransition('pending', 'cancelled', 'waiter')).toBe(true);
      expect(isValidStatusTransition('pending', 'in_progress', 'waiter')).toBe(true);
      expect(isValidStatusTransition('in_progress', 'completed', 'waiter')).toBe(false);
    });

    test('should allow all transitions for admin', () => {
      expect(isValidStatusTransition('pending', 'completed', 'admin')).toBe(true);
      expect(isValidStatusTransition('completed', 'pending', 'admin')).toBe(true);
    });
  });
});
