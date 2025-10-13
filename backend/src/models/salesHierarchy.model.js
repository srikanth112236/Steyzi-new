const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sales Hierarchy Schema
const SalesHierarchySchema = new Schema({
  salesPerson: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subSalesPerson: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Unique constraint to prevent duplicate hierarchies
SalesHierarchySchema.index({ salesPerson: 1, subSalesPerson: 1 }, { unique: true });

// Method to check if a sub-sales person belongs to a sales person
SalesHierarchySchema.statics.isSubSalesPerson = async function(salesPersonId, subSalesPersonId) {
  const hierarchy = await this.findOne({
    salesPerson: salesPersonId,
    subSalesPerson: subSalesPersonId,
    status: 'active'
  });
  return !!hierarchy;
};

const SalesHierarchy = mongoose.model('SalesHierarchy', SalesHierarchySchema);

module.exports = SalesHierarchy;
