const { collegeId } = require('../middleware/auth');
const { purgeCollege, collegeUsage } = require('../services/storageService');

async function usage(req, res) {
  const cid = collegeId(req);
  res.json({ usage: await collegeUsage(cid) });
}

// Remove every piece of data this college owns (courses, sections, students,
// marks, results, exams, faculty uploads, subscriptions). The college account
// itself and its login stay untouched.
async function clearAll(req, res) {
  const cid = collegeId(req);
  const removed = await purgeCollege(cid);
  res.json({ ok: true, removed });
}

module.exports = { usage, clearAll };