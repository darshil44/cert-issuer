const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificate.controller');
const validate = require('../middlewares/validate.middleware');

router.post(
  '/generate',
  validate.generateCertificate,
  certificateController.generateAndSendCertificate
);

/* Optional: fetch certificate metadata or static file links */
router.get('/:id', certificateController.getCertificateMeta);

module.exports = router;
