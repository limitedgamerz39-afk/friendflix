const request = require('supertest');
const express = require('express');
const postRoutes = require('../routes/postRoutes');
const { protect } = require('../middleware/authMiddleware');

// Mock middleware
jest.mock('../middleware/authMiddleware', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  })
}));

// Mock controller functions
jest.mock('../controllers/postController', () => ({
  getReelsFeed: jest.fn((req, res) => {
    res.json({
      posts: [],
      currentPage: 1,
      totalPages: 1,
      totalPosts: 0
    });
  }),
  getWatchFeed: jest.fn((req, res) => {
    res.json({
      posts: [],
      currentPage: 1,
      totalPages: 1,
      totalPosts: 0
    });
  }),
  createPost: jest.fn((req, res) => {
    res.status(201).json({
      _id: 'test-post-id',
      userId: 'test-user-id',
      mediaId: 'test-media-id',
      caption: 'Test post',
      postType: 'reel'
    });
  }),
  getFeed: jest.fn((req, res) => {
    res.json({
      posts: [],
      currentPage: 1,
      totalPages: 1,
      totalPosts: 0
    });
  }),
  getUserPosts: jest.fn((req, res) => {
    res.json({
      posts: [],
      currentPage: 1,
      totalPages: 1,
      totalPosts: 0
    });
  }),
  likePost: jest.fn((req, res) => {
    res.json({
      _id: 'test-post-id',
      likes: []
    });
  }),
  commentOnPost: jest.fn((req, res) => {
    res.json({
      _id: 'test-post-id',
      comments: []
    });
  })
}));

const app = express();
app.use(express.json());
app.use('/api/posts', postRoutes);

describe('Video Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/posts/reels', () => {
    it('should return reels feed', async () => {
      const response = await request(app)
        .get('/api/posts/reels')
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('currentPage');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('totalPosts');
      expect(protect).toHaveBeenCalled();
    });
  });

  describe('GET /api/posts/watch', () => {
    it('should return watch feed', async () => {
      const response = await request(app)
        .get('/api/posts/watch')
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('currentPage');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('totalPosts');
      expect(protect).toHaveBeenCalled();
    });
  });
});