const express = require('express');
const Invoice = require('../models/Invoice');
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/invoices
// @desc    Create invoice from job
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { jobId } = req.body;

    const job = await Job.findById(jobId)
      .populate('customer')
      .populate('items.product', 'name');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Shop admin can only create invoices for their shop
    if (req.user.role === 'shop_admin' && req.user.shop.toString() !== job.shop.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ job: jobId });
    if (existingInvoice) {
      return res.status(400).json({ message: 'Invoice already exists for this job' });
    }

    // Prepare invoice items
    const invoiceItems = job.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      pricingMode: item.pricingMode,
      rate: item.rate,
      duration: item.duration,
      subtotal: item.subtotal
    }));

    // Create invoice
    const invoice = await Invoice.create({
      shop: job.shop,
      job: job._id,
      customer: job.customer._id,
      items: invoiceItems,
      subtotal: job.subtotal,
      tax: job.tax,
      extraCharges: job.extraCharges || 0,
      total: job.total,
      dueDate: job.expectedReturnDate
    });

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'name email phone address')
      .populate('job', 'jobNumber startDate expectedReturnDate')
      .populate('items.product', 'name category');

    res.status(201).json(populatedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/invoices
// @desc    Get all invoices for a shop
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const shopId = req.user.role === 'super_admin' ? req.query.shopId : req.user.shop;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const invoices = await Invoice.find({ shop: shopId })
      .populate('customer', 'name email phone')
      .populate('job', 'jobNumber')
      .sort('-createdAt');
    
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/invoices/:id
// @desc    Get invoice by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('job', 'jobNumber startDate expectedReturnDate actualReturnDate')
      .populate('items.product', 'name category');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Shop admin can only access invoices from their shop
    if (req.user.role === 'shop_admin' && req.user.shop.toString() !== invoice.shop.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/invoices/:id
// @desc    Update invoice (mainly for payment status)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Shop admin can only update invoices from their shop
    if (req.user.role === 'shop_admin' && req.user.shop.toString() !== invoice.shop.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { status, paymentDate } = req.body;

    if (status) invoice.status = status;
    if (paymentDate) invoice.paymentDate = paymentDate;

    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'name email phone address')
      .populate('job', 'jobNumber')
      .populate('items.product', 'name category');

    res.json(populatedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
