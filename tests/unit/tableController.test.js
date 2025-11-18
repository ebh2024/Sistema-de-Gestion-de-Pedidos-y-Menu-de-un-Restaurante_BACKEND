const {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable
} = require('../../src/controllers/tableController');

// Mock dependencies
jest.mock('../../src/models', () => ({
  Table: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

const { Table } = require('../../src/models');

describe('Table Controller - Unit Tests', () => {
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

  describe('getAllTables', () => {
    test('should return tables successfully with filters', async () => {
      const mockTables = [
        { id: 1, number: 1, capacity: 4, status: 'available' },
        { id: 2, number: 2, capacity: 6, status: 'occupied' }
      ];

      mockReq.query = { number: '1', disponible: 'available', minCapacity: '2', maxCapacity: '8' };

      Table.findAll.mockResolvedValue(mockTables);

      await getAllTables(mockReq, mockRes, mockNext);

      expect(Table.findAll).toHaveBeenCalledWith({
        where: {
          number: 1,
          status: 'available',
          capacity: { '$gte': 2, '$lte': 8 }
        }
      });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockTables
      });

      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return tables with partial filters', async () => {
      const mockTables = [
        { id: 1, number: 1, capacity: 4, status: 'available' }
      ];

      mockReq.query = { disponible: 'available' };

      Table.findAll.mockResolvedValue(mockTables);

      await getAllTables(mockReq, mockRes, mockNext);

      expect(Table.findAll).toHaveBeenCalledWith({
        where: {
          status: 'available'
        }
      });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockTables
      });
    });

    test('should return all tables without filters', async () => {
      const mockTables = [
        { id: 1, number: 1, capacity: 4, status: 'available' },
        { id: 2, number: 2, capacity: 6, status: 'occupied' }
      ];

      Table.findAll.mockResolvedValue(mockTables);

      await getAllTables(mockReq, mockRes, mockNext);

      expect(Table.findAll).toHaveBeenCalledWith({ where: {} });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockTables
      });
    });

    test('should return 400 for invalid number', async () => {
      mockReq.query = { number: 'invalid' };

      await getAllTables(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Número inválido'
      });

      expect(Table.findAll).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid minCapacity', async () => {
      mockReq.query = { minCapacity: 'invalid' };

      await getAllTables(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'minCapacity inválido'
      });

      expect(Table.findAll).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid maxCapacity', async () => {
      mockReq.query = { maxCapacity: 'invalid' };

      await getAllTables(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'maxCapacity inválido'
      });

      expect(Table.findAll).not.toHaveBeenCalled();
    });

    test('should call next with error when database throws', async () => {
      const error = new Error('Database error');

      Table.findAll.mockRejectedValue(error);

      await getAllTables(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('getTableById', () => {
    test('should return table successfully', async () => {
      const mockTable = { id: 1, number: 1, capacity: 4, status: 'available' };

      mockReq.params.id = '1';

      Table.findByPk.mockResolvedValue(mockTable);

      await getTableById(mockReq, mockRes, mockNext);

      expect(Table.findByPk).toHaveBeenCalledWith('1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTable
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 404 when table not found', async () => {
      mockReq.params.id = '999';

      Table.findByPk.mockResolvedValue(null);

      await getTableById(mockReq, mockRes, mockNext);

      expect(Table.findByPk).toHaveBeenCalledWith('999');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mesa no encontrada'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with other errors', async () => {
      const error = new Error('Database connection error');

      mockReq.params.id = '1';

      Table.findByPk.mockRejectedValue(error);

      await getTableById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('createTable', () => {
    test('should create table successfully', async () => {
      const tableData = {
        number: 3,
        capacity: 6,
        status: 'available'
      };

      const mockCreatedTable = {
        id: 3,
        ...tableData,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockReq.body = tableData;

      Table.findOne.mockResolvedValue(null);
      Table.create.mockResolvedValue(mockCreatedTable);

      await createTable(mockReq, mockRes, mockNext);

      expect(Table.findOne).toHaveBeenCalledWith({ where: { number: 3 } });
      expect(Table.create).toHaveBeenCalledWith({
        number: 3,
        capacity: 6,
        status: 'available'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mesa creada',
        data: mockCreatedTable
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should create table with default status', async () => {
      const tableData = {
        number: 4,
        capacity: 8
      };

      const mockCreatedTable = {
        id: 4,
        number: 4,
        capacity: 8,
        status: 'available',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockReq.body = tableData;

      Table.findOne.mockResolvedValue(null);
      Table.create.mockResolvedValue(mockCreatedTable);

      await createTable(mockReq, mockRes, mockNext);

      expect(Table.create).toHaveBeenCalledWith({
        number: 4,
        capacity: 8,
        status: 'available'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mesa creada',
        data: mockCreatedTable
      });
    });

    test('should return 400 for missing required fields', async () => {
      mockReq.body = { number: 5 };

      await createTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'number y capacity son requeridos'
      });

      expect(Table.findOne).not.toHaveBeenCalled();
      expect(Table.create).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid number', async () => {
      mockReq.body = { number: 'invalid', capacity: 4 };

      await createTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'number debe ser entero positivo'
      });

      expect(Table.findOne).not.toHaveBeenCalled();
      expect(Table.create).not.toHaveBeenCalled();
    });

    test('should return 400 for zero number', async () => {
      mockReq.body = { number: 0, capacity: 4 };

      await createTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'number debe ser entero positivo'
      });
    });

    test('should return 400 for negative number', async () => {
      mockReq.body = { number: -1, capacity: 4 };

      await createTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'number debe ser entero positivo'
      });
    });

    test('should return 400 for invalid capacity', async () => {
      mockReq.body = { number: 5, capacity: 'invalid' };

      await createTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'capacity debe ser entero positivo'
      });
    });

    test('should return 400 for zero capacity', async () => {
      mockReq.body = { number: 5, capacity: 0 };

      await createTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'capacity debe ser entero positivo'
      });
    });

    test('should return 400 for negative capacity', async () => {
      mockReq.body = { number: 5, capacity: -2 };

      await createTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'capacity debe ser entero positivo'
      });
    });

    test('should return 400 for invalid status', async () => {
      mockReq.body = { number: 5, capacity: 4, status: 'invalid' };

      await createTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'status inválido. Valores permitidos: available, occupied, reserved'
      });

      expect(Table.findOne).not.toHaveBeenCalled();
      expect(Table.create).not.toHaveBeenCalled();
    });

    test('should return 409 for duplicate table number', async () => {
      const existingTable = { id: 1, number: 5, capacity: 4 };

      mockReq.body = { number: 5, capacity: 6 };

      Table.findOne.mockResolvedValue(existingTable);

      await createTable(mockReq, mockRes, mockNext);

      expect(Table.findOne).toHaveBeenCalledWith({ where: { number: 5 } });
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Ya existe una mesa con ese número'
      });

      expect(Table.create).not.toHaveBeenCalled();
    });

    test('should call next with error when database throws', async () => {
      const error = new Error('Database error');

      mockReq.body = { number: 5, capacity: 4 };

      Table.findOne.mockResolvedValue(null);
      Table.create.mockRejectedValue(error);

      await createTable(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('updateTable', () => {
    test('should update table successfully', async () => {
      const updateData = {
        number: 10,
        capacity: 8,
        status: 'occupied'
      };

      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available',
        save: jest.fn().mockResolvedValue()
      };

      mockReq.params.id = '1';
      mockReq.body = updateData;

      Table.findByPk.mockResolvedValue(mockTable);
      Table.findOne.mockResolvedValue(null);

      await updateTable(mockReq, mockRes, mockNext);

      expect(Table.findByPk).toHaveBeenCalledWith('1');
      expect(Table.findOne).toHaveBeenCalledWith({ where: { number: 10 } });
      expect(mockTable.number).toBe(10);
      expect(mockTable.capacity).toBe(8);
      expect(mockTable.status).toBe('occupied');
      expect(mockTable.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mesa actualizada',
        data: mockTable
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should update only provided fields', async () => {
      const updateData = {
        status: 'reserved'
      };

      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available',
        save: jest.fn().mockResolvedValue()
      };

      mockReq.params.id = '1';
      mockReq.body = updateData;

      Table.findByPk.mockResolvedValue(mockTable);

      await updateTable(mockReq, mockRes, mockNext);

      expect(mockTable.number).toBe(1);
      expect(mockTable.capacity).toBe(4);
      expect(mockTable.status).toBe('reserved');
      expect(mockTable.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 when table not found', async () => {
      mockReq.params.id = '999';
      mockReq.body = { status: 'occupied' };

      Table.findByPk.mockResolvedValue(null);

      await updateTable(mockReq, mockRes, mockNext);

      expect(Table.findByPk).toHaveBeenCalledWith('999');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mesa no encontrada'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid number', async () => {
      mockReq.params.id = '1';
      mockReq.body = { number: 'invalid' };

      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available'
      };

      Table.findByPk.mockResolvedValue(mockTable);

      await updateTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'number debe ser entero positivo'
      });
    });

    test('should return 400 for invalid capacity', async () => {
      mockReq.params.id = '1';
      mockReq.body = { capacity: -1 };

      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available'
      };

      Table.findByPk.mockResolvedValue(mockTable);

      await updateTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'capacity debe ser entero positivo'
      });
    });

    test('should return 400 for invalid status', async () => {
      mockReq.params.id = '1';
      mockReq.body = { status: 'invalid' };

      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available'
      };

      Table.findByPk.mockResolvedValue(mockTable);

      await updateTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'status inválido. Valores permitidos: available, occupied, reserved'
      });
    });

    test('should return 409 for duplicate table number', async () => {
      const existingTable = { id: 2, number: 10 };

      mockReq.params.id = '1';
      mockReq.body = { number: 10 };

      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available'
      };

      Table.findByPk.mockResolvedValue(mockTable);
      Table.findOne.mockResolvedValue(existingTable);

      await updateTable(mockReq, mockRes, mockNext);

      expect(Table.findOne).toHaveBeenCalledWith({ where: { number: 10 } });
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Ya existe otra mesa con ese número'
      });
    });

    test('should allow updating to same number for same table', async () => {
      const updateData = { number: 1 };

      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available',
        save: jest.fn().mockResolvedValue()
      };

      mockReq.params.id = '1';
      mockReq.body = updateData;

      Table.findByPk.mockResolvedValue(mockTable);
      Table.findOne.mockResolvedValue(mockTable); // Same table

      await updateTable(mockReq, mockRes, mockNext);

      expect(Table.findOne).toHaveBeenCalledWith({ where: { number: 1 } });
      expect(mockTable.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should call next with error when database throws', async () => {
      const error = new Error('Database error');

      mockReq.params.id = '1';
      mockReq.body = { status: 'occupied' };

      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available',
        save: jest.fn().mockRejectedValue(error)
      };

      Table.findByPk.mockResolvedValue(mockTable);

      await updateTable(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('deleteTable', () => {
    test('should delete table successfully', async () => {
      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available',
        destroy: jest.fn().mockResolvedValue()
      };

      mockReq.params.id = '1';

      Table.findByPk.mockResolvedValue(mockTable);

      await deleteTable(mockReq, mockRes, mockNext);

      expect(Table.findByPk).toHaveBeenCalledWith('1');
      expect(mockTable.destroy).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mesa eliminada'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 404 when table not found', async () => {
      mockReq.params.id = '999';

      Table.findByPk.mockResolvedValue(null);

      await deleteTable(mockReq, mockRes, mockNext);

      expect(Table.findByPk).toHaveBeenCalledWith('999');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Mesa no encontrada'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with other errors', async () => {
      const error = new Error('Database connection error');

      mockReq.params.id = '1';

      Table.findByPk.mockRejectedValue(error);

      await deleteTable(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});
