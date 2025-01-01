const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Screentime = require('../models/Screentime');
const router = express.Router();
const VerifyToken = require('../middleware/VerifyToken');
const sendgrid = require('@sendgrid/mail');
const crypto = require('crypto');


sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

// Helper Functions
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// User Registration
router.post('/register', async (req, res) => {
  const { name, email, password, profilePicture } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      profilePicture: profilePicture || '', // Optional profile picture
    });

    // Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    newUser.verificationToken = verificationToken;

    await newUser.save();

    // Send verification email
    const verificationUrl = `https://screenwise.com/verify-email?token=${verificationToken}`;

    const msg = {
      to: email,
      from: 'screenwise@example.com',  // Your verified SendGrid email address
      subject: 'Email Verification',
      text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
      html: `<strong>Please verify your email by clicking on the following link:</strong> <a href="${verificationUrl}">${verificationUrl}</a>`,
    };

    sendgrid.send(msg)
      .then(() => {
        res.status(201).json({ message: 'User registered successfully! Please check your email to verify your account.' });
      })
      .catch((err) => {
        res.status(500).json({ message: 'Something went wrong. Please try again later.' });
      });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

// Email Verification
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;  // Clear the token after use
    await user.save();

    res.status(200).json({ message: 'Email successfully verified! You can now log in.' });

  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});


// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({ 
      id: user._id, 
      email: user.email, 
      name: user.name, 
      profilePicture: user.profilePicture, 
      token, 
      refreshToken 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Follow a User
router.post('/follow/:id', VerifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(req.user.id);
    const targetUser = await User.findById(id);

    if (!targetUser || user.following.includes(id)) {
      return res.status(400).json({ message: 'Cannot follow this user' });
    }

    user.following.push(id);
    targetUser.followers.push(req.user.id);

    await user.save();
    await targetUser.save();

    res.status(200).json({ message: 'Followed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Could not follow user. Try again later.' });
  }
});


// Get User Screentime Data (Public or Private)
router.get('/screentime/:id', VerifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.screentimePrivacy && id !== req.user.id) {
      return res.status(403).json({ message: 'This user’s screentime is private' });
    }

    const screentime = await Screentime.find({ userID: id }).sort({ date: -1 });
    res.status(200).json(screentime);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch screentime data. Try again later.' });
  }
});

// Refresh Token
router.post('/refresh-token', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = generateToken(user._id);

    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'No user found with this email' });
    }

    // Generate reset token and expiration time
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    const resetUrl = `https://yourapp.com/reset-password?token=${resetToken}`;

    const msg = {
      to: email,
      from: 'your-email@example.com',  // Your verified SendGrid email address
      subject: 'Password Reset',
      text: `Click on the link to reset your password: ${resetUrl}`,
      html: `<strong>Click on the link to reset your password:</strong> <a href="${resetUrl}">${resetUrl}</a>`,
    };

    sendgrid.send(msg)
      .then(() => {
        res.status(200).json({ message: 'Password reset email sent!' });
      })
      .catch((err) => {
        res.status(500).json({ message: 'Error sending email. Please try again later.' });
      });

  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() }, // Check if token is not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash the new password and save it
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully!' });

  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});


module.exports = router;
