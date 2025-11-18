const express = require('express');
const router = express.Router();
const {
  login,
  getAllUsers,
  getAllPosts,
  deletePost,
  blockUser,
  unblockUser,
  getUserReports,
  getDashboardStats
} = require('../controllers/adminController');
const { adminAuth } = require('../middleware/adminAuth');

// Admin login
router.post('/login', login);

// Protected routes
router.get('/dashboard/stats', adminAuth, getDashboardStats);
router.get('/users', adminAuth, getAllUsers);
router.get('/posts', adminAuth, getAllPosts);
router.delete('/posts/:postId', adminAuth, deletePost);
router.post('/users/:userId/block', adminAuth, blockUser);
router.post('/users/:userId/unblock', adminAuth, unblockUser);
router.get('/reports', adminAuth, getUserReports);

module.exports = router;