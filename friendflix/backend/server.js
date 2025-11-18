const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const socketHelper = require('./helpers/socketHelper');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS to allow requests from mobile devices and web
const corsOptions = {
  origin: [
    'http://localhost:3000',      // Web development
    'http://localhost:8081',      // Expo development (current)
    'http://localhost:8083',      // Expo development (alternative)
    'http://127.0.0.1:8081',      // Localhost alternative
    'http://127.0.0.1:3000',      // Localhost alternative for web
    'http://10.0.2.2:8081',       // Android emulator access to Expo
    'http://10.0.2.2:3000',       // Android emulator access to web
    // Dynamic origins for devices on the same network
    // These will be added dynamically based on the request
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
};

// Dynamic CORS middleware to allow requests from any IP on the local network
const dynamicCors = (req, res, next) => {
  const origin = req.headers.origin;
  // If the origin is from the local network, allow it
  if (origin && (origin.startsWith('http://192.168.') || origin.startsWith('http://10.') || origin.startsWith('http://172.'))) {
    corsOptions.origin.push(origin);
    // Remove duplicates
    corsOptions.origin = [...new Set(corsOptions.origin)];
  }
  cors(corsOptions)(req, res, next);
};

// Initialize Socket.IO with updated CORS
const io = new Server(server, {
  cors: corsOptions
});

// Middleware
app.use(dynamicCors);
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/friendflix', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Import User model
const User = require('./models/User');

// Initialize socket helper
socketHelper.setIo(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle user authentication
  socket.on('authenticate', (userId) => {
    socketHelper.addConnectedUser(userId, socket.id);
    console.log('User authenticated:', userId);
  });
  
  // Handle send message event
  socket.on('sendMessage', async (messageData) => {
    try {
      // Broadcast message to recipient
      socketHelper.emitToUser(messageData.receiverId, 'newMessage', messageData);
    } catch (error) {
      console.error('Error sending message via socket:', error);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socketHelper.removeConnectedUser(socket.id);
  });
});

// Initialize Google OAuth client
const oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d'
  });
};

// Routes
app.get('/', (req, res) => {
  res.send('Friendflix API is running...');
});

// User registration
app.post('/api/users/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if user exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create user (password will be hashed by the pre-save hook)
    const user = await User.create({
      name,
      email,
      password
    });
    
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User login
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password: password ? '[REDACTED]' : 'undefined' });
  
  try {
    // Find user
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user && (await bcrypt.compare(password, user.password))) {
      console.log('Password match: Yes');
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      console.log('Password match: No');
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Google OAuth login
app.post('/api/users/google-login', async (req, res) => {
  const { idToken } = req.body;
  
  try {
    // Verify Google ID token
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, name, email, picture } = payload;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      // Update user with Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture
      });
    }
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
});

app.post('/api/users/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

// Profile routes
app.use('/api/profile', require('./routes/profileRoutes'));
// Media routes
app.use('/api/media', require('./routes/mediaRoutes'));
// Post routes
app.use('/api/posts', require('./routes/postRoutes'));
// Follow routes
app.use('/api/follow', require('./routes/followRoutes'));
// Search routes
app.use('/api/search', require('./routes/searchRoutes'));
// User routes
app.use('/api/users', require('./routes/userRoutes'));
// Notification routes
app.use('/api/notifications', require('./routes/notificationRoutes'));
// Admin routes
app.use('/api/admin', require('./routes/adminRoutes'));
// Ad routes
app.use('/api/ads', require('./routes/adRoutes'));
// Settings routes
app.use('/api/settings', require('./routes/settingsRoutes'));
// Story routes
app.use('/api/stories', require('./routes/storyRoutes'));
// Message routes
app.use('/api/messages', require('./routes/messageRoutes'));

// Explore routes
app.use('/api/explore', require('./routes/exploreRoutes'));

// Save routes
app.use('/api/save', require('./routes/saveRoutes'));

// Text post routes
app.use('/api/text-posts', require('./routes/textPostRoutes'));

// Serve admin frontend
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Redirect root to login
app.get('/', (req, res) => {
  res.redirect('/login');
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});