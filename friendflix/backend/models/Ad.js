const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['banner', 'interstitial', 'rewarded'],
    required: true
  },
  provider: {
    type: String,
    enum: ['admob', 'facebook', 'custom'],
    default: 'admob'
  },
  adUnitId: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  schedule: {
    frequency: {
      type: Number, // Show every N minutes
      default: 30
    },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  targeting: {
    minAge: {
      type: Number
    },
    maxAge: {
      type: Number
    },
    countries: [{
      type: String
    }],
    userSegments: [{
      type: String
    }]
  },
  metrics: {
    impressions: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    completions: { // For rewarded ads
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Ad', adSchema);