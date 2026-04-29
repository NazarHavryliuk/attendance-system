const { deleteUser } = require('../controllers/userController');
const { deleteStudent } = require('../controllers/studentController');
const User = require('../models/User');
const Group = require('../models/Group');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { deleteFileByUrl } = require('../services/b2Service');

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock('../models/Group', () => ({
  countDocuments: jest.fn(),
}));

jest.mock('../models/Student', () => ({
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock('../models/Attendance', () => ({
  deleteMany: jest.fn(),
}));

jest.mock('../services/b2Service', () => ({
  deleteFileByUrl: jest.fn(),
}));

const createMockRes = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockReturnValue(res);
  return res;
};

describe('deleteUser photo cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deletes teacher photo from B2 before removing account', async () => {
    const teacher = {
      _id: 'teacher-1',
      role: 'teacher',
      photo_url: 'https://cdn.example/teachers/photo.jpg',
      deleteOne: jest.fn().mockResolvedValue(undefined),
    };

    Group.countDocuments.mockResolvedValue(0);
    User.findOne.mockResolvedValue(teacher);

    const req = {
      params: { id: 'teacher-1' },
      user: { id: 'admin-1', role: 'admin' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await deleteUser(req, res, next);

    expect(Group.countDocuments).toHaveBeenCalledWith({ teacher_id: 'teacher-1' });
    expect(User.findOne).toHaveBeenCalledWith({ _id: 'teacher-1', role: 'teacher' });
    expect(deleteFileByUrl).toHaveBeenCalledWith('https://cdn.example/teachers/photo.jpg');
    expect(teacher.deleteOne).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Teacher deleted' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('deleteStudent photo cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deletes distinct student photo URLs from B2 before removing records', async () => {
    const student = {
      _id: 'student-1',
      user_id: 'user-1',
      photo_url: 'https://cdn.example/students/student-photo.jpg',
    };
    const linkedUser = {
      photo_url: 'https://cdn.example/users/user-photo.jpg',
    };

    Student.findById.mockResolvedValue(student);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(linkedUser),
    });
    Attendance.deleteMany.mockResolvedValue({ deletedCount: 3 });
    User.findByIdAndDelete.mockResolvedValue({ _id: 'user-1' });
    Student.findByIdAndDelete.mockResolvedValue({ _id: 'student-1' });

    const req = {
      params: { id: 'student-1' },
      user: { id: 'admin-1', role: 'admin' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await deleteStudent(req, res, next);

    expect(Student.findById).toHaveBeenCalledWith('student-1');
    expect(deleteFileByUrl).toHaveBeenNthCalledWith(1, 'https://cdn.example/students/student-photo.jpg');
    expect(deleteFileByUrl).toHaveBeenNthCalledWith(2, 'https://cdn.example/users/user-photo.jpg');
    expect(deleteFileByUrl).toHaveBeenCalledTimes(2);
    expect(Attendance.deleteMany).toHaveBeenCalledWith({ student_id: 'student-1' });
    expect(User.findByIdAndDelete).toHaveBeenCalledWith('user-1');
    expect(Student.findByIdAndDelete).toHaveBeenCalledWith('student-1');
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Student account deleted' });
    expect(next).not.toHaveBeenCalled();
  });

  test('does not delete the same B2 file twice when student and user share one URL', async () => {
    const sharedUrl = 'https://cdn.example/shared/photo.jpg';
    const student = {
      _id: 'student-1',
      user_id: 'user-1',
      photo_url: sharedUrl,
    };

    Student.findById.mockResolvedValue(student);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ photo_url: sharedUrl }),
    });
    Attendance.deleteMany.mockResolvedValue({ deletedCount: 1 });
    User.findByIdAndDelete.mockResolvedValue({ _id: 'user-1' });
    Student.findByIdAndDelete.mockResolvedValue({ _id: 'student-1' });

    const req = {
      params: { id: 'student-1' },
      user: { id: 'admin-1', role: 'admin' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await deleteStudent(req, res, next);

    expect(deleteFileByUrl).toHaveBeenCalledTimes(1);
    expect(deleteFileByUrl).toHaveBeenCalledWith(sharedUrl);
    expect(next).not.toHaveBeenCalled();
  });
});