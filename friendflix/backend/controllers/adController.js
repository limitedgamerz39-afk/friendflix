const Ad = require('../models/Ad');

// Create ad
const createAd = async (req, res) => {
  try {
    const ad = new Ad(req.body);
    await ad.save();
    res.status(201).json(ad);
  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all ads
const getAllAds = async (req, res) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json(ads);
  } catch (error) {
    console.error('Get all ads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get ad by ID
const getAdById = async (req, res) => {
  try {
    const { adId } = req.params;
    const ad = await Ad.findById(adId);
    
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    
    res.json(ad);
  } catch (error) {
    console.error('Get ad error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update ad
const updateAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const ad = await Ad.findByIdAndUpdate(adId, req.body, { new: true });
    
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    
    res.json(ad);
  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete ad
const deleteAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const ad = await Ad.findByIdAndDelete(adId);
    
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    
    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get active ads by type
const getActiveAdsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const ads = await Ad.find({ 
      type, 
      isActive: true 
    });
    
    res.json(ads);
  } catch (error) {
    console.error('Get active ads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Record ad impression
const recordImpression = async (req, res) => {
  try {
    const { adId } = req.params;
    const ad = await Ad.findByIdAndUpdate(
      adId,
      { $inc: { 'metrics.impressions': 1 } },
      { new: true }
    );
    
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    
    res.json(ad);
  } catch (error) {
    console.error('Record impression error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Record ad click
const recordClick = async (req, res) => {
  try {
    const { adId } = req.params;
    const ad = await Ad.findByIdAndUpdate(
      adId,
      { $inc: { 'metrics.clicks': 1 } },
      { new: true }
    );
    
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    
    res.json(ad);
  } catch (error) {
    console.error('Record click error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Record ad completion (for rewarded ads)
const recordCompletion = async (req, res) => {
  try {
    const { adId } = req.params;
    const ad = await Ad.findByIdAndUpdate(
      adId,
      { $inc: { 'metrics.completions': 1 } },
      { new: true }
    );
    
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    
    res.json(ad);
  } catch (error) {
    console.error('Record completion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createAd,
  getAllAds,
  getAdById,
  updateAd,
  deleteAd,
  getActiveAdsByType,
  recordImpression,
  recordClick,
  recordCompletion
};