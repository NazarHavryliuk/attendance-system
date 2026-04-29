const User = require('../models/User');
const Student = require('../models/Student');
const { uploadFile, deleteFileByUrl } = require('../services/b2Service');

/**
 * POST /api/upload/user/:id
 * Admin uploads a photo for any user.
 * Teacher/student may upload only their own photo.
 */
const uploadUserPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { id } = req.params;

    // Non-admin users can only upload their own photo
    if (req.user.role !== 'admin' && String(req.user.id) !== String(id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete old photo from B2 if it exists
    await deleteFileByUrl(user.photo_url);

    const folder = `avatars/users`;
    const url = await uploadFile(req.file.buffer, req.file.originalname, folder);

    user.photo_url = url;
    await user.save();

    if (user.role === 'student') {
      await Student.findOneAndUpdate({ user_id: user._id }, { photo_url: url });
    }

    return res.json({ success: true, data: { photo_url: url } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/upload/student/:id
 * Admin uploads a photo for a student.
 */
const uploadStudentPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await deleteFileByUrl(student.photo_url);

    const url = await uploadFile(req.file.buffer, req.file.originalname, 'avatars/students');

    student.photo_url = url;
    await student.save();

    if (student.user_id) {
      await User.findByIdAndUpdate(student.user_id, { photo_url: url });
    }

    return res.json({ success: true, data: { photo_url: url } });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadUserPhoto, uploadStudentPhoto };
