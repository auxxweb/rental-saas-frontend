const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Shop = require('../models/Shop');
const PasswordResetToken = require('../models/PasswordResetToken');
const { protect } = require('../middleware/auth');
const { sendPasswordChangeVerification, sendPasswordChangeConfirmation } = require('../services/emailService');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (Super Admin only)
// @access  Private (Super Admin)
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['super_admin', 'shop_admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, shopId } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      shop: shopId || null
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['super_admin', 'shop_admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role } = req.body;

    // Find user by email and role
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Populate shop if shop_admin
    let userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    };

    if (user.role === 'shop_admin' && user.shop) {
      const shop = await Shop.findById(user.shop);
      userData.shop = shop;
    }

    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    let userData = user.toObject();
    
    if (user.role === 'shop_admin' && user.shop) {
      const shop = await Shop.findById(user.shop);
      userData.shop = shop;
    }
    
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/request-password-change
// @desc    Request password change (sends verification email)
// @access  Private
router.post('/request-password-change', protect, [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('verificationType').isIn(['link', 'otp']).withMessage('Verification type must be link or otp')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword, verificationType = 'link' } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Invalidate any existing tokens
    await PasswordResetToken.updateMany(
      { user: user._id, used: false },
      { used: true }
    );

    // Generate token or OTP
    let token, otp;
    if (verificationType === 'otp') {
      otp = PasswordResetToken.generateOTP();
      token = PasswordResetToken.generateToken();
    } else {
      token = PasswordResetToken.generateToken();
    }

    // Create password reset token
    // Note: In production, store newPassword in Redis or similar secure temporary storage
    // For this implementation, we'll require the user to provide newPassword again during verification
    const resetToken = await PasswordResetToken.create({
      user: user._id,
      token,
      otp: otp || undefined,
      type: verificationType
    });

    // Send verification email
    const emailResult = await sendPasswordChangeVerification(
      user.email,
      verificationType === 'otp' ? otp : token,
      verificationType
    );

    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.json({
      message: verificationType === 'otp' 
        ? 'Verification code sent to your email' 
        : 'Verification link sent to your email',
      type: verificationType,
      token: verificationType === 'otp' ? undefined : token // Don't send token for link type
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/verify-password-change
// @desc    Verify and change password (with token or OTP)
// @access  Public (for link) / Private (for OTP)
router.post('/verify-password-change', [
  body('token').notEmpty().withMessage('Token is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('otp').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, email, newPassword, otp } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find valid reset token
    const resetToken = await PasswordResetToken.findOne({
      user: user._id,
      token,
      used: false
    });

    if (!resetToken || !resetToken.isValid()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Verify OTP if provided
    if (resetToken.type === 'otp') {
      if (!otp || resetToken.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Mark token as used
    resetToken.used = true;
    await resetToken.save();

    // Send confirmation email
    await sendPasswordChangeConfirmation(user.email);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for password change
// @access  Private
router.post('/verify-otp', protect, [
  body('otp').notEmpty().withMessage('OTP is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { otp, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Find valid reset token with OTP
    const resetToken = await PasswordResetToken.findOne({
      user: user._id,
      otp,
      type: 'otp',
      used: false
    });

    if (!resetToken || !resetToken.isValid()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Mark token as used
    resetToken.used = true;
    await resetToken.save();

    // Send confirmation email
    await sendPasswordChangeConfirmation(user.email);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
