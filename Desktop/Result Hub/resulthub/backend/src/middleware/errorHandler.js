const { ZodError } = require('zod');

function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Route not found' });
}

// Multer rejects oversized/invalid file uploads with a MulterError. Translate
// them into clear client errors instead of a generic 500 so the upload UI can
// explain what went wrong.
function isMulterError(err) {
  return Boolean(err) && err.name === 'MulterError';
}

function errorHandler(err, _req, res, _next) {
  if (isMulterError(err)) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum allowed size is 10 MB.' });
    }
    return res.status(400).json({ error: err.message || 'Upload failed' });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: err.message || 'Internal server error',
    details: err.details,
    code: err.code,
  });
}

module.exports = { notFoundHandler, errorHandler };
