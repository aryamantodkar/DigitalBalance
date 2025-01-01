const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Screentime = require('../models/Screentime');
const router = express.Router();
const VerifyToken = require('../middleware/VerifyToken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists with this email' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log("Hashed Password:", hashedPassword);
  try {
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
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

    res.status(200).json({ id: user._id, email: user.email, token, refreshToken });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/screentime',VerifyToken, async (req, res) => {
  const { userID, totalScreentime, date, apps } = req.body;

  // Validate request
  if (!userID || !totalScreentime || !apps || typeof apps !== 'object') {
    return res.status(400).json({ message: 'Invalid input. All fields are required.' });
  }

  try {
    const screentime = new Screentime({
      userID,
      totalScreentime,
      date,
      apps
    });

    await screentime.save();
    res.status(201).json({ message: 'Screentime record created successfully', screentime });
  } catch (err) {
    console.error("Error creating screentime record:", err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

router.get('/screentime/:userID',VerifyToken, async (req, res) => {
  const { userID } = req.params;

  try {
    const records = await Screentime.find({ userID }).sort({ date: -1 });
    res.status(200).json(records);
  } catch (err) {
    console.error("Error fetching screentime records:", err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

router.post('/refresh-token', async (req, res) => {
  const { token } = req.body; // Get refresh token from the client

  if (!token) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});




module.exports = router;
