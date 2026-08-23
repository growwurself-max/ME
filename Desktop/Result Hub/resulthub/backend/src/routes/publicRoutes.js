const router = require('express').Router();
const multer = require('multer');
const asyncHandler = require('../utils/asyncHandler');
const { findResult } = require('../controllers/publicController');
const faculty = require('../controllers/facultyController');

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Add cache control headers to prevent browser caching
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

router.get('/results', asyncHandler(findResult));
router.post('/results', asyncHandler(findResult));

router.post('/faculty-upload/context', asyncHandler(faculty.contextInfo));
router.get('/faculty-upload/template', asyncHandler(faculty.subjectTemplate));
router.post('/faculty-upload/preview', memoryUpload.single('file'), asyncHandler(faculty.preview));
router.post('/faculty-upload/verify', asyncHandler(faculty.verify));
router.post('/faculty-upload/submit', asyncHandler(faculty.submit));

module.exports = router;
