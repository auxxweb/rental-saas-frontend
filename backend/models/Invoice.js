const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: false, // Will be auto-generated
    unique: true,
    sparse: true // Allows multiple null values for unique constraint
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    quantity: Number,
    pricingMode: String,
    rate: Number,
    duration: {
      value: Number,
      unit: String
    },
    subtotal: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  extraCharges: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'overdue'],
    default: 'pending'
  },
  paymentDate: Date,
  dueDate: Date
}, {
  timestamps: true
});

// Index for faster invoice number lookups and tracking
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ shop: 1, invoiceNumber: 1 }); // Compound index for shop-specific invoice number queries

// Generate invoice number before saving
// This ensures sequential invoice numbers connected to previous invoice numbers
invoiceSchema.pre('save', async function(next) {
  // Only generate if invoiceNumber is not already set
  if (!this.invoiceNumber && this.shop) {
    try {
      // Find the latest invoice for this shop to get the highest invoice number
      const latestInvoice = await mongoose.model('Invoice')
        .findOne({ shop: this.shop, invoiceNumber: { $exists: true, $ne: null } })
        .sort({ invoiceNumber: -1 })
        .select('invoiceNumber');

      let nextNumber = 1;

      if (latestInvoice && latestInvoice.invoiceNumber) {
        // Extract the numeric part from the latest invoice number
        // Format: INV-XXXXXX-000001
        const invoiceNumberParts = latestInvoice.invoiceNumber.split('-');
        if (invoiceNumberParts.length >= 3) {
          const numericPart = invoiceNumberParts[invoiceNumberParts.length - 1];
          const parsedNumber = parseInt(numericPart, 10);
          if (!isNaN(parsedNumber)) {
            nextNumber = parsedNumber + 1;
          }
        }
      }

      // Generate shop identifier (last 6 characters of shop ID)
      const shopId = this.shop.toString();
      const shopIdentifier = shopId.slice(-6).toUpperCase();

      // Generate sequential invoice number: INV-SHOPID-000001
      this.invoiceNumber = `INV-${shopIdentifier}-${String(nextNumber).padStart(6, '0')}`;

      // Ensure uniqueness by checking if this invoice number already exists
      const existingInvoice = await mongoose.model('Invoice').findOne({ invoiceNumber: this.invoiceNumber });
      if (existingInvoice && existingInvoice._id.toString() !== this._id.toString()) {
        // If collision occurs, increment and try again
        nextNumber++;
        this.invoiceNumber = `INV-${shopIdentifier}-${String(nextNumber).padStart(6, '0')}`;
      }
    } catch (error) {
      // Fallback: use count if there's an error
      const count = await mongoose.model('Invoice').countDocuments({ shop: this.shop });
      const shopId = this.shop.toString();
      const shopIdentifier = shopId.slice(-6).toUpperCase();
      this.invoiceNumber = `INV-${shopIdentifier}-${String(count + 1).padStart(6, '0')}`;
    }
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
