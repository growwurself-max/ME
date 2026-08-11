const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/authController');

router.post('/login', asyncHandler(controller.login));
router.get('/me', authenticate, asyncHandler(controller.me));

module.exports = router;
