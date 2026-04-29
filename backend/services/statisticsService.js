const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Lesson = require('../models/Lesson');
const LessonSession = require('../models/LessonSession');

const getStudentStatistics = async (studentId) => {
  const student = await Student.findById(studentId).select('group_id');
  if (!student) {
    return {
      student_id: studentId,
      total: 0,
      present: 0,
      absent: 0,
      attendanceRate: 0,
    };
  }

  const lessons = await Lesson.find({ group_id: student.group_id }).select('_id').lean();
  const lessonIds = lessons.map((lesson) => lesson._id);

  if (lessonIds.length === 0) {
    return {
      student_id: studentId,
      total: 0,
      present: 0,
      absent: 0,
      attendanceRate: 0,
    };
  }

  const [sessions, attendanceRecords] = await Promise.all([
    LessonSession.find({ lesson_id: { $in: lessonIds } }).select('lesson_id date').lean(),
    Attendance.find({ student_id: studentId, lesson_id: { $in: lessonIds } }).select('lesson_id date').lean(),
  ]);

  const sessionKeys = new Set(
    sessions.map((session) => `${String(session.lesson_id)}:${new Date(session.date).toISOString().slice(0, 10)}`)
  );

  const presentKeys = new Set();
  attendanceRecords.forEach((record) => {
    const key = `${String(record.lesson_id)}:${new Date(record.date).toISOString().slice(0, 10)}`;
    if (sessionKeys.has(key)) {
      presentKeys.add(key);
    }
  });

  const total = sessionKeys.size;
  const present = presentKeys.size;
  const absent = Math.max(total - present, 0);

  return {
    student_id: studentId,
    total,
    present,
    absent,
    attendanceRate: total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0,
  };
};

module.exports = { getStudentStatistics };
