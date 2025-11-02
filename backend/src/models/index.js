// Export all models
const User = require('./user.model');
const PG = require('./pg.model');
const Resident = require('./resident.model');
const Room = require('./room.model');
const Payment = require('./payment.model');
const PaymentInfo = require('./paymentInfo.model');
const Ticket = require('./ticket.model');
const Activity = require('./activity.model');
const Notification = require('./notification.model');
const Branch = require('./branch.model');
const Document = require('./document.model');
const QRCode = require('./qrCode.model');
const AllocationLetter = require('./allocationLetter.model');
const Subscription = require('./subscription.model');
const UserSubscription = require('./userSubscription.model');
const SubscriptionActivity = require('./subscriptionActivity.model');
const SalesManager = require('./salesManager.model');
const SalesHierarchy = require('./salesHierarchy.model');
const Expense = require('./expense.model');
const Salary = require('./salary.model');
const Maintainer = require('./maintainer.model');
const Floor = require('./floor.model');
const OnboardingStatus = require('./onboardingStatus.model');

module.exports = {
  User,
  PG,
  Resident,
  Room,
  Payment,
  PaymentInfo,
  Ticket,
  Activity,
  Notification,
  Branch,
  Document,
  QRCode,
  AllocationLetter,
  Subscription,
  UserSubscription,
  SubscriptionActivity,
  SalesManager,
  SalesHierarchy,
  Expense,
  Salary,
  Maintainer,
  Floor,
  OnboardingStatus
};
