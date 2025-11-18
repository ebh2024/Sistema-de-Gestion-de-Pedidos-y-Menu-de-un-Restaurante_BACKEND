const checkRole = require('../../src/middlewares/checkRole');

describe('checkRole Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Valid authorization scenarios', () => {
    test('should call next() when user has admin role and admin is allowed', () => {
      mockReq.user = { id: 1, role: 'admin' };
      const middleware = checkRole('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should call next() when user has mesero role and mesero is allowed', () => {
      mockReq.user = { id: 1, role: 'mesero' };
      const middleware = checkRole('mesero');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should call next() when user has cocinero role and cocinero is allowed', () => {
      mockReq.user = { id: 1, role: 'cocinero' };
      const middleware = checkRole('cocinero');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should call next() when user role is in multiple allowed roles', () => {
      mockReq.user = { id: 1, role: 'admin' };
      const middleware = checkRole('admin', 'mesero', 'cocinero');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should call next() when user role matches one of multiple allowed roles', () => {
      mockReq.user = { id: 1, role: 'mesero' };
      const middleware = checkRole('admin', 'mesero');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Unauthorized access scenarios', () => {
    test('should return 401 when req.user is not set', () => {
      mockReq.user = undefined;
      const middleware = checkRole('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Usuario no autenticado. Use el middleware auth antes de checkRole.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when req.user is null', () => {
      mockReq.user = null;
      const middleware = checkRole('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Usuario no autenticado. Use el middleware auth antes de checkRole.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 when user role is not in allowed roles', () => {
      mockReq.user = { id: 1, role: 'mesero' };
      const middleware = checkRole('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acceso denegado. No tiene permisos para realizar esta acción.',
        requiredRoles: ['admin'],
        userRole: 'mesero'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 when user has cocinero role but only admin is allowed', () => {
      mockReq.user = { id: 1, role: 'cocinero' };
      const middleware = checkRole('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acceso denegado. No tiene permisos para realizar esta acción.',
        requiredRoles: ['admin'],
        userRole: 'cocinero'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 when user has admin role but only mesero is allowed', () => {
      mockReq.user = { id: 1, role: 'admin' };
      const middleware = checkRole('mesero');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acceso denegado. No tiene permisos para realizar esta acción.',
        requiredRoles: ['mesero'],
        userRole: 'admin'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 when user role does not match any of multiple allowed roles', () => {
      mockReq.user = { id: 1, role: 'cocinero' };
      const middleware = checkRole('admin', 'mesero');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acceso denegado. No tiene permisos para realizar esta acción.',
        requiredRoles: ['admin', 'mesero'],
        userRole: 'cocinero'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    test('should handle empty allowed roles array', () => {
      mockReq.user = { id: 1, role: 'admin' };
      const middleware = checkRole();

      middleware(mockReq, mockRes, mockNext);

      // With no allowed roles, no role should be authorized
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle user with undefined role', () => {
      mockReq.user = { id: 1, role: undefined };
      const middleware = checkRole('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle user with null role', () => {
      mockReq.user = { id: 1, role: null };
      const middleware = checkRole('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle user with empty string role', () => {
      mockReq.user = { id: 1, role: '' };
      const middleware = checkRole('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    test('should handle errors gracefully', () => {
      mockReq.user = { id: 1, role: 'admin' };
      const middleware = checkRole('admin');

      // The middleware doesn't throw errors, it handles them gracefully
      // This test verifies that the middleware completes without throwing
      expect(() => {
        middleware(mockReq, mockRes, mockNext);
      }).not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
