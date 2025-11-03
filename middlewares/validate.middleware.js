const Joi = require('joi');

/**
 * Validation middleware factory
 * Use like: validate(schema). For common endpoints we export helper functions.
 */
const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map((d) => d.message);
    return res.status(400).json({ error: 'ValidationError', details });
  }
  req.validatedBody = value;
  next();
};

const generateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  gstNumber: Joi.string().allow('', null).max(32),
  businessName: Joi.string().min(1).max(200).required(),
  businessAddress: Joi.string().min(1).max(400).required(),
  certificateTitle: Joi.string().default('Certificate of Achievement'),
  date: Joi.string().default(new Date().toLocaleDateString()),
  // optional file naming or flags
  uploadToSupabase: Joi.boolean().default(false)
});

module.exports = {
  generateCertificate: validateBody(generateSchema)
};
