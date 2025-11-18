const Post = require('../models/Post');
const User = require('../models/User');
const Media = require('../models/Media');
const Follow = require('../models/Follow');

// Get trending data for explore page
const getTrendingData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get trending posts (most liked in the last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const trendingPosts = await Post.find({
      createdAt: { $gte: oneWeekAgo }
    })
    .populate([
      { path: 'userId', select: 'name username avatar' },
      { path: 'mediaId', select: 'url isVideo uploadType' }
    ])
    .sort({ 'likes.length': -1 })
    .limit(20);
    
    // Get trending reels (most liked reels in the last 7 days)
    const trendingReels = await Post.find({
      createdAt: { $gte: oneWeekAgo },
      'mediaId.uploadType': 'reel'
    })
    .populate([
      { path: 'userId', select: 'name username avatar' },
      { path: 'mediaId', select: 'url isVideo uploadType' }
    ])
    .sort({ 'likes.length': -1 })
    .limit(20);
    
    // Get trending users (most followed)
    const trendingUsers = await User.find({})
      .select('name username avatar')
      .limit(10);
    
    // Add follower counts to trending users
    for (let i = 0; i < trendingUsers.length; i++) {
      const followerCount = await Follow.countDocuments({ following: trendingUsers[i]._id });
      trendingUsers[i] = trendingUsers[i].toObject();
      trendingUsers[i].followers = { length: followerCount };
    }
    
    // Extract hashtags from captions (simple implementation)
    const hashtagMap = new Map();
    
    // Process posts to extract hashtags
    trendingPosts.forEach(post => {
      if (post.caption) {
        const hashtags = post.caption.match(/#[\w]+/g);
        if (hashtags) {
          hashtags.forEach(tag => {
            const cleanTag = tag.toLowerCase();
            hashtagMap.set(cleanTag, (hashtagMap.get(cleanTag) || 0) + 1);
          });
        }
      }
    });
    
    // Convert to array and sort by count
    const trendingHashtags = Array.from(hashtagMap, ([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Get recommended posts based on user interests
    // For now, we'll just get recent posts from users with similar interests
    // In a real implementation, this would be more sophisticated
    const recommendedPosts = await Post.find({})
      .populate([
        { path: 'userId', select: 'name username avatar' },
        { path: 'mediaId', select: 'url isVideo uploadType' }
      ])
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      trendingPosts,
      trendingReels,
      trendingUsers,
      trendingHashtags,
      recommendedPosts
    });
  } catch (error) {
    console.error('Get trending data error:', error);
    res.status(500).json({ message: 'Error fetching trending data' });
  }
};

// Search posts by hashtag
const searchPostsByHashtag = async (req, res) => {
  try {
    const { hashtag } = req.params;
    const userId = req.user.id;
    
    if (!hashtag) {
      return res.status(400).json({ message: 'Hashtag is required' });
    }
    
    const posts = await Post.find({
      caption: { $regex: `#${hashtag}`, $options: 'i' }
    })
    .populate([
      { path: 'userId', select: 'name username avatar' },
      { path: 'mediaId', select: 'url isVideo uploadType' }
    ])
    .sort({ createdAt: -1 })
    .limit(50);
    
    res.json(posts);
  } catch (error) {
    console.error('Search posts by hashtag error:', error);
    res.status(500).json({ message: 'Error searching posts by hashtag' });
  }
};

module.exports = {
  getTrendingData,
  searchPostsByHashtag
};