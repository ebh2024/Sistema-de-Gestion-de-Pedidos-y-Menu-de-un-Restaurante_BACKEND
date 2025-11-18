const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../../src/models');
const { initiatePasswordReset, resetPassword } = require('../../src/services/authService');
const { sendEmail, generatePasswordResetEmail } = require('../../src/utils/emailService');

// Mock dependencies
jest.mock('../../src/models');
jest.mock('../../src/utils/emailService');
jest.mock('bcryptjs');
jest.mock('crypto');

describe('Auth Service - Password Recovery Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variables
    process.env.FRONTEND_URL = 'http://localhost:3000';
    // Mock Date.now
    jest.spyOn(Date, 'now').mockReturnValue(1731897600000); // 2025-01-01T12:00:00Z
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initiatePasswordReset', () => {
    test('should initiate password reset for existing user', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        update: jest.fn().mockResolvedValue(undefined)
      };

      User.findOne.mockResolvedValue(mockUser);
      sendEmail.mockResolvedValue(undefined);
      generatePasswordResetEmail.mockReturnValue('<html>Reset email</html>');
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue('mock-reset-token')
      });

      await initiatePasswordReset('user@example.com');

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'user@example.com' }
      });

      expect(crypto.randomBytes).toHaveBeenCalledWith(32);

      expect(mockUser.update).toHaveBeenCalledWith({
        resetPasswordToken: 'mock-reset-token',
        resetPasswordExpires: new Date(1731897600000 + 3600000) // 1 hour later
      });

      expect(generatePasswordResetEmail).toHaveBeenCalledWith('mock-reset-token');
      expect(sendEmail).toHaveBeenCalledWith(
        'user@example.com',
        'Recuperación de Contraseña - Sistema de Restaurante',
        '<html>Reset email</html>'
      );
    });

    test('should silently return for non-existent user (security)', async () => {
      User.findOne.mockResolvedValue(null);

      await initiatePasswordReset('nonexistent@example.com');

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' }
      });

      // Should not call sendEmail, or generatePasswordResetEmail
      // (no user instance exists to call update on)
      expect(sendEmail).not.toHaveBeenCalled();
      expect(generatePasswordResetEmail).not.toHaveBeenCalled();
    });

    test('should continue even if email sending fails (for security)', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        update: jest.fn().mockResolvedValue(undefined)
      };

      User.findOne.mockResolvedValue(mockUser);
      sendEmail.mockRejectedValue(new Error('Email service error'));
      generatePasswordResetEmail.mockReturnValue('<html>Reset email</html>');
      crypto.randomBytes.mockReturnValue({
        toString: jest.fn().mockReturnValue('mock-reset-token')
      });

      // Should not throw error
      await expect(initiatePasswordReset('user@example.com')).resolves.not.toThrow();

      // Should still update user token
      expect(mockUser.update).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    test('should reset password successfully with valid token', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        update: jest.fn().mockResolvedValue(undefined)
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.genSalt.mockResolvedValue('mock-salt');
      bcrypt.hash.mockResolvedValue('hashed-new-password');

      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now

      await resetPassword({
        token: 'valid-reset-token',
        password: 'newpassword123'
      });

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          resetPasswordToken: 'valid-reset-token',
          resetPasswordExpires: {
            [Op.gt]: expect.any(Date)
          }
        }
      });

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 'mock-salt');

      expect(mockUser.update).toHaveBeenCalledWith({
        password: 'hashed-new-password',
        resetPasswordToken: null,
        resetPasswordExpires: null
      });
    });

    test('should throw error for invalid or expired token', async () => {
      User.findOne.mockResolvedValue(null); // No user found with token

      await expect(resetPassword({
        token: 'invalid-token',
        password: 'newpassword123'
      })).rejects.toThrow('Token inválido o expirado');

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          resetPasswordToken: 'invalid-token',
          resetPasswordExpires: {
            [Op.gt]: expect.any(Date)
          }
        }
      });

      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test('should hash the new password correctly', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        update: jest.fn().mockResolvedValue(undefined)
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.genSalt.mockResolvedValue('test-salt');
      bcrypt.hash.mockResolvedValue('hashed-password');

      await resetPassword({
        token: 'valid-token',
        password: 'mypassword123'
      });

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('mypassword123', 'test-salt');

      expect(mockUser.update).toHaveBeenCalledWith({
        password: 'hashed-password',
        resetPasswordToken: null,
        resetPasswordExpires: null
      });
    });

    test('should clear reset token fields after successful reset', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        update: jest.fn().mockResolvedValue(undefined)
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed-pass');

      await resetPassword({
        token: 'valid-token',
        password: 'password123'
      });

      expect(mockUser.update).toHaveBeenCalledWith({
        password: 'hashed-pass',
        resetPasswordToken: null,
        resetPasswordExpires: null
      });
    });
  });
});
