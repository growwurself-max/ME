class AppError extends Error {
  constructor(status, message, details, code) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
  }
}
const badRequest = (m, d) => new AppError(400, m, d);
const unauthorized = (m = 'Unauthorized') => new AppError(401, m);
const forbidden = (m = 'Forbidden') => new AppError(403, m);
const notFound = (m = 'Not found') => new AppError(404, m);
module.exports = { AppError, badRequest, unauthorized, forbidden, notFound };
