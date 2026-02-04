const express = require('express');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/customers
// @desc    Get all customers for a shop
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const shopId = req.user.role === 'super_admin' ? req.query.shopId : req.user.shop;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const customers = await Customer.find({ shop: shopId }).sort('-createdAt');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/customers
// @desc    Create a new customer
// @access  Private
router.post('/', [
  protect,
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
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

    const customer = await Customer.create({
      ...req.body,
      shop: shopId
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
