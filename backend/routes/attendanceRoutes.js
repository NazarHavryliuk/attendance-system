const express = require('express');
const {
  registerAttendance,
  getAttendanceByLesson,
  getLessonReport,
} = require('../controllers/attendanceController');
const validateObjectId = require('../middlewares/validateObjectId');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.post('/register', authorizeRoles('admin', 'teacher', 'student'), registerAttendance);
router.get('/lesson-report/:lessonId', authorizeRoles('admin', 'teacher'), validateObjectId('lessonId'), getLessonReport);
router.get('/:lessonId', authorizeRoles('admin', 'teacher', 'student'), validateObjectId('lessonId'), getAttendanceByLesson);

module.exports = router;
