const express = require('express');
const router = express.Router();
const { 
  createTextPost,
  getTextPosts,
  getTextPost,
  updateTextPost,
  deleteTextPost,
  toggleLike: likeTextPost,
  addComment: commentOnTextPost
} = require('../controllers/textPostController');
const { protect } = require('../middleware/authMiddleware');

// Text post routes
router.post('/', protect, createTextPost);
router.get('/', protect, getTextPosts);
router.get('/:postId', protect, getTextPost);
router.put('/:postId', protect, updateTextPost);
router.delete('/:postId', protect, deleteTextPost);
router.post('/:postId/like', protect, likeTextPost);
router.post('/:postId/comment', protect, commentOnTextPost);

module.exports = router;