const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Lesson = require('../models/Lesson');

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

  const [total, present] = await Promise.all([
    Lesson.countDocuments({ group_id: student.group_id }),
    Attendance.countDocuments({ student_id: studentId }),
  ]);
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
