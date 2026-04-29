const Group = require('../models/Group');
const Student = require('../models/Student');
const Lesson = require('../models/Lesson');

const getGroups = async (req, res, next) => {
  try {
    const query = {};

    if (req.user.role === 'student') {
      const ownStudent = await Student.findOne({ user_id: req.user.id });
      if (!ownStudent) {
        return res.json({ success: true, data: [] });
      }
      query._id = ownStudent.group_id;
    }

    const groups = await Group.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: groups });
  } catch (error) {
    next(error);
  }
};

const createGroup = async (req, res, next) => {
  try {
    const { name, year } = req.body;

    if (!name || !year) {
      return res.status(400).json({ success: false, message: 'name and year are required' });
    }

    const existing = await Group.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Group already exists' });
    }

    const group = await Group.create({ name, year });
    return res.status(201).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

const updateGroup = async (req, res, next) => {
  try {
    const payload = {};
    const { name, year } = req.body;

    if (name !== undefined) payload.name = name;
    if (year !== undefined) payload.year = year;

    const group = await Group.findByIdAndUpdate(req.params.id, payload, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    return res.json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const [studentCount, lessonCount] = await Promise.all([
      Student.countDocuments({ group_id: id }),
      Lesson.countDocuments({ group_id: id }),
    ]);

    if (studentCount > 0 || lessonCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Group cannot be deleted while students or lessons are assigned',
      });
    }

    await Group.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGroups, createGroup, updateGroup, deleteGroup };
