const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();


const User = require('../models/user');
const { sendOTP } = require('../utils/nodemailer')
const authenticateAdmin = require('./authenticateUser');
const ensureDashboardExists = require('./ensuredashboardexist')
const Dashboard = require('../models/dashboard')


const router = express.Router();

// Password, email, validation regex
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


// Endpoint for user signup
router.post('/signup', async (req, res) => {
    const { password, email, confirmPassword}=req.body

    // Check if any required field is missing
    if (!password || !confirmPassword || !email )
        return res.status(400).json({ status: "error", msg: "Fill in all fields correctly" });
    

     // Check if password and confirm password match
     if (password !== confirmPassword) {
        return res.status(400).json({ status: "error", msg: "Password and confirm password do not match" });
    }

    
    
    // Validate password
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            status: "error",
            msg: "Password must be at least 8 characters long, contain at least one uppercase letter, one digit, and one special character."
        });
    }
    
    // Validate email
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            status: "error",
            msg: "Invalid email format."
        });
    }
    try {
        // Check if email has been used to create an account before
        const found = await User.findOne({ email }).lean();
        if (found) {
            return res.status(400).json({ status: 'error', msg: `User with this email: ${email} already exists` });
        } 

            // Check the current number of admins in the database
            const adminCount = await User.countDocuments({ email });
    
            // If trying to sign up as an admin and there are already 2 admins
            if ( email >= 2) {
                return res.status(400).json({ status: 'error', msg: 'restricted access you are not admin.'});//  two admins can sign up only
            }
    
 
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newAdmin = new User({
            email,
            password: hashedPassword,
        });


    // Automatically create a dashboard for the new user
    await Dashboard.create({
        userId: newAdmin._id,
      });

        await newAdmin.save();
        res.status(201).json({ msg: 'You signed up successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", msg: error.message });
    };
});

// Endpoint for user to log in

router.post('/login',async (req, res) => {
    const { email, password } = req.body;

    // Check if any required field is missing
    if (!email || !password) {
        return res.status(400).json({ status: 'error', msg: 'Email and password are required' });
    }

    // Validate email format
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            status: "error",
            msg: "Invalid email format."
        });
    }

    // Validate password format
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            status: "error",
            msg: "Password must be at least 8 characters long, contain at least one uppercase letter, one digit, and one special character."
        });
    }

    try {
        // Check if user with that email exists in the database
        const Admin = await User.findOne({ email });
        if (!Admin) {
            return res.status(400).json({ status: 'error', msg: 'Incorrect email or password' });
        }

        // Check if password is correct
        const isPasswordValid = await bcrypt.compare(password, Admin.password);
        if (!isPasswordValid) {
            return res.status(400).json({ status: 'error', msg: 'Incorrect email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { _id: Admin._id, email: Admin.email, role: Admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );

        // Update user document online status
        Admin.is_online = true;
        await Admin.save();

          // Step 3: Ensure the dashboard exists
    let dashboard = await Dashboard.findOne({ userId: Admin._id });
    if (!dashboard) {
      dashboard = new Dashboard({
        userId: Admin._id,
        posts: 0, // Default value
        comments: 0, // Default value
        lastUpdated:null, // Default value
      });
      await dashboard.save();
    }



        // Send user data without the password
        const { password: userPassword, ...userWithoutPassword } = Admin.toObject();

        res.status(200).json({
            status: 'success',
            msg: 'You have successfully logged in as admin',
            user: userWithoutPassword,
            token
        });
   

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", msg: "An error occurred during login. Please try again." });
    }
});

// Endpoint  for forgot password

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ status: "error", msg: "Valid email is required" });
    }

    // Validate email format
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            status: "error",
            msg: "Invalid email format."
        });
    }

    try {
        // Check if the Admin exists
        const Admin = await User.findOne({ email });
        if (!Admin) {
            return res.status(404).json({ status: "error", msg: "User not found" });
        }

        // Generate a 6-digit OTP
        
    const otp = crypto.randomInt(10000,999999).toString();
    Admin.otp = otp;
    Admin.otptime = Date.now() + 1 * 60 * 1000; // 1minutes

        await Admin.save();

        // Send OTP via email
        await sendOTP(email, otp);

        res.status(200).json({ status: "success", msg: "OTP sent to your email" });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ status: "error", msg: "Failed to send OTP" });
    }
});



// Verify OTP route
router.post('/verify-otp', async (req, res) => {
  const { otp } = req.body;

  try {
    const Admin = await User.findOne({ otp });

    if (!Admin) {
      return res.status(400).send({ msg: 'Invalid OTP' });
    }

    // Check if OTP is valid and not expired
    if (Admin.otp !== otp || Date.now() > Admin.otptime) {
      return res.status(400).send({ msg: 'Invalid or expired OTP' });
    }

    res.status(200).send({ msg: 'OTP verified successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send({ msg: 'Server error' });
  }
});

// Resetting the password 

router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const Admin = await User.findOne({
      _id: decoded.userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!Admin) {
      return res.status(400).send({ msg: 'Invalid or expired token' });
    }

    // Hash the new password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Save the new password
    Admin.password = hashedPassword;
    Admin.resetPasswordToken = undefined; // Clear reset token
    Admin.resetPasswordExpires = undefined; // Clear reset token expiry time

    await Admin.save();

    res.status(200).send({ msg: 'Password successfully reset' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send({ msg: 'Server error' });
  }
});

// Logout Endpoint
router.post('/logout', authenticateAdmin, async (req, res) => {
    try {
      // Ensure the token is available in the request
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ status: 'error', msg: 'No token provided.' });
      }
  
      // Ensure the authenticated user exists and is an admin
      const user = req.user; // Attach the user from the middleware
      if (!user) {
        return res.status(401).json({ status: 'error', msg: 'User not authenticated.' });
      }
  
      // Filter out the current token from the user's tokens array
      user.tokens = user.tokens.filter((t) => t.token !== token);
  
      // Mark the user as offline
      user.is_online = false;
  
      // Save the updated user to the database
      await user.save();
  
      res.status(200).json({ status: 'success', msg: 'You have successfully logged out.' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ status: 'error', msg: 'Internal server error.' });
    }
  });      

module.exports = router;
