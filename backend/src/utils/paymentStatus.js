/**
 * Utility functions for payment status calculations
 */

/**
 * Calculate the current month's payment due date
 * @param {Date} checkInDate - Resident's check-in date
 * @returns {Date} - Payment due date for current month
 */
const getCurrentMonthDueDate = (checkInDate) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Payment is due on the 2nd of every month
  return new Date(currentYear, currentMonth, 2);
};

/**
 * Calculate the next month's payment due date
 * @param {Date} checkInDate - Resident's check-in date
 * @returns {Date} - Payment due date for next month
 */
const getNextMonthDueDate = (checkInDate) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Next month's payment is due on the 2nd
  return new Date(currentYear, currentMonth + 1, 2);
};

/**
 * Check if a payment is overdue
 * @param {Date} dueDate - Payment due date
 * @param {Date} lastPaymentDate - Last payment date
 * @returns {boolean} - True if payment is overdue
 */
const isPaymentOverdue = (dueDate, lastPaymentDate) => {
  const now = new Date();
  
  // If no last payment date, check if current due date has passed
  if (!lastPaymentDate) {
    return now > dueDate;
  }
  
  // If last payment date is before due date, it's overdue
  return lastPaymentDate < dueDate && now > dueDate;
};

/**
 * Calculate payment status based on dates and last payment
 * @param {Date} checkInDate - Resident's check-in date
 * @param {Date} lastPaymentDate - Last payment date
 * @param {Date} lastPaymentMonth - Month of last payment (YYYY-MM format)
 * @returns {Object} - Payment status information
 */
const calculatePaymentStatus = (checkInDate, lastPaymentDate, lastPaymentMonth = null) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  
  // If no last payment, check if current month is overdue
  if (!lastPaymentDate || !lastPaymentMonth) {
    const currentDueDate = getCurrentMonthDueDate(checkInDate);
    
    if (now > currentDueDate) {
      return {
        status: 'overdue',
        dueDate: currentDueDate,
        overdueDays: Math.floor((now - currentDueDate) / (1000 * 60 * 60 * 24))
      };
    } else {
      return {
        status: 'pending',
        dueDate: currentDueDate,
        overdueDays: 0
      };
    }
  }
  
  // Check if last payment was for current month
  if (lastPaymentMonth === currentMonthStr) {
    return {
      status: 'paid',
      dueDate: getCurrentMonthDueDate(checkInDate),
      overdueDays: 0
    };
  }
  
  // Check if current month is overdue
  const currentDueDate = getCurrentMonthDueDate(checkInDate);
  
  if (now > currentDueDate) {
    return {
      status: 'overdue',
      dueDate: currentDueDate,
      overdueDays: Math.floor((now - currentDueDate) / (1000 * 60 * 60 * 24))
    };
  } else {
    return {
      status: 'pending',
      dueDate: currentDueDate,
      overdueDays: 0
    };
  }
};

/**
 * Get payment status for a specific month
 * @param {Date} checkInDate - Resident's check-in date
 * @param {Date} lastPaymentDate - Last payment date
 * @param {string} monthYear - Month and year in format "YYYY-MM"
 * @returns {Object} - Payment status for the month
 */
const getPaymentStatusForMonth = (checkInDate, lastPaymentDate, monthYear) => {
  const [year, month] = monthYear.split('-').map(Number);
  const monthDueDate = new Date(year, month - 1, 2); // Month is 0-indexed
  const now = new Date();
  
  // Check if payment was made for this month
  if (lastPaymentDate) {
    const lastPaymentYear = lastPaymentDate.getFullYear();
    const lastPaymentMonth = lastPaymentDate.getMonth() + 1;
    const lastPaymentMonthStr = `${lastPaymentYear}-${String(lastPaymentMonth).padStart(2, '0')}`;
    
    if (lastPaymentMonthStr === monthYear) {
      return {
        status: 'paid',
        dueDate: monthDueDate,
        overdueDays: 0
      };
    }
  }
  
  // Check if this month is overdue
  if (now > monthDueDate) {
    return {
      status: 'overdue',
      dueDate: monthDueDate,
      overdueDays: Math.floor((now - monthDueDate) / (1000 * 60 * 60 * 24))
    };
  } else {
    return {
      status: 'pending',
      dueDate: monthDueDate,
      overdueDays: 0
    };
  }
};

/**
 * Generate payment months from check-in date to current month
 * @param {Date} checkInDate - Resident's check-in date
 * @returns {Array} - Array of month-year strings
 */
const generatePaymentMonths = (checkInDate) => {
  const months = [];
  const now = new Date();
  const checkInYear = checkInDate.getFullYear();
  const checkInMonth = checkInDate.getMonth();
  
  let currentYear = checkInYear;
  let currentMonth = checkInMonth;
  
  while (
    currentYear < now.getFullYear() ||
    (currentYear === now.getFullYear() && currentMonth <= now.getMonth())
  ) {
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    months.push(monthStr);
    
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }
  
  return months;
};

module.exports = {
  calculatePaymentStatus,
  getPaymentStatusForMonth,
  generatePaymentMonths,
  getCurrentMonthDueDate,
  getNextMonthDueDate,
  isPaymentOverdue
}; 