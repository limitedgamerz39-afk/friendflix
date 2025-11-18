const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const { protect } = require('../middleware/authMiddleware');

// Get user profile by ID
router.get('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('name username email avatar bio');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Get user posts
router.get('/:userId/posts', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find({ userId })
      .skip(skip)
      .limit(limit)
      .populate([
        { path: 'userId', select: 'name username avatar' },
        { path: 'mediaId', select: 'url isVideo' }
      ])
      .sort({ createdAt: -1 });
    
    const total = await Post.countDocuments({ userId });
    
    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Error fetching user posts' });
  }
});

module.exports = router;