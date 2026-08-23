const { collegeId } = require('../middleware/auth');
const { getSubscription } = require('../services/subscriptionService');

async function status(req, res) {
  const cid = collegeId(req);
  res.json(await getSubscription(cid));
}

module.exports = { status };