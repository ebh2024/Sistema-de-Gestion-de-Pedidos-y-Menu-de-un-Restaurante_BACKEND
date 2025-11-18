const jwt = require('jsonwebtoken');
const auth = require('../../src/middlewares/auth');

// Mock the User model
jest.mock('../../src/models/User', () => ({
  findByPk: jest.fn()
}));

const User = require('../../src/models/User');

// Mock environment variables
process.env.JWT_SECRET = 'test_jwt_secret_key';

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      header: jest.fn()
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Valid token scenarios', () => {
    test('should call next() for valid token with active user', async () => {
      const userData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        is_active: true
      };

      const token = jwt.sign({ id: userData.id }, process.env.JWT_SECRET);
      mockReq.header.mockReturnValue(`Bearer ${token}`);

      User.findByPk.mockResolvedValue(userData);

      await auth(mockReq, mockRes, mockNext);

      expect(mockReq.header).toHaveBeenCalledWith('Authorization');
      expect(User.findByPk).toHaveBeenCalledWith(userData.id);
      expect(mockReq.user).toEqual({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should handle token without Bearer prefix', async () => {
      const userData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        is_active: true
      };

      const token = jwt.sign({ id: userData.id }, process.env.JWT_SECRET);
      mockReq.header.mockReturnValue(token); // No Bearer prefix

      User.findByPk.mockResolvedValue(userData);

      await auth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });
  });

  describe('Invalid token scenarios', () => {
    test('should return 401 for missing Authorization header', async () => {
      mockReq.header.mockReturnValue(undefined);

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acceso denegado. No se proporcionó token de autenticación.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for null Authorization header', async () => {
      mockReq.header.mockReturnValue(null);

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acceso denegado. No se proporcionó token de autenticación.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for empty Authorization header', async () => {
      mockReq.header.mockReturnValue('');

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acceso denegado. No se proporcionó token de autenticación.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for Bearer without token', async () => {
      mockReq.header.mockReturnValue('Bearer ');

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acceso denegado. No se proporcionó token de autenticación.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for invalid JWT token', async () => {
      mockReq.header.mockReturnValue('Bearer invalid.jwt.token');

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token inválido.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for expired JWT token', async () => {
      const expiredToken = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '-1h' });
      mockReq.header.mockReturnValue(`Bearer ${expiredToken}`);

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token expirado. Por favor, inicie sesión nuevamente.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for token signed with different secret', async () => {
      const wrongToken = jwt.sign({ id: 1 }, 'different_secret');
      mockReq.header.mockReturnValue(`Bearer ${wrongToken}`);

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token inválido.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('User validation scenarios', () => {
    test('should return 401 for non-existent user', async () => {
      const token = jwt.sign({ id: 999 }, process.env.JWT_SECRET);
      mockReq.header.mockReturnValue(`Bearer ${token}`);

      User.findByPk.mockResolvedValue(null);

      await auth(mockReq, mockRes, mockNext);

      expect(User.findByPk).toHaveBeenCalledWith(999);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token inválido. Usuario no encontrado.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for inactive user', async () => {
      const userData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        is_active: false
      };

      const token = jwt.sign({ id: userData.id }, process.env.JWT_SECRET);
      mockReq.header.mockReturnValue(`Bearer ${token}`);

      User.findByPk.mockResolvedValue(userData);

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Usuario inactivo. Contacte al administrador.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    test('should return 500 for database errors', async () => {
      const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
      mockReq.header.mockReturnValue(`Bearer ${token}`);

      User.findByPk.mockRejectedValue(new Error('Database connection failed'));

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error en la autenticación.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
