const express = require('express');
const Shop = require('../models/Shop');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/subscriptions
// @desc    Get all subscriptions
// @access  Private (Super Admin)
router.get('/', protect, authorize('super_admin'), async (req, res) => {
  try {
    const shops = await Shop.find().select('name email subscription status').sort('-createdAt');
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/subscriptions/:shopId
// @desc    Update shop subscription
// @access  Private (Super Admin)
router.put('/:shopId', protect, authorize('super_admin'), async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const { plan, startDate, endDate, isActive } = req.body;

    if (plan) shop.subscription.plan = plan;
    if (startDate) shop.subscription.startDate = startDate;
    if (endDate) shop.subscription.endDate = endDate;
    if (isActive !== undefined) shop.subscription.isActive = isActive;

    await shop.save();

    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
