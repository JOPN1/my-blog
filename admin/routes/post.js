const express = require('express');
require('dotenv').config();
const Post = require ('../models/post')
const upload = require('../utils/multer')
const authenticateAdmin = require('../routes/authenticateUser')

const router = express.Router()


// Create a new blog post (admin only)
router.post('/blogPost', authenticateAdmin, upload.fields([{ name: 'image' }, { name: 'video' }]), async (req, res) => {
    const { title, content } = req.body;
    const image = req.files.image ? req.files.image[0].filename : null;
    const video = req.files.video ? req.files.video[0].filename : null;
  
    if (!title || !content) {
      return res.status(400).json({ message: 'Provide title and content' });
    }
  
    try {
      const newPost = new Post({ title, content, image, video });
      await newPost.save();
      res.status(201).json({ message: 'Blog post created successfully', post: newPost });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Fetch all blog posts (public access)
  router.get('/blogsPost', async (req, res) => {
    try {
      const posts = await Post.find();
      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  module.exports = router