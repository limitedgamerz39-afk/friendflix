const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Get user notifications
router.get('/', protect, getUserNotifications);

// Mark notification as read
router.put('/:notificationId/read', protect, markAsRead);

// Mark all notifications as read
router.put('/read-all', protect, markAllAsRead);

// Get unread notifications count
router.get('/unread-count', protect, getUnreadCount);

module.exports = router;