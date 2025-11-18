# MinIO Setup Instructions

To enable profile picture uploads in the Friendflix app, you need to set up a MinIO server for object storage.

## Prerequisites

1. Docker installed on your system
2. Basic understanding of object storage concepts

## Setting up MinIO with Docker

1. Run MinIO server using Docker:
   ```bash
   docker run -p 9000:9000 -p 9001:9001 \
     -e "MINIO_ROOT_USER=minioadmin" \
     -e "MINIO_ROOT_PASSWORD=minioadmin" \
     -v /path/to/data:/data \
     quay.io/minio/minio server /data --console-address ":9001"
   ```

2. Access MinIO Console:
   - Open your browser and go to http://localhost:9001
   - Login with username: `minioadmin` and password: `minioadmin`

3. Create a bucket:
   - In the MinIO Console, click "Create Bucket"
   - Name the bucket `friendflix-profile-pictures`
   - Set the bucket as public if needed for direct image access

4. Configure access keys:
   - Go to "Access Keys" in the MinIO Console
   - Create a new access key and secret key
   - Update the backend `.env` file with these credentials

## Environment Variables

Update the following variables in the backend `.env` file:

```
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_PUBLIC_URL=http://localhost:9000
```

## Testing

After setting up MinIO, you can test profile picture uploads by:

1. Running the backend server
2. Running the frontend application
3. Navigating to the profile page
4. Uploading a profile picture

The uploaded images will be stored in the MinIO bucket and accessible via the public URL.