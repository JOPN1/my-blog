const express = require('express');
const mongoose = require('mongoose')
const router = express.Router();
const RiderDashboard = require('../models/dashboard');
const authenticateUser = require('../routes/authenticateUser');
const ensureDashboardExists = require('../routes/ensureDashboardExists');
const User = require('../../user/models/user')


// Middleware
router.use(express.json());

/**
 * POST Rider Dashboard
 * @route POST /api/riders/dashboard
 */
router.post('/dashboardin', authenticateUser, ensureDashboardExists, async (req, res) => {
  try {
    const { riderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(riderId)) {
      console.error('Invalid rider ID:', riderId);
      return res.status(400).send({ message: 'Invalid rider ID' });
    }

    console.log('Rider ID from request body:', riderId);
    console.log('User ID from token:', req.user.id);

    if (req.user.id !== riderId) {
      console.error(`Access forbidden: token user ID ${req.user.id} does not match rider ID ${riderId}`);
      return res.status(403).send({ message: 'Access forbidden' });
    }

    const dashboard = await RiderDashboard.findOne({ rider: riderId }).populate('rider');
    if (!dashboard) {
      console.error('Dashboard not found for Rider ID:', riderId);
      return res.status(404).send({ message: 'Dashboard not found' });
    }

    console.log('Dashboard retrieved successfully:', dashboard);
    res.send(dashboard);
  } catch (error) {
    console.error('Error fetching dashboard data:', error.message);
    res.status(500).send({ error: 'Error fetching dashboard data' });
  }
});


/**
 * POST Add New Delivery
 * @route POST /api/riders/new-delivery
 */
router.post('/new-delivery', authenticateUser, async (req, res) => {
  try {
    const { riderId } = req.body;

    if (req.user.id !== riderId) {
      return res.status(403).send({ message: 'Access forbidden' });
    }

    const dashboard = await RiderDashboard.findOneAndUpdate(
      { rider: riderId },
      {
        $inc: {
          'deliveries.new': 1,
          'deliveries.total': 1,
        },
        $push: {
          deliveryHistory: { status: 'new' },
        },
      },
      { new: true }
    );

    res.send(dashboard);
  } catch (error) {
    res.status(500).send({ error: 'Error adding new delivery' });
  }
});

/**
 * POST Update Delivery Status
 * @route POST /api/riders/delivery-status
 */
router.post('/delivery-status', authenticateUser, async (req, res) => {
  try {
    const { riderId, deliveryId, status, earnings } = req.body;

    if (req.user.id !== riderId) {
      return res.status(403).send({ message: 'Access forbidden' });
    }

    const dashboard = await RiderDashboard.findOne({ rider: riderId });

    if (!dashboard) {
      return res.status(404).send({ message: 'Dashboard not found' });
    }

    const delivery = dashboard.deliveryHistory.id(deliveryId);

    if (!delivery) {
      return res.status(404).send({ message: 'Delivery not found' });
    }

    delivery.status = status;

    if (status === 'completed') {
      dashboard.earnings.total += earnings;
      dashboard.earnings.withdrawable += earnings;
      dashboard.deliveries.completed += 1;
      dashboard.deliveryOverview.today.deliveries += 1;
      dashboard.deliveryOverview.today.earnings += earnings;
    } else if (status === 'pending') {
      dashboard.deliveries.pending += 1;
    } else if (status === 'declined') {
      dashboard.deliveries.declined += 1;
    }

    await dashboard.save();
    res.send(dashboard);
  } catch (error) {
    res.status(500).send({ error: 'Error updating delivery status' });
  }
});

/**
 * POST Withdraw Money
 * @route POST /api/riders/withdraw
 */
router.post('/withdraw', authenticateUser, async (req, res) => {
  try {
    const { riderId, amount } = req.body;

    if (req.user.id !== riderId) {
      return res.status(403).send({ message: 'Access forbidden' });
    }

    const dashboard = await RiderDashboard.findOne({ rider: riderId });

    if (!dashboard) {
      return res.status(404).send({ message: 'Dashboard not found' });
    }

    if (dashboard.earnings.withdrawable < amount) {
      return res.status(400).send({ message: 'Insufficient withdrawable balance' });
    }

    dashboard.earnings.withdrawable -= amount;
    dashboard.withdrawalHistory.push({ amount, date: new Date() });

    await dashboard.save();
    res.send(dashboard);
  } catch (error) {
    res.status(500).send({ error: 'Error processing withdrawal' });
  }
});

/**
 * POST Fetch Earnings
 * @route POST /api/riders/earnings
 */
router.post('/earnings', authenticateUser, async (req, res) => {
  try {
    const { riderId } = req.body;

    if (req.user.id !== riderId) {
      return res.status(403).send({ message: 'Access forbidden' });
    }

    const dashboard = await RiderDashboard.findOne(
      { rider: riderId },
      { earnings: 1 } // Fetch only the earnings field
    );

    if (!dashboard) {
      return res.status(404).send({ message: 'Dashboard not found' });
    }

    res.send({
      totalEarnings: dashboard.earnings.total,
      withdrawableEarnings: dashboard.earnings.withdrawable,
    });
  } catch (error) {
    console.error('Error fetching earnings:', error.message); // Log the error
    res.status(500).send({ error: 'Error fetching earnings' }); // Proper status code and message
  }
});

/**
 * POST Update Delivery Earnings (Completed Delivery)
 * @route POST /api/riders/delivery-completed
 */
router.post('/delivery-completed', authenticateUser, async (req, res) => {
  try {
    const { riderId, earnings } = req.body;

    if (req.user.id !== riderId) {
      return res.status(403).send({ message: 'Access forbidden' });
    }

    const dashboard = await RiderDashboard.findOneAndUpdate(
      { rider: riderId },
      {
        $inc: {
          'earnings.total': earnings,
          'earnings.withdrawable': earnings,
        },
      },
      { new: true }
    );

    if (!dashboard) {
      return res.status(404).send({ message: 'Dashboard not found' });
    }

    res.send({
      message: 'Earnings updated successfully',
      totalEarnings: dashboard.earnings.total,
      withdrawableEarnings: dashboard.earnings.withdrawable,
    });
  } catch (error) {
    res.status(500).send({ error: 'Error updating earnings' });
  }
});

//  WHEN AN ORDER IS RECIEVED...................................................................................................





module.exports = router;


