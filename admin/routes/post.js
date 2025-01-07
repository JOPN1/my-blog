const express = require('express');
require('dotenv').config();
const Post = require ('../models/post')
const upload = require('../utils/multer')
const authenticateAdmin = require('../routes/authenticateUser') 

const router = express.Router()



const validCategories = ['npfl', 'football', 'basketball', 'tennis', 'formula-one'];

// Middleware to validate category
const validateCategory = (req, res, next) => {
  const { category } = req.query;
  if (category && !validCategories.includes(category.toLowerCase()) && category.toLowerCase() !== 'all') {
    return res.status(400).json({ message: 'Invalid category' });
  }
  next();
};


// Create a new blog post (admin only)
router.post('/blogPost', authenticateAdmin ,upload.fields([{ name: 'image' }, { name: 'video' }]), async (req, res) => {
    const { title, description, category } = req.body;
    const image = req.files.image ? req.files.image[0].filename : null;
    const video = req.files.video ? req.files.video[0].filename : null;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Provide title, decription, and category' });
    }

    if (!validCategories.includes(category.toLowerCase())) { 
      return res.status(400).json({ message: 'Invalid category' });
    }

    try {
      const newPost = new Post({ title, description, image, video, category: category.toLowerCase(), createdBy: req.User._id });
      await newPost.save();
      res.status(201).json({ message: 'Blog post created successfully', post: newPost });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Fetch all blog posts sorted by recency, with optional category filtering and pagination
router.get('/blogsPost', validateCategory, async (req, res) => {
  const { category } = req.query;

  try {
    const filter = category && category.toLowerCase() !== 'all'
      ? { category: category.toLowerCase() }
      : {}; // If no category is specified or 'all', fetch all posts.

    // Fetch posts from the database, sorted by creation date (most recent first)
    const posts = await Post.find(filter).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch blog posts by specific category
router.get('/blogsPost/:category', async (req, res) => {
  const { category } = req.params;

  if (!validCategories.includes(category.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  try {
    const posts = await Post.find({ category: category.toLowerCase() }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

//delete post by specific Id

router.delete('/blogpost/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Delete the document
    await post.remove();
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

  module.exports = router