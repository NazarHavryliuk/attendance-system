const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET || 'dev_secret_change_me',
    { expiresIn: '7d' }
  );

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }

    const matched = await user.comparePassword(password);
    if (!matched) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await Student.findOne({ user_id: user._id }).populate('group_id');
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          photo_url: user.photo_url || null,
        },
        studentProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

const changeMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'newPassword must be at least 6 chars' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const matched = await user.comparePassword(currentPassword);
    if (!matched) {
      return res.status(401).json({ success: false, message: 'Current password is invalid' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

const bootstrapAdmin = async (req, res, next) => {
  try {
    const adminsCount = await User.countDocuments({ role: 'admin' });
    if (adminsCount > 0) {
      return res.status(400).json({ success: false, message: 'Admin account already exists' });
    }

    const envBootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    if (!envBootstrapPassword) {
      return res.status(500).json({
        success: false,
        message: 'Server bootstrap password is not configured',
      });
    }

    const { name, email, password, bootstrapPassword } = req.body;
    if (!name || !email || !password || !bootstrapPassword) {
      return res.status(400).json({
        success: false,
        message: 'name, email, password, bootstrapPassword are required',
      });
    }

    if (bootstrapPassword !== envBootstrapPassword) {
      return res.status(403).json({ success: false, message: 'Invalid bootstrap password' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
    });

    return res.status(201).json({
      success: true,
      message: 'Admin account created',
      data: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, me, changeMyPassword, bootstrapAdmin };
