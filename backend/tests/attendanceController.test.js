const { registerAttendance } = require('../controllers/attendanceController');
const Attendance = require('../models/Attendance');
const Lesson = require('../models/Lesson');
const Student = require('../models/Student');

jest.mock('../models/Attfendance', () => ({
  findOneAndUpdate: jest.fn(),
}));

jest.mock('../models/Lesson', () => ({
  findById: jest.fn(),
}));

jest.mock('../models/Student', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
}));

const createMockRes = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
};

describe('registerAttendance for student current lesson checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns 403 if lesson is not currently in progress', async () => {
    jest.setSystemTime(new Date('2026-04-28T08:00:00')); // Tuesday

    Lesson.findById.mockResolvedValue({
      _id: 'lesson1',
      group_id: 'group1',
      day_of_week: 'tuesday',
      start_time: '10:00',
      end_time: '11:30',
      date: new Date('2026-04-28T10:00:00'),
    });

    Student.findOne.mockResolvedValue({
      _id: 'student1',
      user_id: 'user-student',
      group_id: 'group1',
    });

    const req = {
      body: { lesson_id: 'lesson1' },
      user: { id: 'user-student', role: 'student' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await registerAttendance(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'You can mark attendance only for the lesson currently in progress',
    });
    expect(Attendance.findOneAndUpdate).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('registers attendance when lesson is currently in progress', async () => {
    jest.setSystemTime(new Date('2026-04-28T10:15:00')); // Tuesday

    Lesson.findById.mockResolvedValue({
      _id: 'lesson1',
      group_id: 'group1',
      day_of_week: 'tuesday',
      start_time: '10:00',
      end_time: '11:30',
      date: new Date('2026-04-28T10:00:00'),
    });

    Student.findOne.mockResolvedValue({
      _id: 'student1',
      user_id: 'user-student',
      group_id: 'group1',
    });

    Student.findById.mockResolvedValue({
      _id: 'student1',
      group_id: 'group1',
    });

    Attendance.findOneAndUpdate.mockResolvedValue({ _id: 'attendance1' });

    const req = {
      body: { lesson_id: 'lesson1' },
      user: { id: 'user-student', role: 'student' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await registerAttendance(req, res, next);

    expect(Attendance.findOneAndUpdate).toHaveBeenCalledWith(
      {
        lesson_id: 'lesson1',
        student_id: 'student1',
        date: expect.any(Date),
      },
      {
        lesson_id: 'lesson1',
        student_id: 'student1',
        date: expect.any(Date),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });
});
