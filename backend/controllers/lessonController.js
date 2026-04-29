const Lesson = require('../models/Lesson');
const Group = require('../models/Group');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

const toMinutes = (value) => {
  const [hours, minutes] = String(value).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return (hours * 60) + minutes;
};

const getCurrentDayAndMinutes = () => {
  const now = new Date();
  const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return {
    day: dayMap[now.getDay()],
    minutes: (now.getHours() * 60) + now.getMinutes(),
  };
};

const getLessons = async (req, res, next) => {
  try {
    const query = {};

    if (req.user.role === 'teacher') {
      query.teacher_id = req.user.id;
    }

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user_id: req.user.id });
      if (!student) {
        return res.json({ success: true, data: [] });
      }
      query.group_id = student.group_id;
    }

    const lessons = await Lesson.find(query)
      .populate('group_id', 'name year')
      .populate('teacher_id', 'name email')
      .lean()
      .sort({ date: -1 });

    if (req.user.role === 'student') {
      const { day, minutes } = getCurrentDayAndMinutes();
      const decorated = lessons.map((lesson) => {
        const start = toMinutes(lesson.start_time);
        const end = toMinutes(lesson.end_time);
        const isActiveNow =
          lesson.day_of_week === day
          && !Number.isNaN(start)
          && !Number.isNaN(end)
          && minutes >= start
          && minutes < end;

        return { ...lesson, is_active_now: isActiveNow };
      });

      return res.json({ success: true, data: decorated });
    }

    res.json({ success: true, data: lessons });
  } catch (error) {
    next(error);
  }
};

const createLesson = async (req, res, next) => {
  try {
    const {
      subject,
      group_id,
      teacher_id,
      day_of_week,
      start_time,
      end_time,
    } = req.body;

    if (!subject || !group_id || !teacher_id || !day_of_week || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'subject, group_id, teacher_id, day_of_week, start_time, end_time are required',
      });
    }

    const allowedDays = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
    if (!allowedDays.has(String(day_of_week).toLowerCase())) {
      return res.status(400).json({ success: false, message: 'day_of_week is invalid' });
    }

    const start = toMinutes(start_time);
    const end = toMinutes(end_time);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      return res.status(400).json({ success: false, message: 'start_time and end_time must be HH:MM' });
    }
    if (start >= end) {
      return res.status(400).json({ success: false, message: 'end_time must be later than start_time' });
    }

    const group = await Group.findById(group_id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const teacher = await User.findOne({ _id: teacher_id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const lesson = await Lesson.create({
      subject,
      group_id,
      teacher_id,
      day_of_week: String(day_of_week).toLowerCase(),
      start_time,
      end_time,
      created_by: req.user.id,
    });

    return res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

const deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    await Promise.all([
      Attendance.deleteMany({ lesson_id: lesson._id }),
      Lesson.findByIdAndDelete(lesson._id),
    ]);

    return res.json({ success: true, message: 'Lesson deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLessons, createLesson, deleteLesson };
