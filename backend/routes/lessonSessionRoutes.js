const express = require('express');
const { createLessonSession, getSessionsByLesson, deleteLessonSession } = require('../controllers/lessonSessionController');
const validateObjectId = require('../middlewares/validateObjectId');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', authorizeRoles('admin', 'teacher'), createLessonSession);
router.delete('/:id', authorizeRoles('admin', 'teacher'), validateObjectId('id'), deleteLessonSession);
router.get('/:lessonId', authorizeRoles('admin', 'teacher', 'student'), validateObjectId('lessonId'), getSessionsByLesson);

module.exports = router;
