const { uploadUserPhoto, uploadStudentPhoto } = require('../controllers/uploadController');
const User = require('../models/User');
const Student = require('../models/Student');
const { uploadFile, deleteFileByUrl } = require('../services/b2Service');

jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../models/Student', () => ({
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock('../services/b2Service', () => ({
  uploadFile: jest.fn(),
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

describe('uploadUserPhoto controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 400 when file is not provided', async () => {
    const req = {
      file: null,
      params: { id: '507f1f77bcf86cd799439011' },
      user: { id: '507f1f77bcf86cd799439011', role: 'teacher' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await uploadUserPhoto(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No file uploaded' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when teacher uploads photo for another user', async () => {
    const req = {
      file: { buffer: Buffer.from('file'), originalname: 'avatar.jpg' },
      params: { id: '507f1f77bcf86cd799439011' },
      user: { id: '507f1f77bcf86cd799439012', role: 'teacher' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await uploadUserPhoto(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access denied' });
    expect(User.findById).not.toHaveBeenCalled();
  });

  test('returns 403 when student uploads photo for another user', async () => {
    const req = {
      file: { buffer: Buffer.from('file'), originalname: 'avatar.jpg' },
      params: { id: '507f1f77bcf86cd799439011' },
      user: { id: '507f1f77bcf86cd799439013', role: 'student' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await uploadUserPhoto(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access denied' });
    expect(User.findById).not.toHaveBeenCalled();
  });

  test('allows student to upload own photo', async () => {
    const user = {
      _id: '507f1f77bcf86cd799439013',
      role: 'student',
      photo_url: null,
      save: jest.fn().mockResolvedValue(undefined),
    };

    User.findById.mockResolvedValue(user);
    uploadFile.mockResolvedValue('https://cdn.example/student-avatar.jpg');

    const req = {
      file: { buffer: Buffer.from('file'), originalname: 'avatar.jpg' },
      params: { id: '507f1f77bcf86cd799439013' },
      user: { id: '507f1f77bcf86cd799439013', role: 'student' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await uploadUserPhoto(req, res, next);

    expect(uploadFile).toHaveBeenCalledWith(req.file.buffer, 'avatar.jpg', 'avatars/users');
    expect(user.photo_url).toBe('https://cdn.example/student-avatar.jpg');
    expect(user.save).toHaveBeenCalled();
    expect(Student.findOneAndUpdate).toHaveBeenCalledWith(
      { user_id: '507f1f77bcf86cd799439013' },
      { photo_url: 'https://cdn.example/student-avatar.jpg' }
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { photo_url: 'https://cdn.example/student-avatar.jpg' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 when user is not found', async () => {
    User.findById.mockResolvedValue(null);

    const req = {
      file: { buffer: Buffer.from('file'), originalname: 'avatar.jpg' },
      params: { id: '507f1f77bcf86cd799439011' },
      user: { id: '507f1f77bcf86cd799439011', role: 'admin' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await uploadUserPhoto(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
  });

  test('uploads photo, updates user photo_url and returns 200 payload', async () => {
    const user = {
      photo_url: 'https://old.example/avatar.jpg',
      save: jest.fn().mockResolvedValue(undefined),
    };

    User.findById.mockResolvedValue(user);
    uploadFile.mockResolvedValue('https://cdn.example/new-avatar.jpg');

    const req = {
      file: { buffer: Buffer.from('file'), originalname: 'avatar.jpg' },
      params: { id: '507f1f77bcf86cd799439011' },
      user: { id: '507f1f77bcf86cd799439011', role: 'teacher' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await uploadUserPhoto(req, res, next);

    expect(deleteFileByUrl).toHaveBeenCalledWith('https://old.example/avatar.jpg');
    expect(uploadFile).toHaveBeenCalledWith(req.file.buffer, 'avatar.jpg', 'avatars/users');
    expect(user.photo_url).toBe('https://cdn.example/new-avatar.jpg');
    expect(user.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { photo_url: 'https://cdn.example/new-avatar.jpg' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('passes unexpected errors to next()', async () => {
    const failure = new Error('db failed');
    User.findById.mockRejectedValue(failure);

    const req = {
      file: { buffer: Buffer.from('file'), originalname: 'avatar.jpg' },
      params: { id: '507f1f77bcf86cd799439011' },
      user: { id: '507f1f77bcf86cd799439011', role: 'admin' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await uploadUserPhoto(req, res, next);

    expect(next).toHaveBeenCalledWith(failure);
  });
});

describe('uploadStudentPhoto controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updates both Student and linked User photo_url', async () => {
    const student = {
      _id: '607f1f77bcf86cd799439021',
      user_id: '507f1f77bcf86cd799439011',
      photo_url: 'https://old.example/student-photo.jpg',
      save: jest.fn().mockResolvedValue(undefined),
    };

    Student.findById.mockResolvedValue(student);
    uploadFile.mockResolvedValue('https://cdn.example/new-student-photo.jpg');
    User.findByIdAndUpdate = jest.fn().mockResolvedValue(undefined);

    const req = {
      file: { buffer: Buffer.from('file'), originalname: 'student.jpg' },
      params: { id: '607f1f77bcf86cd799439021' },
      user: { id: '507f1f77bcf86cd799439010', role: 'admin' },
    };
    const res = createMockRes();
    const next = jest.fn();

    await uploadStudentPhoto(req, res, next);

    expect(deleteFileByUrl).toHaveBeenCalledWith('https://old.example/student-photo.jpg');
    expect(uploadFile).toHaveBeenCalledWith(req.file.buffer, 'student.jpg', 'avatars/students');
    expect(student.photo_url).toBe('https://cdn.example/new-student-photo.jpg');
    expect(student.save).toHaveBeenCalled();
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { photo_url: 'https://cdn.example/new-student-photo.jpg' }
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { photo_url: 'https://cdn.example/new-student-photo.jpg' },
    });
    expect(next).not.toHaveBeenCalled();
  });
});
