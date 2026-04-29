const express = require('express');
const {
  getStatisticsByStudent,
  getStudentReport,
  getGroupReport,
  getGroupAttendanceTable,
  getLessonReport,
  getStudentSubjectReport,
} = require('../controllers/statisticsController');
const validateObjectId = require('../middlewares/validateObjectId');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/statistics/:studentId', authorizeRoles('admin', 'teacher', 'student'), validateObjectId('studentId'), getStatisticsByStudent);
router.get('/report/student/:id', authorizeRoles('admin', 'teacher', 'student'), validateObjectId('id'), getStudentReport);
router.get('/report/group/:groupId', authorizeRoles('admin', 'teacher', 'student'), validateObjectId('groupId'), getGroupReport);
router.get('/report/group/:groupId/attendance-table', authorizeRoles('admin', 'teacher', 'student'), validateObjectId('groupId'), getGroupAttendanceTable);
router.get('/report/lesson/:lessonId', authorizeRoles('admin', 'teacher', 'student'), validateObjectId('lessonId'), getLessonReport);
router.get('/report/student/:id/by-subject', authorizeRoles('admin', 'teacher', 'student'), validateObjectId('id'), getStudentSubjectReport);

module.exports = router;
