const LessonSession = require('../models/LessonSession');
const Lesson = require('../models/Lesson');

const createLessonSession = async (req, res, next) => {
  try {
    const { lesson_id, date } = req.body;

    if (!lesson_id) {
      return res.status(400).json({ success: false, message: 'lesson_id is required' });
    }

    const lesson = await Lesson.findById(lesson_id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (req.user.role === 'teacher' && String(lesson.teacher_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You can only add sessions for your own lessons' });
    }

    const rawSessionDate = date ? new Date(date) : new Date();
    if (Number.isNaN(rawSessionDate.getTime())) {
      return res.status(400).json({ success: false, message: 'date must be a valid date' });
    }
    // Normalize to midnight UTC
    const sessionDate = new Date(Date.UTC(
      rawSessionDate.getUTCFullYear(),
      rawSessionDate.getUTCMonth(),
      rawSessionDate.getUTCDate(),
    ));

    const session = await LessonSession.create({
      lesson_id,
      date: sessionDate,
      created_by: req.user.id,
    });

    return res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const getSessionsByLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (req.user.role === 'teacher' && String(lesson.teacher_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied for this lesson' });
    }

    const sessions = await LessonSession.find({ lesson_id: lessonId })
      .sort({ date: -1 })
      .populate('created_by', 'name');

    return res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

const deleteLessonSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await LessonSession.findById(id).populate('lesson_id');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (req.user.role === 'teacher' && String(session.lesson_id.teacher_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You can only delete sessions for your own lessons' });
    }

    await session.deleteOne();
    return res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createLessonSession, getSessionsByLesson, deleteLessonSession };
