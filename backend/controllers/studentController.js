const Student = require('../models/Student');
const Group = require('../models/Group');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Lesson = require('../models/Lesson');
const { deleteFileByUrl } = require('../services/b2Service');

const getStudents = async (req, res, next) => {
  try {
    const query = {};

    if (req.user.role === 'teacher') {
      const ownLessons = await Lesson.find({ teacher_id: req.user.id }).select('group_id').lean();
      const ownGroupIds = [...new Set(ownLessons.map((lesson) => String(lesson.group_id)))];
      query.group_id = { $in: ownGroupIds };
    }

    if (req.user.role === 'student') {
      query.user_id = req.user.id;
    }

    const students = await Student.find(query)
      .populate('group_id')
      .populate('user_id', 'isActive role photo_url')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const { name, email, password, group_id } = req.body;

    if (!name || !email || !password || !group_id) {
      return res.status(400).json({ success: false, message: 'name, email, password, group_id are required' });
    }

    const group = await Group.findById(group_id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      isActive: true,
    });

    try {
      const student = await Student.create({ name, email, group_id, user_id: user._id });
      return res.status(201).json({ success: true, data: student });
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const payload = {};
    if (req.body.name !== undefined) payload.name = req.body.name;
    if (req.body.email !== undefined) payload.email = req.body.email;

    if (req.body.group_id) {
      const targetGroup = await Group.findById(req.body.group_id);
      if (!targetGroup) {
        return res.status(404).json({ success: false, message: 'Target group not found' });
      }

      payload.group_id = req.body.group_id;
    }

    const updated = await Student.findByIdAndUpdate(id, payload, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (req.body.name !== undefined || req.body.email !== undefined) {
      await User.findByIdAndUpdate(updated.user_id, {
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body.email !== undefined ? { email: req.body.email } : {}),
      });
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const user = await User.findById(student.user_id).select('photo_url');
    const photoUrls = [...new Set([student.photo_url, user?.photo_url].filter(Boolean))];
    await Promise.all(photoUrls.map((url) => deleteFileByUrl(url)));

    await Promise.all([
      Attendance.deleteMany({ student_id: student._id }),
      User.findByIdAndDelete(student.user_id),
      Student.findByIdAndDelete(student._id),
    ]);

    return res.json({ success: true, message: 'Student account deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStudents, createStudent, updateStudent, deleteStudent };
