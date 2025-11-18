// Mock the database models and operations
jest.mock('../../src/models', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

// Mock auth middleware
jest.mock('../../src/middlewares/auth', () => {
  return jest.fn((req, res, next) => {
    // Mock successful authentication
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error en la autenticación'
      });
    }
  });
});

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../../src/models');
const userRoutes = require('../../src/routes/userRoutes');

// Create test app
const app = express();
app.use(express.json());

app.use('/api/users', userRoutes);

// Add error handling middleware to match the real app (must be after routes)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
});

// Mock environment variables
process.env.JWT_SECRET = 'test_jwt_secret_key';

describe('User Routes Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/users/profile', () => {
    test('should return user profile when authenticated', async () => {
      const mockUser = {
        id: 1,
        name: 'testuser',
        email: 'test@example.com',
        role: 'waiter',
        is_active: true,
        created_at: new Date('2025-01-01T00:00:00Z'),
        updated_at: new Date('2025-01-01T00:00:00Z')
      };

      User.findByPk.mockResolvedValue(mockUser);

      // Create a valid JWT token
      const token = jwt.sign(
        { id: 1, email: 'test@example.com', role: 'waiter' },
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockUser.id);
      expect(response.body.data.name).toBe(mockUser.name);
      expect(response.body.data.email).toBe(mockUser.email);
      expect(response.body.data.role).toBe(mockUser.role);
      expect(response.body.data.is_active).toBe(mockUser.is_active);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password'] }
      });
    });

    test('should return 401 when no token provided', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token no proporcionado');

      expect(User.findByPk).not.toHaveBeenCalled();
    });

    test('should return 401 when invalid token provided', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token inválido');

      expect(User.findByPk).not.toHaveBeenCalled();
    });

    test('should return 401 when expired token provided', async () => {
      // Create an expired token (issued 2 hours ago)
      const expiredToken = jwt.sign(
        { id: 1, email: 'test@example.com', role: 'waiter', iat: Math.floor(Date.now() / 1000) - 7200 },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token expirado');

      expect(User.findByPk).not.toHaveBeenCalled();
    });

    test('should return 404 when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      // Create a valid JWT token
      const token = jwt.sign(
        { id: 999, email: 'nonexistent@example.com', role: 'waiter' },
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Usuario no encontrado');

      expect(User.findByPk).toHaveBeenCalledWith(999, {
        attributes: { exclude: ['password'] }
      });
    });

    test('should exclude password from response data', async () => {
      const mockUserWithoutPassword = {
        id: 1,
        name: 'testuser',
        email: 'test@example.com',
        role: 'waiter',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
        // password is excluded by the query attributes
      };

      User.findByPk.mockResolvedValue(mockUserWithoutPassword);

      // Create a valid JWT token
      const token = jwt.sign(
        { id: 1, email: 'test@example.com', role: 'waiter' },
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data.name).toBe('testuser');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.role).toBe('waiter');
    });

    test('should handle database errors gracefully', async () => {
      User.findByPk.mockRejectedValue(new Error('Database connection failed'));

      // Create a valid JWT token
      const token = jwt.sign(
        { id: 1, email: 'test@example.com', role: 'waiter' },
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Database connection failed');

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password'] }
      });
    });

    test('should work with different user roles', async () => {
      const roles = ['waiter', 'cook', 'admin'];

      for (const role of roles) {
        const mockUser = {
          id: 1,
          name: 'testuser',
          email: 'test@example.com',
          role: role,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };

        User.findByPk.mockResolvedValue(mockUser);

        // Create a valid JWT token with the specific role
        const token = jwt.sign(
          { id: 1, email: 'test@example.com', role: role },
          process.env.JWT_SECRET
        );

        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.role).toBe(role);
      }
    });
  });
});
