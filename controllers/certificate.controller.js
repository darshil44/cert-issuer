const certificateService = require('../services/certificate.service');
const logger = require('../utils/logger');

async function generateAndSendCertificate(req, res, next) {
  try {
    const payload = req.validatedBody;
    // service returns metadata and links
    const result = await certificateService.generateAndSend(payload);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    logger.error('Controller error', err);
    next(err);
  }
}

async function getCertificateMeta(req, res, next) {
  try {
    const id = req.params.id;
    const meta = await certificateService.getMeta(id);
    if (!meta) return res.status(404).json({ error: 'NotFound' });
    res.json({ success: true, data: meta });
  } catch (err) {
    next(err);
  }
}

module.exports = { generateAndSendCertificate, getCertificateMeta };
