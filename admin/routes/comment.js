const express = require('express');
require('dotenv').config();
const Comment = require('../models/comment')

const router = express.Router();



// Add a comment to a blog post (public access)
router.post('/blogs/:postId/comments', async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
  
    if (!content) {
      return res.status(400).json({ message: 'Provide a comment' });
    }
  
    try {
      const newComment = new Comment({ postId, content });
      await newComment.save();
      res.status(201).json({ message: 'Comment added successfully', content: newComment });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Fetch comments for a blog post (public access)
  router.get('/blogs/:postId/comments', async (req, res) => {
    const { postId } = req.params;
  
    try {
      const comments = await Comment.find({ postId });
      res.status(200).json(comments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  module.exports = router