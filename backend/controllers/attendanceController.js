const Attendance = require('../models/Attendance');
const Lesson = require('../models/Lesson');
const Student = require('../models/Student');

const toMinutes = (value) => {
  const [hours, minutes] = String(value).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return (hours * 60) + minutes;
};

const isLessonOngoingNow = (lesson) => {
  const now = new Date();
  const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayMap[now.getDay()];
  const currentMinutes = (now.getHours() * 60) + now.getMinutes();

  const start = toMinutes(lesson.start_time);
  const end = toMinutes(lesson.end_time);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;

  return lesson.day_of_week === today && currentMinutes >= start && currentMinutes < end;
};

const registerAttendance = async (req, res, next) => {
  try {
    const { lesson_id, student_id: rawStudentId, date: rawDate } = req.body;

    if (!lesson_id) {
      return res.status(400).json({ success: false, message: 'lesson_id is required' });
    }

    const lesson = await Lesson.findById(lesson_id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    let studentId = rawStudentId;

    if (req.user.role === 'student') {
      const studentProfile = await Student.findOne({ user_id: req.user.id });
      if (!studentProfile) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      if (String(studentProfile.group_id) !== String(lesson.group_id)) {
        return res.status(403).json({ success: false, message: 'You can mark attendance only for your group lessons' });
      }

      if (!isLessonOngoingNow(lesson)) {
        return res.status(403).json({
          success: false,
          message: 'You can mark attendance only for the lesson currently in progress',
        });
      }

      studentId = studentProfile._id;
    }

    if (req.user.role === 'teacher') {
      if (String(lesson.teacher_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'You can mark attendance only for your lessons' });
      }
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'student_id is required' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (String(student.group_id) !== String(lesson.group_id)) {
      return res.status(400).json({ success: false, message: 'Student does not belong to lesson group' });
    }

    const rawAttendanceDate = rawDate ? new Date(rawDate) : new Date();
    if (Number.isNaN(rawAttendanceDate.getTime())) {
      return res.status(400).json({ success: false, message: 'date must be a valid date' });
    }
    // Normalize to midnight UTC so dates match session dates
    const attendanceDate = new Date(Date.UTC(
      rawAttendanceDate.getUTCFullYear(),
      rawAttendanceDate.getUTCMonth(),
      rawAttendanceDate.getUTCDate(),
    ));

    const record = await Attendance.findOneAndUpdate(
      { lesson_id, student_id: studentId, date: attendanceDate },
      { lesson_id, student_id: studentId, date: attendanceDate },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    return res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const getAttendanceByLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    let studentFilter = {};

    if (req.user.role === 'teacher') {
      if (String(lesson.teacher_id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Access denied for this lesson' });
      }
    }

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user_id: req.user.id });
      if (!student || String(student.group_id) !== String(lesson.group_id)) {
        return res.status(403).json({ success: false, message: 'Access denied for this lesson' });
      }
      studentFilter = { student_id: student._id };
    }

    const records = await Attendance.find({ lesson_id: lessonId, ...studentFilter })
      .populate('student_id')
      .populate('lesson_id')
      .sort({ date: -1 });

    return res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

const getLessonReport = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const LessonSession = require('../models/LessonSession');

    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (req.user.role === 'teacher' && String(lesson.teacher_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied for this lesson' });
    }

    const sessions = await LessonSession.find({ lesson_id: lessonId }).sort({ date: 1 }).lean();
    const groupStudents = await Student.find({ group_id: lesson.group_id }).sort({ name: 1 }).lean();
    const attendanceRecords = await Attendance.find({ lesson_id: lessonId }).lean();

    // Build lookup: studentId -> Set of date strings (YYYY-MM-DD UTC)
    const attendanceMap = {};
    for (const record of attendanceRecords) {
      const sid = String(record.student_id);
      if (!attendanceMap[sid]) attendanceMap[sid] = new Set();
      attendanceMap[sid].add(record.date.toISOString().slice(0, 10));
    }

    const sessionDates = sessions.map((s) => s.date.toISOString().slice(0, 10));

    const rows = groupStudents.map((student) => {
      const sid = String(student._id);
      const presence = sessionDates.map((d) => attendanceMap[sid]?.has(d) ?? false);
      const presentCount = presence.filter(Boolean).length;
      const percentage = sessions.length > 0 ? Math.round((presentCount / sessions.length) * 100) : 0;
      return {
        student_id: student._id,
        name: student.name,
        presence,
        percentage,
      };
    });

    return res.json({
      success: true,
      data: {
        sessions: sessions.map((s) => ({ _id: s._id, date: s.date })),
        rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerAttendance, getAttendanceByLesson, getLessonReport };
