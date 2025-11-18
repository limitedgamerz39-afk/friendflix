const express = require('express');
const router = express.Router();
const { 
  savePost,
  unsavePost,
  getSavedPosts,
  isPostSaved
} = require('../controllers/saveController');
const { protect } = require('../middleware/authMiddleware');

// Save a post
router.post('/save', protect, savePost);

// Unsave a post
router.post('/unsave', protect, unsavePost);

// Get saved posts
router.get('/saved', protect, getSavedPosts);

// Check if a post is saved
router.get('/is-saved/:postId', protect, isPostSaved);

module.exports = router;