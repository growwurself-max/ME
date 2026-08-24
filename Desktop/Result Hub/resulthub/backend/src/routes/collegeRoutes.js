const router = require('express').Router();
const multer = require('multer');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireRole } = require('../middleware/auth');
const courses = require('../controllers/courseController');
const sections = require('../controllers/sectionController');
const students = require('../controllers/studentController');
const upload = require('../controllers/uploadController');
const results = require('../controllers/resultController');
const exams = require('../controllers/examController');
const faculty = require('../controllers/facultyController');
const storage = require('../controllers/storageController');
const subscription = require('../controllers/subscriptionController');

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authenticate, requireRole('college_admin'));

router.get('/dashboard', asyncHandler(results.dashboard));
router.get('/subscription', asyncHandler(subscription.status));
router.get('/storage', asyncHandler(storage.usage));
router.delete('/data', asyncHandler(storage.clearAll));

router.get('/courses', asyncHandler(courses.list));
router.post('/courses', asyncHandler(courses.create));
router.put('/courses/:id', asyncHandler(courses.update));
router.delete('/courses/:id', asyncHandler(courses.remove));

router.get('/sections', asyncHandler(sections.list));
router.post('/sections', asyncHandler(sections.create));
router.put('/sections/:id', asyncHandler(sections.update));
router.delete('/sections/:id', asyncHandler(sections.remove));
router.post('/sections/:id/faculty-code', asyncHandler(sections.regenerateFacultyCode));

router.get('/students', asyncHandler(students.list));
router.post('/students', asyncHandler(students.create));
router.put('/students/:id', asyncHandler(students.update));
router.delete('/students/:id', asyncHandler(students.remove));

router.get('/upload/template', asyncHandler(upload.template));
router.post('/upload/preview', memoryUpload.single('file'), asyncHandler(upload.preview));
router.post('/upload/preview-paste', asyncHandler(upload.previewPaste));
router.post('/upload/commit', asyncHandler(upload.commit));

router.post('/results/recalculate', asyncHandler(results.recalculate));
router.post('/results/publish', asyncHandler(results.publish));
router.get('/results/export/excel', asyncHandler(results.exportExcel));
router.get('/results/export/data', asyncHandler(results.exportData));

router.get('/exams', asyncHandler(exams.list));
router.post('/exams', asyncHandler(exams.create));
router.put('/exams/:id', asyncHandler(exams.update));
router.delete('/exams/:id', asyncHandler(exams.remove));
router.post('/exams/publish', asyncHandler(exams.publish));

router.get('/faculty-upload/status', asyncHandler(faculty.status));

module.exports = router;
