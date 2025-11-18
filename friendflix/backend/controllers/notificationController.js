const Notification = require('../models/Notification');
const { emitToUser } = require('../helpers/socketHelper');

// Create a new notification
const createNotification = async (recipientId, senderId, type, postId, message) => {
  try {
    // Don't create notification if user is notifying themselves
    if (recipientId.toString() === senderId.toString()) {
      return;
    }
    
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      postId,
      message
    });
    
    await notification.save();
    
    // Emit real-time notification
    emitToUser(recipientId, 'newNotification', notification);
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name username avatar')
      .populate('postId', 'caption')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Notification.countDocuments({ recipient: userId });
    
    res.json({
      notifications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
};

// Get unread notifications count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Error fetching unread notifications count' });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};