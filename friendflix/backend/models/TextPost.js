const mongoose = require('mongoose');

const textPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2200
  },
  hashtags: [{
    type: String,
    trim: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true,
      maxlength: 2200
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
textPostSchema.index({ userId: 1 });
textPostSchema.index({ createdAt: -1 });
textPostSchema.index({ 'likes.userId': 1 });

// Static method to get feed posts
textPostSchema.statics.getFeedPosts = async function(followerIds, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ userId: { $in: followerIds } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate([
      { path: 'userId', select: 'name username avatar' }
    ]);
};

// Static method to get feed posts count
textPostSchema.statics.getFeedPostsCount = async function(followerIds) {
  return this.countDocuments({ userId: { $in: followerIds } });
};

module.exports = mongoose.model('TextPost', textPostSchema);