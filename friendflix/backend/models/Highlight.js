const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 50
  },
  coverUrl: {
    type: String,
    required: true
  },
  stories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story'
  }],
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
highlightSchema.index({ userId: 1 });
highlightSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Highlight', highlightSchema);