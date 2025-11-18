const TextPost = require('../models/TextPost');

// Create text post
const createTextPost = async (req, res) => {
  try {
    const {
      content,
      hashtags = [],
      mentions = [],
      title = null
    } = req.body;

    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const post = new TextPost({
      userId,
      content: content.trim(),
      hashtags,
      mentions,
      title: title ? title.trim() : null
    });

    await post.save();

    // Populate user info for response
    await post.populate('userId', 'username avatar displayName');

    res.status(201).json({
      success: true,
      message: 'Text post created successfully',
      post
    });

  } catch (error) {
    console.error('Create text post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating text post',
      error: error.message
    });
  }
};

// Get text posts
const getTextPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};
    if (userId) {
      query.userId = userId;
    }

    const posts = await TextPost.find(query)
      .populate('userId', 'username avatar displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TextPost.countDocuments(query);

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get text posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting text posts',
      error: error.message
    });
  }
};

// Get single text post
const getTextPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await TextPost.findById(postId)
      .populate('userId', 'username avatar displayName')
      .populate('comments.userId', 'username avatar displayName');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      post
    });

  } catch (error) {
    console.error('Get text post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting text post',
      error: error.message
    });
  }
};

// Update text post
const updateTextPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, hashtags, mentions, title } = req.body;
    const userId = req.user.id;

    const post = await TextPost.findOne({ _id: postId, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Update fields
    if (content !== undefined) post.content = content.trim();
    if (hashtags !== undefined) post.hashtags = hashtags;
    if (mentions !== undefined) post.mentions = mentions;
    if (title !== undefined) post.title = title ? title.trim() : null;
    
    post.updatedAt = new Date();

    await post.save();
    await post.populate('userId', 'username avatar displayName');

    res.json({
      success: true,
      message: 'Post updated successfully',
      post
    });

  } catch (error) {
    console.error('Update text post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating text post',
      error: error.message
    });
  }
};

// Delete text post
const deleteTextPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await TextPost.findOne({ _id: postId, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await TextPost.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete text post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting text post',
      error: error.message
    });
  }
};

// Like/unlike post
const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await TextPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const likeIndex = post.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      likes: post.likes.length,
      isLiked: likeIndex === -1
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
      error: error.message
    });
  }
};

// Add comment
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    const post = await TextPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const newComment = {
      userId,
      comment: comment.trim(),
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Populate user info for the new comment
    await post.populate('comments.userId', 'username avatar displayName');
    const addedComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: addedComment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// Get post comments
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const post = await TextPost.findById(postId)
      .select('comments')
      .populate('comments.userId', 'username avatar displayName')
      .slice('comments', [skip, limit]);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      comments: post.comments,
      pagination: {
        page,
        limit,
        total: post.comments.length
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting comments',
      error: error.message
    });
  }
};

module.exports = {
  createTextPost,
  getTextPosts,
  getTextPost,
  updateTextPost,
  deleteTextPost,
  toggleLike,
  addComment,
  getComments
};