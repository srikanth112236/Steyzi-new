const mongoose = require('mongoose');

const onboardingStatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  currentStep: {
    type: String,
    default: null
  },
  steps: [{
    stepId: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  }],
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

// Middleware to update timestamps
onboardingStatusSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for efficient querying
onboardingStatusSchema.index({ userId: 1 }, { unique: true });
onboardingStatusSchema.index({ 'steps.stepId': 1 });

const OnboardingStatus = mongoose.model('OnboardingStatus', onboardingStatusSchema);

module.exports = OnboardingStatus;
