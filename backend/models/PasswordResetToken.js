const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String,
    required: false
  },
  type: {
    type: String,
    enum: ['link', 'otp'],
    default: 'link'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate token
passwordResetTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Generate OTP
passwordResetTokenSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Check if token is valid
passwordResetTokenSchema.methods.isValid = function() {
  return !this.used && new Date() < this.expiresAt;
};

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
