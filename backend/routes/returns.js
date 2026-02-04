const express = require('express');
const Job = require('../models/Job');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/returns
// @desc    Get all returns/pending returns for a shop
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const shopId = req.user.role === 'super_admin' ? req.query.shopId : req.user.shop;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const returns = await Job.find({ 
      shop: shopId,
      status: { $in: ['active', 'returned', 'overdue'] }
    })
      .populate('customer', 'name email phone')
      .populate('items.product', 'name category')
      .sort('-expectedReturnDate');
    
    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/returns/:jobId
// @desc    Process return for a job
// @access  Private
router.post('/:jobId', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Shop admin can only process returns for their shop
    if (req.user.role === 'shop_admin' && req.user.shop.toString() !== job.shop.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { actualReturnDate, extraCharges, notes } = req.body;

    job.actualReturnDate = actualReturnDate || new Date();
    job.status = 'returned';

    // Calculate extra charges if returned late
    if (new Date(job.actualReturnDate) > new Date(job.expectedReturnDate)) {
      const diffTime = new Date(job.actualReturnDate) - new Date(job.expectedReturnDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Calculate extra charges based on items
      let extra = 0;
      for (const item of job.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const dailyRate = product.pricing.daily || product.pricing.hourly * 24 || product.pricing.monthly / 30 || 0;
          extra += dailyRate * diffDays * item.quantity;
        }
      }
      
      job.extraCharges = extra;
    } else if (extraCharges !== undefined) {
      job.extraCharges = extraCharges;
    }

    if (notes) job.notes = notes;

    // Recalculate total
    job.total = job.subtotal + job.tax + (job.extraCharges || 0);

    await job.save();

    // Return products to stock
    for (const item of job.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
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

module.exports = router;
