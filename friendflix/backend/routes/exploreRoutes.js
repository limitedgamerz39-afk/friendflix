const express = require('express');
const router = express.Router();
const { getTrendingData, searchPostsByHashtag } = require('../controllers/exploreController');
const { protect } = require('../middleware/authMiddleware');

// Get trending data for explore page
router.get('/trending', protect, getTrendingData);

// Search posts by hashtag
router.get('/hashtag/:hashtag', protect, searchPostsByHashtag);

module.exports = router;