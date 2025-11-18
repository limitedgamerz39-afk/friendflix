const express = require('express');
const router = express.Router();
const { 
  createPost,
  getFeed,
  getUserPosts,
  likePost,
  commentOnPost,
  getReelsFeed,
  getWatchFeed
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// Post routes
router.post('/', protect, createPost);
router.get('/feed', protect, getFeed);
router.get('/reels', protect, getReelsFeed);
router.get('/watch', protect, getWatchFeed);
router.get('/user/:userId', protect, getUserPosts);
router.post('/:postId/like', protect, likePost);
router.post('/:postId/comment', protect, commentOnPost);

module.exports = router;