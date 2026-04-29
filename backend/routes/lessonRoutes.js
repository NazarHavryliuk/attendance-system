const express = require('express');
const { getLessons, createLesson, deleteLesson } = require('../controllers/lessonController');
const validateObjectId = require('../middlewares/validateObjectId');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('admin', 'teacher', 'student'), getLessons);
router.post('/register', authorizeRoles('admin'), createLesson);
router.delete('/:id', authorizeRoles('admin'), validateObjectId('id'), deleteLesson);

module.exports = router;
