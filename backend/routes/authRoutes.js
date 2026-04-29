const express = require('express');
const { login, me, changeMyPassword, bootstrapAdmin } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', login);
router.post('/bootstrap-admin', bootstrapAdmin);
router.get('/me', authenticate, me);
router.put('/change-password', authenticate, changeMyPassword);

module.exports = router;
