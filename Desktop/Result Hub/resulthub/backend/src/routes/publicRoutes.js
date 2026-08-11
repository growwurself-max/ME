const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { findResult } = require('../controllers/publicController');

router.get('/results', asyncHandler(findResult));
router.post('/results', asyncHandler(findResult));

module.exports = router;
