const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Send a new message
router.post('/send', messageController.sendMessage);

// Get chat history with a specific user
router.get('/history/:userId', messageController.getChatHistory);

// Get list of conversations
router.get('/conversations', messageController.getConversations);

// Mark message as read
router.put('/read/:messageId', messageController.markAsRead);

// Delete message
router.delete('/:messageId', messageController.deleteMessage);

// Block user
router.post('/block/:userId', messageController.blockUser);

// Unblock user
router.delete('/unblock/:userId', messageController.unblockUser);

// Report user
router.post('/report/:userId', messageController.reportUser);

module.exports = router;