const express = require('express');
const { body, validationResult } = require('express-validator');
const Shop = require('../models/Shop');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendShopCredentials } = require('../services/emailService');
const { sendShopCredentialsWhatsApp } = require('../services/whatsappService');

const router = express.Router();

// @route   GET /api/shops
// @desc    Get all shops (Super Admin) or own shop (Shop Admin)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'super_admin') {
      const shops = await Shop.find().populate('admin', 'name email').sort('-createdAt');
      res.json(shops);
    } else {
      const shop = await Shop.findById(req.user.shop).populate('admin', 'name email');
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      res.json(shop);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/shops/:id
// @desc    Get shop by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('admin', 'name email');
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Shop admin can only access their own shop
    if (req.user.role === 'shop_admin' && req.user.shop.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/shops
// @desc    Create a new shop
// @access  Private (Super Admin)
router.post('/', [
  protect,
  authorize('super_admin'),
  body('name').trim().notEmpty().withMessage('Shop name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('adminEmail').isEmail().withMessage('Please provide a valid admin email'),
  body('adminPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, 
      email, 
      phone, 
      address, 
      adminEmail, 
      adminName, 
      adminPassword,
      whatsappNumber 
    } = req.body;

    // Check if shop email already exists
    const shopExists = await Shop.findOne({ email });
    if (shopExists) {
      return res.status(400).json({ message: 'Shop with this email already exists' });
    }

    // Check if admin user already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create admin user
    const adminUser = await User.create({
      name: adminName || 'Shop Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'shop_admin'
    });

    // Create shop
    const shop = await Shop.create({
      name,
      email,
      phone,
      address,
      admin: adminUser._id,
      status: 'active' // Auto-activate new shops
    });

    // Link shop to admin user
    adminUser.shop = shop._id;
    await adminUser.save();

    // Send credentials via email
    const emailResult = await sendShopCredentials(
      { name, email, phone },
      { email: adminEmail, password: adminPassword }
    );

    // Send credentials via WhatsApp if phone number provided
    let whatsappResult = { success: false };
    if (whatsappNumber || phone) {
      whatsappResult = await sendShopCredentialsWhatsApp(
        whatsappNumber || phone,
        { name, email, phone },
        { email: adminEmail, password: adminPassword }
      );
    }

    const populatedShop = await Shop.findById(shop._id).populate('admin', 'name email');

    res.status(201).json({
      ...populatedShop.toObject(),
      notifications: {
        email: emailResult.success ? 'sent' : 'failed',
        whatsapp: whatsappResult.success ? 'sent' : 'failed'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/shops/:id
// @desc    Update shop
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Shop admin can only update their own shop
    if (req.user.role === 'shop_admin' && req.user.shop.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, email, phone, address, status, subscription, settings } = req.body;

    if (name) shop.name = name;
    if (email) shop.email = email;
    if (phone) shop.phone = phone;
    if (address) shop.address = { ...shop.address, ...address };
    if (status && req.user.role === 'super_admin') shop.status = status;
    if (subscription && req.user.role === 'super_admin') shop.subscription = { ...shop.subscription, ...subscription };
    if (settings) shop.settings = { ...shop.settings, ...settings };

    await shop.save();

    const populatedShop = await Shop.findById(shop._id).populate('admin', 'name email');
    res.json(populatedShop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/shops/:id
// @desc    Delete shop
// @access  Private (Super Admin)
router.delete('/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    await shop.deleteOne();
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/shops/stats/overview
// @desc    Get shop statistics
// @access  Private (Super Admin)
router.get('/stats/overview', protect, authorize('super_admin'), async (req, res) => {
  try {
    const totalShops = await Shop.countDocuments();
    const activeShops = await Shop.countDocuments({ status: 'active' });
    const pendingShops = await Shop.countDocuments({ status: 'pending' });

    // Calculate revenue (sum of all invoices)
    const Invoice = require('../models/Invoice');
    const revenueResult = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    const revenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      totalShops,
      activeShops,
      pendingShops,
      revenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
