const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },

    category: { 
      type: String, 
      required: true, 
      enum: ['npfl', 'football', 'basketball', 'tennis', 'formula-one'], 
      lowercase: true 
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model (admin in this case)
      required: true
  },

    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true },
  { collection: 'Post' });

module.exports = mongoose.model('Post', postSchema);
