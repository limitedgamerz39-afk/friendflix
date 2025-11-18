const express = require('express');
const router = express.Router();
const { 
  initializeUpload, 
  uploadChunk, 
  finalizeUpload, 
  getUserMedia,
  getUploadStatus,
  deleteMedia
} = require('../controllers/mediaController');
const { protect } = require('../middleware/authMiddleware');

// Media routes
router.post('/initialize', protect, initializeUpload);
router.post('/chunk', protect, uploadChunk);
router.post('/finalize', protect, finalizeUpload);
router.get('/user/:userId', protect, getUserMedia); // Get specific user's media
router.get('/user', protect, getUserMedia); // Get current user's media
router.get('/status/:mediaId', protect, getUploadStatus); // Get upload status
router.delete('/:mediaId', protect, deleteMedia);

module.exports = router;