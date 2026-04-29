const express = require('express');
const { authenticate, authorizeRoles } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const validateObjectId = require('../middlewares/validateObjectId');
const { uploadUserPhoto, uploadStudentPhoto } = require('../controllers/uploadController');

const router = express.Router();

router.use(authenticate);

// Admin can upload photo for any user; teacher and student can upload only their own
router.post(
  '/user/:id',
  authorizeRoles('admin', 'teacher', 'student'),
  validateObjectId('id'),
  upload.single('photo'),
  uploadUserPhoto
);

// Admin-only: upload student photo
router.post(
  '/student/:id',
  authorizeRoles('admin'),
  validateObjectId('id'),
  upload.single('photo'),
  uploadStudentPhoto
);

module.exports = router;
