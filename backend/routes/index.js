const express = require('express');

const authRoutes = require('./authRoutes');
const groupRoutes = require('./groupRoutes');
const studentRoutes = require('./studentRoutes');
const lessonRoutes = require('./lessonRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const statisticsRoutes = require('./statisticsRoutes');
const userRoutes = require('./userRoutes');
const uploadRoutes = require('./uploadRoutes');
const lessonSessionRoutes = require('./lessonSessionRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/groups', groupRoutes);
router.use('/students', studentRoutes);
router.use('/lessons', lessonRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/', statisticsRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/lesson-sessions', lessonSessionRoutes);

module.exports = router;
