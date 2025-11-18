// Mock the database models and operations
jest.mock('../../src/models', () => ({
  User: {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const express = require('express');
const { User } = require('../../src/models');
const authRoutes = require('../../src/routes/authRoutes');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Mock environment variables
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

describe('Authentication Routes Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        role: 'user' // frontend role
      };

      // Mock database responses
      User.findOne.mockResolvedValue(null); // No existing user
      User.create.mockResolvedValue({
        id: 1,
        name: 'johndoe',
        email: 'john@example.com',
        role: 'waiter',
        is_active: true
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      expect(response.body.user.role).toBe('user'); // frontend role
      expect(response.body.token).toBeDefined();

      // Verify database calls
      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          [require('sequelize').Op.or]: [
            { email: userData.email },
            { name: userData.username }
          ]
        }
      });
      expect(User.create).toHaveBeenCalledWith({
        name: userData.username,
        email: userData.email,
        password: expect.any(String), // Should be hashed
        role: 'waiter' // backend role mapping
      });
    });

    test('should return 400 for missing required fields', async () => {
      const incompleteData = {
        firstName: 'John',
        // missing lastName, email, username, password
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Todos los campos son requeridos');
    });

    test('should return 409 for duplicate email', async () => {
      // Mock existing user
      User.findOne.mockResolvedValue({
        id: 1,
        name: 'existinguser',
        email: 'john@example.com'
      });

      const duplicateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john@example.com', // duplicate email
        username: 'janesmith',
        password: 'password456',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ya está registrado');
    });

    test('should return 409 for duplicate username', async () => {
      // Mock existing user
      User.findOne.mockResolvedValue({
        id: 1,
        name: 'johndoe',
        email: 'john@example.com'
      });

      const duplicateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        username: 'johndoe', // duplicate username
        password: 'password456',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ya está registrado');
    });

    test('should map frontend roles to backend roles correctly', async () => {
      const testCases = [
        { frontend: 'user', backend: 'waiter' },
        { frontend: 'moderator', backend: 'cook' },
        { frontend: 'admin', backend: 'admin' },
        { frontend: 'invalid', backend: 'waiter' } // default to waiter
      ];

      for (const { frontend, backend } of testCases) {
        User.findOne.mockResolvedValue(null); // No existing user
        User.create.mockResolvedValue({
          id: 1,
          name: `testuser${frontend}`,
          email: `test${frontend}@example.com`,
          role: backend,
          is_active: true
        });

        const userData = {
          firstName: 'Test',
          lastName: 'User',
          email: `test${frontend}@example.com`,
          username: `testuser${frontend}`,
          password: 'password123',
          role: frontend
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(User.create).toHaveBeenCalledWith({
          name: userData.username,
          email: userData.email,
          password: expect.any(String),
          role: backend
        });
      }
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with correct credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      // Mock user lookup
      const mockUser = {
        id: 1,
        name: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'waiter',
        is_active: true
      };
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.role).toBe('user'); // frontend role
      expect(response.body.token).toBeDefined();

      // Verify token is valid
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role); // backend role
    });

    test('should return 400 for missing credentials', async () => {
      const incompleteData = {
        username: 'testuser'
        // missing password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Nombre de usuario y contraseña son requeridos');
    });

    test('should return 401 for non-existent user', async () => {
      User.findOne.mockResolvedValue(null); // User not found

      const loginData = {
        username: 'nonexistent',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Credenciales inválidas');
    });

    test('should return 401 for wrong password', async () => {
      const mockUser = {
        id: 1,
        name: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 10), // Different password
        role: 'waiter',
        is_active: true
      };
      User.findOne.mockResolvedValue(mockUser);

      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Credenciales inválidas');
    });

    test('should return 403 for inactive user', async () => {
      const mockUser = {
        id: 1,
        name: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'waiter',
        is_active: false // Inactive user
      };
      User.findOne.mockResolvedValue(mockUser);

      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Usuario inactivo');
    });

    test('should map backend roles to frontend roles correctly', async () => {
      const roleMappings = [
        { backend: 'waiter', frontend: 'user' },
        { backend: 'cook', frontend: 'moderator' },
        { backend: 'admin', frontend: 'admin' }
      ];

      for (const { backend, frontend } of roleMappings) {
        const mockUser = {
          id: 1,
          name: 'testuser',
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
          role: backend,
          is_active: true
        };
        User.findOne.mockResolvedValue(mockUser);

        const loginData = {
          username: 'testuser',
          password: 'password123'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body.user.role).toBe(frontend);
      }
    });
  });
});
