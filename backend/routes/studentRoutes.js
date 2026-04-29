const express = require('express');
const {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const validateObjectId = require('../middlewares/validateObjectId');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('admin', 'teacher', 'student'), getStudents);
router.post('/register', authorizeRoles('admin'), createStudent);
router.put('/:id', authorizeRoles('admin'), validateObjectId('id'), updateStudent);
router.delete('/:id', authorizeRoles('admin'), validateObjectId('id'), deleteStudent);

module.exports = router;
