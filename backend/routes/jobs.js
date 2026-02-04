const express = require('express');
const { body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Shop = require('../models/Shop');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Calculate rent based on pricing mode and duration
const calculateRent = (rate, duration, pricingMode) => {
  let total = 0;
  
  if (pricingMode === 'hourly') {
    total = rate * duration;
  } else if (pricingMode === 'daily') {
    total = rate * duration;
  } else if (pricingMode === 'monthly') {
    total = rate * duration;
  }
  
  return total;
};

// @route   GET /api/jobs
// @desc    Get all jobs for a shop
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const shopId = req.user.role === 'super_admin' ? req.query.shopId : req.user.shop;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const jobs = await Job.find({ shop: shopId })
      .populate('customer', 'name email phone')
      .populate('items.product', 'name category')
      .sort('-createdAt');
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get job by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name category pricing');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Shop admin can only access jobs from their shop
    if (req.user.role === 'shop_admin' && req.user.shop.toString() !== job.shop.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/jobs
// @desc    Create a new job/bill
// @access  Private
router.post('/', [
  protect,
  body('customer').notEmpty().withMessage('Customer is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('expectedReturnDate').isISO8601().withMessage('Valid expected return date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shopId = req.user.role === 'super_admin' ? req.body.shopId : req.user.shop;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const { customer, items, startDate, expectedReturnDate, notes } = req.body;

    // Get shop for tax rate
    const shop = await Shop.findById(shopId);
    const taxRate = shop?.settings?.taxRate || 0;

    // Process items and calculate totals
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      // Get rate based on pricing mode
      const rate = product.pricing[item.pricingMode] || 0;
      if (rate === 0) {
        return res.status(400).json({ message: `${item.pricingMode} rate not set for ${product.name}` });
      }

      // Calculate duration in the appropriate unit
      const duration = item.duration.value;
      const itemSubtotal = calculateRent(rate, duration, item.pricingMode) * item.quantity;

      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        pricingMode: item.pricingMode,
        rate: rate,
        duration: {
          value: duration,
          unit: item.duration.unit
        },
        subtotal: itemSubtotal
      });

      subtotal += itemSubtotal;

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    // Create job
    const job = await Job.create({
      shop: shopId,
      customer,
      items: processedItems,
      startDate,
      expectedReturnDate,
      subtotal,
      tax,
      total,
      notes
    });

    const populatedJob = await Job.findById(job._id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name category');

    res.status(201).json(populatedJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update job (mainly for return tracking)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Shop admin can only update jobs from their shop
    if (req.user.role === 'shop_admin' && req.user.shop.toString() !== job.shop.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { actualReturnDate, status, extraCharges, notes } = req.body;

    if (actualReturnDate) {
      job.actualReturnDate = actualReturnDate;
      
      // Calculate extra charges if returned late
      if (new Date(actualReturnDate) > new Date(job.expectedReturnDate)) {
        const diffTime = new Date(actualReturnDate) - new Date(job.expectedReturnDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Calculate extra charges based on items
        let extra = 0;
        for (const item of job.items) {
          const product = await Product.findById(item.product);
          const dailyRate = product.pricing.daily || product.pricing.hourly * 24 || 0;
          extra += dailyRate * diffDays * item.quantity;
        }
        
        job.extraCharges = extra;
        job.total = job.subtotal + job.tax + extra;
      }
    }

    if (status) job.status = status;
    if (extraCharges !== undefined) {
      job.extraCharges = extraCharges;
      job.total = job.subtotal + job.tax + extraCharges;
    }
    if (notes !== undefined) job.notes = notes;

    await job.save();

    // Return products to stock if status is returned
    if (status === 'returned') {
      for (const item of job.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    const populatedJob = await Job.findById(job._id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name category');

    res.json(populatedJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/jobs/stats/overview
// @desc    Get job statistics for shop dashboard
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const shopId = req.user.role === 'super_admin' ? req.query.shopId : req.user.shop;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const activeJobs = await Job.countDocuments({ shop: shopId, status: 'active' });
    const pendingReturns = await Job.countDocuments({ 
      shop: shopId, 
      status: 'active',
      expectedReturnDate: { $lt: new Date() }
    });
    const returnedJobs = await Job.countDocuments({ shop: shopId, status: 'returned' });

    res.json({
      activeJobs,
      pendingReturns,
      returnedJobs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
