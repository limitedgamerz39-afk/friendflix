const Follow = require('../models/Follow');
const User = require('../models/User');
const { emitToUser, emitToAll } = require('../helpers/socketHelper');
const { createNotification } = require('./notificationController');

// Follow a user
const followUser = async (req, res) => {
  try {
    const { userId } = req.params; // User to follow
    const followerId = req.user.id; // Current user

    // Check if user is trying to follow themselves
    if (userId === followerId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({ follower: followerId, following: userId });
    if (existingFollow) {
      return res.status(400).json({ message: 'You are already following this user' });
    }

    // Create follow relationship
    const follow = new Follow({
      follower: followerId,
      following: userId
    });

    await follow.save();
    
    // Create notification for followed user
    const sender = await User.findById(followerId).select('name username');
    const message = `${sender.name} started following you`;
    await createNotification(userId, followerId, 'follow', null, message);

    // Emit real-time update
    emitToUser(userId, 'userFollowed', {
      followerId,
      message: 'Someone followed you'
    });

    res.status(201).json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Error following user' });
  }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params; // User to unfollow
    const followerId = req.user.id; // Current user

    // Check if user is trying to unfollow themselves
    if (userId === followerId) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }

    // Check if following
    const follow = await Follow.findOneAndDelete({ follower: followerId, following: userId });
    if (!follow) {
      return res.status(400).json({ message: 'You are not following this user' });
    }

    // Emit real-time update
    emitToUser(userId, 'userUnfollowed', {
      followerId,
      message: 'Someone unfollowed you'
    });

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: 'Error unfollowing user' });
  }
};

// Get followers count
const getFollowersCount = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const count = await Follow.countDocuments({ following: userId });
    
    res.json({ count });
  } catch (error) {
    console.error('Get followers count error:', error);
    res.status(500).json({ message: 'Error fetching followers count' });
  }
};

// Get following count
const getFollowingCount = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const count = await Follow.countDocuments({ follower: userId });
    
    res.json({ count });
  } catch (error) {
    console.error('Get following count error:', error);
    res.status(500).json({ message: 'Error fetching following count' });
  }
};

// Get followers list
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const followers = await Follow.find({ following: userId })
      .skip(skip)
      .limit(limit)
      .populate('follower', 'name username avatar');
    
    const total = await Follow.countDocuments({ following: userId });
    
    res.json({
      followers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Error fetching followers' });
  }
};

// Get following list
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const following = await Follow.find({ follower: userId })
      .skip(skip)
      .limit(limit)
      .populate('following', 'name username avatar');
    
    const total = await Follow.countDocuments({ follower: userId });
    
    res.json({
      following,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Error fetching following' });
  }
};

// Check if user is following another user
const isFollowing = async (req, res) => {
  try {
    const { userId } = req.params; // User to check if following
    const followerId = req.user.id; // Current user

    const follow = await Follow.findOne({ follower: followerId, following: userId });
    
    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Check following error:', error);
    res.status(500).json({ message: 'Error checking follow status' });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowersCount,
  getFollowingCount,
  getFollowers,
  getFollowing,
  isFollowing
};