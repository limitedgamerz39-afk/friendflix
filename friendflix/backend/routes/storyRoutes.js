const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  uploadStory,
  getActiveStories,
  getUserStories,
  viewStory,
  getStoryViewers,
  deleteStory,
  createHighlight,
  getUserHighlights
} = require('../controllers/storyController');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// Upload story
router.post('/', protect, upload.single('media'), uploadStory);

// Get all active stories
router.get('/', protect, getActiveStories);

// Get stories by user
router.get('/user/:userId', protect, getUserStories);

// View story (track viewer)
router.post('/:storyId/view', protect, viewStory);

// Get story viewers
router.get('/:storyId/viewers', protect, getStoryViewers);

// Delete story
router.delete('/:storyId', protect, deleteStory);

// Create highlight
router.post('/highlights', protect, createHighlight);

// Get user highlights
router.get('/highlights/user/:userId', protect, getUserHighlights);

module.exports = router;