const { ZodError } = require('zod');

function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Route not found' });
}

function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Internal server error', details: err.details });
}

module.exports = { notFoundHandler, errorHandler };
