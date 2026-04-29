const requireApiKeyIfConfigured = (req, res, next) => {
  const configuredKey = process.env.API_ACCESS_KEY;

  // Keep local development simple: if no key is configured, skip validation.
  if (!configuredKey) {
    return next();
  }

  const incomingKey = req.headers['x-api-key'];
  if (!incomingKey || incomingKey !== configuredKey) {
    return res.status(401).json({ success: false, message: 'Invalid API key' });
  }

  return next();
};

module.exports = requireApiKeyIfConfigured;