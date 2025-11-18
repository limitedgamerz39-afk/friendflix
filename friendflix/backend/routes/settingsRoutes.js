const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserSettings,
  updateUserSettings,
  changePassword
} = require('../controllers/settingsController');

// Get user settings
router.get('/', protect, getUserSettings);

// Update user settings
router.put('/', protect, updateUserSettings);

// Change password
router.put('/password', protect, changePassword);

module.exports = router;