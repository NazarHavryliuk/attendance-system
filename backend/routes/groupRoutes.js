const express = require('express');
const { getGroups, createGroup, updateGroup, deleteGroup } = require('../controllers/groupController');
const validateObjectId = require('../middlewares/validateObjectId');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getGroups);
router.post('/register', authorizeRoles('admin'), createGroup);
router.put('/:id', authorizeRoles('admin'), validateObjectId('id'), updateGroup);
router.delete('/:id', authorizeRoles('admin'), validateObjectId('id'), deleteGroup);

module.exports = router;
