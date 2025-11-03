const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Wrapper to send mail and provide structured result + error handling
 * Accepts nodemailer sendMail options object.
 */
async function sendMail(options) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
  }
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'No Reply'}" <${process.env.SMTP_FROM_EMAIL}>`,
      ...options
    });
    logger.info('Email sent', { messageId: info.messageId });
    return info;
  } catch (err) {
    logger.error('Email send failed', err);
    throw err;
  }
}

module.exports = { sendMail };
