const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

// Get video metadata using ffmpeg
const getVideoMetadata = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        resolve({
          duration: Math.floor(metadata.format.duration),
          width: videoStream?.width,
          height: videoStream?.height,
          bitrate: metadata.format.bit_rate,
          codec: videoStream?.codec_name
        });
      }
    });
  });
};

// Generate thumbnail from video
const generateThumbnail = (videoPath, thumbnailPath, time = 1) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [time],
        filename: thumbnailPath,
        folder: '.',
        size: '320x240'
      })
      .on('end', () => resolve(thumbnailPath))
      .on('error', reject);
  });
};

// Convert video to different format/resolution
const convertVideo = (inputPath, outputPath, options = {}) => {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath);
    
    // Apply options
    if (options.resolution) {
      command = command.size(options.resolution);
    }
    
    if (options.codec) {
      command = command.videoCodec(options.codec);
    }
    
    if (options.bitrate) {
      command = command.videoBitrate(options.bitrate);
    }
    
    command
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
};

module.exports = {
  getVideoMetadata,
  generateThumbnail,
  convertVideo
};