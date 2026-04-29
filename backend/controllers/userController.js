const User = require('../models/User');
const Group = require('../models/Group');

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'teacher' }).sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({ name, email, password, role: 'teacher' });
    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'teacher' },
      { name: req.body.name, email: req.body.email, isActive: req.body.isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const assignedGroups = await Group.countDocuments({ teacher_id: id });
    if (assignedGroups > 0) {
      return res.status(400).json({
        success: false,
        message: 'Teacher cannot be deleted while assigned to groups',
      });
    }

    const user = await User.findOneAndDelete({ _id: id, role: 'teacher' });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    return res.json({ success: true, message: 'Teacher deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
