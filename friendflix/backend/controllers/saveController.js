const User = require('../models/User');
const Post = require('../models/Post');

// Save a post
const savePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add post to user's saved posts if not already saved
    const user = await User.findById(userId);
    if (!user.savedPosts.includes(postId)) {
      user.savedPosts.push(postId);
      await user.save();
    }

    res.json({ message: 'Post saved successfully', saved: true });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ message: 'Error saving post', error: error.message });
  }
};

// Remove a saved post
const unsavePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;

    // Remove post from user's saved posts
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { savedPosts: postId } },
      { new: true }
    );

    res.json({ message: 'Post unsaved successfully', saved: false });
  } catch (error) {
    console.error('Unsave post error:', error);
    res.status(500).json({ message: 'Error unsaving post', error: error.message });
  }
};

// Get saved posts
const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with populated saved posts
    const user = await User.findById(userId)
      .populate({
        path: 'savedPosts',
        populate: [
          { path: 'userId', select: 'name username avatar' },
          { path: 'mediaId', select: 'url isVideo uploadType' }
        ]
      });

    // Sort saved posts by saved date (most recent first)
    // Since we don't store saved date, we'll return them as is
    const savedPosts = user.savedPosts || [];

    res.json({ savedPosts });
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ message: 'Error fetching saved posts', error: error.message });
  }
};

// Check if a post is saved
const isPostSaved = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const isSaved = user.savedPosts.includes(postId);

    res.json({ isSaved });
  } catch (error) {
    console.error('Check saved post error:', error);
    res.status(500).json({ message: 'Error checking if post is saved', error: error.message });
  }
};

module.exports = {
  savePost,
  unsavePost,
  getSavedPosts,
  isPostSaved
};