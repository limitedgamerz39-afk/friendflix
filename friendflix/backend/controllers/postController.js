const Post = require('../models/Post');
const Media = require('../models/Media');
const User = require('../models/User');
const { emitToUser, emitToAll } = require('../helpers/socketHelper');
const { createNotification } = require('./notificationController');

// Create a new post
const createPost = async (req, res) => {
  try {
    const { mediaId, mediaIds, caption, postType, title, description, category, duration } = req.body;
    const userId = req.user.id;

    // Verify media belongs to user or is completed
    let media = null;
    let medias = [];
    
    if (mediaId) {
      media = await Media.findOne({ 
        _id: mediaId, 
        $or: [
          { userId },
          { uploadStatus: 'completed' },
          { uploadStatus: 'pending' },
          { uploadStatus: 'uploading' }
        ]
      });
      
      if (!media) {
        return res.status(404).json({ message: 'Media not found' });
      }
    } else if (mediaIds && mediaIds.length > 0) {
      medias = await Media.find({ 
        _id: { $in: mediaIds },
        $or: [
          { userId },
          { uploadStatus: 'completed' },
          { uploadStatus: 'pending' },
          { uploadStatus: 'uploading' }
        ]
      });
      
      if (medias.length !== mediaIds.length) {
        return res.status(404).json({ message: 'One or more media not found' });
      }
    } else {
      // For text-only posts
      if (!caption) {
        return res.status(400).json({ message: 'Caption is required for text-only posts' });
      }
    }

    // Create post
    const post = new Post({
      userId,
      mediaId,
      mediaIds: mediaIds || [],
      caption,
      postType: postType || 'post',
      title,
      description,
      category,
      duration: duration || (media ? media.duration : null)
    });

    await post.save();

    // Populate post with user and media details
    await post.populate([
      { path: 'userId', select: 'name username avatar' },
      { path: 'mediaId', select: 'url isVideo uploadType duration uploadStatus' },
      { path: 'mediaIds', select: 'url isVideo uploadType duration uploadStatus' }
    ]);

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
};

// Get feed posts (from followed users)
const getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // For now, we'll get posts from all users (in a real app, you'd get posts from followed users)
    // In a real implementation, you would have a followers/following system
    // For demo purposes, we'll assume the user follows everyone
    const followerIds = [userId]; // In real app, this would be populated from a followers collection
    
    // Get all user IDs for demo purposes
    const allUsers = await User.find({}, '_id');
    const allUserIds = allUsers.map(user => user._id);
    
    // Get valid posts using the static method
    const posts = await Post.getValidPosts(
      { userId: { $in: allUserIds } },
      { page, limit }
    );
    
    const totalPosts = await Post.countDocuments({ 
      userId: { $in: allUserIds },
      $or: [
        { caption: { $exists: true, $ne: "" }, mediaId: null, mediaIds: { $size: 0 } },
        { "mediaId.uploadStatus": "completed" },
        { "mediaId.uploadStatus": "pending" },
        { "mediaId.uploadStatus": "uploading" },
        { "mediaIds.uploadStatus": "completed" },
        { "mediaIds.uploadStatus": "pending" },
        { "mediaIds.uploadStatus": "uploading" }
      ]
    });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Error fetching feed' });
  }
};

// Get user's posts
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get valid posts using the static method
    const posts = await Post.getValidPosts(
      { userId },
      { page, limit }
    );

    const totalPosts = await Post.countDocuments({ 
      userId,
      $or: [
        { caption: { $exists: true, $ne: "" }, mediaId: null, mediaIds: { $size: 0 } },
        { "mediaId.uploadStatus": "completed" },
        { "mediaId.uploadStatus": "pending" },
        { "mediaId.uploadStatus": "uploading" },
        { "mediaIds.uploadStatus": "completed" },
        { "mediaIds.uploadStatus": "pending" },
        { "mediaIds.uploadStatus": "uploading" }
      ]
    });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Error fetching user posts' });
  }
};

// Like a post
const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already liked the post
    const alreadyLiked = post.likes.some(like => like.userId.toString() === userId);
    
    if (alreadyLiked) {
      // Unlike the post
      post.likes = post.likes.filter(like => like.userId.toString() !== userId);
    } else {
      // Like the post
      post.likes.push({ userId });
      
      // Create notification for post owner (if not the same user)
      if (post.userId.toString() !== userId) {
        const sender = await User.findById(userId).select('name username');
        const message = `${sender.name} liked your post`;
        await createNotification(post.userId, userId, 'like', post._id, message);
      }
    }

    await post.save();

    // Populate post with user and media details
    await post.populate([
      { path: 'userId', select: 'name username avatar' },
      { path: 'mediaId', select: 'url isVideo uploadType duration uploadStatus' }
    ]);

    // Emit real-time update
    emitToAll('postLiked', {
      postId: post._id,
      likes: post.likes,
      liked: !alreadyLiked
    });

    res.json(post);
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Error liking post' });
  }
};

// Add comment to post
const commentOnPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add comment
    const comment = {
      userId,
      text
    };
    post.comments.push(comment);
    
    // Create notification for post owner (if not the same user)
    if (post.userId.toString() !== userId) {
      const sender = await User.findById(userId).select('name username');
      const message = `${sender.name} commented on your post: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`;
      await createNotification(post.userId, userId, 'comment', post._id, message);
    }

    await post.save();

    // Populate post with user and media details
    await post.populate([
      { path: 'userId', select: 'name username avatar' },
      { path: 'mediaId', select: 'url isVideo uploadType duration uploadStatus' }
    ]);

    // Populate the new comment with user details
    await post.populate({
      path: 'comments.userId',
      select: 'name username avatar'
    });

    // Emit real-time update
    emitToAll('postCommented', {
      postId: post._id,
      comment: post.comments[post.comments.length - 1],
      commentsCount: post.comments.length
    });

    res.json(post);
  } catch (error) {
    console.error('Comment on post error:', error);
    res.status(500).json({ message: 'Error commenting on post' });
  }
};

// Get reels feed (short vertical videos)
const getReelsFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const tab = req.query.tab || 'following'; // following, trending, recommended

    let filter = { postType: 'reel' };
    
    // Apply different filters based on the tab
    switch (tab) {
      case 'trending':
        // For trending, we sort by views and likes
        filter = { 
          postType: 'reel',
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        };
        break;
      case 'recommended':
        // For recommended, we could use some algorithm based on user preferences
        // For now, we'll just get recent reels
        filter = { 
          postType: 'reel',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        };
        break;
      case 'following':
      default:
        // For following, we would filter by followed users
        // In a real app, you would have a followers/following system
        // For demo purposes, we'll get all reels
        filter = { postType: 'reel' };
        break;
    }

    // Get valid posts using the static method
    const posts = await Post.getValidPosts(filter, { page, limit });

    const totalPosts = await Post.countDocuments({ 
      ...filter,
      $or: [
        { "mediaId.uploadStatus": "completed" },
        { "mediaId.uploadStatus": "pending" },
        { "mediaId.uploadStatus": "uploading" },
        { "mediaIds.uploadStatus": "completed" },
        { "mediaIds.uploadStatus": "pending" },
        { "mediaIds.uploadStatus": "uploading" }
      ]
    });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts
    });
  } catch (error) {
    console.error('Get reels feed error:', error);
    res.status(500).json({ message: 'Error fetching reels feed' });
  }
};

// Get watch feed (long-form videos)
const getWatchFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;

    // Build query filter
    const filter = { postType: 'long_video' };
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Get valid posts using the static method
    const posts = await Post.getValidPosts(filter, { page, limit });

    const totalPosts = await Post.countDocuments({ 
      ...filter,
      $or: [
        { "mediaId.uploadStatus": "completed" },
        { "mediaId.uploadStatus": "pending" },
        { "mediaId.uploadStatus": "uploading" },
        { "mediaIds.uploadStatus": "completed" },
        { "mediaIds.uploadStatus": "pending" },
        { "mediaIds.uploadStatus": "uploading" }
      ]
    });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts
    });
  } catch (error) {
    console.error('Get watch feed error:', error);
    res.status(500).json({ message: 'Error fetching watch feed' });
  }
};

module.exports = {
  createPost,
  getFeed,
  getUserPosts,
  likePost,
  commentOnPost,
  getReelsFeed,
  getWatchFeed
};