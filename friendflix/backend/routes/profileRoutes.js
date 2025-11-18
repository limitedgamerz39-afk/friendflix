const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadProfilePicture } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const minioStorage = require('multer-minio-storage');

// Multer configuration for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Profile routes
router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadProfilePicture);

module.exports = router;