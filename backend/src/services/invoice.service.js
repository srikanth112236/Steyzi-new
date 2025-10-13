const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const { UserSubscription, Subscription, User, Payment } = require('../models');
const emailService = require('./email.service');
const logger = require('../utils/logger');

/**
 * Invoice Service
 * Handles automated invoice generation and delivery
 */
class InvoiceService {
  /**
   * Generate PDF invoice for subscription
   */
  async generateInvoice(subscriptionId, billingPeriod = null) {
    try {
      // Get subscription details with user info
      const subscription = await UserSubscription.findById(subscriptionId)
        .populate('userId', 'firstName lastName email phone')
        .populate('subscriptionPlanId');

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const user = subscription.userId;
      const plan = subscription.subscriptionPlanId;

      // Calculate billing period
      const periodStart = billingPeriod?.start || subscription.startDate;
      const periodEnd = billingPeriod?.end || subscription.endDate;

      // Calculate charges
      const charges = await this.calculateCharges(subscription, periodStart, periodEnd);

      // Generate PDF
      const pdfBuffer = await this.createPDFInvoice({
        subscription,
        user,
        plan,
        charges,
        periodStart,
        periodEnd,
        invoiceNumber: this.generateInvoiceNumber(subscriptionId)
      });

      return {
        success: true,
        invoiceNumber: this.generateInvoiceNumber(subscriptionId),
        pdfBuffer,
        charges,
        subscription
      };

    } catch (error) {
      logger.error('Invoice generation error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Calculate subscription charges
   */
  async calculateCharges(subscription, periodStart, periodEnd) {
    const plan = subscription.subscriptionPlanId;
    const basePrice = plan.basePrice;
    const extraBeds = Math.max(0, subscription.totalBeds - plan.baseBedCount);
    const extraBedCharges = extraBeds * plan.topUpPricePerBed;

    // Calculate branch charges if applicable
    let branchCharges = 0;
    if (plan.allowMultipleBranches && subscription.totalBranches > plan.branchCount) {
      const extraBranches = subscription.totalBranches - plan.branchCount;
      branchCharges = extraBranches * plan.costPerBranch;
    }

    // Apply annual discount if applicable
    let discountAmount = 0;
    if (plan.billingCycle === 'annual' && plan.annualDiscount > 0) {
      const totalBeforeDiscount = basePrice + extraBedCharges + branchCharges;
      discountAmount = (totalBeforeDiscount * plan.annualDiscount) / 100;
    }

    const subtotal = basePrice + extraBedCharges + branchCharges - discountAmount;
    const taxRate = 18; // 18% GST
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return {
      basePrice,
      extraBedCharges,
      branchCharges,
      discountAmount,
      subtotal,
      taxAmount,
      taxRate,
      total,
      extraBeds,
      extraBranches: plan.allowMultipleBranches ? Math.max(0, subscription.totalBranches - plan.branchCount) : 0
    };
  }

  /**
   * Create PDF invoice document
   */
  async createPDFInvoice({ subscription, user, plan, charges, periodStart, periodEnd, invoiceNumber }) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Company Info
        doc.fontSize(12).font('Helvetica-Bold').text('PG MAINTENANCE SYSTEM');
        doc.font('Helvetica').text('123 Tech Street, Bangalore, Karnataka 560001');
        doc.text('GSTIN: 29ABCDE1234F2Z5');
        doc.text('Phone: +91-9876543210 | Email: support@pgmaintenance.com');
        doc.moveDown();

        // Invoice Details
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Invoice Number: ${invoiceNumber}`, { continued: true });
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
        doc.moveDown(0.5);

        doc.text(`Billing Period: ${new Date(periodStart).toLocaleDateString()} - ${new Date(periodEnd).toLocaleDateString()}`);
        doc.moveDown();

        // Customer Details
        doc.fontSize(12).font('Helvetica-Bold').text('BILL TO:');
        doc.font('Helvetica').fontSize(10);
        doc.text(`${user.firstName} ${user.lastName}`);
        doc.text(user.email);
        if (user.phone) doc.text(`Phone: ${user.phone}`);
        doc.moveDown();

        // Plan Details
        doc.fontSize(12).font('Helvetica-Bold').text('SUBSCRIPTION DETAILS:');
        doc.font('Helvetica').fontSize(10);
        doc.text(`Plan: ${plan.planName}`);
        doc.text(`Billing Cycle: ${plan.billingCycle}`);
        doc.text(`Beds: ${subscription.totalBeds} (${plan.baseBedCount} base + ${charges.extraBeds} extra)`);
        if (plan.allowMultipleBranches) {
          doc.text(`Branches: ${subscription.totalBranches} (${plan.branchCount} included + ${charges.extraBranches} extra)`);
        }
        doc.moveDown();

        // Charges Table
        const tableTop = doc.y;
        const tableLeft = 50;

        // Table Header
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Description', tableLeft, tableTop);
        doc.text('Qty', tableLeft + 300, tableTop);
        doc.text('Rate', tableLeft + 350, tableTop);
        doc.text('Amount', tableLeft + 420, tableTop, { width: 80, align: 'right' });

        // Table border
        doc.moveTo(tableLeft, tableTop - 5).lineTo(tableLeft + 480, tableTop - 5).stroke();
        doc.moveTo(tableLeft, tableTop + 15).lineTo(tableLeft + 480, tableTop + 15).stroke();

        let yPosition = tableTop + 25;

        // Base subscription
        doc.font('Helvetica').fontSize(9);
        doc.text(`${plan.planName} - ${plan.billingCycle}`, tableLeft, yPosition);
        doc.text('1', tableLeft + 300, yPosition);
        doc.text(`₹${charges.basePrice.toLocaleString()}`, tableLeft + 350, yPosition);
        doc.text(`₹${charges.basePrice.toLocaleString()}`, tableLeft + 420, yPosition, { width: 80, align: 'right' });

        yPosition += 15;

        // Extra beds
        if (charges.extraBeds > 0) {
          doc.text(`Extra Beds (${charges.extraBeds})`, tableLeft, yPosition);
          doc.text(charges.extraBeds.toString(), tableLeft + 300, yPosition);
          doc.text(`₹${plan.topUpPricePerBed.toLocaleString()}`, tableLeft + 350, yPosition);
          doc.text(`₹${charges.extraBedCharges.toLocaleString()}`, tableLeft + 420, yPosition, { width: 80, align: 'right' });
          yPosition += 15;
        }

        // Extra branches
        if (charges.extraBranches > 0) {
          doc.text(`Extra Branches (${charges.extraBranches})`, tableLeft, yPosition);
          doc.text(charges.extraBranches.toString(), tableLeft + 300, yPosition);
          doc.text(`₹${plan.costPerBranch.toLocaleString()}`, tableLeft + 350, yPosition);
          doc.text(`₹${charges.branchCharges.toLocaleString()}`, tableLeft + 420, yPosition, { width: 80, align: 'right' });
          yPosition += 15;
        }

        // Discount
        if (charges.discountAmount > 0) {
          doc.font('Helvetica-Bold');
          doc.text(`Annual Discount (${plan.annualDiscount}%)`, tableLeft, yPosition);
          doc.text('-', tableLeft + 300, yPosition);
          doc.text(`₹${charges.discountAmount.toLocaleString()}`, tableLeft + 420, yPosition, { width: 80, align: 'right' });
          yPosition += 15;
        }

        // Subtotal
        doc.moveTo(tableLeft, yPosition - 5).lineTo(tableLeft + 480, yPosition - 5).stroke();
        doc.font('Helvetica-Bold');
        doc.text('Subtotal', tableLeft + 350, yPosition);
        doc.text(`₹${charges.subtotal.toLocaleString()}`, tableLeft + 420, yPosition, { width: 80, align: 'right' });
        yPosition += 15;

        // Tax
        doc.font('Helvetica');
        doc.text(`GST (${charges.taxRate}%)`, tableLeft + 350, yPosition);
        doc.text(`₹${charges.taxAmount.toLocaleString()}`, tableLeft + 420, yPosition, { width: 80, align: 'right' });
        yPosition += 15;

        // Total
        doc.moveTo(tableLeft, yPosition - 5).lineTo(tableLeft + 480, yPosition - 5).stroke();
        doc.font('Helvetica-Bold').fontSize(11);
        doc.text('TOTAL', tableLeft + 350, yPosition);
        doc.text(`₹${charges.total.toLocaleString()}`, tableLeft + 420, yPosition, { width: 80, align: 'right' });

        // Footer
        doc.font('Helvetica').fontSize(8);
        doc.text('Thank you for choosing PG Maintenance System!', 50, doc.page.height - 100);
        doc.text('For any queries, contact us at support@pgmaintenance.com', 50, doc.page.height - 80);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate unique invoice number
   */
  generateInvoiceNumber(subscriptionId) {
    const timestamp = Date.now().toString().slice(-6);
    const shortId = subscriptionId.toString().slice(-4).toUpperCase();
    return `INV-${timestamp}-${shortId}`;
  }

  /**
   * Send invoice via email
   */
  async sendInvoiceEmail(userEmail, invoiceData, pdfBuffer) {
    try {
      const emailData = {
        to: userEmail,
        subject: `Invoice ${invoiceData.invoiceNumber} - PG Maintenance System`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Invoice Generated</h2>
            <p>Dear Customer,</p>
            <p>Your invoice has been generated successfully. Please find the details below:</p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
              <p><strong>Amount:</strong> ₹${invoiceData.charges.total.toLocaleString()}</p>
              <p><strong>Billing Period:</strong> ${new Date(invoiceData.periodStart).toLocaleDateString()} - ${new Date(invoiceData.periodEnd).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>

            <p>The invoice is attached to this email in PDF format.</p>

            <p>If you have any questions, please contact our support team.</p>

            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              PG Maintenance System<br>
              This is an automated invoice notification.
            </p>
          </div>
        `,
        attachments: [{
          filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      };

      await emailService.sendEmail(emailData);

      return {
        success: true,
        message: 'Invoice sent successfully'
      };

    } catch (error) {
      logger.error('Email sending error:', error);
      return {
        success: false,
        message: 'Failed to send invoice email'
      };
    }
  }

  /**
   * Generate and send invoice automatically
   */
  async generateAndSendInvoice(subscriptionId, billingPeriod = null) {
    try {
      // Generate invoice
      const invoiceResult = await this.generateInvoice(subscriptionId, billingPeriod);

      if (!invoiceResult.success) {
        throw new Error(invoiceResult.message);
      }

      // Send via email
      const user = invoiceResult.subscription.userId;
      const emailResult = await this.sendInvoiceEmail(user.email, invoiceResult, invoiceResult.pdfBuffer);

      return {
        success: true,
        invoiceNumber: invoiceResult.invoiceNumber,
        charges: invoiceResult.charges,
        emailSent: emailResult.success
      };

    } catch (error) {
      logger.error('Auto invoice generation error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new InvoiceService();
