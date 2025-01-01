const adminDashboard =require("../models/user")

const ensureDashboardExists = async (req, res, next) => {
  const { id: riderId } = req.user;

  try {
    // Fetch existing dashboard
    let dashboard = await adminDashboard.findOne({ rider: adminId });

    // If no dashboard, create a new one
    if (!dashboard) {
      dashboard = new RiderDashboard({
        rider: riderId,
        earnings: { total: 0, withdrawable: 0 },
        deliveries: { completed: 0, pending: 0, declined: 0 },
        deliveryHistory: [],
        withdrawalHistory: [],
        deliveryOverview: {
          today: { deliveries: 0, earnings: 0 },
          weekly: { deliveries: 0, earnings: 0 },
          monthly: { deliveries: 0, earnings: 0 },
        },
      });

      await dashboard.save();
      console.log('Dashboard created successfully for rider:', riderId);
    }

    next();
  } catch (error) {
    console.error('Error ensuring dashboard exists:', error.message);
    res.status(500).json({ error: 'Error fetching dashboard data' });
  }
};

module.exports = ensureDashboardExists;