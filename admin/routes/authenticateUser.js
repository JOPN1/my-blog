const jwt = require('jsonwebtoken');
const admin = require('../models/user');

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).send({ error: 'Token missing in the request header.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded:', decoded); // Debug decoded token

    const user = await admin.findOne({ _id: decoded._id });
    if (!user) {
      throw new Error('User not found.');
    }

    console.log('User Tokens:', user.tokens); // Debug tokens
    if (!user.tokens.some(t => t.token === token)) {
      throw new Error('Token is invalid or does not match.');
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message); // Log error for debugging
    res.status(401).send({ error: error.message });
  }
};

module.exports = authenticateUser;

