# Video Features Documentation

## Overview
This document describes the new video features added to Friendflix, including Reels/Shorts and Watch functionality.

## Features Implemented

### 1. Reels/Shorts
- Vertical full-screen video feed similar to Instagram Reels/YouTube Shorts
- Autoplay videos as user scrolls vertically
- Like, comment, share, and save buttons overlaid on each video
- Backend support for trending, recommended, and following tabs

### 2. Watch (Long-form Videos)
- YouTube-style interface for long-form videos
- Horizontal feeds: trending, subscriptions (followed users), categories
- Each video has title, description, channel info, view/like/comment/share buttons
- Video suggestions/next-up sidebar and autoplay feature
- Backend supports video playlist and history tracking

### 3. Video Upload
- Optimized for short-form (≤60 sec) and vertical format for Reels
- Support for long video uploads with metadata (title, description, category)
- Automatic duration extraction and storage

## API Endpoints

### Reels
- `GET /api/posts/reels` - Get reels feed
- Supports pagination with `page` and `limit` query parameters

### Watch
- `GET /api/posts/watch` - Get watch feed
- Supports pagination and category filtering with `page`, `limit`, and `category` query parameters

### Video Upload
- `POST /api/media/initialize` - Initialize upload with metadata
- `POST /api/media/chunk` - Upload chunk
- `POST /api/media/complete` - Complete upload with metadata
- `POST /api/posts` - Create post with video metadata

## Data Models

### Post Model
New fields added:
- `title` (String) - Video title
- `description` (String) - Video description
- `views` (Number) - View count
- `category` (String) - Video category
- `duration` (Number) - Video duration in seconds
- `postType` (String) - Enum: ['post', 'reel', 'story', 'long_video']

### Media Model
New fields added:
- `duration` (Number) - Video duration in seconds
- `uploadType` (String) - Enum: ['post', 'reel', 'story', 'long_video']

## Frontend Components

### Reels Screen
- Vertical scrolling video feed
- Autoplay functionality
- Overlay controls for interaction

### Watch Screen
- Category filtering
- Trending and subscription sections
- Horizontal video previews

### Media Upload Screen
- Tabbed interface for different upload types
- Metadata forms for long videos
- Duration extraction and display

## Migration Scripts
Run `npm run migrate` to update existing database records with new fields.

## Testing
Run `npm test` to verify video upload functionality.