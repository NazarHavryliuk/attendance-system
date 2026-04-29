const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Lesson = require('../models/Lesson');
const LessonSession = require('../models/LessonSession');
const Group = require('../models/Group');
const { getStudentStatistics } = require('../services/statisticsService');

const ensureStudentAccess = async (requestUser, studentId) => {
  const student = await Student.findById(studentId).populate('group_id');
  if (!student) {
    return { error: 'Student not found', code: 404 };
  }

  if (requestUser.role === 'student' && String(student.user_id) !== String(requestUser.id)) {
    return { error: 'Access denied', code: 403 };
  }

  if (requestUser.role === 'teacher') {
    const hasAccess = await Lesson.exists({
      group_id: student.group_id?._id || student.group_id,
      teacher_id: requestUser.id,
    });
    if (!hasAccess) {
      return { error: 'Access denied', code: 403 };
    }
  }



  return { student };
};

const ensureGroupAccess = async (requestUser, groupId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    return { error: 'Group not found', code: 404 };
  }

  if (requestUser.role === 'teacher') {
    const hasAccess = await Lesson.exists({ group_id: groupId, teacher_id: requestUser.id });
    if (!hasAccess) {
      return { error: 'Access denied', code: 403 };
    }
  }



  if (requestUser.role === 'student') {
    const ownStudent = await Student.findOne({ user_id: requestUser.id });
    if (!ownStudent || String(ownStudent.group_id) !== String(groupId)) {
      return { error: 'Access denied', code: 403 };
    }
  }

  return { group };
};

const getStatisticsByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const access = await ensureStudentAccess(req.user, studentId);

    if (access.error) {
      return res.status(access.code).json({ success: false, message: access.error });
    }

    const stats = await getStudentStatistics(studentId);
    return res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

const getStudentReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const access = await ensureStudentAccess(req.user, id);
    if (access.error) {
      return res.status(access.code).json({ success: false, message: access.error });
    }

    const [stats, records] = await Promise.all([
      getStudentStatistics(id),
      Attendance.find({ student_id: id }).populate('lesson_id').sort({ date: -1 }),
    ]);

    return res.json({
      success: true,
      data: {
        student: access.student,
        stats,
        records,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getGroupReport = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const access = await ensureGroupAccess(req.user, groupId);
    if (access.error) {
      return res.status(access.code).json({ success: false, message: access.error });
    }

    const students = await Student.find({ group_id: groupId });
    const studentIds = students.map((s) => s._id);

    const [present, lessonCount] = await Promise.all([
      Attendance.countDocuments({ student_id: { $in: studentIds } }),
      Lesson.countDocuments({ group_id: groupId }),
    ]);
    const total = students.length * lessonCount;
    const absent = Math.max(total - present, 0);

    return res.json({
      success: true,
      data: {
        group: access.group,
        studentsCount: students.length,
        lessonsCount: lessonCount,
        total,
        present,
        absent,
        attendanceRate: total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getGroupAttendanceTable = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const access = await ensureGroupAccess(req.user, groupId);
    if (access.error) {
      return res.status(access.code).json({ success: false, message: access.error });
    }

    const [students, lessons] = await Promise.all([
      Student.find({ group_id: groupId }).sort({ name: 1 }),
      Lesson.find({ group_id: groupId }).sort({ subject: 1 }),
    ]);

    const lessonIds = lessons.map((lesson) => lesson._id);
    const [sessions, attendances] = await Promise.all([
      LessonSession.find({ lesson_id: { $in: lessonIds } }),
      Attendance.find({ lesson_id: { $in: lessonIds } }),
    ]);

    // sessionCount[lessonId] = number of sessions held
    const sessionCount = {};
    sessions.forEach((s) => {
      const lid = String(s.lesson_id);
      sessionCount[lid] = (sessionCount[lid] || 0) + 1;
    });

    // attendCount[studentId_lessonId] = number of attended sessions
    const attendCount = {};
    attendances.forEach((a) => {
      const key = `${a.student_id}_${a.lesson_id}`;
      attendCount[key] = (attendCount[key] || 0) + 1;
    });

    const rows = students.map((student) => {
      const byLesson = {};
      lessons.forEach((lesson) => {
        const lid = String(lesson._id);
        const total = sessionCount[lid] || 0;
        const present = attendCount[`${student._id}_${lid}`] || 0;
        byLesson[lid] = total > 0 ? Math.round((present / total) * 100) : null;
      });
      return {
        studentId: student._id,
        studentName: student.name,
        attendanceByLesson: byLesson,
      };
    });

    return res.json({
      success: true,
      data: {
        group: access.group,
        lessonColumns: lessons.map((lesson) => ({
          id: lesson._id,
          subject: lesson.subject,
        })),
        rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getLessonReport = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId).populate('group_id');
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (req.user.role === 'teacher' && String(lesson.teacher_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.user.role === 'student') {
      const ownStudent = await Student.findOne({ user_id: req.user.id });
      if (!ownStudent || String(ownStudent.group_id) !== String(lesson.group_id._id)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const [students, sessions, records] = await Promise.all([
      Student.find({ group_id: lesson.group_id._id }).sort({ name: 1 }),
      LessonSession.find({ lesson_id: lessonId }).sort({ date: 1 }).lean(),
      Attendance.find({ lesson_id: lessonId }).select('student_id date').lean(),
    ]);

    const sessionDateKeys = new Set(
      sessions.map((session) => new Date(session.date).toISOString().slice(0, 10))
    );

    // attendedDatesByStudent[studentId] = Set of session dates where student has attendance
    const attendedDatesByStudent = new Map();
    for (const record of records) {
      const dateKey = new Date(record.date).toISOString().slice(0, 10);
      if (!sessionDateKeys.has(dateKey)) continue;

      const sid = String(record.student_id);
      if (!attendedDatesByStudent.has(sid)) {
        attendedDatesByStudent.set(sid, new Set());
      }
      attendedDatesByStudent.get(sid).add(dateKey);
    }

    const totalSessions = sessions.length;
    const rows = students.map((student) => {
      const attendedSessions = attendedDatesByStudent.get(String(student._id))?.size || 0;
      return {
        studentId: student._id,
        studentName: student.name,
        attendedSessions,
        totalSessions,
        attendanceRate: totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : null,
      };
    });

    return res.json({
      success: true,
      data: {
        lesson,
        totalSessions,
        rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getStudentSubjectReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const access = await ensureStudentAccess(req.user, id);
    if (access.error) {
      return res.status(access.code).json({ success: false, message: access.error });
    }

    const lessons = await Lesson.find({ group_id: access.student.group_id }).select('_id subject').lean();
    const lessonIds = lessons.map((lesson) => lesson._id);
    const [sessions, attended] = await Promise.all([
      LessonSession.find({ lesson_id: { $in: lessonIds } }).select('lesson_id date').lean(),
      Attendance.find({ student_id: id, lesson_id: { $in: lessonIds } }).select('lesson_id date').lean(),
    ]);

    const sessionDatesByLesson = new Map();
    for (const session of sessions) {
      const lessonKey = String(session.lesson_id);
      const dateKey = new Date(session.date).toISOString().slice(0, 10);
      if (!sessionDatesByLesson.has(lessonKey)) {
        sessionDatesByLesson.set(lessonKey, new Set());
      }
      sessionDatesByLesson.get(lessonKey).add(dateKey);
    }

    const attendedDatesByLesson = new Map();
    for (const record of attended) {
      const lessonKey = String(record.lesson_id);
      const dateKey = new Date(record.date).toISOString().slice(0, 10);
      const validSessionDates = sessionDatesByLesson.get(lessonKey);
      if (!validSessionDates?.has(dateKey)) continue;
      if (!attendedDatesByLesson.has(lessonKey)) {
        attendedDatesByLesson.set(lessonKey, new Set());
      }
      attendedDatesByLesson.get(lessonKey).add(dateKey);
    }

    const bySubject = {};

    lessons.forEach((lesson) => {
      const subject = lesson.subject || 'Unknown';
      if (!bySubject[subject]) {
        bySubject[subject] = { subject, total: 0, present: 0, absent: 0, attendanceRate: 0 };
      }

      const lessonKey = String(lesson._id);
      const totalSessions = sessionDatesByLesson.get(lessonKey)?.size || 0;
      const presentSessions = attendedDatesByLesson.get(lessonKey)?.size || 0;

      bySubject[subject].total += totalSessions;
      bySubject[subject].present += presentSessions;
    });

    const result = Object.values(bySubject).map((item) => {
      const absent = Math.max(item.total - item.present, 0);
      const attendanceRate = item.total > 0 ? Number(((item.present / item.total) * 100).toFixed(2)) : 0;
      return { ...item, absent, attendanceRate };
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatisticsByStudent,
  getStudentReport,
  getGroupReport,
  getGroupAttendanceTable,
  getLessonReport,
  getStudentSubjectReport,
};
