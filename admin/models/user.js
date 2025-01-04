const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
      type: String,
      unique: true
    },
    password: {
      type: String,
      required: true
    },

    confirmPassword:{
      type: String
    },
    
  otp: String,

  otptime: Date,

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
