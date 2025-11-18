// Script to update existing post records with new fields
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Post = require('../models/Post');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/friendflix', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updatePostFields = async () => {
  try {
    console.log('Starting post fields update...');
    
    // Update all post records to ensure they have the new fields
    const result = await Post.updateMany(
      { title: { $exists: false } },
      { $set: { 
          title: null,
          description: null,
          views: 0,
          category: 'other',
          duration: null
        } 
      }
    );
    
    console.log(`Updated ${result.modifiedCount} post records`);
    console.log('Post fields update completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating post fields:', error);
    process.exit(1);
  }
};

// Run the update
updatePostFields();