// send-email.js - Versión actualizada para Hostinger
const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  // 1. Verificación inicial (método y datos)
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);

    if (!data.email) {
      return { 
        statusCode: 400, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'El correo electrónico es requerido.' }) 
      };
    }

    // 2. Verificar que las variables de entorno de Hostinger existen
    if (!process.env.HOSTINGER_EMAIL || !process.env.HOSTINGER_PASSWORD) {
      console.error('Error: Las variables de entorno HOSTINGER_EMAIL o HOSTINGER_PASSWORD no están configuradas en Netlify.');
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error de configuración del servidor.' }),
      };
    }

    // 3. Configuración del transportador de Nodemailer para Hostinger
    // ESTA ES LA SECCIÓN MODIFICADA
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com', // Servidor SMTP de Hostinger
      port: 465,                  // Puerto SSL (recomendado)
      secure: true,               // Usar SSL
      auth: {
        user: process.env.HOSTINGER_EMAIL,    // Tu email de Hostinger (lo configuraremos en Netlify)
        pass: process.env.HOSTINGER_PASSWORD  // Tu contraseña de Hostinger (lo configuraremos en Netlify)
      }
    });

    // 4. Definir el contenido del email que recibirás
    let mailOptions;
    if (data.formType === 'trial') {
      // Email para la prueba de 3 días
      mailOptions = {
        from: `"Web CostePro" <${process.env.HOSTINGER_EMAIL}>`,
        to: process.env.HOSTINGER_EMAIL, // Te lo envías a ti mismo
        subject: '🚀 Nueva solicitud de prueba de 3 días',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Solicitud de Prueba</h2>
            <p>Un usuario ha solicitado la prueba de 3 días desde la web.</p>
            <p><strong>Email del solicitante:</strong> ${data.email}</p>
          </div>
        `
      };
    } else {
      // Email del formulario de contacto
      mailOptions = {
        from: `"Web CostePro" <${process.env.HOSTINGER_EMAIL}>`,
        to: process.env.HOSTINGER_EMAIL, // Te lo envías a ti mismo
        subject: `📬 Nuevo mensaje de contacto de: ${data.name}`,
        replyTo: data.email, // Para poder responder directamente al usuario
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
    }

    // 5. Enviar el email
    await transporter.sendMail(mailOptions);
    transporter.close();

    // 6. Enviar respuesta de éxito al frontend
    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: '¡Gracias! Tu mensaje ha sido enviado.' }),
    };

  } catch (error) {
    console.error('--- ERROR EN LA FUNCIÓN DE EMAIL ---');
    console.error('Error completo:', error);
    return {
      statusCode: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: `Error al enviar el email: ${error.message}` }),
    };
  }
};
