const { User } = require('../../src/models');
const { getUserProfile } = require('../../src/controllers/userController');

// Mock dependencies
jest.mock('../../src/models');

describe('User Controller - Unit Tests', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request object
    mockRequest = {
      user: {
        id: 1
      }
    };

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock next function
    mockNext = jest.fn();
  });

  describe('getUserProfile', () => {
    test('should return user profile successfully', async () => {
      const mockUser = {
        id: 1,
        name: 'testuser',
        email: 'test@example.com',
        role: 'waiter',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      User.findByPk.mockResolvedValue(mockUser);

      await getUserProfile(mockRequest, mockResponse, mockNext);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password'] }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });

      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 404 when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await getUserProfile(mockRequest, mockResponse, mockNext);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password'] }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado'
      });

      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next with error when database operation fails', async () => {
      const mockError = new Error('Database connection failed');
      User.findByPk.mockRejectedValue(mockError);

      await getUserProfile(mockRequest, mockResponse, mockNext);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password'] }
      });

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    test('should exclude password from returned user data', async () => {
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

      await getUserProfile(mockRequest, mockResponse, mockNext);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password'] }
      });

      const returnedData = mockResponse.json.mock.calls[0][0].data;
      expect(returnedData).not.toHaveProperty('password');
      expect(returnedData.name).toBe('testuser');
      expect(returnedData.email).toBe('test@example.com');
    });
  });
});
