const Dashboard = require('../models/dashboard');
const Post = require('../models/post');
const Comment = require('../models/comment');
const express = require('express');
const router = express.Router();
const authenticateAdmin = require('../routes/authenticateUser');

const ensureDashboardExists = require('../routes/ensuredashboardexist')
/**
 * POST Update Server-Wide Dashboard Statistics
 * @route POST /api/admin/dashboard/update
 * @description Updates the server-wide total posts and comments statistics
 */
router.post('/dashboard/update', authenticateAdmin, ensureDashboardExists, async (req, res) => {
  try {
    const [postCount, commentCount] = await Promise.all([
      Post.countDocuments(),
      Comment.countDocuments(),
    ]);

    let dashboard = await Dashboard.findOne();
    if (!dashboard) {
      dashboard = new Dashboard();
    }

    dashboard.posts = postCount;
    dashboard.comments = commentCount;
    dashboard.lastUpdated = Date.now();
    await dashboard.save();

    res.status(200).json({
      status: 'success',
      data: dashboard,
    });
  } catch (error) {
    console.error('Error updating dashboard data:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Error updating dashboard data',
    });
  }
});

/**
 * GET Admin-Specific and Server-Wide Dashboard Data
 * @route GET /api/admin/dashboard
 * @description Fetch server-wide and admin-specific dashboard data
 */
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const adminId = req.user.id; // Assuming `authenticateAdmin` middleware adds `req.user`

    // Fetch server-wide counts
    const [totalPosts, totalComments] = await Promise.all([
      Post.countDocuments(),
      Comment.countDocuments(),
    ]);

    // Fetch admin-specific counts
    const [adminPosts, adminComments] = await Promise.all([
      Post.countDocuments({ author: adminId }),
      Comment.countDocuments({ post: { $in: await Post.find({ author: adminId }).select('_id') } }),
    ]);

    const dashboard = {
      server: {
        totalPosts,
        totalComments,
      },
      user: {
        userPosts,
        userComments,
      },
    };

    res.status(200).json({
      status: 'success',
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching dashboard data',
    });
  }
});

module.exports = Dashboard

