const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireRole } = require('../middleware/auth');
const c = require('../controllers/superAdminController');

router.use(authenticate, requireRole('super_admin'));

router.get('/stats', asyncHandler(c.stats));
router.get('/colleges', asyncHandler(c.listColleges));
router.post('/colleges', asyncHandler(c.createCollege));
router.put('/colleges/:id', asyncHandler(c.updateCollege));
router.patch('/colleges/:id/activate', asyncHandler(c.activate));
router.patch('/colleges/:id/deactivate', asyncHandler(c.deactivate));
router.patch('/colleges/:id/password', asyncHandler(c.resetPassword));
router.delete('/colleges/:id', asyncHandler(c.deleteCollege));
router.delete('/colleges/:id/data', asyncHandler(c.resetCollegeData));
router.get('/colleges/:id/subscription', asyncHandler(c.getSubscription));
router.put('/colleges/:id/subscription', asyncHandler(c.updateSubscription));

module.exports = router;
