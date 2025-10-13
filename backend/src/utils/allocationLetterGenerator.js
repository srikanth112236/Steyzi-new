const fs = require('fs');
const path = require('path');

/**
 * Generate PDF content for allocation letter
 */
async function generateAllocationLetterPDF(allocationData) {
  try {
    const { resident, room, bedNumber, sharingType, onboardingDate } = allocationData;
    
    // Create HTML content for the allocation letter
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Room Allocation Letter</title>
        <style>
          body { 
            font-family: "Inter", "Arial", sans-serif; 
            margin: 0; 
            padding: 40px; 
            line-height: 1.6;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          .header h1 { 
            color: #2563eb; 
            margin: 0; 
            font-size: 28px;
            font-weight: 700;
          }
          .header p { 
            color: #6b7280; 
            margin: 5px 0 0 0; 
            font-size: 16px;
          }
          .content { 
            margin: 30px 0; 
          }
          .resident-info { 
            background-color: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #2563eb;
          }
          .info-row { 
            display: flex; 
            margin: 10px 0; 
          }
          .info-label { 
            font-weight: 600; 
            width: 150px; 
            color: #374151;
          }
          .info-value { 
            color: #6b7280; 
          }
          .room-details { 
            background-color: #f0f9ff; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #0ea5e9;
          }
          .room-details h3 { 
            color: #0ea5e9; 
            margin: 0 0 15px 0; 
            font-size: 18px;
          }
          .terms { 
            margin: 30px 0; 
            padding: 20px; 
            background-color: #fef3c7; 
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
          }
          .terms h3 { 
            color: #f59e0b; 
            margin: 0 0 15px 0; 
            font-size: 18px;
          }
          .terms ul { 
            margin: 0; 
            padding-left: 20px; 
          }
          .terms li { 
            margin: 8px 0; 
            color: #92400e;
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            color: #6b7280; 
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          .signature-section { 
            margin: 40px 0; 
            display: flex; 
            justify-content: space-between; 
          }
          .signature-box { 
            text-align: center; 
            width: 200px; 
          }
          .signature-line { 
            border-bottom: 1px solid #333; 
            margin: 40px 0 10px 0; 
          }
          .date { 
            color: #6b7280; 
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ROOM ALLOCATION LETTER</h1>
          <p>PG Management System</p>
        </div>
        
        <div class="content">
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
          
          <div class="resident-info">
            <h3 style="color: #2563eb; margin: 0 0 15px 0;">Resident Information</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${resident.firstName} ${resident.lastName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${resident.phone || 'Not provided'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${resident.email || 'Not provided'}</span>
            </div>
          </div>
          
          <div class="room-details">
            <h3>Room Allocation Details</h3>
            <div class="info-row">
              <span class="info-label">Room Number:</span>
              <span class="info-value">${room.roomNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bed Number:</span>
              <span class="info-value">${bedNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Sharing Type:</span>
              <span class="info-value">${sharingType.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Monthly Rent:</span>
              <span class="info-value">₹${sharingType.cost.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Check-in Date:</span>
              <span class="info-value">${new Date(onboardingDate).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
          
          <div class="terms">
            <h3>Terms and Conditions</h3>
            <ul>
              <li>This allocation is valid from the check-in date mentioned above.</li>
              <li>Monthly rent of ₹${sharingType.cost.toLocaleString()} is due on the 1st of every month.</li>
              <li>Resident must maintain the room in good condition.</li>
              <li>No smoking or alcohol consumption is allowed in the premises.</li>
              <li>Visitors are allowed only during visiting hours (6 PM - 9 PM).</li>
              <li>Resident must inform management 30 days in advance before vacating.</li>
              <li>Security deposit and advance payment terms apply as per agreement.</li>
            </ul>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p><strong>Resident Signature</strong></p>
              <p class="date">Date: _______________</p>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <p><strong>Management Signature</strong></p>
              <p class="date">Date: _______________</p>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>PG Management System</strong></p>
          <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
          <p>For any queries, contact: +91-XXXXXXXXXX</p>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  } catch (error) {
    console.error('Error generating allocation letter PDF:', error);
    throw error;
  }
}

/**
 * Convert HTML to base64 PDF data
 * Note: This is a simplified version. In production, you'd use puppeteer or similar
 */
async function htmlToBase64PDF(htmlContent) {
  try {
    // For now, we'll return the HTML as base64
    // In production, you'd use puppeteer to convert HTML to PDF
    const base64Content = Buffer.from(htmlContent).toString('base64');
    return `data:application/pdf;base64,${base64Content}`;
  } catch (error) {
    console.error('Error converting HTML to PDF:', error);
    throw error;
  }
}

module.exports = {
  generateAllocationLetterPDF,
  htmlToBase64PDF
};
