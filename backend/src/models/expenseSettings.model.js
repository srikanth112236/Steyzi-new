const mongoose = require('mongoose');

const expenseSettingsSchema = new mongoose.Schema({
  // Email configuration for monthly reports
  monthlyReportEmail: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  
  // Whether monthly reports are enabled
  monthlyReportsEnabled: {
    type: Boolean,
    default: true
  },
  
  // Day of month to send reports (default: 25)
  reportDay: {
    type: Number,
    default: 25,
    min: 1,
    max: 31,
    validate: {
      validator: function(v) {
        return v >= 1 && v <= 31;
      },
      message: 'Report day must be between 1 and 31'
    }
  },
  
  // Last sent date
  lastSentDate: {
    type: Date,
    default: null
  },
  
  // Metadata
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
expenseSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      monthlyReportEmail: '',
      monthlyReportsEnabled: true,
      reportDay: 25
    });
  }
  return settings;
};

expenseSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ExpenseSettings = mongoose.model('ExpenseSettings', expenseSettingsSchema);

module.exports = ExpenseSettings;

