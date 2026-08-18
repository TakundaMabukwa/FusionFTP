const config = require('../config/env');
const logger = require('../utils/logger');

function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    logger.warn('Missing API key', { path: req.path });
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing API key',
      },
    });
  }

  if (apiKey !== config.api.key) {
    logger.warn('Invalid API key attempt', { path: req.path });
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid API key',
      },
    });
  }

  next();
}

module.exports = apiKeyAuth;
