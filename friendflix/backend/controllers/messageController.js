const Message = require('../models/Message');
const User = require('../models/User');
const Media = require('../models/Media');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const socketHelper = require('../helpers/socketHelper');

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, mediaId, messageType } = req.body;
    const senderId = req.user._id;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Create message
    const messageData = {
      sender: senderId,
      receiver: receiverId,
      content: content || '',
      messageType: messageType || 'text'
    };

    // Add media if provided
    if (mediaId) {
      messageData.media = mediaId;
    }

    const message = new Message(messageData);
    await message.save();

    // Populate sender and receiver info
    await message.populate('sender', 'name username avatar');
    await message.populate('receiver', 'name username avatar');
    if (message.media) {
      await message.populate('media');
    }

    // Emit message to receiver via WebSocket
    socketHelper.emitToUser(receiverId, 'newMessage', message);

    // Create notification for receiver
    const notification = new Notification({
      userId: receiverId,
      type: 'message',
      message: `${req.user.name} sent you a message`,
      relatedId: message._id,
      sender: senderId
    });
    await notification.save();

    // Emit notification to receiver
    socketHelper.emitToUser(receiverId, 'newNotification', notification);

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get chat history between two users
exports.getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ],
      $or: [
        { deletedFor: { $ne: 'both' } },
        { deletedFor: null }
      ]
    })
    .populate('sender', 'name username avatar')
    .populate('receiver', 'name username avatar')
    .populate('media')
    .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { 
        sender: userId, 
        receiver: currentUserId, 
        isRead: false 
      },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get list of conversations (users the current user has chatted with)
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Get all messages where current user is either sender or receiver
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(currentUserId) },
            { receiver: new mongoose.Types.ObjectId(currentUserId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', new mongoose.Types.ObjectId(currentUserId)] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', new mongoose.Types.ObjectId(currentUserId)] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: 1,
            name: 1,
            username: 1,
            avatar: 1
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      receiver: currentUserId
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.isRead = true;
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete message for user
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ]
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Determine which user is deleting the message
    const isSender = message.sender.toString() === currentUserId;
    const isReceiver = message.receiver.toString() === currentUserId;

    // Update deletedFor field
    if (message.deletedFor === 'both') {
      // Message already deleted for both users
      await message.remove();
    } else if (message.deletedFor === null) {
      // First deletion
      message.deletedFor = isSender ? 'sender' : 'receiver';
      await message.save();
    } else if (
      (message.deletedFor === 'sender' && isReceiver) ||
      (message.deletedFor === 'receiver' && isSender)
    ) {
      // Second deletion - delete completely
      await message.remove();
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Add user to blocked list
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: userId }
    });

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Remove user from blocked list
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: userId }
    });

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Report user
exports.reportUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const currentUserId = req.user._id;

    // Create report (in a real app, you might want a separate Report model)
    // For now, we'll just log it and add to user's reported list
    await User.findByIdAndUpdate(userId, {
      $addToSet: { reportedBy: currentUserId }
    });

    // You might want to send this to admins or store in a separate collection
    console.log(`User ${currentUserId} reported user ${userId} for: ${reason}`);

    res.json({ message: 'User reported successfully' });
  } catch (error) {
    console.error('Error reporting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};