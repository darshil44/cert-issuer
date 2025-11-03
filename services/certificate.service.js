const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const puppeteer = require('puppeteer');
const { supabase } = require('../config/supabase');
const mailer = require('../utils/mailer');
const logger = require('../utils/logger');

/**
 * Main service:
 * - render EJS template to HTML
 * - use puppeteer to create PDF and JPG (PNG) files
 * - optionally upload to supabase
 * - send email with attachments
 */

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'certificate.ejs');

async function renderHtml(data) {
  // EJS will be rendered by puppeteer page via data URL or file path - simpler to render here by requiring ejs
  const ejs = require('ejs');
  const template = await fs.readFile(TEMPLATE_PATH, 'utf-8');
  return ejs.render(template, data);
}

async function htmlToPdfAndImage(html, filenameBase) {
  logger.info('Launching puppeteer...');
  const browser = await puppeteer.launch({
    headless: process.env.PUPPETEER_HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 2480, height: 1754 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Set certificate size — landscape A4 for PDF; for image use high DPI
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      landscape: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
    });

    // For image, set viewport to similar aspect ratio and screenshot
     // 300 DPI approx for A4 landscape
    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 90, fullPage: true });

    return { pdfBuffer, imageBuffer: screenshotBuffer };
  } finally {
    await browser.close();
  }
}

async function saveToLocalTemp(buffer, ext, baseName) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cert-'));
  const filePath = path.join(tmpDir, `${baseName}.${ext}`);
  await fs.writeFile(filePath, buffer);
  return { filePath, tmpDir };
}

async function uploadToSupabaseIfConfigured(buffer, filename, mimeType) {
  if (!supabase) return null;
  const bucket = process.env.SUPABASE_BUCKET || 'certificates';
  const folder = `${new Date().toISOString().split('T')[0]}`;
  const key = `${folder}/${filename}`;
  const { data, error } = await supabase.storage.from(bucket).upload(key, buffer, {
    contentType: mimeType,
    upsert: true
  });
  if (error) {
    logger.error('Supabase upload failed', error);
    return null;
  }
  // Make public link
  const { publicURL, error: urlErr } = supabase.storage.from(bucket).getPublicUrl(key);
  if (urlErr) {
    logger.error('Supabase getPublicUrl error', urlErr);
    return null;
  }
  return publicURL;
}

async function generateAndSend(payload) {
  // Normalize and fill defaults
  const baseNameSafe = `${payload.name.replace(/\s+/g, '_')}_${Date.now()}`;
  const dataForTemplate = {
    name: payload.name,
    gstNumber: payload.gstNumber || '',
    businessName: payload.businessName,
    businessAddress: payload.businessAddress,
    certificateTitle: payload.certificateTitle || 'Certificate of Achievement',
    date: payload.date || new Date().toLocaleDateString(),
    issuerName: process.env.SMTP_FROM_NAME || 'Your Company',
    baseUrl: process.env.BASE_URL || ''
  };

  const html = await renderHtml(dataForTemplate);
  const { pdfBuffer, imageBuffer } = await htmlToPdfAndImage(html, baseNameSafe);

  // Save to temp files
  const { filePath: pdfPath, tmpDir: tmp1 } = await saveToLocalTemp(pdfBuffer, 'pdf', baseNameSafe);
  const { filePath: imagePath, tmpDir: tmp2 } = await saveToLocalTemp(imageBuffer, 'jpg', baseNameSafe);

  // Optionally upload to supabase
  let pdfUrl = null;
  let imageUrl = null;
  if (payload.uploadToSupabase && supabase) {
    pdfUrl = await uploadToSupabaseIfConfigured(pdfBuffer, `${baseNameSafe}.pdf`, 'application/pdf');
    imageUrl = await uploadToSupabaseIfConfigured(imageBuffer, `${baseNameSafe}.jpg`, 'image/jpeg');
  }

  // Send email with attachments
  const mailOptions = {
    to: payload.email,
    subject: `${dataForTemplate.certificateTitle} - ${dataForTemplate.name}`,
    text: `Hi ${dataForTemplate.name},\n\nPlease find attached your certificate.\n\nRegards,\n${dataForTemplate.issuerName}`,
    html: `<p>Hi ${dataForTemplate.name},</p><p>Please find attached your certificate.</p><p>Regards,<br/>${dataForTemplate.issuerName}</p>`,
    attachments: [
      { filename: `${baseNameSafe}.pdf`, path: pdfPath, contentType: 'application/pdf' },
      { filename: `${baseNameSafe}.jpg`, path: imagePath, contentType: 'image/jpeg' }
    ]
  };

  const mailResult = await mailer.sendMail(mailOptions);

  // Clean up temp directories (best-effort)
  try {
    await fs.rm(tmp1, { recursive: true, force: true });
    await fs.rm(tmp2, { recursive: true, force: true });
  } catch (e) {
    logger.warn('Temp cleanup failed', e);
  }

  // Build response metadata
  const meta = {
    emailSent: mailResult.accepted ? true : true,
    messageId: mailResult.messageId || null,
    pdfUrl,
    imageUrl,
    filenameBase: baseNameSafe,
    createdAt: new Date().toISOString()
  };

  // Optionally persist metadata to a DB here (not implemented)
  return meta;
}

async function getMeta(id) {
  // placeholder: in production, fetch from DB by id
  return null;
}

module.exports = { generateAndSend, getMeta };
