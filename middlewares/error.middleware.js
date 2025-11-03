const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(err);
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || 500;
  const payload = {
    error: err.name || 'InternalServerError',
    message: err.message || 'An internal server error occurred'
  };
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
}

module.exports = { errorHandler };
