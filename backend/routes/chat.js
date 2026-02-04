const express = require('express');
const { body, validationResult } = require('express-validator');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Shop = require('../models/Shop');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chat/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    let conversations;
    
    if (req.user.role === 'super_admin') {
      // Super admin sees all conversations
      conversations = await Conversation.find()
        .populate('shop', 'name email')
        .populate('shopAdmin', 'name email')
        .sort('-lastMessageAt')
        .limit(50);
    } else {
      // Shop admin sees only their conversation
      conversations = await Conversation.find({ shopAdmin: req.user._id })
        .populate('shop', 'name email')
        .sort('-lastMessageAt');
    }

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          senderRole: req.user.role === 'super_admin' ? 'shop_admin' : 'super_admin',
          isRead: false
        });
        
        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );

    res.json(conversationsWithUnread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/chat/conversations/:id
// @desc    Get single conversation with messages
// @access  Private
router.get('/conversations/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('shop', 'name email')
      .populate('shopAdmin', 'name email')
      .populate('superAdmin', 'name email');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check authorization
    if (req.user.role === 'shop_admin' && conversation.shopAdmin._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get messages
    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name email')
      .sort('createdAt')
      .limit(100);

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversation._id,
        senderRole: req.user.role === 'super_admin' ? 'shop_admin' : 'super_admin',
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      conversation,
      messages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/chat/conversations
// @desc    Create or get existing conversation
// @access  Private
router.post('/conversations', protect, async (req, res) => {
  try {
    if (req.user.role !== 'shop_admin') {
      return res.status(403).json({ message: 'Only shop admins can create conversations' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({ shopAdmin: req.user._id, status: 'open' });

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        shop: req.user.shop,
        shopAdmin: req.user._id,
        status: 'open'
      });
    }

    const populated = await Conversation.findById(conversation._id)
      .populate('shop', 'name email')
      .populate('shopAdmin', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/chat/messages
// @desc    Send a message
// @access  Private
router.post('/messages', [
  protect,
  body('conversation').notEmpty().withMessage('Conversation ID is required'),
  body('content').trim().notEmpty().withMessage('Message content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { conversation: conversationId, content } = req.body;

    // Verify conversation exists and user has access
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check authorization
    if (req.user.role === 'shop_admin' && conversation.shopAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      senderRole: req.user.role,
      content
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    
    // Update unread count
    if (req.user.role === 'shop_admin') {
      conversation.unreadCount.superAdmin = (conversation.unreadCount.superAdmin || 0) + 1;
    } else {
      conversation.unreadCount.shopAdmin = (conversation.unreadCount.shopAdmin || 0) + 1;
    }
    
    await conversation.save();

    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/chat/messages/:conversationId
// @desc    Get messages for a conversation
// @access  Private
router.get('/messages/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    // Verify conversation access
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (req.user.role === 'shop_admin' && conversation.shopAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Build query
    const query = { conversation: conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email')
      .sort('-createdAt')
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        senderRole: req.user.role === 'super_admin' ? 'shop_admin' : 'super_admin',
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/chat/conversations/:id/status
// @desc    Update conversation status
// @access  Private
router.put('/conversations/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['open', 'closed', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Only super admin can change status
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    conversation.status = status;
    await conversation.save();

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/chat/unread-count
// @desc    Get unread message count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    let count = 0;

    if (req.user.role === 'super_admin') {
      // Count unread messages from shop admins
      count = await Message.countDocuments({
        senderRole: 'shop_admin',
        isRead: false
      });
    } else {
      // Count unread messages from super admin for this shop admin
      const conversations = await Conversation.find({ shopAdmin: req.user._id });
      const conversationIds = conversations.map(c => c._id);
      
      count = await Message.countDocuments({
        conversation: { $in: conversationIds },
        senderRole: 'super_admin',
        isRead: false
      });
    }

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
