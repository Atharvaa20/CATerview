const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { User, sequelize } = require('../models')
const { Op } = require('sequelize')
const { sendOtpEmail, sendPasswordResetOtpEmail } = require('../services/emailService')
const { generateOTP, getOtpExpiryTime, isOtpExpired } = require('../utils/otpGenerator')

// Generate and send OTP to user's email
const sendVerificationEmail = async (email, name) => {
  const otp = generateOTP();
  const otpExpires = getOtpExpiryTime();
  
  // Save OTP to user record or update if exists
  await User.update(
    { otp, otpExpires },
    { where: { email } }
  );
  
  // Send OTP via email
  await sendOtpEmail(email, otp);
  return { otp, otpExpires };
};

// Register endpoint - sends OTP to user's email
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      // If user exists but not verified, update their details and resend OTP
      existingUser.name = name;
      existingUser.password = password; // Will be hashed by the model
      await existingUser.save();
    } else {
      // Create new unverified user
      await User.create({
        name,
        email,
        password,
        isVerified: false
      });
    }

    // Generate and send OTP
    await sendVerificationEmail(email, name);
    
    res.status(200).json({
      message: 'Verification OTP sent to your email',
      email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify OTP and activate user
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if OTP matches and is not expired
    if (user.otp !== otp || isOtpExpired(user.otpExpires)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      error: 'OTP verification failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate and send new OTP
    await sendVerificationEmail(email, user.name);
    
    res.status(200).json({
      message: 'New OTP sent to your email',
      email
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      error: 'Failed to resend OTP',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', { email: req.body.email });
    
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user exists and is verified
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isVerified) {
      return res.status(401).json({ 
        error: 'Account not verified. Please verify your email first.'
      });
    }

    console.log('Login attempt for email:', email);
    console.log('Password provided (first 2 chars):', password ? password.substring(0, 2) + '...' : 'none');
    
    let userInstance;
    try {
      // First, try to find the user using Sequelize's model method
      const userData = await User.findOne({
        where: { email },
        attributes: ['id', 'email', 'password'],
        raw: true
      });

      if (!userData) {
        console.log('User not found for email:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log('User data from database:', {
        id: userData.id,
        email: userData.email,
        hasPassword: !!userData.password,
        passwordLength: userData.password ? userData.password.length : 0,
        passwordStartsWith: userData.password ? userData.password.substring(0, 10) + '...' : 'none'
      });

      // Get the full user instance for validation
      userInstance = await User.findByPk(userData.id);
      if (!userInstance) {
        console.log('User instance not found for ID:', userData.id);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log('User model instance created, checking password...');
      
      // Check password
      console.log('Starting password validation...');
      console.log('Calling user.validPassword()...');
      const isValidPassword = await userInstance.validPassword(password);
      console.log('Password validation completed, result:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token with role
      console.log('Generating token for user:', userInstance.id);
      const token = jwt.sign(
        { userId: userInstance.id, role: userInstance.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      console.log('Token generated successfully');
      console.log('Token payload:', { userId: userInstance.id, role: userInstance.role });

      res.json({
        user: {
          id: userInstance.id,
          name: userInstance.name,
          email: userInstance.email,
          role: userInstance.role
        },
        token
      });
    } catch (error) {
      console.error('Error during authentication:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return res.status(500).json({ 
        error: 'Error during authentication',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('Login error:', error)
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors.map(e => e.message) })
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Unique constraint failed', details: error.errors.map(e => e.message) })
    }
    res.status(500).json({ 
      error: 'Internal server error', 
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred' 
    })
  }
})

// Request password reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // For security, don't reveal if the email exists or not
      return res.json({ message: 'If your email is registered, you will receive an OTP' });
    }

    // Generate and save OTP
    const otp = generateOTP();
    const otpExpires = getOtpExpiryTime();
    
    user.otp = otp;
    user.otpExpires = otpExpires;
    user.resetPasswordOtp = otp; // Using a separate field for password reset OTP
    user.resetPasswordOtpExpires = otpExpires;
    await user.save();

    // Send password reset OTP via email
    await sendPasswordResetOtpEmail(email, otp);

    res.json({ 
      message: 'If your email is registered, you will receive an OTP',
      email // Send back email for the next step
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      error: 'Failed to process password reset request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify OTP and reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ 
      where: { 
        email,
        resetPasswordOtp: otp,
        resetPasswordOtpExpires: { [Op.gt]: new Date() }
      } 
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Update password and clear OTP
    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      error: 'Failed to reset password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router
