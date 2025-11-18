// Script to update existing media records with duration field
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Media = require('../models/Media');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/friendflix', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updateMediaDuration = async () => {
  try {
    console.log('Starting media duration update...');
    
    // Update all media records to ensure they have the duration field
    const result = await Media.updateMany(
      { duration: { $exists: false } },
      { $set: { duration: null } }
    );
    
    console.log(`Updated ${result.modifiedCount} media records`);
    console.log('Media duration update completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating media duration:', error);
    process.exit(1);
  }
};

// Run the update
updateMediaDuration();