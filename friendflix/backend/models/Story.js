const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  caption: {
    type: String,
    maxlength: 200
  },
  viewers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '1d' } // Auto-delete after 24 hours
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  highlights: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Highlight'
  }]
}, {
  timestamps: true
});

// Index for efficient querying
storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Story', storySchema);