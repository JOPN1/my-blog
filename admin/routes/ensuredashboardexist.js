const Dashboard = require('../models/dashboard');

/**
 * Middleware to ensure the dashboard exists for the authenticated admin.
 * If it doesn't exist, create a new dashboard with default values (all zero).
 */
const ensureDashboardExists = async (req, res, next) => {
  try {
    const adminId = req.user.id; // Assuming `req.user` is populated by `authenticateAdmin`

    // Check if a dashboard exists for the admin
    let dashboard = await Dashboard.findOne({ userId: adminId });
    if (!dashboard) {
      // Create a new dashboard with default values
      dashboard = new Dashboard({
        userId: adminId,
        posts: 0, // Explicitly set to zero
        comments: 0, // Explicitly set to zero
        lastUpdated: null, // Explicitly set to null
      });
      await dashboard.save();
    }

    // Attach the dashboard to the request object for downstream usage
    req.dashboard = dashboard;
    next();
  } catch (error) {
    console.error('Error ensuring dashboard exists:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Error ensuring dashboard exists',
    });
  }
};

module.exports = ensureDashboardExists;