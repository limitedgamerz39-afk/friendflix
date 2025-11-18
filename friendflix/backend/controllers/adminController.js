const Admin = require('../models/Admin');
const User = require('../models/User');
const Post = require('../models/Post');
const jwt = require('jsonwebtoken');
const { emitToUser } = require('../helpers/socketHelper');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Admin login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for admin
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(admin._id);

    res.json({
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments();
    
    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all posts
const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find()
      .populate([
        { path: 'userId', select: 'name username avatar' },
        { path: 'mediaId', select: 'url isVideo' }
      ])
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Post.countDocuments();
    
    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get all posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Delete post
    await Post.findByIdAndDelete(postId);
    
    // Notify user if needed
    emitToUser(post.userId, 'postDeleted', {
      postId,
      message: 'Your post has been removed by admin'
    });
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Block user
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Block user
    user.isActive = false;
    await user.save();
    
    // Notify user
    emitToUser(userId, 'userBlocked', {
      message: 'Your account has been blocked by admin'
    });
    
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unblock user
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Unblock user
    user.isActive = true;
    await user.save();
    
    // Notify user
    emitToUser(userId, 'userUnblocked', {
      message: 'Your account has been unblocked by admin'
    });
    
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user reports (mock implementation)
const getUserReports = async (req, res) => {
  try {
    // This is a mock implementation - in a real app, you would have a reports collection
    const reports = [
      {
        _id: '1',
        reporter: 'user1',
        reportedUser: 'user2',
        reason: 'Inappropriate content',
        status: 'pending',
        createdAt: new Date()
      },
      {
        _id: '2',
        reporter: 'user3',
        reportedUser: 'user4',
        reason: 'Spam',
        status: 'resolved',
        createdAt: new Date()
      }
    ];
    
    res.json(reports);
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const blockedUsers = await User.countDocuments({ isActive: false });
    const reportedContent = 5; // Mock value
    
    res.json({
      totalUsers,
      totalPosts,
      blockedUsers,
      reportedContent
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  getAllUsers,
  getAllPosts,
  deletePost,
  blockUser,
  unblockUser,
  getUserReports,
  getDashboardStats
};