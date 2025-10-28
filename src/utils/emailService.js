const sgMail = require('@sendgrid/mail');

// Configurar API key de SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Envía un email usando SendGrid
 * @param {string} to - Email del destinatario
 * @param {string} subject - Asunto del email
 * @param {string} html - Contenido HTML del email
 */
const sendEmail = async (to, subject, html) => {
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html,
    };

    await sgMail.send(msg);
    console.log('Email enviado correctamente a:', to);
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw error;
  }
};

/**
 * Genera el contenido HTML del email de recuperación de contraseña
 * @param {string} resetToken - Token de recuperación
 * @returns {string} Contenido HTML del email
 */
const generatePasswordResetEmail = (resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Recuperar Contraseña</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">🍽️ Sistema de Gestión de Restaurante</h2>
          <h3 style="color: #34495e;">Recuperación de Contraseña</h3>
          
          <p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente botón para restablecer tu contraseña:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #3498db; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Recuperar Contraseña
            </a>
          </div>
          
          <p>O copia y pega el siguiente enlace en tu navegador:</p>
          <p style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${resetUrl}
          </p>
          
          <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px;">
            <strong>Nota:</strong> Este enlace expirará en 1 hora por seguridad.
          </p>
          
          <p style="color: #7f8c8d; font-size: 14px;">
            Si no solicitaste este cambio, ignora este email.
          </p>
        </div>
      </body>
    </html>
  `;
};

module.exports = {
  sendEmail,
  generatePasswordResetEmail
};

