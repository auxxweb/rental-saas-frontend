const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products for a shop
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const shopId = req.user.role === 'super_admin' ? req.query.shopId : req.user.shop;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const products = await Product.find({ shop: shopId }).sort('-createdAt');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Shop admin can only access products from their shop
    if (req.user.role === 'shop_admin' && req.user.shop.toString() !== product.shop.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private
router.post('/', [
  protect,
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('pricing.hourly').optional().isFloat({ min: 0 }),
  body('pricing.daily').optional().isFloat({ min: 0 }),
  body('pricing.monthly').optional().isFloat({ min: 0 })
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

    const product = await Product.create({
      ...req.body,
      shop: shopId
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Shop admin can only update products from their shop
    if (req.user.role === 'shop_admin' && req.user.shop.toString() !== product.shop.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, category, description, stock, pricing, images, isActive } = req.body;

    if (name) product.name = name;
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (stock !== undefined) product.stock = stock;
    if (pricing) product.pricing = { ...product.pricing, ...pricing };
    if (images) product.images = images;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Shop admin can only delete products from their shop
    if (req.user.role === 'shop_admin' && req.user.shop.toString() !== product.shop.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
