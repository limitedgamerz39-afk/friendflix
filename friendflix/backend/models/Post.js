const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mediaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media'
  },
  mediaIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media'
  }],
  caption: {
    type: String,
    maxlength: 2200
  },
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
  postType: {
    type: String,
    enum: ['post', 'reel', 'story', 'long_video'],
    default: 'post'
  },
  title: {
    type: String,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 5000
  },
  views: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['entertainment', 'education', 'music', 'sports', 'news', 'gaming', 'other'],
    default: 'other'
  },
  duration: {
    type: Number // Duration in seconds
  }
}, {
  timestamps: true
});

// Validate that either mediaId or mediaIds is provided
postSchema.pre('validate', function(next) {
  if (!this.mediaId && (!this.mediaIds || this.mediaIds.length === 0)) {
    next(new Error('Either mediaId or mediaIds must be provided'));
  } else if (this.mediaId && this.mediaIds && this.mediaIds.length > 0) {
    next(new Error('Cannot provide both mediaId and mediaIds'));
  } else {
    next();
  }
});

// Indexes for better query performance
postSchema.index({ userId: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'likes.userId': 1 });

// Static method to get feed posts
postSchema.statics.getFeedPosts = async function(followerIds, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ userId: { $in: followerIds } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate([
      { path: 'userId', select: 'name username avatar' },
      { path: 'mediaId', select: 'url isVideo uploadStatus' }
    ]);
};

// Static method to get feed posts count
postSchema.statics.getFeedPostsCount = async function(followerIds) {
  return this.countDocuments({ userId: { $in: followerIds } });
};

// Static method to get valid posts (with completed media or text-only)
postSchema.statics.getValidPosts = async function(filter, options = {}) {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;
  
  // Add validation to filter
  const validatedFilter = {
    ...filter,
    $or: [
      { caption: { $exists: true, $ne: "" }, mediaId: null, mediaIds: { $size: 0 } },
      { "mediaId.uploadStatus": "completed" },
      { "mediaId.uploadStatus": "pending" },
      { "mediaId.uploadStatus": "uploading" },
      { "mediaIds.uploadStatus": "completed" },
      { "mediaIds.uploadStatus": "pending" },
      { "mediaIds.uploadStatus": "uploading" }
    ]
  };
  
  return this.find(validatedFilter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate([
      { path: 'userId', select: 'name username avatar' },
      { path: 'mediaId', select: 'url isVideo uploadType duration uploadStatus' },
      { path: 'mediaIds', select: 'url isVideo uploadType duration uploadStatus' }
    ]);
};

module.exports = mongoose.model('Post', postSchema);