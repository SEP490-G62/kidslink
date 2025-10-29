const nodemailer = require('nodemailer');

// Create reusable transporter using SMTP
function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const secure = String(process.env.EMAIL_SECURE || 'false') === 'true';

  if (!host || !user || !pass) {
    throw new Error('SMTP cấu hình chưa đầy đủ (EMAIL_HOST, EMAIL_USER, EMAIL_PASS)');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || process.env.EMAIL_USER;
  const transporter = createTransporter();
  await transporter.sendMail({ from, to, subject, html, text });
}

module.exports = { sendMail };


