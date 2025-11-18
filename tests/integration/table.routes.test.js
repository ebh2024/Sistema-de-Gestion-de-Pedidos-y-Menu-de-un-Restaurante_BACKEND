// Mock the database models and operations
jest.mock('../../src/models', () => ({
  Table: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findOne: jest.fn()
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
const { Table, User } = require('../../src/models');
const tableRoutes = require('../../src/routes/tableRoutes');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/tables', tableRoutes);

// Mock environment variables
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

describe('Table Routes Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/tables', () => {
    test('should return all tables successfully', async () => {
      const mockTables = [
        {
          id: 1,
          number: 1,
          capacity: 4,
          status: 'available',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          number: 2,
          capacity: 6,
          status: 'occupied',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      Table.findAll.mockResolvedValue(mockTables);

      const response = await request(app)
        .get('/api/tables')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available'
      });

      expect(Table.findAll).toHaveBeenCalledWith({ where: {} });
    });

    test('should filter tables by number', async () => {
      const mockTables = [
        {
          id: 1,
          number: 5,
          capacity: 4,
          status: 'available',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      Table.findAll.mockResolvedValue(mockTables);

      const response = await request(app)
        .get('/api/tables?number=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: 1,
        number: 5,
        capacity: 4,
        status: 'available'
      });

      expect(Table.findAll).toHaveBeenCalledWith({
        where: { number: 5 }
      });
    });

    test('should filter tables by status', async () => {
      const mockTables = [
        {
          id: 1,
          number: 1,
          capacity: 4,
          status: 'available',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      Table.findAll.mockResolvedValue(mockTables);

      const response = await request(app)
        .get('/api/tables?disponible=available')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available'
      });

      expect(Table.findAll).toHaveBeenCalledWith({
        where: { status: 'available' }
      });
    });

    test('should filter tables by capacity range', async () => {
      const mockTables = [
        {
          id: 1,
          number: 1,
          capacity: 6,
          status: 'available',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      Table.findAll.mockResolvedValue(mockTables);

      const response = await request(app)
        .get('/api/tables?minCapacity=4&maxCapacity=8')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);

      expect(Table.findAll).toHaveBeenCalledWith({
        where: {
          capacity: { '$gte': 4, '$lte': 8 }
        }
      });
    });

    test('should return 400 for invalid number filter', async () => {
      const response = await request(app)
        .get('/api/tables?number=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Número inválido');
    });

    test('should return 400 for invalid minCapacity filter', async () => {
      const response = await request(app)
        .get('/api/tables?minCapacity=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('minCapacity inválido');
    });

    test('should return 400 for invalid maxCapacity filter', async () => {
      const response = await request(app)
        .get('/api/tables?maxCapacity=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('maxCapacity inválido');
    });

    test('should handle empty results', async () => {
      Table.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/tables')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/tables/:id', () => {
    test('should return table by id successfully', async () => {
      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available',
        created_at: new Date(),
        updated_at: new Date()
      };

      Table.findByPk.mockResolvedValue(mockTable);

      const response = await request(app)
        .get('/api/tables/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available'
      });

      expect(Table.findByPk).toHaveBeenCalledWith('1');
    });

    test('should return 404 when table not found', async () => {
      Table.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tables/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Mesa no encontrada');

      expect(Table.findByPk).toHaveBeenCalledWith('999');
    });
  });

  describe('POST /api/tables', () => {
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

      Table.findOne.mockResolvedValue(null);
      Table.create.mockResolvedValue(mockCreatedTable);

      const response = await request(app)
        .post('/api/tables')
        .send(tableData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Mesa creada');
      expect(response.body.data).toMatchObject({
        id: 3,
        number: 3,
        capacity: 6,
        status: 'available'
      });

      expect(Table.findOne).toHaveBeenCalledWith({ where: { number: 3 } });
      expect(Table.create).toHaveBeenCalledWith({
        number: 3,
        capacity: 6,
        status: 'available'
      });
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

      Table.findOne.mockResolvedValue(null);
      Table.create.mockResolvedValue(mockCreatedTable);

      const response = await request(app)
        .post('/api/tables')
        .send(tableData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 4,
        number: 4,
        capacity: 8,
        status: 'available'
      });

      expect(Table.create).toHaveBeenCalledWith({
        number: 4,
        capacity: 8,
        status: 'available'
      });
    });

    test('should return 400 for missing required fields', async () => {
      const incompleteData = {
        number: 5
      };

      const response = await request(app)
        .post('/api/tables')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('number y capacity son requeridos');
    });

    test('should return 400 for invalid number', async () => {
      const invalidData = {
        number: 'invalid',
        capacity: 4
      };

      const response = await request(app)
        .post('/api/tables')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('number debe ser entero positivo');
    });

    test('should return 400 for zero number', async () => {
      const invalidData = {
        number: 0,
        capacity: 4
      };

      const response = await request(app)
        .post('/api/tables')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('number debe ser entero positivo');
    });

    test('should return 400 for negative number', async () => {
      const invalidData = {
        number: -1,
        capacity: 4
      };

      const response = await request(app)
        .post('/api/tables')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('number debe ser entero positivo');
    });

    test('should return 400 for invalid capacity', async () => {
      const invalidData = {
        number: 5,
        capacity: 'invalid'
      };

      const response = await request(app)
        .post('/api/tables')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('capacity debe ser entero positivo');
    });

    test('should return 400 for zero capacity', async () => {
      const invalidData = {
        number: 5,
        capacity: 0
      };

      const response = await request(app)
        .post('/api/tables')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('capacity debe ser entero positivo');
    });

    test('should return 400 for negative capacity', async () => {
      const invalidData = {
        number: 5,
        capacity: -2
      };

      const response = await request(app)
        .post('/api/tables')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('capacity debe ser entero positivo');
    });

    test('should return 400 for invalid status', async () => {
      const invalidData = {
        number: 5,
        capacity: 4,
        status: 'invalid'
      };

      const response = await request(app)
        .post('/api/tables')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('status inválido. Valores permitidos: available, occupied, reserved');
    });

    test('should return 409 for duplicate table number', async () => {
      const existingTable = { id: 1, number: 5, capacity: 4 };

      const duplicateData = {
        number: 5,
        capacity: 6
      };

      Table.findOne.mockResolvedValue(existingTable);

      const response = await request(app)
        .post('/api/tables')
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Ya existe una mesa con ese número');

      expect(Table.findOne).toHaveBeenCalledWith({ where: { number: 5 } });
      expect(Table.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/tables/:id', () => {
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

      Table.findByPk.mockResolvedValue(mockTable);
      Table.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/tables/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Mesa actualizada');
      expect(response.body.data.number).toBe(10);
      expect(response.body.data.capacity).toBe(8);
      expect(response.body.data.status).toBe('occupied');

      expect(Table.findByPk).toHaveBeenCalledWith('1');
      expect(Table.findOne).toHaveBeenCalledWith({ where: { number: 10 } });
      expect(mockTable.save).toHaveBeenCalled();
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

      Table.findByPk.mockResolvedValue(mockTable);

      const response = await request(app)
        .put('/api/tables/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('reserved');

      expect(mockTable.save).toHaveBeenCalled();
    });

    test('should return 404 when table not found', async () => {
      Table.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/tables/999')
        .send({ status: 'occupied' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Mesa no encontrada');
    });

    test('should return 400 for invalid number', async () => {
      const invalidData = {
        number: 'invalid'
      };

      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available'
      };

      Table.findByPk.mockResolvedValue(mockTable);

      const response = await request(app)
        .put('/api/tables/1')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('number debe ser entero positivo');
    });

    test('should return 400 for invalid capacity', async () => {
      const invalidData = {
        capacity: -1
      };

      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available'
      };

      Table.findByPk.mockResolvedValue(mockTable);

      const response = await request(app)
        .put('/api/tables/1')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('capacity debe ser entero positivo');
    });

    test('should return 400 for invalid status', async () => {
      const invalidData = {
        status: 'invalid'
      };

      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available'
      };

      Table.findByPk.mockResolvedValue(mockTable);

      const response = await request(app)
        .put('/api/tables/1')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('status inválido. Valores permitidos: available, occupied, reserved');
    });

    test('should return 409 for duplicate table number', async () => {
      const existingTable = { id: 2, number: 10 };

      const updateData = {
        number: 10
      };

      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available'
      };

      Table.findByPk.mockResolvedValue(mockTable);
      Table.findOne.mockResolvedValue(existingTable);

      const response = await request(app)
        .put('/api/tables/1')
        .send(updateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Ya existe otra mesa con ese número');
    });

    test('should allow updating to same number for same table', async () => {
      const updateData = {
        number: 1
      };

      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available',
        save: jest.fn().mockResolvedValue()
      };

      Table.findByPk.mockResolvedValue(mockTable);
      Table.findOne.mockResolvedValue(mockTable); // Same table

      const response = await request(app)
        .put('/api/tables/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockTable.save).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/tables/:id', () => {
    test('should delete table successfully', async () => {
      const mockTable = {
        id: 1,
        number: 1,
        capacity: 4,
        status: 'available',
        destroy: jest.fn().mockResolvedValue()
      };

      Table.findByPk.mockResolvedValue(mockTable);

      const response = await request(app)
        .delete('/api/tables/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Mesa eliminada');

      expect(Table.findByPk).toHaveBeenCalledWith('1');
      expect(mockTable.destroy).toHaveBeenCalled();
    });

    test('should return 404 when table not found', async () => {
      Table.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/tables/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Mesa no encontrada');
    });
  });
});
