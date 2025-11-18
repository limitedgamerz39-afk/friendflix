const User = require('../models/User');
const { minioClient, minioEnabled, minioError } = require('../utils/minioHelper');

// Create bucket if it doesn't exist (only if MinIO is enabled)
const bucketName = 'friendflix-profile-pictures';
if (minioEnabled && minioClient) {
  minioClient.bucketExists(bucketName, (err, exists) => {
    if (err) {
      console.error('Error checking bucket existence:', err.message);
      // If it's an authentication error, disable MinIO
      if (err.code === 'InvalidAccessKeyId' || err.code === 'SignatureDoesNotMatch') {
        minioEnabled = false;
        minioError = err.message;
      }
      return;
    }
    if (!exists) {
      minioClient.makeBucket(bucketName, 'us-east-1', (err) => {
        if (err) {
          console.error('Error creating bucket:', err.message);
          // If it's an authentication error, disable MinIO
          if (err.code === 'InvalidAccessKeyId' || err.code === 'SignatureDoesNotMatch') {
            minioEnabled = false;
            minioError = err.message;
          }
        } else {
          console.log('Bucket created successfully');
        }
      });
    } else {
      console.log(`Bucket ${bucketName} already exists`);
    }
  });
} else {
  console.log('MinIO is not enabled, skipping bucket initialization for profile pictures');
}

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, username, bio } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, username, bio },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    // Check if MinIO is enabled
    if (!minioEnabled) {
      return res.status(500).json({ 
        message: 'File upload service is not available. Please contact administrator.',
        error: minioError || 'MinIO service is not configured properly'
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileName = `${req.user.id}-${Date.now()}-${req.file.originalname}`;
    
    // Upload file to MinIO
    await minioClient.putObject(
      bucketName,
      fileName,
      req.file.buffer,
      req.file.size,
      { 'Content-Type': req.file.mimetype }
    );
    
    // Generate public URL
    const publicUrl = `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${bucketName}/${fileName}`;
    
    // Update user's avatar URL
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: publicUrl },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Profile picture uploaded successfully',
      avatar: publicUrl,
      user
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    // If it's an authentication error, disable MinIO
    if (error.code === 'InvalidAccessKeyId' || error.code === 'SignatureDoesNotMatch') {
      minioEnabled = false;
      minioError = error.message;
      return res.status(500).json({ 
        message: 'File upload service is not available due to authentication issues.',
        error: error.message
      });
    }
    res.status(500).json({ message: 'Error uploading profile picture', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture
};