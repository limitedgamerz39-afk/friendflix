const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema(
  {
    chunkNumber: { type: Number, required: true },
    etag: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const mediaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },

    url: { type: String }, // set only after finalize

    caption: { type: String, maxlength: 2200 },

    isVideo: { type: Boolean, default: false },
    duration: { type: Number }, // seconds

    uploadType: {
      type: String,
      enum: ['post', 'reel', 'story', 'long_video'],
      default: 'post'
    },

    uploadStatus: {
      type: String,
      enum: ['pending', 'uploading', 'completed', 'finalized', 'failed'],
      default: 'pending'
    },

    totalChunks: { type: Number, required: true },

    chunks: [chunkSchema],   // cleaned and safe schema

    finalizedAt: { type: Date },
    uploadedAt: { type: Date },

  },
  { timestamps: true }
);

// -------------------------------
// 🔐 VALIDATION LOGIC
// -------------------------------

// URL MUST exist only when FINALIZED — not before
mediaSchema.pre("save", function (next) {
  if (this.uploadStatus === "finalized" && !this.url) {
    return next(new Error("URL is required when status is 'finalized'"));
  }
  next();
});

// Static method to get completed media
mediaSchema.statics.getCompletedMedia = async function(mediaIds) {
  return this.find({ 
    _id: { $in: mediaIds },
    uploadStatus: 'completed'
  });
};

module.exports = mongoose.model("Media", mediaSchema);