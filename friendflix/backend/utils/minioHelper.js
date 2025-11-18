const minio = require('minio');
require('dotenv').config();

// Initialize MinIO client
let minioClient = null;
let minioEnabled = false;
let minioError = null;

// Try to initialize MinIO client
try {
  if (process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY) {
    minioClient = new minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY
    });
    minioEnabled = true;
    console.log('MinIO client initialized successfully');
  } else {
    console.log('MinIO not configured, file upload features will be disabled');
  }
} catch (error) {
  console.error('Failed to initialize MinIO client:', error.message);
  minioError = error.message;
  minioEnabled = false;
}

const bucketName = process.env.MINIO_MEDIA_BUCKET || 'friendflix-media';

// Create bucket if it doesn't exist (only if MinIO is enabled)
const createBucketIfNotExists = async () => {
  if (!minioEnabled) {
    throw new Error('MinIO service is not available: ' + (minioError || 'Not configured'));
  }

  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`Bucket ${bucketName} created successfully`);
      
      // Set bucket policy to allow public read access
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`]
          }
        ]
      };
      
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log('Bucket policy set successfully');
    } else {
      console.log(`Bucket ${bucketName} already exists`);
    }
  } catch (error) {
    console.error('Error creating bucket:', error.message);
    // If it's an authentication error, disable MinIO
    if (error.code === 'InvalidAccessKeyId' || error.code === 'SignatureDoesNotMatch') {
      minioEnabled = false;
      minioError = error.message;
    }
    throw error;
  }
};

// Upload file to MinIO
const uploadToMinIO = async (file, objectName) => {
  if (!minioEnabled) {
    throw new Error('MinIO service is not available: ' + (minioError || 'Not configured'));
  }

  try {
    // Ensure bucket exists
    await createBucketIfNotExists();
    
    // Upload file
    const metaData = {
      'Content-Type': file.mimetype
    };
    
    const result = await minioClient.putObject(
      bucketName,
      objectName,
      file.buffer,
      file.size,
      metaData
    );
    
    // Return public URL
    const publicUrl = `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${bucketName}/${objectName}`;
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to MinIO:', error.message);
    // If it's an authentication error, disable MinIO
    if (error.code === 'InvalidAccessKeyId' || error.code === 'SignatureDoesNotMatch') {
      minioEnabled = false;
      minioError = error.message;
    }
    throw error;
  }
};

// Delete file from MinIO
const deleteFromMinIO = async (objectName) => {
  if (!minioEnabled) {
    throw new Error('MinIO service is not available: ' + (minioError || 'Not configured'));
  }

  try {
    await minioClient.removeObject(bucketName, objectName);
    console.log(`File ${objectName} deleted successfully`);
  } catch (error) {
    console.error('Error deleting from MinIO:', error.message);
    // If it's an authentication error, disable MinIO
    if (error.code === 'InvalidAccessKeyId' || error.code === 'SignatureDoesNotMatch') {
      minioEnabled = false;
      minioError = error.message;
    }
    throw error;
  }
};

module.exports = {
  uploadToMinIO,
  deleteFromMinIO,
  createBucketIfNotExists,
  minioEnabled,
  minioClient
};