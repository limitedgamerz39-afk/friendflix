const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    trim: true,
    sparse: true // Allows null values without violating unique constraint
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    minlength: 6,
    // Not required for Google login users
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values without violating unique constraint
  },
  avatar: {
    type: String
  },
  bio: {
    type: String,
    maxlength: 500
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  settings: {
    password: {
      lastChanged: {
        type: Date,
        default: Date.now
      }
    },
    notifications: {
      push: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      isPrivate: {
        type: Boolean,
        default: false
      }
    },
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      darkMode: {
        type: Boolean,
        default: false
      }
    }
  }
}, {
  timestamps: true
});

// Hash password before saving (only for non-Google users)
userSchema.pre('save', async function(next) {
  // Only hash the password if it's been modified and exists
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  // Google users won't have a password
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);