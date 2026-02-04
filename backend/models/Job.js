const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  jobNumber: {
    type: String,
    required: false, // Will be auto-generated
    unique: true,
    sparse: true // Allows multiple null values for unique constraint
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    pricingMode: {
      type: String,
      enum: ['hourly', 'daily', 'monthly'],
      required: true
    },
    rate: {
      type: Number,
      required: true
    },
    duration: {
      value: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        enum: ['hours', 'days', 'months'],
        required: true
      }
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  startDate: {
    type: Date,
    required: true
  },
  expectedReturnDate: {
    type: Date,
    required: true
  },
  actualReturnDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue', 'cancelled'],
    default: 'active'
  },
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    default: 0
  },
  extraCharges: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster job number lookups and tracking
jobSchema.index({ jobNumber: 1 });
jobSchema.index({ shop: 1, jobNumber: 1 }); // Compound index for shop-specific job number queries

// Generate job number before saving
// This ensures sequential job numbers connected to previous job numbers
jobSchema.pre('save', async function(next) {
  // Only generate if jobNumber is not already set
  if (!this.jobNumber && this.shop) {
    try {
      // Find the latest job for this shop to get the highest job number
      const latestJob = await mongoose.model('Job')
        .findOne({ shop: this.shop, jobNumber: { $exists: true, $ne: null } })
        .sort({ jobNumber: -1 })
        .select('jobNumber');

      let nextNumber = 1;

      if (latestJob && latestJob.jobNumber) {
        // Extract the numeric part from the latest job number
        // Format: JOB-XXXXXX-000001
        const jobNumberParts = latestJob.jobNumber.split('-');
        if (jobNumberParts.length >= 3) {
          const numericPart = jobNumberParts[jobNumberParts.length - 1];
          const parsedNumber = parseInt(numericPart, 10);
          if (!isNaN(parsedNumber)) {
            nextNumber = parsedNumber + 1;
          }
        }
      }

      // Generate shop identifier (last 6 characters of shop ID)
      const shopId = this.shop.toString();
      const shopIdentifier = shopId.slice(-6).toUpperCase();

      // Generate sequential job number: JOB-SHOPID-000001
      this.jobNumber = `JOB-${shopIdentifier}-${String(nextNumber).padStart(6, '0')}`;

      // Ensure uniqueness by checking if this job number already exists
      const existingJob = await mongoose.model('Job').findOne({ jobNumber: this.jobNumber });
      if (existingJob && existingJob._id.toString() !== this._id.toString()) {
        // If collision occurs, increment and try again
        nextNumber++;
        this.jobNumber = `JOB-${shopIdentifier}-${String(nextNumber).padStart(6, '0')}`;
      }
    } catch (error) {
      // Fallback: use count if there's an error
      const count = await mongoose.model('Job').countDocuments({ shop: this.shop });
      const shopId = this.shop.toString();
      const shopIdentifier = shopId.slice(-6).toUpperCase();
      this.jobNumber = `JOB-${shopIdentifier}-${String(count + 1).padStart(6, '0')}`;
    }
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema);
