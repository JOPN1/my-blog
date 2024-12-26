const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  otp: String,
  otptime: Date,
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },

  role: { type: String, default: 'admin' }, // admin or user

  is_online: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'users' });


const model = mongoose.model('User', userSchema);

module.exports = model;
