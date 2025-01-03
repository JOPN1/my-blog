const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8
    },

    confirmPassword:{
      type: String,
      minlength: 8
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
