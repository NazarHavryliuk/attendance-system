const {
  getStatisticsByStudent,
  getGroupReport,
  getGroupAttendanceTable,
  getLessonReport,
  getStudentSubjectReport,
} = require('../controllers/statisticsController');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Lesson = require('../models/Lesson');
const LessonSession = require('../models/LessonSession');
const Group = require('../models/Group');
const { getStudentStatistics } = require('../services/statisticsService');

jest.mock('../models/Student', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../models/Attendance', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('../models/Lesson', () => ({
  findById: jest.fn(),
  find: jest.fn(),
  exists: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('../models/LessonSession', () => ({
  find: jest.fn(),
}));

jest.mock('../models/Group', () => ({
  findById: jest.fn(),
}));

jest.mock('../services/statisticsService', () => ({
  getStudentStatistics: jest.fn(),
}));

const createMockRes = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
};

describe('statisticsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getStatisticsByStudent returns 404 when student does not exist', async () => {
    Student.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const req = {
      params: { studentId: 'student-1' },
      user: { id: 'admin-1', role: 'admin' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await getStatisticsByStudent(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Student not found' });
    expect(getStudentStatistics).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('getStatisticsByStudent returns 403 for teacher without access', async () => {
    Student.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: 'student-1', user_id: 'user-10', group_id: { _id: 'group-1' } }),
    });
    Lesson.exists.mockResolvedValue(false);

    const req = {
      params: { studentId: 'student-1' },
      user: { id: 'teacher-1', role: 'teacher' },
    };
    const res = createMockRes();

    await getStatisticsByStudent(req, res, jest.fn());

    expect(Lesson.exists).toHaveBeenCalledWith({ group_id: 'group-1', teacher_id: 'teacher-1' });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access denied' });
  });

  test('getStatisticsByStudent returns stats for allowed user', async () => {
    Student.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: 'student-1', user_id: 'user-1', group_id: { _id: 'group-1' } }),
    });
    getStudentStatistics.mockResolvedValue({ total: 10, present: 9, absent: 1, attendanceRate: 90 });

    const req = {
      params: { studentId: 'student-1' },
      user: { id: 'user-1', role: 'student' },
    };
    const res = createMockRes();

    await getStatisticsByStudent(req, res, jest.fn());

    expect(getStudentStatistics).toHaveBeenCalledWith('student-1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { total: 10, present: 9, absent: 1, attendanceRate: 90 },
    });
  });

  test('getGroupReport returns aggregated totals and attendanceRate', async () => {
    Group.findById.mockResolvedValue({ _id: 'group-1', name: 'G-1' });
    Student.find.mockResolvedValue([{ _id: 's1' }, { _id: 's2' }, { _id: 's3' }]);
    Attendance.countDocuments.mockResolvedValue(11);
    Lesson.countDocuments.mockResolvedValue(5);

    const req = {
      params: { groupId: 'group-1' },
      user: { id: 'admin-1', role: 'admin' },
    };
    const res = createMockRes();

    await getGroupReport(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        group: { _id: 'group-1', name: 'G-1' },
        studentsCount: 3,
        lessonsCount: 5,
        total: 15,
        present: 11,
        absent: 4,
        attendanceRate: 73.33,
      },
    });
  });

  test('getGroupAttendanceTable builds matrix with percentages per lesson', async () => {
    Group.findById.mockResolvedValue({ _id: 'group-1', name: 'G-1' });
    Student.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { _id: 's1', name: 'Alice' },
        { _id: 's2', name: 'Bob' },
      ]),
    });
    Lesson.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { _id: 'l1', subject: 'Math' },
        { _id: 'l2', subject: 'Physics' },
      ]),
    });
    LessonSession.find.mockResolvedValue([
      { lesson_id: 'l1', date: new Date('2026-04-29') },
      { lesson_id: 'l1', date: new Date('2026-04-30') },
      { lesson_id: 'l2', date: new Date('2026-04-29') },
    ]);
    Attendance.find.mockResolvedValue([
      { lesson_id: 'l1', student_id: 's1' },
      { lesson_id: 'l1', student_id: 's1' },
      { lesson_id: 'l2', student_id: 's2' },
    ]);

    const req = {
      params: { groupId: 'group-1' },
      user: { id: 'admin-1', role: 'admin' },
    };
    const res = createMockRes();

    await getGroupAttendanceTable(req, res, jest.fn());

    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.data.lessonColumns).toEqual([
      { id: 'l1', subject: 'Math' },
      { id: 'l2', subject: 'Physics' },
    ]);
    expect(payload.data.rows[0].attendanceByLesson.l1).toBe(100);
    expect(payload.data.rows[0].attendanceByLesson.l2).toBe(0);
    expect(payload.data.rows[1].attendanceByLesson.l1).toBe(0);
    expect(payload.data.rows[1].attendanceByLesson.l2).toBe(100);
  });

  test('getLessonReport blocks teacher without lesson ownership', async () => {
    Lesson.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: 'lesson-1', group_id: { _id: 'group-1' }, teacher_id: 'teacher-x' }),
    });

    const req = {
      params: { lessonId: 'lesson-1' },
      user: { id: 'teacher-1', role: 'teacher' },
    };
    const res = createMockRes();

    await getLessonReport(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access denied' });
  });

  test('getLessonReport returns session-aware attendance matrix', async () => {
    Lesson.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: 'lesson-1', group_id: { _id: 'group-1' }, teacher_id: 'teacher-1' }),
    });
    Student.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { _id: 's1', name: 'Alice' },
        { _id: 's2', name: 'Bob' },
      ]),
    });
    LessonSession.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: 'ss1', lesson_id: 'lesson-1', date: new Date('2026-04-29T00:00:00Z') },
          { _id: 'ss2', lesson_id: 'lesson-1', date: new Date('2026-04-30T00:00:00Z') },
        ]),
      }),
    });
    Attendance.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { student_id: 's1', date: new Date('2026-04-29T10:00:00Z') },
          { student_id: 's1', date: new Date('2026-04-30T10:00:00Z') },
          { student_id: 's2', date: new Date('2026-04-29T10:00:00Z') },
          { student_id: 's2', date: new Date('2026-05-01T10:00:00Z') },
        ]),
      }),
    });

    const req = {
      params: { lessonId: 'lesson-1' },
      user: { id: 'teacher-1', role: 'teacher' },
    };
    const res = createMockRes();

    await getLessonReport(req, res, jest.fn());

    const data = res.json.mock.calls[0][0].data;
    expect(data.totalSessions).toBe(2);
    expect(data.rows[0]).toEqual({
      studentId: 's1',
      studentName: 'Alice',
      attendedSessions: 2,
      totalSessions: 2,
      attendanceRate: 100,
    });
    expect(data.rows[1]).toEqual({
      studentId: 's2',
      studentName: 'Bob',
      attendedSessions: 1,
      totalSessions: 2,
      attendanceRate: 50,
    });
  });

  test('getStudentSubjectReport aggregates by subject using session dates', async () => {
    Student.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: 'student-1', user_id: 'user-1', group_id: 'group-1' }),
    });
    Lesson.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: 'l1', subject: 'Programming' },
          { _id: 'l2', subject: 'Programming' },
          { _id: 'l3', subject: 'Math' },
        ]),
      }),
    });
    LessonSession.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { lesson_id: 'l1', date: new Date('2026-04-29T00:00:00Z') },
          { lesson_id: 'l1', date: new Date('2026-04-30T00:00:00Z') },
          { lesson_id: 'l2', date: new Date('2026-04-29T00:00:00Z') },
          { lesson_id: 'l3', date: new Date('2026-04-29T00:00:00Z') },
        ]),
      }),
    });
    Attendance.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { lesson_id: 'l1', date: new Date('2026-04-29T10:00:00Z') },
          { lesson_id: 'l2', date: new Date('2026-04-29T10:00:00Z') },
          { lesson_id: 'l3', date: new Date('2026-05-10T10:00:00Z') },
        ]),
      }),
    });

    const req = {
      params: { id: 'student-1' },
      user: { id: 'admin-1', role: 'admin' },
    };
    const res = createMockRes();

    await getStudentSubjectReport(req, res, jest.fn());

    const rows = res.json.mock.calls[0][0].data;
    const programming = rows.find((r) => r.subject === 'Programming');
    const math = rows.find((r) => r.subject === 'Math');

    expect(programming.total).toBe(3);
    expect(programming.present).toBe(2);
    expect(programming.absent).toBe(1);
    expect(programming.attendanceRate).toBe(66.67);

    expect(math.total).toBe(1);
    expect(math.present).toBe(0);
    expect(math.absent).toBe(1);
    expect(math.attendanceRate).toBe(0);
  });
});
