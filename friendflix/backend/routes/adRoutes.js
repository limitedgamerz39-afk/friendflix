const express = require('express');
const router = express.Router();
const {
  createAd,
  getAllAds,
  getAdById,
  updateAd,
  deleteAd,
  getActiveAdsByType,
  recordImpression,
  recordClick,
  recordCompletion
} = require('../controllers/adController');
const { adminAuth } = require('../middleware/adminAuth');

// Admin routes
router.post('/', adminAuth, createAd);
router.get('/', adminAuth, getAllAds);
router.get('/:adId', adminAuth, getAdById);
router.put('/:adId', adminAuth, updateAd);
router.delete('/:adId', adminAuth, deleteAd);

// Public routes for ad serving
router.get('/type/:type', getActiveAdsByType);
router.post('/:adId/impression', recordImpression);
router.post('/:adId/click', recordClick);
router.post('/:adId/completion', recordCompletion);

module.exports = router;