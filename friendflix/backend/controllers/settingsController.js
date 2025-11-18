const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get user settings
const getUserSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('settings');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.settings);
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user settings
const updateUserSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update settings
    Object.assign(user.settings, settings);
    
    await user.save();
    
    res.json(user.settings);
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Update last changed timestamp
    user.settings.password.lastChanged = Date.now();
    
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserSettings,
  updateUserSettings,
  changePassword
};