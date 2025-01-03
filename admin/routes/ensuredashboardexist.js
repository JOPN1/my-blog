const AdminDashboard = require('../routes/dashboard'); // Assuming AdminDashboard model exists

/**
 * Middleware to ensure the admin's dashboard exists
 */
const ensureDashboardExists = async (req, res, next) => {
  try {
    const adminId = req.user.id; // Assuming req.user is set by authenticateAdmin middleware

    // Check if a dashboard exists for the admin
    let dashboard = await AdminDashboard.findOne({ admin: adminId });

    // If no dashboard exists, create one
    if (!dashboard) {
      dashboard = new AdminDashboard({
        admin: adminId,
        posts: 0,
        comments: 0,
        // Add other initial dashboard properties as needed
      });

      await dashboard.save();
    }

    req.dashboard = dashboard; // Attach the dashboard to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Error ensuring admin dashboard exists:', error.message);
    res.status(500).json({ status: 'error', msg: 'Error processing dashboard' });
  }
};

module.exports = ensureDashboardExists;