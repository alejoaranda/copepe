// send-email.js - Versión final completa
const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  // 1. Verificación inicial del método
  if (event.httpMethod !== 'POST' ) {
    return { 
      statusCode: 405, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Método no permitido' })
    };
  }

  try {
    const data = JSON.parse(event.body);

    // 2. Validar que el email del cliente existe
    if (!data.email) {
      return { 
        statusCode: 400, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'El correo electrónico es requerido.' }) 
      };
    }

    // 3. Verificar variables de entorno (importante para la seguridad)
    if (!process.env.HOSTINGER_EMAIL || !process.env.HOSTINGER_PASSWORD) {
      console.error('Error: Faltan las variables de entorno del email en el servidor.');
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error de configuración del servidor.' }),
      };
    }

    // 4. Configuración del transportador de Nodemailer para Hostinger
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.HOSTINGER_EMAIL,
        pass: process.env.HOSTINGER_PASSWORD
      }
    });

    // 5. Lógica para diferenciar entre formulario de prueba y de contacto
    if (data.formType === 'trial') {
      
      // --- ACCIÓN 1: ENVIAR EMAIL AL CLIENTE CON LA PLANTILLA ELEGANTE ---
      const mailToCustomer = {
        from: `"CostePro" <${process.env.HOSTINGER_EMAIL}>`,
        to: data.email, // Se envía al correo que el usuario introdujo
        subject: '✅ Aquí tienes tu prueba gratuita de CostePro',
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
              .header { background-color: #264653; color: #ffffff; padding: 20px; text-align: center; border-radius: 12px 12px 0 0; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { padding: 30px 25px; color: #1f2937; line-height: 1.7; }
              .content p { margin: 0 0 15px; }
              .button-container { text-align: center; margin: 30px 0; }
              .button { background: linear-gradient(135deg, #2a9d8f, #264653); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #9ca3af; }
              .footer a { color: #2a9d8f; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>CostePro</h1>
              </div>
              <div class="content">
                <h2>¡Tu prueba gratuita está lista!</h2>
                <p>Hola,</p>
                <p>¡Muchas gracias por tu interés en <strong>CostePro</strong>! Estamos seguros de que nuestra herramienta te ayudará a optimizar la gestión de tu cocina.</p>
                <p>Haz clic en el botón de abajo para descargar tu versión de prueba gratuita, válida por 3 días.</p>
                <div class="button-container">
                  <a href="URL_DEL_ENLACE_DE_DESCARGA_AQUI" class="button">Descargar mi Prueba Gratis</a>
                </div>
                <p>Si tienes cualquier duda o necesitas ayuda durante el periodo de prueba, simplemente responde a este correo. ¡Estaremos encantados de ayudarte!</p>
                <p>Un saludo,<br><strong>El equipo de CostePro</strong></p>
              </div>
              <div class="footer">
                <p>&copy; 2025 CostePro. Todos los derechos reservados.</p>
                <p>Si no solicitaste esta prueba, puedes ignorar este correo.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      await transporter.sendMail(mailToCustomer);

      // --- ACCIÓN 2: ENVIARTE UNA NOTIFICACIÓN A TI (OPCIONAL) ---
      const notificationToOwner = {
        from: `"Notificación Web" <${process.env.HOSTINGER_EMAIL}>`,
        to: process.env.HOSTINGER_EMAIL, // Te lo envías a ti mismo
        subject: '🚀 Nuevo usuario ha solicitado la prueba de 3 días',
        html: `<p>El usuario con el correo <strong>${data.email}</strong> ha solicitado la prueba gratuita.</p>`
      };
      await transporter.sendMail(notificationToOwner);

    } else {
      // --- LÓGICA PARA EL FORMULARIO DE CONTACTO (SIN CAMBIOS) ---
      const mailFromContactForm = {
        from: `"Web CostePro" <${process.env.HOSTINGER_EMAIL}>`,
        to: process.env.HOSTINGER_EMAIL,
        subject: `📬 Nuevo mensaje de contacto de: ${data.name}`,
        replyTo: data.email,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Nuevo Mensaje de Contacto</h2>
            <p><strong>Nombre:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <hr>
            <p><strong>Mensaje:</strong></p>
            <p>${data.message}</p>
          </div>
        `
      };
      await transporter.sendMail(mailFromContactForm);
    }

    // 6. Cerrar la conexión y enviar respuesta de éxito
    transporter.close();
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '¡Listo! Revisa tu bandeja de entrada.' }),
    };

  } catch (error) {
    console.error('--- ERROR EN LA FUNCIÓN DE EMAIL ---', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: `Error al procesar la solicitud: ${error.message}` }),
    };
  }
};
