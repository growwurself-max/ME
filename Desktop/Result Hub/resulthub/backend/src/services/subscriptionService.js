const { db, FieldValue } = require('../config/firebase');
const { AppError, notFound } = require('../utils/errors');

// Default per-plan caps. The Super Admin can override the effective limit for
// any college; the system always uses the configured limit, never a hardcoded
// value baked into the publish path.
const DEFAULT_LIMITS = { free: 10, basic: 30, premium: 50 };

// Live count of currently-published units. Used as the fallback for colleges
// that predate the lifetime counter, and to seed it on first use.
async function countLivePublished(collegeId) {
  const examsSnapshot = await db.collection('exams')
    .where('college_id', '==', collegeId)
    .where('published', '==', true)
    .select('published')
    .get();
  const publishedExams = examsSnapshot.size;

  // Course-level results are stored one row per student, so distinct
  // (course, section) groups are collapsed into a single published unit.
  const resultsSnapshot = await db.collection('results')
    .where('college_id', '==', collegeId)
    .where('published', '==', true)
    .where('exam_id', '==', null)
    .select('course_id', 'section_id')
    .get();

  const groups = new Set();
  resultsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    groups.add(`${data.course_id}|${data.section_id || ''}`);
  });

  return publishedExams + groups.size;
}

// Lifetime published count for a college. The persistent counter survives
// clearing the college's data, so wiping results can never restore plan quota.
// Colleges that predate the counter fall back to the live count.
async function countPublished(collegeId) {
  const collegeDoc = await db.collection('colleges').doc(collegeId).get();
  if (collegeDoc.exists && typeof collegeDoc.data().published_total === 'number') {
    return collegeDoc.data().published_total;
  }
  return countLivePublished(collegeId);
}

// Record that a college has genuinely published one or more units. The counter
// is stored on the college document so it is atomic and survives data resets.
// Only genuine new publications call this (re-publishing the same unit is a
// no-op handled by the callers).
async function recordPublication(collegeId, count = 1) {
  const increment = Math.max(1, Math.floor(Number(count) || 1));
  const collegeRef = db.collection('colleges').doc(collegeId);
  const collegeDoc = await collegeRef.get();
  if (!collegeDoc.exists) return;

  if (typeof collegeDoc.data().published_total === 'number') {
    await collegeRef.update({
      published_total: FieldValue.increment(increment),
      updated_at: FieldValue.serverTimestamp(),
    });
  } else {
    // Seed with the current live count before the first increment so legacy
    // colleges keep an accurate lifetime total.
    const live = await countLivePublished(collegeId);
    await collegeRef.update({
      published_total: live + increment,
      updated_at: FieldValue.serverTimestamp(),
    });
  }
}

// Resolve the effective cap: an explicit configured limit always wins,
// otherwise fall back to the selected plan's default.
function resolveLimit(plan, planLimit) {
  if (typeof planLimit === 'number' && Number.isFinite(planLimit) && planLimit > 0) {
    return Math.floor(planLimit);
  }
  return DEFAULT_LIMITS[plan] || DEFAULT_LIMITS.free;
}

async function getSubscription(collegeId) {
  const collegeDoc = await db.collection('colleges').doc(collegeId).get();
  if (!collegeDoc.exists) throw notFound('College not found');

  const data = collegeDoc.data();
  const plan = data.plan || 'free';
  const limit = resolveLimit(plan, data.plan_limit);
  const used = await countPublished(collegeId);

  return { plan, limit, used, remaining: Math.max(0, limit - used) };
}

// Throw before a college can publish once its cap is reached. The error carries
// a stable code the frontend uses to render the "Plan Limit Reached" dialog.
async function assertCanPublish(collegeId) {
  const { plan, limit, used } = await getSubscription(collegeId);
  if (used >= limit) {
    throw new AppError(
      403,
      'Plan limit reached. Upgrade your subscription or contact the Super Admin.',
      { plan, limit, used },
      'PLAN_LIMIT_REACHED'
    );
  }
  return { plan, limit, used };
}

module.exports = {
  DEFAULT_LIMITS,
  countPublished,
  countLivePublished,
  recordPublication,
  resolveLimit,
  getSubscription,
  assertCanPublish,
};