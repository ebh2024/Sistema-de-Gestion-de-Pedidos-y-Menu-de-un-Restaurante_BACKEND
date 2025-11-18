const {
  createOrder: createOrderController,
  getAllOrders,
  getOrderById: getOrderByIdController,
  updateOrderStatus: updateOrderStatusController,
  deleteOrder: deleteOrderController,
  generateOrderTicketPDF: generateOrderTicketPDFController
} = require('../../src/controllers/orderController');

// Mock services
jest.mock('../../src/services/orderService', () => ({
  createOrder: jest.fn(),
  getOrders: jest.fn(),
  getOrderById: jest.fn(),
  updateOrderStatus: jest.fn(),
  deleteOrder: jest.fn(),
  generateOrderTicketPDF: jest.fn()
}));

// Mock validators
jest.mock('../../src/validators/orderValidators', () => ({
  validateOrderCreation: jest.fn(),
  validateOrderStatus: jest.fn(),
  validateOrderFilters: jest.fn()
}));

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  generateOrderTicketPDF
} = require('../../src/services/orderService');

const {
  validateOrderCreation,
  validateOrderStatus,
  validateOrderFilters
} = require('../../src/validators/orderValidators');

describe('Order Controller - Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 1, role: 'admin' }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('createOrderController', () => {
    test('should create order successfully', async () => {
      const orderData = {
        tableId: 1,
        items: [{ dishId: 1, quantity: 2 }]
      };

      const mockOrder = {
        id: 1,
        userId: 1,
        tableId: 1,
        total: 25.99,
        status: 'pending'
      };

      mockReq.body = orderData;
      validateOrderCreation.mockReturnValue({ isValid: true, errors: [] });
      createOrder.mockResolvedValue(mockOrder);

      await createOrderController(mockReq, mockRes, mockNext);

      expect(validateOrderCreation).toHaveBeenCalledWith(orderData);
      expect(createOrder).toHaveBeenCalledWith(orderData, 1);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Pedido creado exitosamente',
        data: mockOrder
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 for validation errors', async () => {
      const orderData = { tableId: 1 };
      const validationErrors = ['tableId es requerido', 'items debe ser un array no vacío'];

      mockReq.body = orderData;
      validateOrderCreation.mockReturnValue({
        isValid: false,
        errors: validationErrors
      });

      await createOrderController(mockReq, mockRes, mockNext);

      expect(validateOrderCreation).toHaveBeenCalledWith(orderData);
      expect(createOrder).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'tableId es requerido, items debe ser un array no vacío'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 404 for table not found', async () => {
      const orderData = {
        tableId: 999,
        items: [{ dishId: 1, quantity: 1 }]
      };

      mockReq.body = orderData;
      validateOrderCreation.mockReturnValue({ isValid: true, errors: [] });
      createOrder.mockRejectedValue(new Error('Mesa no encontrada'));

      await createOrderController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mesa no encontrada'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 for unavailable table', async () => {
      const orderData = {
        tableId: 1,
        items: [{ dishId: 1, quantity: 1 }]
      };

      mockReq.body = orderData;
      validateOrderCreation.mockReturnValue({ isValid: true, errors: [] });
      createOrder.mockRejectedValue(new Error('La mesa 5 no está disponible. Estado actual: occupied'));

      await createOrderController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'La mesa 5 no está disponible. Estado actual: occupied'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with unexpected errors', async () => {
      const orderData = {
        tableId: 1,
        items: [{ dishId: 1, quantity: 1 }]
      };
      const unexpectedError = new Error('Database connection failed');

      mockReq.body = orderData;
      validateOrderCreation.mockReturnValue({ isValid: true, errors: [] });
      createOrder.mockRejectedValue(unexpectedError);

      await createOrderController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('getAllOrders', () => {
    test('should return orders successfully', async () => {
      const filters = { status: 'pending', tableId: '1' };
      const mockOrders = [
        { id: 1, status: 'pending', total: 25.99 },
        { id: 2, status: 'pending', total: 15.50 }
      ];

      mockReq.query = filters;
      validateOrderFilters.mockReturnValue({ isValid: true, errors: [] });
      getOrders.mockResolvedValue(mockOrders);

      await getAllOrders(mockReq, mockRes, mockNext);

      expect(validateOrderFilters).toHaveBeenCalledWith(filters);
      expect(getOrders).toHaveBeenCalledWith(filters, 'admin');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockOrders
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid filters', async () => {
      const filters = { status: 'invalid_status' };
      const validationErrors = ['Filtro de estado inválido: invalid_status'];

      mockReq.query = filters;
      validateOrderFilters.mockReturnValue({
        isValid: false,
        errors: validationErrors
      });

      await getAllOrders(mockReq, mockRes, mockNext);

      expect(validateOrderFilters).toHaveBeenCalledWith(filters);
      expect(getOrders).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Filtro de estado inválido: invalid_status'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');

      mockReq.query = {};
      validateOrderFilters.mockReturnValue({ isValid: true, errors: [] });
      getOrders.mockRejectedValue(unexpectedError);

      await getAllOrders(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('getOrderByIdController', () => {
    test('should return order by id successfully', async () => {
      const mockOrder = {
        id: 1,
        status: 'pending',
        total: 25.99,
        User: { id: 1, name: 'Test User' },
        Table: { id: 1, number: 5 }
      };

      mockReq.params.id = '1';
      getOrderById.mockResolvedValue(mockOrder);

      await getOrderByIdController(mockReq, mockRes, mockNext);

      expect(getOrderById).toHaveBeenCalledWith('1', 'admin');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 404 when order not found', async () => {
      mockReq.params.id = '999';
      getOrderById.mockRejectedValue(new Error('Pedido no encontrado'));

      await getOrderByIdController(mockReq, mockRes, mockNext);

      expect(getOrderById).toHaveBeenCalledWith('999', 'admin');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Pedido no encontrado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 for permission denied', async () => {
      mockReq.params.id = '1';
      mockReq.user.role = 'cook';
      getOrderById.mockRejectedValue(new Error('No tienes permisos para ver este pedido'));

      await getOrderByIdController(mockReq, mockRes, mockNext);

      expect(getOrderById).toHaveBeenCalledWith('1', 'cook');
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No tienes permisos para ver este pedido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');

      mockReq.params.id = '1';
      getOrderById.mockRejectedValue(unexpectedError);

      await getOrderByIdController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('updateOrderStatusController', () => {
    test('should update order status successfully', async () => {
      const mockUpdatedOrder = {
        id: 1,
        status: 'in_progress',
        total: 25.99
      };

      mockReq.params.id = '1';
      mockReq.body = { status: 'in_progress' };
      validateOrderStatus.mockReturnValue({ isValid: true, errors: [] });
      updateOrderStatus.mockResolvedValue(mockUpdatedOrder);

      await updateOrderStatusController(mockReq, mockRes, mockNext);

      expect(validateOrderStatus).toHaveBeenCalledWith('in_progress');
      expect(updateOrderStatus).toHaveBeenCalledWith('1', 'in_progress', 'admin');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Estado del pedido actualizado exitosamente',
        data: mockUpdatedOrder
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid status', async () => {
      const validationErrors = ['Estado inválido. Estados válidos: pending, in_progress, completed, cancelled'];

      mockReq.params.id = '1';
      mockReq.body = { status: 'invalid_status' };
      validateOrderStatus.mockReturnValue({
        isValid: false,
        errors: validationErrors
      });

      await updateOrderStatusController(mockReq, mockRes, mockNext);

      expect(validateOrderStatus).toHaveBeenCalledWith('invalid_status');
      expect(updateOrderStatus).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Estado inválido. Estados válidos: pending, in_progress, completed, cancelled'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 404 when order not found', async () => {
      mockReq.params.id = '999';
      mockReq.body = { status: 'completed' };
      validateOrderStatus.mockReturnValue({ isValid: true, errors: [] });
      updateOrderStatus.mockRejectedValue(new Error('Pedido no encontrado'));

      await updateOrderStatusController(mockReq, mockRes, mockNext);

      expect(updateOrderStatus).toHaveBeenCalledWith('999', 'completed', 'admin');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Pedido no encontrado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 for permission denied', async () => {
      mockReq.params.id = '1';
      mockReq.body = { status: 'completed' };
      mockReq.user.role = 'cook';
      validateOrderStatus.mockReturnValue({ isValid: true, errors: [] });
      updateOrderStatus.mockRejectedValue(new Error('No puedes cambiar el estado de "pending" a "completed"'));

      await updateOrderStatusController(mockReq, mockRes, mockNext);

      expect(updateOrderStatus).toHaveBeenCalledWith('1', 'completed', 'cook');
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No puedes cambiar el estado de "pending" a "completed"'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');

      mockReq.params.id = '1';
      mockReq.body = { status: 'in_progress' };
      validateOrderStatus.mockReturnValue({ isValid: true, errors: [] });
      updateOrderStatus.mockRejectedValue(unexpectedError);

      await updateOrderStatusController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('deleteOrderController', () => {
    test('should delete order successfully', async () => {
      mockReq.params.id = '1';
      deleteOrder.mockResolvedValue();

      await deleteOrderController(mockReq, mockRes, mockNext);

      expect(deleteOrder).toHaveBeenCalledWith('1', 'admin');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Pedido eliminado exitosamente'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 404 when order not found', async () => {
      mockReq.params.id = '999';
      deleteOrder.mockRejectedValue(new Error('Pedido no encontrado'));

      await deleteOrderController(mockReq, mockRes, mockNext);

      expect(deleteOrder).toHaveBeenCalledWith('999', 'admin');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Pedido no encontrado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 for completed order deletion attempt', async () => {
      mockReq.params.id = '1';
      deleteOrder.mockRejectedValue(new Error('No se puede eliminar un pedido completado'));

      await deleteOrderController(mockReq, mockRes, mockNext);

      expect(deleteOrder).toHaveBeenCalledWith('1', 'admin');
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No se puede eliminar un pedido completado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 for non-admin deletion attempt', async () => {
      mockReq.params.id = '1';
      mockReq.user.role = 'waiter';
      deleteOrder.mockRejectedValue(new Error('Solo los administradores pueden eliminar pedidos'));

      await deleteOrderController(mockReq, mockRes, mockNext);

      expect(deleteOrder).toHaveBeenCalledWith('1', 'waiter');
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Solo los administradores pueden eliminar pedidos'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');

      mockReq.params.id = '1';
      deleteOrder.mockRejectedValue(unexpectedError);

      await deleteOrderController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('generateOrderTicketPDFController', () => {
    test('should generate PDF successfully', async () => {
      const mockPdfBuffer = Buffer.from('PDF content');

      mockReq.params.id = '1';
      generateOrderTicketPDF.mockResolvedValue(mockPdfBuffer);

      await generateOrderTicketPDFController(mockReq, mockRes, mockNext);

      expect(generateOrderTicketPDF).toHaveBeenCalledWith('1');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="ticket-pedido-1.pdf"');
      expect(mockRes.send).toHaveBeenCalledWith(mockPdfBuffer);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 404 when order not found', async () => {
      mockReq.params.id = '999';
      generateOrderTicketPDF.mockRejectedValue(new Error('Pedido no encontrado'));

      await generateOrderTicketPDFController(mockReq, mockRes, mockNext);

      expect(generateOrderTicketPDF).toHaveBeenCalledWith('999');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Pedido no encontrado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with unexpected errors', async () => {
      const unexpectedError = new Error('PDF generation failed');

      mockReq.params.id = '1';
      generateOrderTicketPDF.mockRejectedValue(unexpectedError);

      await generateOrderTicketPDFController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockRes.setHeader).not.toHaveBeenCalled();
      expect(mockRes.send).not.toHaveBeenCalled();
    });
  });
});
