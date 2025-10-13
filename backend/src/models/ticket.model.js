const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Ticket title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  // Ticket Details
  category: {
    type: String,
    enum: ['maintenance', 'billing', 'complaint', 'suggestion', 'emergency', 'other'],
    required: [true, 'Category is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    required: false
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'cancelled'],
    default: 'open'
  },

  // Related Entities
  pg: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PG',
    required: [true, 'PG is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Location and Contact (Optional)
  location: {
    room: {
      type: String,
      required: false
    },
    floor: {
      type: String,
      required: false
    },
    building: {
      type: String,
      required: false
    }
  },
  contactPhone: {
    type: String,
    required: false,
    match: [/^\d{10}$/, 'Contact phone must be 10 digits']
  },

  // Attachments
  attachments: [{
    url: {
      type: String,
      required: true
    },
    filename: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Timeline
  timeline: [{
    action: {
      type: String,
      required: true
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Comments thread
  comments: [{
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorRole: {
      type: String,
      enum: ['superadmin', 'admin', 'support', 'user'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Resolution Information
  resolution: {
    solution: {
      type: String,
      trim: true,
      maxlength: [1000, 'Solution cannot exceed 1000 characters']
    },
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  closedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for ticket age
ticketSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
ticketSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return this.status !== 'closed' && this.status !== 'resolved' && new Date() > this.dueDate;
});

// Virtual for response time
ticketSchema.virtual('responseTime').get(function() {
  const firstUpdate = this.timeline.find(t => t.action !== 'created');
  if (!firstUpdate) return null;
  return Math.floor((firstUpdate.timestamp - this.createdAt) / (1000 * 60 * 60));
});

// Indexes for better query performance
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ pg: 1, status: 1 });
ticketSchema.index({ user: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ createdAt: -1 });

// Pre-save middleware to update timeline
ticketSchema.pre('save', function(next) {
  if (this.isNew) {
    this.timeline.push({
      action: 'created',
      description: 'Ticket created',
      performedBy: this.user
    });
  }
  next();
});

// Static method to find tickets by status
ticketSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('user pg assignedTo');
};

// Static method to find overdue tickets
ticketSchema.statics.findOverdue = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['closed', 'resolved'] }
  });
};

// Instance method to add timeline entry
ticketSchema.methods.addTimelineEntry = function(action, description, performedBy) {
  this.timeline.push({
    action,
    description,
    performedBy,
    timestamp: new Date()
  });
  return this.save();
};

// Instance method to add a comment
ticketSchema.methods.addComment = function(message, authorId, authorRole) {
  this.comments.push({
    message,
    author: authorId,
    authorRole,
    createdAt: new Date()
  });
  return this.save();
};

// Instance method to assign ticket
ticketSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  this.status = 'in_progress';
  this.addTimelineEntry('assigned', 'Ticket assigned', userId);
  return this.save();
};

// Instance method to resolve ticket
ticketSchema.methods.resolve = function(solution, resolvedBy, rating = null, feedback = null) {
  this.status = 'resolved';
  this.resolution = {
    solution,
    resolvedAt: new Date(),
    resolvedBy,
    rating,
    feedback
  };
  this.addTimelineEntry('resolved', `Ticket resolved: ${solution}`, resolvedBy);
  return this.save();
};

// Instance method to close ticket
ticketSchema.methods.close = function(closedBy) {
  this.status = 'closed';
  this.closedAt = new Date();
  this.addTimelineEntry('closed', 'Ticket closed', closedBy);
  return this.save();
};

module.exports = mongoose.model('Ticket', ticketSchema); 