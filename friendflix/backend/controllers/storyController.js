const Story = require('../models/Story');
const Highlight = require('../models/Highlight');
const User = require('../models/User');
const { uploadToMinIO } = require('../utils/minioHelper');

// Upload story
const uploadStory = async (req, res) => {
  try {
    const { caption } = req.body;
    const userId = req.user.id;
    
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Determine media type
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    
    // Upload to MinIO
    let mediaUrl;
    try {
      mediaUrl = await uploadToMinIO(req.file, `stories/${userId}/${Date.now()}_${req.file.originalname}`);
    } catch (uploadError) {
      console.error('MinIO upload error:', uploadError);
      return res.status(500).json({ 
        message: 'File upload service is not available. Please contact administrator.' 
      });
    }
    
    // Create story
    const story = new Story({
      userId,
      mediaUrl,
      mediaType,
      caption,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });
    
    await story.save();
    
    // Populate user info
    await story.populate('userId', 'name username avatar');
    
    res.status(201).json(story);
  } catch (error) {
    console.error('Upload story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all active stories
const getActiveStories = async (req, res) => {
  try {
    const stories = await Story.find({
      expiresAt: { $gt: new Date() }
    })
    .populate('userId', 'name username avatar')
    .sort({ createdAt: -1 });
    
    res.json(stories);
  } catch (error) {
    console.error('Get active stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user stories
const getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    const stories = await Story.find({
      userId,
      expiresAt: { $gt: new Date() }
    })
    .populate('userId', 'name username avatar')
    .sort({ createdAt: -1 });
    
    res.json(stories);
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// View story (track viewer)
const viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;
    
    // Find the story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    // Check if story has expired
    if (story.expiresAt <= new Date()) {
      return res.status(404).json({ message: 'Story has expired' });
    }
    
    // Add viewer if not already viewed
    const existingViewer = story.viewers.find(viewer => viewer.userId.toString() === userId);
    if (!existingViewer) {
      story.viewers.push({ userId });
      await story.save();
    }
    
    res.json({ message: 'Story viewed successfully' });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get story viewers
const getStoryViewers = async (req, res) => {
  try {
    const { storyId } = req.params;
    
    // Find the story and populate viewers
    const story = await Story.findById(storyId)
      .populate('viewers.userId', 'name username avatar');
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    res.json(story.viewers);
  } catch (error) {
    console.error('Get story viewers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete story
const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;
    
    const story = await Story.findOneAndDelete({
      _id: storyId,
      userId
    });
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create highlight
const createHighlight = async (req, res) => {
  try {
    const { storyId, title } = req.body;
    const userId = req.user.id;
    
    // Find the story
    const story = await Story.findById(storyId);
    if (!story || story.userId.toString() !== userId) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    // Create highlight
    const highlight = new Highlight({
      userId,
      storyId,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      title: title || 'Highlight'
    });
    
    await highlight.save();
    
    res.status(201).json(highlight);
  } catch (error) {
    console.error('Create highlight error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user highlights
const getUserHighlights = async (req, res) => {
  try {
    const { userId } = req.params;
    const highlights = await Highlight.find({ userId })
      .sort({ createdAt: -1 });
    
    res.json(highlights);
  } catch (error) {
    console.error('Get user highlights error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  uploadStory,
  getActiveStories,
  getUserStories,
  viewStory,
  getStoryViewers,
  deleteStory,
  createHighlight,
  getUserHighlights
};