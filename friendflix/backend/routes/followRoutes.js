const express = require('express');
const router = express.Router();
const { 
  followUser,
  unfollowUser,
  getFollowersCount,
  getFollowingCount,
  getFollowers,
  getFollowing,
  isFollowing
} = require('../controllers/followController');
const { protect } = require('../middleware/authMiddleware');

// Follow routes
router.post('/:userId/follow', protect, followUser);
router.post('/:userId/unfollow', protect, unfollowUser);
router.get('/:userId/followers/count', protect, getFollowersCount);
router.get('/:userId/following/count', protect, getFollowingCount);
router.get('/:userId/followers', protect, getFollowers);
router.get('/:userId/following', protect, getFollowing);
router.get('/:userId/is-following', protect, isFollowing);

module.exports = router;