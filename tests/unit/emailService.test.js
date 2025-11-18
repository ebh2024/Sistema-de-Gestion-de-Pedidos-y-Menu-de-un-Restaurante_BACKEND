const sgMail = require('@sendgrid/mail');
const { sendEmail, generatePasswordResetEmail } = require('../../src/utils/emailService');

// Mock SendGrid
jest.mock('@sendgrid/mail');

describe('Email Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variables for tests
    process.env.SENDGRID_API_KEY = 'test_api_key';
    process.env.SENDGRID_FROM_EMAIL = 'noreply@test.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  describe('sendEmail', () => {
    test('should send email successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue(undefined);
      sgMail.send = mockSend;
      sgMail.setApiKey = jest.fn();

      const to = 'user@example.com';
      const subject = 'Test Subject';
      const html = '<p>Test HTML content</p>';

      await sendEmail(to, subject, html);

      expect(mockSend).toHaveBeenCalledWith({
        to,
        from: 'noreply@test.com',
        subject,
        html
      });
    });

    test('should throw error when SendGrid fails', async () => {
      const mockError = new Error('SendGrid API error');
      sgMail.send = jest.fn().mockRejectedValue(mockError);

      const to = 'user@example.com';
      const subject = 'Test Subject';
      const html = '<p>Test HTML content</p>';

      await expect(sendEmail(to, subject, html)).rejects.toThrow('SendGrid API error');
    });
  });

  describe('generatePasswordResetEmail', () => {
    test('should generate correct HTML email content', () => {
      const resetToken = 'test-reset-token-123';
      const expectedUrl = 'http://localhost:3000/reset-password?token=test-reset-token-123';

      const html = generatePasswordResetEmail(resetToken);

      // Check that HTML contains expected elements
      expect(html).toContain('🍽️ Sistema de Gestión de Restaurante');
      expect(html).toContain('Recuperación de Contraseña');
      expect(html).toContain(expectedUrl);
      expect(html).toContain('Recuperar Contraseña');
      expect(html).toContain('Este enlace expirará en 1 hora por seguridad');
      expect(html).toContain('Si no solicitaste este cambio, ignora este email');

      // Check HTML structure
      expect(html).toContain('<html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body');
      expect(html).toContain('text-align: center');
      expect(html).toContain('background-color: #3498db');
      expect(html).toContain('color: white');
    });

    test('should include reset URL in both button and text link', () => {
      const resetToken = 'unique-token-456';
      const expectedUrl = 'http://localhost:3000/reset-password?token=unique-token-456';

      const html = generatePasswordResetEmail(resetToken);

      // Should appear in button href
      expect(html).toContain(`href="${expectedUrl}"`);
      // Should appear as plain text
      expect(html).toContain(expectedUrl);
    });

    test('should use correct frontend URL from environment', () => {
      process.env.FRONTEND_URL = 'https://myapp.com';
      const resetToken = 'test-token';
      const expectedUrl = 'https://myapp.com/reset-password?token=test-token';

      const html = generatePasswordResetEmail(resetToken);

      expect(html).toContain(expectedUrl);
    });
  });
});
