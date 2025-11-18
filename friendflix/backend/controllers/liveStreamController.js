const LiveStream = require('../models/LiveStream');
const { minioEnabled } = require('../utils/minioHelper');

// Create new live stream
const createStream = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      tags,
      isPublic = true
    } = req.body;

    const userId = req.user.id;

    // Generate unique stream key
    const streamKey = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stream = new LiveStream({
      userId,
      title,
      description,
      category: category || 'General',
      tags: tags || [],
      isPublic,
      streamKey,
      status: 'created',
      streamUrl: `${process.env.RTMP_SERVER_URL || 'rtmp://localhost:1935/live'}/${streamKey}`,
      playbackUrl: `${process.env.HLS_SERVER_URL || 'http://localhost:8000/live'}/${streamKey}.m3u8`
    });

    await stream.save();

    res.json({
      success: true,
      stream: {
        id: stream._id,
        streamKey: stream.streamKey,
        streamUrl: stream.streamUrl,
        playbackUrl: stream.playbackUrl,
        title: stream.title,
        status: stream.status
      }
    });

  } catch (error) {
    console.error('Create stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating live stream',
      error: error.message
    });
  }
};

// Start live stream
const startStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user.id;

    const stream = await LiveStream.findOne({ _id: streamId, userId });
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }

    if (stream.status === 'live') {
      return res.status(400).json({
        success: false,
        message: 'Stream is already live'
      });
    }

    stream.status = 'live';
    stream.startedAt = new Date();
    stream.viewerCount = 0;

    await stream.save();

    // Notify via Socket.IO
    const io = req.app.get('io');
    io.emit('stream-started', {
      streamId: stream._id,
      title: stream.title,
      userId: stream.userId
    });

    res.json({
      success: true,
      message: 'Stream started successfully',
      stream: {
        id: stream._id,
        status: stream.status,
        startedAt: stream.startedAt
      }
    });

  } catch (error) {
    console.error('Start stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting stream',
      error: error.message
    });
  }
};

// Stop live stream
const stopStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user.id;

    const stream = await LiveStream.findOne({ _id: streamId, userId });
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }

    if (stream.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Stream is not live'
      });
    }

    stream.status = 'ended';
    stream.endedAt = new Date();
    stream.duration = Math.round((stream.endedAt - stream.startedAt) / 1000);

    await stream.save();

    // Notify via Socket.IO
    const io = req.app.get('io');
    io.emit('stream-ended', {
      streamId: stream._id
    });

    res.json({
      success: true,
      message: 'Stream stopped successfully',
      stream: {
        id: stream._id,
        status: stream.status,
        endedAt: stream.endedAt,
        duration: stream.duration,
        maxViewers: stream.maxViewers
      }
    });

  } catch (error) {
    console.error('Stop stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Error stopping stream',
      error: error.message
    });
  }
};

// Get stream info
const getStream = async (req, res) => {
  try {
    const { streamId } = req.params;

    const stream = await LiveStream.findById(streamId)
      .populate('userId', 'username avatar displayName');
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }

    res.json({
      success: true,
      stream
    });

  } catch (error) {
    console.error('Get stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting stream info',
      error: error.message
    });
  }
};

// Get active streams
const getActiveStreams = async (req, res) => {
  try {
    const streams = await LiveStream.find({ status: 'live' })
      .populate('userId', 'username avatar displayName')
      .sort({ startedAt: -1 });

    res.json({
      success: true,
      streams
    });

  } catch (error) {
    console.error('Get active streams error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting active streams',
      error: error.message
    });
  }
};

// Get user streams
const getUserStreams = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    const targetUserId = userId || currentUserId;

    const streams = await LiveStream.find({ userId: targetUserId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      streams
    });

  } catch (error) {
    console.error('Get user streams error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user streams',
      error: error.message
    });
  }
};

// Update viewer count
const updateViewerCount = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { viewerCount } = req.body;

    const stream = await LiveStream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }

    stream.viewerCount = viewerCount;
    if (viewerCount > stream.maxViewers) {
      stream.maxViewers = viewerCount;
    }

    await stream.save();

    // Notify via Socket.IO
    const io = req.app.get('io');
    io.to(streamId).emit('viewer-count-update', {
      streamId,
      viewerCount
    });

    res.json({
      success: true,
      message: 'Viewer count updated'
    });

  } catch (error) {
    console.error('Update viewer count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating viewer count',
      error: error.message
    });
  }
};

// Send chat message
const sendChatMessage = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const stream = await LiveStream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }

    const chatMessage = {
      userId,
      message,
      timestamp: new Date()
    };

    // Add to chat history (limit to last 100 messages)
    stream.chat.push(chatMessage);
    if (stream.chat.length > 100) {
      stream.chat = stream.chat.slice(-100);
    }

    await stream.save();

    // Broadcast via Socket.IO
    const io = req.app.get('io');
    io.to(streamId).emit('chat-message', {
      ...chatMessage,
      user: req.user // User info from auth middleware
    });

    res.json({
      success: true,
      message: 'Chat message sent'
    });

  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending chat message',
      error: error.message
    });
  }
};

// Get stream chat
const getChat = async (req, res) => {
  try {
    const { streamId } = req.params;

    const stream = await LiveStream.findById(streamId)
      .select('chat')
      .populate('chat.userId', 'username avatar displayName');

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }

    res.json({
      success: true,
      chat: stream.chat
    });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting chat',
      error: error.message
    });
  }
};

module.exports = {
  createStream,
  startStream,
  stopStream,
  getStream,
  getActiveStreams,
  getUserStreams,
  updateViewerCount,
  sendChatMessage,
  getChat
};r