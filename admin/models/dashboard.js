const mongoose = require('mongoose');

// Define the Dashboard schema
const DashboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  posts: {
    type: Number,
    default: 0,
  },
  comments: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const Dashboard = mongoose.model('Dashboard', DashboardSchema);

module.exports = Dashboard;

