const express = require('express');
require('dotenv').config();
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

const sendVerificationEmail = async (email, verificationToken) => {
  if (!email || !verificationToken) {
    throw new Error('Email and verification token are required.');
  }

  const verificationUrl = `http://192.168.1.8:5000/api/auth/verify-email?token=${verificationToken}`;
  const msg = {
    to: email,
    from: 'app.screenwise@gmail.com', // Must be a verified sender in your SendGrid account
    subject: 'Verify Your Email Address',
    text: `Hello,

    Thank you for signing up! Please verify your email address by clicking the link below:

    ${verificationUrl}

    If you did not request this, please ignore this email.

    Best regards,
    The Team`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f9;
            color: #333;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .header {
            background-color: #00796b;
            color: #ffffff;
            padding: 15px;
            border-radius: 8px 8px 0 0;
            font-size: 24px;
            font-weight: bold;
          }
          .content {
            margin: 20px 0;
            font-size: 16px;
            line-height: 1.5;
          }
          .cta-button {
            display: inline-block;
            margin: 20px 0;
            padding: 12px 20px;
            font-size: 18px;
            color: #ffffff;
            background-color: #00796b;
            text-decoration: none;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .cta-button:hover {
            background-color: #005f50;
          }
          .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            Verify Your Email Address
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Thank you for signing up! Please confirm your email address to complete your registration.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${verificationUrl}" class="cta-button">Verify Email</a>
            <p>If the button above doesn’t work, please copy and paste the following link into your browser:</p>
            <p><a href="${verificationUrl}" style="color: #00796b;">${verificationUrl}</a></p>
            <p>If you did not request this email, please ignore it.</p>
          </div>
          <div class="footer">
            <p>Best regards,</p>
            <p>The Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };


  try {
    await sendgrid.send(msg);
    console.log('Verification email sent to:', email);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Could not send verification email.');
  }
};

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;


  // Validate required fields
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: 'Name, email, and password are required.' });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'User already exists with this email.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a verification token and expiration date
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // Token expires in 24 hours

    // Create a new user with default values for fields not yet collected
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      firstLogin: true, // User will provide additional details on first login
      emailVerified: false, // Default to false for new users
      verificationToken,
      verificationTokenExpiration,
    });

    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully! A verification email has been sent.',
      userId: newUser._id,
    });
    
    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      res.status(500).json({
        message: 'User registered, but there was an error sending the verification email.',
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

// Email Verification Route
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    // Find the user with the corresponding verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              background-color: #f2f7f4;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              color: #555;
            }
            .container {
              text-align: center;
              background: #fff;
              padding: 40px;
              border-radius: 15px;
              box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
              max-width: 400px;
              width: 100%;
            }
            .error {
              color: #d32f2f;
              font-size: 22px;
              font-weight: 600;
            }
            h1 {
              color: #43a047;
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 20px;
            }
            p {
              font-size: 18px;
              margin-top: 15px;
              line-height: 1.6;
              color: #777;
            }
            .cta-button {
              margin-top: 20px;
              padding: 12px 25px;
              background-color: #00796b;
              color: #fff;
              text-decoration: none;
              border-radius: 50px;
              font-weight: bold;
              font-size: 16px;
              transition: background-color 0.3s ease;
            }
            .cta-button:hover {
              background-color: #004d40;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Invalid or Expired Token</h1>
            <p>We’re sorry, but your verification link is invalid or has expired.</p>
            <p>If you need assistance, please contact support.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Mark the user's email as verified
    user.emailVerified = true;
    user.verificationToken = undefined; // Clear the token after successful verification
    await user.save();

    // Redirect to a success page or return a success response
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background-color: #f2f7f4;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: #555;
          }
          .container {
            text-align: center;
            background: #fff;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 100%;
          }
          h1 {
            color: #43a047;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 20px;
          }
          p {
            font-size: 18px;
            margin-top: 15px;
            line-height: 1.6;
            color: #777;
          }
          .cta-button {
            margin-top: 30px;
            padding: 12px 25px;
            background-color: #00796b;
            color: #fff;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.3s ease;
          }
          .cta-button:hover {
            background-color: #004d40;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Email Verified Successfully!</h1>
          <p>Thank you for verifying your email address. You can now log in to your account.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background-color: #f2f7f4;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: #555;
          }
          .container {
            text-align: center;
            background: #fff;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 100%;
          }
          .error {
            color: #d32f2f;
            font-size: 22px;
            font-weight: 600;
          }
          p {
            font-size: 18px;
            margin-top: 15px;
            line-height: 1.6;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">An Error Occurred</h1>
          <p>Something went wrong. Please try again later.</p>
        </div>
      </body>
      </html>
    `);
  }
});


//Redirect After Verification
router.get('/check-verification', async (req, res) => {
  const { userId } = req.query;

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.emailVerified) {
      return res.status(200).json({ verified: true });
    } else {
      return res.status(200).json({ verified: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error checking email verification status.' });
  }
});

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified or user not found.' });
    }

    try {
      await sendVerificationEmail(email, verificationToken);
      res.status(201).json({
        message: 'User registered successfully! A verification email has been sent.',
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      res.status(500).json({
        message: 'User registered, but there was an error sending the verification email.',
      });
    }

    res.status(200).json({ message: 'Verification email resent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resending verification email.' });
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

    if (!user.emailVerified) {
      return res.status(400).json({ message: 'Email not verified. Please check your email.' });
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

router.get('/first-login', VerifyToken, async (req, res) => {
  try {
    const userId = req.query.user.id; // `req.user` is assumed to be set by the `authenticate` middleware
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ firstLogin: user.firstLogin });
  } catch (error) {
    console.error("Error checking first login:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/upload',VerifyToken, async (req, res) => {
  try {
      const { userId, profilePicture } = req.body;

      if (!userId || !profilePicture) {
          return res.status(400).json({ message: 'User ID and profile picture are required' });
      }

      // Find and update the user's profile picture
      const user = await User.findByIdAndUpdate(
          userId,
          { profilePicture },
          { new: true } // Return the updated user document
      );

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'Profile picture updated successfully', user });
  } catch (error) {
      console.error('Error updating profile picture:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/update-selected-apps',VerifyToken, async (req, res) => {
  try {
      const { userId, selectedApps } = req.body;

      if (!userId || !selectedApps) {
          return res.status(400).json({ message: 'User ID and selected apps are required' });
      }

      const user = await User.findByIdAndUpdate(
          userId,
          { selectedApps },
          { new: true } 
      );

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'Selected apps updated successfully', user });
  } catch (error) {
      console.error('Error updating selected apps:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/set-first-login',VerifyToken, async (req, res) => {
  try {
    const { userId } = req.body; // Expecting userId in the request body

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find the user by ID and update the firstLogin field
    const user = await User.findByIdAndUpdate(
      userId,
      { firstLogin: false }, // Update the firstLogin field to false
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'First login updated successfully', user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/screenlimit',VerifyToken, async (req, res) => {
  try {
    const { userId, screenTimeLimit } = req.body; // Expecting userId in the request body

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find the user by ID and update the firstLogin field
    const user = await User.findByIdAndUpdate(
      userId,
      { screentimeLimit: screenTimeLimit }, // Update the firstLogin field to false
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'Screen limit updated successfully', user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/user/details',VerifyToken, async (req, res) => {
  const { userId } = req.body; // Extract user ID from request body

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required.',
    });
  }

  try {
    // Fetch the user by ID with populated followers and following fields
    const user = await User.findById(userId)
      .populate('followers', 'name email profilePicture') // Populate follower details
      .populate('following', 'name email profilePicture') // Populate following details
      .select('-password -verificationToken -resetToken -firstLogin -emailVerified'); // Exclude sensitive fields

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details.',
      error: error.message,
    });
  }
});

router.post('/screentime', async (req, res) => {
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

router.get('/screentime/:userID', async (req, res) => {
  const { userID } = req.params;
  try {
    const records = await Screentime.find({ userID }).sort({ date: -1 });
    res.status(200).json(records);
  } catch (err) {
    console.error("Error fetching screentime records:", err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;
