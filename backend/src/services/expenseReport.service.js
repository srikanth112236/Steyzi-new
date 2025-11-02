const PDFDocument = require('pdfkit');
const expenseService = require('./expense.service');
const emailService = require('./email.service');

class ExpenseReportService {
  /**
   * Helper function to draw a styled rectangle (rounded corners simulated with styling)
   */
  drawRoundedRect(doc, x, y, width, height, radius, fillColor, strokeColor) {
    doc.save();
    
    // Draw filled rectangle
    if (fillColor) {
      doc.fillColor(fillColor);
      doc.rect(x, y, width, height).fill();
    }
    
    // Draw border
    if (strokeColor) {
      doc.strokeColor(strokeColor);
      doc.lineWidth(1.5);
      doc.rect(x, y, width, height).stroke();
    }
    
    doc.restore();
  }

  /**
   * Helper function to draw table cell
   */
  drawTableCell(doc, x, y, width, height, text, options = {}) {
    const { 
      bgColor = '#FFFFFF', 
      textColor = '#000000', 
      fontSize = 9, 
      fontStyle = 'Helvetica',
      align = 'left',
      padding = 5,
      bold = false
    } = options;

    // Draw cell background
    doc.save();
    doc.fillColor(bgColor);
    doc.rect(x, y, width, height).fill();
    
    // Draw border
    doc.strokeColor('#E5E7EB');
    doc.lineWidth(0.5);
    doc.rect(x, y, width, height).stroke();
    doc.restore();

    // Draw text
    const textX = align === 'center' ? x + width / 2 : x + padding;
    const textY = y + height / 2 - fontSize / 3;
    
    doc.font(bold ? 'Helvetica-Bold' : fontStyle)
       .fontSize(fontSize)
       .fillColor(textColor);
    
    if (align === 'center') {
      doc.text(text || '-', textX, textY, { align: 'center', width: width - padding * 2 });
    } else if (align === 'right') {
      doc.text(text || '-', x + width - padding, textY, { align: 'right', width: width - padding * 2 });
    } else {
      doc.text(text || '-', textX, textY, { width: width - padding * 2 });
    }
    
    doc.fillColor('#000000'); // Reset to black
  }

  /**
   * Generate monthly expense report PDF
   */
  async generateMonthlyReportPDF(year, month) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await expenseService.getExpensesForMonth(year, month);
        if (!result.success) {
          reject(new Error(result.message));
          return;
        }

        const { expenses, summary } = result.data;
        const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const generatedDate = new Date().toLocaleDateString('en-IN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          info: {
            Title: `Expense Report - ${monthName}`,
            Author: 'PG Maintenance System',
            Subject: 'Monthly Expense Report'
          }
        });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Modern Header with gradient effect
        const headerHeight = 120;
        doc.rect(0, 0, doc.page.width, headerHeight)
           .fillColor('#1E40AF')
           .fill();
        
        // White text on blue background
        doc.fillColor('#FFFFFF')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('EXPENSE REPORT', 50, 30, { align: 'center', width: doc.page.width - 100 });
        
        doc.fontSize(16)
           .font('Helvetica')
           .text(monthName, 50, 65, { align: 'center', width: doc.page.width - 100 });
        
        doc.fontSize(10)
           .text(`Generated on ${generatedDate}`, 50, 90, { align: 'center', width: doc.page.width - 100 });

        let yPos = headerHeight + 30;

        // Company Info Box
        const companyBoxY = yPos;
        this.drawRoundedRect(doc, 50, companyBoxY, doc.page.width - 100, 60, 8, '#F8FAFC', '#E5E7EB');
        
        doc.fillColor('#1E293B')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('PG MAINTENANCE SYSTEM', 60, companyBoxY + 10);
        
        doc.fillColor('#64748B')
           .fontSize(9)
           .font('Helvetica');
        
        const companyInfo = [
          '123 Tech Street, Bangalore, Karnataka 560001',
          `Phone: ${process.env.COMPANY_PHONE || '+91-9876543210'} | Email: ${process.env.COMPANY_EMAIL || 'support@pgmaintenance.com'}`
        ];
        
        companyInfo.forEach((line, index) => {
          doc.text(line, 60, companyBoxY + 25 + (index * 12));
        });

        yPos = companyBoxY + 80;

        // Calculate totals
        let totalAmount = 0;
        expenses.forEach(exp => {
          totalAmount += exp.amount;
        });

        // Summary Cards
        const cardWidth = (doc.page.width - 140) / 2;
        const cardHeight = 70;

        // Total Expenses Card
        this.drawRoundedRect(doc, 50, yPos, cardWidth, cardHeight, 8, '#EEF2FF', '#3B82F6');
        doc.fillColor('#1E40AF')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('Total Expenses', 60, yPos + 15, { width: cardWidth - 20 });
        doc.fontSize(18)
           .fillColor('#3B82F6')
           .text(`₹${totalAmount.toLocaleString('en-IN')}`, 60, yPos + 30, { width: cardWidth - 20 });
        doc.fontSize(9)
           .fillColor('#64748B')
           .font('Helvetica')
           .text(`${expenses.length} expenses`, 60, yPos + 52, { width: cardWidth - 20 });

        // Total Count Card
        this.drawRoundedRect(doc, 50 + cardWidth + 40, yPos, cardWidth, cardHeight, 8, '#F0FDF4', '#10B981');
        doc.fillColor('#059669')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('Total Expenses Count', 60 + cardWidth + 40, yPos + 15, { width: cardWidth - 20 });
        doc.fontSize(18)
           .fillColor('#10B981')
           .text(`${expenses.length}`, 60 + cardWidth + 40, yPos + 30, { width: cardWidth - 20 });
        doc.fontSize(9)
           .fillColor('#64748B')
           .font('Helvetica')
           .text('items this month', 60 + cardWidth + 40, yPos + 52, { width: cardWidth - 20 });

        yPos += cardHeight + 30;

        // Breakdown by Type Section
        if (summary && summary.length > 0) {
          doc.fillColor('#1E293B')
             .fontSize(16)
             .font('Helvetica-Bold')
             .text('Breakdown by Expense Type', 50, yPos);
          yPos += 25;

          // Breakdown Table
          const breakdownTableY = yPos;
          const breakdownRowHeight = 25;
          const breakdownColWidths = [(doc.page.width - 100) * 0.5, (doc.page.width - 100) * 0.25, (doc.page.width - 100) * 0.25];
          
          // Header row
          this.drawTableCell(doc, 50, breakdownTableY, breakdownColWidths[0], breakdownRowHeight, 'Expense Type', {
            bgColor: '#1E40AF',
            textColor: '#FFFFFF',
            fontSize: 10,
            bold: true,
            padding: 8
          });
          this.drawTableCell(doc, 50 + breakdownColWidths[0], breakdownTableY, breakdownColWidths[1], breakdownRowHeight, 'Amount', {
            bgColor: '#1E40AF',
            textColor: '#FFFFFF',
            fontSize: 10,
            bold: true,
            align: 'right',
            padding: 8
          });
          this.drawTableCell(doc, 50 + breakdownColWidths[0] + breakdownColWidths[1], breakdownTableY, breakdownColWidths[2], breakdownRowHeight, 'Count', {
            bgColor: '#1E40AF',
            textColor: '#FFFFFF',
            fontSize: 10,
            bold: true,
            align: 'center',
            padding: 8
          });

          let breakdownY = breakdownTableY + breakdownRowHeight;
          summary.forEach((item, index) => {
            const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
            this.drawTableCell(doc, 50, breakdownY, breakdownColWidths[0], breakdownRowHeight, item._id, {
              bgColor,
              fontSize: 9,
              padding: 8
            });
            this.drawTableCell(doc, 50 + breakdownColWidths[0], breakdownY, breakdownColWidths[1], breakdownRowHeight, `₹${item.totalAmount.toLocaleString('en-IN')}`, {
              bgColor,
              fontSize: 9,
              align: 'right',
              padding: 8,
              bold: true
            });
            this.drawTableCell(doc, 50 + breakdownColWidths[0] + breakdownColWidths[1], breakdownY, breakdownColWidths[2], breakdownRowHeight, item.count.toString(), {
              bgColor,
              fontSize: 9,
              align: 'center',
              padding: 8
            });
            breakdownY += breakdownRowHeight;
          });

          yPos = breakdownY + 30;
        }

        // Detailed Expenses Section
        if (expenses.length > 0) {
          if (yPos > 600) {
            doc.addPage();
            yPos = 50;
          }

          doc.fillColor('#1E293B')
             .fontSize(16)
             .font('Helvetica-Bold')
             .text('Detailed Expense List', 50, yPos);
          yPos += 25;

          // Table Configuration
          const tableLeft = 50;
          const tableWidth = doc.page.width - 100;
          const rowHeight = 30;
          const colWidths = [
            tableWidth * 0.15,  // Date
            tableWidth * 0.20,  // Type
            tableWidth * 0.20,  // Amount
            tableWidth * 0.45   // Description
          ];

          // Table Header
          const headers = ['Date', 'Type', 'Amount (₹)', 'Description'];
          const headerAligns = ['left', 'left', 'right', 'left'];
          
          headers.forEach((header, index) => {
            this.drawTableCell(doc, 
              tableLeft + colWidths.slice(0, index).reduce((a, b) => a + b, 0),
              yPos,
              colWidths[index],
              rowHeight,
              header,
              {
                bgColor: '#1E40AF',
                textColor: '#FFFFFF',
                fontSize: 10,
                bold: true,
                align: headerAligns[index],
                padding: 8
              }
            );
          });
          yPos += rowHeight;

          // Table Rows
          expenses.forEach((expense, index) => {
            if (yPos > 730) {
              doc.addPage();
              yPos = 50;
              
              // Redraw headers on new page
              headers.forEach((header, hIndex) => {
                this.drawTableCell(doc, 
                  tableLeft + colWidths.slice(0, hIndex).reduce((a, b) => a + b, 0),
                  yPos,
                  colWidths[hIndex],
                  rowHeight,
                  header,
                  {
                    bgColor: '#1E40AF',
                    textColor: '#FFFFFF',
                    fontSize: 10,
                    bold: true,
                    align: headerAligns[hIndex],
                    padding: 8
                  }
                );
              });
              yPos += rowHeight;
            }

            const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
            const expenseDate = new Date(expense.date);
            const formattedDate = expenseDate.toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });

            // Date
            this.drawTableCell(doc, tableLeft, yPos, colWidths[0], rowHeight, formattedDate, {
              bgColor,
              fontSize: 9,
              padding: 8
            });

            // Type with colored badge
            const typeColors = {
              server: '#3B82F6',
              maintenance: '#10B981',
              office: '#F59E0B',
              utilities: '#EF4444',
              marketing: '#8B5CF6',
              software: '#06B6D4',
              hardware: '#F97316',
              travel: '#EC4899',
              miscellaneous: '#64748B'
            };
            const typeColor = typeColors[expense.type.toLowerCase()] || '#64748B';
            
            this.drawTableCell(doc, tableLeft + colWidths[0], yPos, colWidths[1], rowHeight, expense.type, {
              bgColor,
              textColor: typeColor,
              fontSize: 9,
              bold: true,
              padding: 8
            });

            // Amount
            this.drawTableCell(doc, tableLeft + colWidths[0] + colWidths[1], yPos, colWidths[2], rowHeight, `₹${expense.amount.toLocaleString('en-IN')}`, {
              bgColor,
              fontSize: 9,
              align: 'right',
              padding: 8,
              bold: true
            });

            // Description (may need to wrap)
            const descText = expense.description || '-';
            const maxDescWidth = colWidths[3] - 16;
            const descLines = doc.heightOfString(descText, { width: maxDescWidth, fontSize: 9 });
            const descHeight = Math.max(rowHeight, (descLines / 9) * 12 + 16);

            this.drawTableCell(doc, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], yPos, colWidths[3], descHeight, descText, {
              bgColor,
              fontSize: 9,
              padding: 8
            });

            yPos += descHeight;
          });
        }

        // Footer
        const footerY = doc.page.height - 40;
        doc.strokeColor('#E5E7EB')
           .lineWidth(1)
           .moveTo(50, footerY)
           .lineTo(doc.page.width - 50, footerY)
           .stroke();
        
        doc.fillColor('#64748B')
           .fontSize(8)
           .font('Helvetica')
           .text('This is an automated report generated by PG Maintenance System', 50, footerY + 5, {
             align: 'center',
             width: doc.page.width - 100
           });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate comparison report PDF (current month vs last month)
   */
  async generateComparisonReportPDF(year, month) {
    return new Promise(async (resolve, reject) => {
      try {
        const currentMonthResult = await expenseService.getExpensesForMonth(year, month);
        const lastMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
        const lastMonthResult = await expenseService.getExpensesForMonth(lastMonth.year, lastMonth.month);

        if (!currentMonthResult.success || !lastMonthResult.success) {
          reject(new Error('Failed to fetch expense data'));
          return;
        }

        const currentMonth = currentMonthResult.data;
        const previousMonth = lastMonthResult.data;
        const currentMonthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const lastMonthName = new Date(lastMonth.year, lastMonth.month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const generatedDate = new Date().toLocaleDateString('en-IN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          info: {
            Title: `Expense Comparison Report - ${currentMonthName}`,
            Author: 'PG Maintenance System',
            Subject: 'Monthly Expense Comparison Report'
          }
        });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Modern Header
        const headerHeight = 120;
        doc.rect(0, 0, doc.page.width, headerHeight)
           .fillColor('#7C3AED')
           .fill();
        
        doc.fillColor('#FFFFFF')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('EXPENSE COMPARISON REPORT', 50, 30, { align: 'center', width: doc.page.width - 100 });
        
        doc.fontSize(16)
           .font('Helvetica')
           .text(`${currentMonthName} vs ${lastMonthName}`, 50, 65, { align: 'center', width: doc.page.width - 100 });
        
        doc.fontSize(10)
           .text(`Generated on ${generatedDate}`, 50, 90, { align: 'center', width: doc.page.width - 100 });

        let yPos = headerHeight + 30;

        // Company Info Box
        const companyBoxY = yPos;
        this.drawRoundedRect(doc, 50, companyBoxY, doc.page.width - 100, 60, 8, '#F8FAFC', '#E5E7EB');
        
        doc.fillColor('#1E293B')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('PG MAINTENANCE SYSTEM', 60, companyBoxY + 10);
        
        doc.fillColor('#64748B')
           .fontSize(9)
           .font('Helvetica')
           .text('123 Tech Street, Bangalore, Karnataka 560001', 60, companyBoxY + 25);

        yPos = companyBoxY + 80;

        // Calculate totals
        const currentTotal = currentMonth.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const previousTotal = previousMonth.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const difference = currentTotal - previousTotal;
        const percentChange = previousTotal > 0 ? ((difference / previousTotal) * 100).toFixed(2) : 0;

        // Comparison Summary Cards
        const cardWidth = (doc.page.width - 140) / 3;
        const cardHeight = 85;

        // Current Month Card
        this.drawRoundedRect(doc, 50, yPos, cardWidth, cardHeight, 8, '#EEF2FF', '#3B82F6');
        doc.fillColor('#1E40AF')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('This Month', 60, yPos + 10, { width: cardWidth - 20 });
        doc.fontSize(14)
           .text(currentMonthName, 60, yPos + 22, { width: cardWidth - 20 });
        doc.fontSize(16)
           .fillColor('#3B82F6')
           .text(`₹${currentTotal.toLocaleString('en-IN')}`, 60, yPos + 40, { width: cardWidth - 20 });
        doc.fontSize(8)
           .fillColor('#64748B')
           .font('Helvetica')
           .text(`${currentMonth.expenses.length} expenses`, 60, yPos + 60, { width: cardWidth - 20 });

        // Previous Month Card
        this.drawRoundedRect(doc, 50 + cardWidth + 20, yPos, cardWidth, cardHeight, 8, '#F0FDF4', '#10B981');
        doc.fillColor('#059669')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('Last Month', 60 + cardWidth + 20, yPos + 10, { width: cardWidth - 20 });
        doc.fontSize(14)
           .text(lastMonthName, 60 + cardWidth + 20, yPos + 22, { width: cardWidth - 20 });
        doc.fontSize(16)
           .fillColor('#10B981')
           .text(`₹${previousTotal.toLocaleString('en-IN')}`, 60 + cardWidth + 20, yPos + 40, { width: cardWidth - 20 });
        doc.fontSize(8)
           .fillColor('#64748B')
           .font('Helvetica')
           .text(`${previousMonth.expenses.length} expenses`, 60 + cardWidth + 20, yPos + 60, { width: cardWidth - 20 });

        // Difference Card
        const diffColor = difference > 0 ? '#FEE2E2' : difference < 0 ? '#D1FAE5' : '#F3F4F6';
        const diffBorderColor = difference > 0 ? '#EF4444' : difference < 0 ? '#10B981' : '#9CA3AF';
        const diffTextColor = difference > 0 ? '#DC2626' : difference < 0 ? '#059669' : '#6B7280';
        
        this.drawRoundedRect(doc, 50 + (cardWidth + 20) * 2, yPos, cardWidth, cardHeight, 8, diffColor, diffBorderColor);
        doc.fillColor(diffTextColor)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('Change', 60 + (cardWidth + 20) * 2, yPos + 10, { width: cardWidth - 20 });
        doc.fontSize(16)
           .text(difference > 0 ? `+₹${difference.toLocaleString('en-IN')}` : `₹${difference.toLocaleString('en-IN')}`, 
                 60 + (cardWidth + 20) * 2, yPos + 30, { width: cardWidth - 20 });
        doc.fontSize(12)
           .text(difference > 0 ? `+${percentChange}% ↑` : difference < 0 ? `${Math.abs(percentChange)}% ↓` : 'No change', 
                 60 + (cardWidth + 20) * 2, yPos + 50, { width: cardWidth - 20 });

        yPos += cardHeight + 30;

        // Comparison by Type Table
        const allTypes = new Set([
          ...(currentMonth.summary || []).map(s => s._id),
          ...(previousMonth.summary || []).map(s => s._id)
        ]);

        doc.fillColor('#1E293B')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('Comparison by Expense Type', 50, yPos);
        yPos += 25;

        // Table Configuration
        const tableLeft = 50;
        const tableWidth = doc.page.width - 100;
        const rowHeight = 30;
        const colWidths = [
          tableWidth * 0.25,  // Type
          tableWidth * 0.20,  // Current Month
          tableWidth * 0.20,   // Last Month
          tableWidth * 0.18,   // Difference
          tableWidth * 0.17    // Change %
        ];

        // Table Header
        const headers = ['Type', currentMonthName.substring(0, 15), lastMonthName.substring(0, 15), 'Difference', 'Change'];
        const headerAligns = ['left', 'right', 'right', 'right', 'center'];
        
        headers.forEach((header, index) => {
          this.drawTableCell(doc, 
            tableLeft + colWidths.slice(0, index).reduce((a, b) => a + b, 0),
            yPos,
            colWidths[index],
            rowHeight,
            header,
            {
              bgColor: '#7C3AED',
              textColor: '#FFFFFF',
              fontSize: 9,
              bold: true,
              align: headerAligns[index],
              padding: 6
            }
          );
        });
        yPos += rowHeight;

        // Table Rows
        Array.from(allTypes).forEach((type, index) => {
          if (yPos > 730) {
            doc.addPage();
            yPos = 50;
            
            // Redraw headers
            headers.forEach((header, hIndex) => {
              this.drawTableCell(doc, 
                tableLeft + colWidths.slice(0, hIndex).reduce((a, b) => a + b, 0),
                yPos,
                colWidths[hIndex],
                rowHeight,
                header,
                {
                  bgColor: '#7C3AED',
                  textColor: '#FFFFFF',
                  fontSize: 9,
                  bold: true,
                  align: headerAligns[hIndex],
                  padding: 6
                }
              );
            });
            yPos += rowHeight;
          }

          const currentType = currentMonth.summary?.find(s => s._id === type);
          const previousType = previousMonth.summary?.find(s => s._id === type);
          const currentAmount = currentType?.totalAmount || 0;
          const previousAmount = previousType?.totalAmount || 0;
          const diff = currentAmount - previousAmount;
          const pctChange = previousAmount > 0 ? ((diff / previousAmount) * 100).toFixed(1) : (currentAmount > 0 ? 'New' : '0');

          const bgColor = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          const diffBgColor = diff > 0 ? '#FEE2E2' : diff < 0 ? '#D1FAE5' : '#F3F4F6';
          const diffTextColor = diff > 0 ? '#DC2626' : diff < 0 ? '#059669' : '#6B7280';

          // Type
          this.drawTableCell(doc, tableLeft, yPos, colWidths[0], rowHeight, type, {
            bgColor,
            fontSize: 9,
            bold: true,
            padding: 6
          });

          // Current Month Amount
          this.drawTableCell(doc, tableLeft + colWidths[0], yPos, colWidths[1], rowHeight, `₹${currentAmount.toLocaleString('en-IN')}`, {
            bgColor,
            fontSize: 9,
            align: 'right',
            padding: 6,
            bold: true
          });

          // Last Month Amount
          this.drawTableCell(doc, tableLeft + colWidths[0] + colWidths[1], yPos, colWidths[2], rowHeight, `₹${previousAmount.toLocaleString('en-IN')}`, {
            bgColor,
            fontSize: 9,
            align: 'right',
            padding: 6
          });

          // Difference
          const diffText = diff > 0 ? `+₹${diff.toLocaleString('en-IN')}` : `₹${diff.toLocaleString('en-IN')}`;
          this.drawTableCell(doc, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], yPos, colWidths[3], rowHeight, diffText, {
            bgColor: diffBgColor,
            textColor: diffTextColor,
            fontSize: 9,
            align: 'right',
            padding: 6,
            bold: true
          });

          // Change Percentage
          const changeText = diff > 0 ? `${pctChange}% ↑` : diff < 0 ? `${Math.abs(pctChange)}% ↓` : '0%';
          this.drawTableCell(doc, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPos, colWidths[4], rowHeight, changeText, {
            bgColor: diffBgColor,
            textColor: diffTextColor,
            fontSize: 9,
            align: 'center',
            padding: 6,
            bold: true
          });

          yPos += rowHeight;
        });

        // Areas of Increased Expenses Section
        if (difference > 0) {
          yPos += 20;
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }

          this.drawRoundedRect(doc, 50, yPos, doc.page.width - 100, 60, 8, '#FEF3C7', '#F59E0B');
          
          doc.fillColor('#92400E')
             .fontSize(14)
             .font('Helvetica-Bold')
             .text('⚠️ Areas of Increased Expenses', 60, yPos + 15);
          
          doc.fillColor('#78350F')
             .fontSize(9)
             .font('Helvetica')
             .text('The following expense categories showed significant increases compared to last month:', 60, yPos + 35, { width: doc.page.width - 120 });
          
          yPos += 70;

          const increasedTypes = Array.from(allTypes).filter(type => {
            const currentType = currentMonth.summary?.find(s => s._id === type);
            const previousType = previousMonth.summary?.find(s => s._id === type);
            return (currentType?.totalAmount || 0) > (previousType?.totalAmount || 0);
          });

          if (increasedTypes.length > 0) {
            increasedTypes.forEach((type, index) => {
              if (yPos > 730) {
                doc.addPage();
                yPos = 50;
              }

              const currentType = currentMonth.summary?.find(s => s._id === type);
              const previousType = previousMonth.summary?.find(s => s._id === type);
              const currentAmount = currentType?.totalAmount || 0;
              const previousAmount = previousType?.totalAmount || 0;
              const diff = currentAmount - previousAmount;
              const pct = previousAmount > 0 ? ((diff / previousAmount) * 100).toFixed(1) : 'New';

              this.drawRoundedRect(doc, 50, yPos, doc.page.width - 100, 35, 6, index % 2 === 0 ? '#FFFFFF' : '#F8FAFC', '#E5E7EB');
              
              doc.fillColor('#1E293B')
                 .fontSize(10)
                 .font('Helvetica-Bold')
                 .text(type, 60, yPos + 8);
              
              doc.fillColor('#DC2626')
                 .fontSize(9)
                 .text(`Increased by ₹${diff.toLocaleString('en-IN')} (${pct}%)`, doc.page.width - 200, yPos + 8, { align: 'right', width: 140 });

              yPos += 40;
            });
          } else {
            doc.fillColor('#64748B')
               .fontSize(9)
               .font('Helvetica')
               .text('No significant increases in expense categories.', 60, yPos);
          }
        }

        // Footer
        const footerY = doc.page.height - 40;
        doc.strokeColor('#E5E7EB')
           .lineWidth(1)
           .moveTo(50, footerY)
           .lineTo(doc.page.width - 50, footerY)
           .stroke();
        
        doc.fillColor('#64748B')
           .fontSize(8)
           .font('Helvetica')
           .text('This is an automated comparison report generated by PG Maintenance System', 50, footerY + 5, {
             align: 'center',
             width: doc.page.width - 100
           });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send monthly expense report via email
   */
  async sendMonthlyReportEmail(emailAddress, year, month) {
    try {
      const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Generate both PDFs
      const monthlyReportPDF = await this.generateMonthlyReportPDF(year, month);
      const comparisonReportPDF = await this.generateComparisonReportPDF(year, month);

      // Send email with both PDFs
      const emailResult = await emailService.sendEmail({
        to: emailAddress,
        subject: `Monthly Expense Report - ${monthName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
              .attachment-list { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Monthly Expense Report</h2>
                <p>${monthName}</p>
              </div>
              <div class="content">
                <p>Dear Administrator,</p>
                <p>Please find attached the monthly expense reports for <strong>${monthName}</strong>:</p>
                
                <div class="attachment-list">
                  <h3>Attachments:</h3>
                  <ul>
                    <li><strong>Monthly Expense Report:</strong> Detailed breakdown of all expenses for ${monthName}</li>
                    <li><strong>Comparison Report:</strong> Comparison between ${monthName} and previous month with analysis of expense changes</li>
                  </ul>
                </div>

                <p>These reports are generated automatically and contain detailed information about all expenses during the reporting period.</p>
                
                <p>If you have any questions or need additional information, please contact the system administrator.</p>

                <div class="footer">
                  <p>PG Maintenance System<br>
                  This is an automated monthly expense report.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        attachments: [
          {
            filename: `expense-report-${year}-${String(month).padStart(2, '0')}.pdf`,
            content: monthlyReportPDF,
            contentType: 'application/pdf'
          },
          {
            filename: `expense-comparison-${year}-${String(month).padStart(2, '0')}.pdf`,
            content: comparisonReportPDF,
            contentType: 'application/pdf'
          }
        ]
      });

      return {
        success: emailResult.success,
        message: emailResult.success ? 'Monthly expense report sent successfully' : 'Failed to send monthly expense report',
        error: emailResult.error
      };
    } catch (error) {
      console.error('Send monthly report email error:', error);
      return {
        success: false,
        message: 'Failed to send monthly expense report',
        error: error.message
      };
    }
  }
}

module.exports = new ExpenseReportService();

