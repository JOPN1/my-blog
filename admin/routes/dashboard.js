const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const authenticateAdmin = require('../routes/authenticateUser');
const Post = require('../models/post'); // Assuming a Post model exists
const Comment = require('../models/comment'); // Assuming a Comment model exists

// Middleware
router.use(express.json());

/**
 * GET Admin Dashboard
 * @route GET /api/admin/dashboard
 * @description Fetch statistics for the admin dashboard
 */
router.get('/dashboard/post', authenticateAdmin, async (req, res) => {
  try {
    // Fetch aggregated counts for posts and comments
    const [postCount] = await Promise.all([
      Post.countDocuments(), // Count all posts
      
    ]);

    const dashboard = {
      posts: postCount
    };

    res.status(200).json({
      status: 'success',
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error.message);
    res.status(500).json({ status: 'error', msg: 'Error fetching dashboard data' });
  }
});

//comment

router.get('/dashboard/comment', authenticateAdmin, async (req, res) => {
  try {
    // Fetch aggregated counts for posts and comments
    const [commentCount] = await Promise.all([
      Comment.countDocuments(), // Count all comments
    ]);

    const dashboard = {
      comments: commentCount,
    };

    res.status(200).json({
      status: 'success',
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error.message);
    res.status(500).json({ status: 'error', msg: 'Error fetching dashboard data' });
  }
});

module.exports = router;
