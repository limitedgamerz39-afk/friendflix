const Media = require('../models/Media');
const { minioClient, minioEnabled } = require('../utils/minioHelper');
const { processVideo } = require('../utils/videoProcessor');
const { emitToAll } = require('../helpers/socketHelper');

// Initialize upload
const initializeUpload = async (req, res) => {
  try {
    if (!minioEnabled) {
      return res.status(500).json({
        success: false,
        message: 'Media upload service is not available'
      });
    }

    const {
      filename,
      size,
      mimeType,
      isVideo,
      uploadType,
      duration,
      width,
      height,
      title,
      description,
      categories,
      tags
    } = req.body;

    const userId = req.user.id;

    // Validate file size limits
    const maxSizes = {
      post: 50 * 1024 * 1024, // 50MB
      reel: 100 * 1024 * 1024, // 100MB
      long_video: 500 * 1024 * 1024 // 500MB
    };

    const maxSize = maxSizes[uploadType] || maxSizes.post;
    if (size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum ${maxSize / (1024 * 1024)}MB allowed for ${uploadType}`
      });
    }

    // Validate reel duration
    if (uploadType === 'reel' && duration > 60) {
      return res.status(400).json({
        success: false,
        message: 'Reel videos must be 60 seconds or less'
      });
    }

    // Validate long video duration
    if (uploadType === 'long_video' && duration > 900) {
      return res.status(400).json({
        success: false,
        message: 'Videos must be 15 minutes or less'
      });
    }

    // Calculate chunks (5MB each)
    const CHUNK_SIZE = 5 * 1024 * 1024;
    const totalChunks = Math.ceil(size / CHUNK_SIZE);

    // Create media record
    const media = new Media({
      userId,
      filename,
      originalName: filename,
      size,
      mimeType,
      isVideo,
      duration,
      width,
      height,
      uploadType,
      totalChunks,
      uploadStatus: 'pending',
      metadata: {
        title,
        description,
        categories: categories || [],
        tags: tags || [],
        aspectRatio: width && height ? (width / height).toFixed(2) : null
      }
    });

    await media.save();

    // Generate presigned URLs for each chunk
    const presignedUrls = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkKey = `uploads/${media._id}/chunk-${i}`;
      const presignedUrl = await minioClient.presignedPutObject(
        process.env.MINIO_MEDIA_BUCKET || 'friendflix-media',
        chunkKey,
        24 * 60 * 60 // 24 hours
      );
      presignedUrls.push({
        chunkNumber: i,
        url: presignedUrl
      });
    }

    res.json({
      success: true,
      mediaId: media._id,
      presignedUrls,
      totalChunks,
      chunkSize: CHUNK_SIZE
    });

  } catch (error) {
    console.error('Initialize upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing upload',
      error: error.message
    });
  }
};

// Upload chunk
const uploadChunk = async (req, res) => {
  try {
    const { mediaId, chunkNumber, etag } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!mediaId || chunkNumber === undefined || !etag) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Find media record
    const media = await Media.findOne({ _id: mediaId, userId });
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Update chunk status
    const chunkIndex = media.chunks.findIndex(chunk => chunk.chunkNumber === chunkNumber);
    if (chunkIndex > -1) {
      media.chunks[chunkIndex] = {
        chunkNumber,
        etag,
        uploadedAt: new Date()
      };
    } else {
      media.chunks.push({
        chunkNumber,
        etag,
        uploadedAt: new Date()
      });
    }

    // Update upload progress
    media.uploadedChunks = media.chunks.length;
    media.uploadStatus = 'uploading';

    await media.save();

    res.json({
      success: true,
      message: 'Chunk uploaded successfully',
      uploadedChunks: media.chunks.length,
      totalChunks: media.totalChunks
    });

  } catch (error) {
    console.error('Upload chunk error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading chunk',
      error: error.message
    });
  }
};

// Finalize upload
const finalizeUpload = async (req, res) => {
  try {
    const { mediaId, caption, uploadType, ...metadata } = req.body;
    const userId = req.user.id;

    // Find media record
    const media = await Media.findOne({ _id: mediaId, userId });
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Check if all chunks are uploaded
    if (media.chunks.length !== media.totalChunks) {
      return res.status(400).json({
        success: false,
        message: 'Not all chunks have been uploaded',
        uploadedChunks: media.chunks.length,
        totalChunks: media.totalChunks
      });
    }

    // Combine chunks and create final file
    const finalObjectName = `media/${userId}/${media._id}/${media.filename}`;
    
    // In production, you would combine chunks here
    // For now, we'll simulate the process
    
    // Update media record
    media.url = `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${process.env.MINIO_MEDIA_BUCKET || 'friendflix-media'}/${finalObjectName}`;
    media.caption = caption;
    media.uploadType = uploadType;
    media.uploadStatus = 'completed';
    media.uploadedAt = new Date();
    
    // Update metadata
    media.metadata = {
      ...media.metadata,
      ...metadata,
      caption,
      finalUrl: media.url
    };

    // For videos, start processing
    if (media.isVideo) {
      media.processingStatus = 'queued';
      // In production, you would queue video processing here
      // await processVideo(media);
    }

    await media.save();

    // Emit event to notify clients that media upload is completed
    emitToAll('mediaUploadCompleted', {
      mediaId: media._id,
      userId: media.userId,
      status: media.uploadStatus,
      url: media.url
    });

    res.json({
      success: true,
      message: 'Upload successfully',
      media: {
        id: media._id,
        url: media.url,
        type: media.uploadType,
        status: media.uploadStatus
      }
    });

  } catch (error) {
    console.error('Finalize upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error finalizing upload',
      error: error.message
    });
  }
};

// Get user media
const getUserMedia = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    const targetUserId = userId || currentUserId;
    
    const media = await Media.find({ userId: targetUserId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      media
    });
  } catch (error) {
    console.error('Get user media error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching media',
      error: error.message
    });
  }
};

// Get upload status
const getUploadStatus = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const userId = req.user.id;

    const media = await Media.findOne({ _id: mediaId, userId });
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    res.json({
      success: true,
      media: {
        id: media._id,
        uploadStatus: media.uploadStatus,
        processingStatus: media.processingStatus,
        uploadedChunks: media.chunks.length,
        totalChunks: media.totalChunks,
        progress: Math.round((media.chunks.length / media.totalChunks) * 100)
      }
    });
  } catch (error) {
    console.error('Get upload status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upload status',
      error: error.message
    });
  }
};

// Delete media
const deleteMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const userId = req.user.id;

    const media = await Media.findOne({ _id: mediaId, userId });
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Delete from MinIO (in production)
    if (media.url && minioEnabled) {
      try {
        const urlParts = media.url.split('/');
        const objectName = urlParts.slice(3).join('/');
        await minioClient.removeObject(
          process.env.MINIO_MEDIA_BUCKET || 'friendflix-media',
          objectName
        );
      } catch (minioError) {
        console.error('Error deleting from MinIO:', minioError);
      }
    }

    await Media.findByIdAndDelete(mediaId);

    res.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting media',
      error: error.message
    });
  }
};

module.exports = {
  initializeUpload,
  uploadChunk,
  finalizeUpload,
  getUserMedia,
  getUploadStatus,
  deleteMedia
};