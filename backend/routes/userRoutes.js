const express = require('express');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const validateObjectId = require('../middlewares/validateObjectId');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('admin'));

router.get('/', getUsers);
router.post('/register', createUser);
router.put('/:id', validateObjectId('id'), updateUser);
router.delete('/:id', validateObjectId('id'), deleteUser);

module.exports = router;
