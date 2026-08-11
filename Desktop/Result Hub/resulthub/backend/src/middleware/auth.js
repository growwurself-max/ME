const { admin } = require('../config/firebase');
const { unauthorized, forbidden } = require('../utils/errors');

// Attaches req.user = { id, role, collegeId? } from the Bearer token.
async function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(unauthorized('Missing access token'));
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    // Custom claims set via setCustomUserClaims are embedded directly in the ID token
    const role = decoded.role;
    const collegeId = decoded.collegeId || null;

    req.user = {
      id: decoded.uid,
      role,
      collegeId,
      authProvider: 'firebase',
    };
    return next();
  } catch (error) {
    return next(unauthorized('Invalid or expired Firebase ID token'));
  }
}

const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(forbidden('Insufficient role'));

// Multi-tenancy: every college-scoped query must use this id, never a body value.
function collegeId(req) {
  if (req.user.role !== 'college_admin' || !req.user.collegeId) {
    throw forbidden('College context required');
  }
  return req.user.collegeId;
}

module.exports = { authenticate, requireRole, collegeId };
