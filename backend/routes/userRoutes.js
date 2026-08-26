const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  createUser, 
  updateUser, 
  toggleUserStatus, 
  resetPassword 
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Enforce that all user management actions require authenticated admin access
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser);

router.route('/:id/status')
  .put(toggleUserStatus);

router.route('/:id/reset-password')
  .put(resetPassword);

module.exports = router;
