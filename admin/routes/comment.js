const express = require('express');
require('dotenv').config();
const Comment = require('../models/comment')
const Post = require('../models/post'); // Post model to check if the post exists
const authenticateAdmin = require('../routes/authenticateUser')
const router = express.Router();

// Create a new comment on a specific blog post
router.post('/comment/:postId', async (req, res) => {
  const { content } = req.body;
  const { postId } = req.params;

  if (!content) {
    return res.status(400).json({ message: 'Content is required for the comment' });
  }

  try {
    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Create a new comment and link it to the post
    const newComment = new Comment({ content, post: postId });
    await newComment.save();

    res.status(201).json({ message: 'Comment created successfully', comment: newComment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch all comments for a specific post
router.get('/comments/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Fetch all comments associated with the post
    const comments = await Comment.find({ post: postId }).sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a comment by ID (admin only)

router.delete('/comment/:commentId',authenticateAdmin, async (req, res) => {
  const { commentId } = req.params;

  try {
    // Find the comment by ID
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Delete the comment
    await comment.remove();

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

  module.exports = router