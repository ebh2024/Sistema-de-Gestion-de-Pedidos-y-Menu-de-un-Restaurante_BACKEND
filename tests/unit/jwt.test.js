const jwt = require('jsonwebtoken');
const { generateToken, verifyToken } = require('../../src/utils/jwt');

// Mock environment variables
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

describe('JWT Utilities', () => {
  describe('generateToken', () => {
    test('should generate a valid JWT token', () => {
      const payload = {
        id: 1,
        email: 'test@example.com',
        role: 'admin'
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify the token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    test('should use default expiration if JWT_EXPIRES_IN is not set', () => {
      const originalExpiresIn = process.env.JWT_EXPIRES_IN;
      delete process.env.JWT_EXPIRES_IN;

      const payload = { id: 1 };
      const token = generateToken(payload);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.exp - decoded.iat).toBe(24 * 60 * 60); // 24 hours in seconds

      // Restore
      process.env.JWT_EXPIRES_IN = originalExpiresIn;
    });

    test('should throw error if JWT_SECRET is not defined', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => {
        generateToken({ id: 1 });
      }).toThrow('JWT_SECRET no está definido en las variables de entorno');

      // Restore
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('verifyToken', () => {
    test('should verify and return decoded payload for valid token', () => {
      const payload = {
        id: 1,
        email: 'test@example.com',
        role: 'admin'
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    test('should throw error for invalid token', () => {
      const invalidToken = 'invalid.jwt.token';

      expect(() => {
        verifyToken(invalidToken);
      }).toThrow('Token inválido o expirado');
    });

    test('should throw error for expired token', () => {
      const payload = { id: 1 };
      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1h' });

      expect(() => {
        verifyToken(expiredToken);
      }).toThrow('Token inválido o expirado');
    });

    test('should throw error if JWT_SECRET is not defined', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const payload = { id: 1 };
      const token = jwt.sign(payload, 'some_secret', { expiresIn: '1h' });

      expect(() => {
        verifyToken(token);
      }).toThrow('JWT_SECRET no está definido en las variables de entorno');

      // Restore
      process.env.JWT_SECRET = originalSecret;
    });

    test('should throw error for token signed with different secret', () => {
      const payload = { id: 1 };
      const token = jwt.sign(payload, 'different_secret', { expiresIn: '1h' });

      expect(() => {
        verifyToken(token);
      }).toThrow('Token inválido o expirado');
    });
  });
});
