const express = require('express');
const Job = require('../models/Job');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/jobs
// @desc    Get jobs report
// @access  Private
router.get('/jobs', protect, async (req, res) => {
  try {
    const shopId = req.user.role === 'super_admin' ? req.query.shopId : req.user.shop;
    const { startDate, endDate, status } = req.query;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const query = { shop: shopId };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name')
      .sort('-createdAt');

    const totalRevenue = jobs.reduce((sum, job) => sum + job.total, 0);
    const totalJobs = jobs.length;

    res.json({
      jobs,
      summary: {
        totalJobs,
        totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reports/payments
// @desc    Get payments report
// @access  Private
router.get('/payments', protect, async (req, res) => {
  try {
    const shopId = req.user.role === 'super_admin' ? req.query.shopId : req.user.shop;
    const { startDate, endDate, status } = req.query;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const query = { shop: shopId };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (status) query.status = status;

    const invoices = await Invoice.find(query)
      .populate('customer', 'name email phone')
      .populate('job', 'jobNumber')
      .sort('-createdAt');

    const totalPaid = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const totalPending = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.total, 0);

    res.json({
      invoices,
      summary: {
        totalInvoices: invoices.length,
        totalPaid,
        totalPending
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reports/returns
// @desc    Get returns report
// @access  Private
router.get('/returns', protect, async (req, res) => {
  try {
    const shopId = req.user.role === 'super_admin' ? req.query.shopId : req.user.shop;
    const { startDate, endDate } = req.query;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const query = { 
      shop: shopId,
      status: 'returned'
    };
    
    if (startDate || endDate) {
      query.actualReturnDate = {};
      if (startDate) query.actualReturnDate.$gte = new Date(startDate);
      if (endDate) query.actualReturnDate.$lte = new Date(endDate);
    }

    const returns = await Job.find(query)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name')
      .sort('-actualReturnDate');

    const totalExtraCharges = returns.reduce((sum, ret) => sum + (ret.extraCharges || 0), 0);
    const lateReturns = returns.filter(ret => 
      ret.actualReturnDate && ret.expectedReturnDate &&
      new Date(ret.actualReturnDate) > new Date(ret.expectedReturnDate)
    ).length;

    res.json({
      returns,
      summary: {
        totalReturns: returns.length,
        lateReturns,
        totalExtraCharges
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
