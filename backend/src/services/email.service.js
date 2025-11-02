const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on environment
   */
  async initializeTransporter() {
    try {
      console.log('🔧 Initializing email transporter...');
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('EMAIL_USER configured:', !!process.env.EMAIL_USER);
      console.log('EMAIL_PASS configured:', !!process.env.EMAIL_PASS);

      if (process.env.NODE_ENV === 'production') {
        // Production: Use AWS SES or other email service
        console.log('Using production email configuration');
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: process.env.EMAIL_PORT || 587,
          secure: false, // Use TLS
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
          }
        });
      } else {
        // Development: Check if real email config is provided
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS &&
            process.env.EMAIL_USER !== 'your-email@gmail.com') {
          console.log('Using Gmail for development');
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });
        } else {
          console.log('📧 Using mock email transporter for development (emails will be logged only)');
          // Create a mock transporter that logs emails instead of sending them
          this.transporter = {
            sendMail: async (options) => {
              console.log('📧 MOCK EMAIL SENT:');
              console.log('  To:', options.to);
              console.log('  Subject:', options.subject);
              console.log('  From:', options.from);
              console.log('  HTML Length:', options.html?.length || 0, 'characters');
              console.log('  Text Length:', options.text?.length || 0, 'characters');
              console.log('  Email would be sent in production with real SMTP server');
              return {
                messageId: 'mock-' + Date.now(),
                envelope: { from: options.from, to: [options.to] }
              };
            },
            options: { service: 'mock', mock: true }
          };
        }
      }
      console.log('✅ Email transporter initialized successfully');
    } catch (error) {
      console.error('❌ Email transporter initialization failed:', error);
      console.log('🔄 Creating fallback mock transporter');

      // Create fallback mock transporter
      this.transporter = {
        sendMail: async (options) => {
          console.log('📧 FALLBACK MOCK EMAIL:');
          console.log('  To:', options.to);
          console.log('  Subject:', options.subject);
          console.log('  This is a fallback - configure EMAIL_USER and EMAIL_PASS for real emails');
          return {
            messageId: 'fallback-mock-' + Date.now(),
            envelope: { from: process.env.FROM_EMAIL || 'noreply@pgmaintenance.com', to: [options.to] }
          };
        },
        options: { service: 'fallback-mock', mock: true }
      };
    }
  }

  /**
   * Load email template
   * @param {string} templateName - Name of the template file
   * @param {Object} data - Data to replace in template
   * @returns {string} - HTML content
   */
  async loadTemplate(templateName, data) {
    try {
      const templatePath = path.join(__dirname, '../../templates', templateName);
      console.log('Loading email template from:', templatePath);
      
      let template = await fs.readFile(templatePath, 'utf8');
      console.log('Template loaded successfully, length:', template.length);
      
      // Replace placeholders with actual data
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, data[key]);
      });
      
      console.log('Template processed with data keys:', Object.keys(data));
      return template;
    } catch (error) {
      console.error('Error loading email template:', error);
      console.error('Template path attempted:', path.join(__dirname, '../../templates', templateName));
      
      // Return a basic HTML template as fallback
      return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>PG Maintenance System</title>
            <style>
                body { font-family: "Inter", sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .credentials { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏠 PG Maintenance System</h1>
                    <h2>Welcome Admin!</h2>
                </div>
                <div class="content">
                    <p>Dear ${data.firstName || 'Admin'} ${data.lastName || ''},</p>
                    
                    <p>Your PG <strong>"${data.pgName || 'Property'}"</strong> has been successfully registered in our system.</p>
                    
                    <div class="credentials">
                        <h3>🔑 Your Admin Login Credentials</h3>
                        <p><strong>Email:</strong> ${data.email || 'N/A'}</p>
                        <p><strong>Password:</strong> ${data.password || data.adminPassword || 'N/A'}</p>
                        <p><strong>Role:</strong> Admin</p>
                    </div>
                    
                    <p>
                        <a href="${data.loginUrl || 'http://localhost:3000/admin/login'}" class="button">
                            🚀 Login to Admin Dashboard
                        </a>
                    </p>
                    
                    <p><strong>Important:</strong> Please login and change your password immediately for security.</p>
                    
                    <p>Best regards,<br>
                    <strong>PG Maintenance Team</strong></p>
                </div>
            </div>
        </body>
        </html>
      `;
    }
  }

  /**
   * Get default email template
   * @param {Object} data - Template data
   * @returns {string} - HTML content
   */
  getDefaultTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PG Maintenance System</title>
          <style>
            body { font-family: "Inter", sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PG Maintenance System</h1>
            </div>
            <div class="content">
              ${data.content || 'Email content goes here'}
            </div>
            <div class="footer">
              <p>© 2025 PG Maintenance System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @returns {Promise<Object>} - Email result
   */
  async sendEmail(options) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const mailOptions = {
        from: `"PG Maintenance System" <${process.env.EMAIL_USER || 'noreply@pgmaintenance.com'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments || []
      };

      // Check if this is a mock transporter
      if (this.transporter?.options?.mock) {
        console.log('📧 Using mock email transporter (development mode)');
        const result = await this.transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId, mock: true };
      }

      console.log('📧 Attempting to send real email to:', options.to);
      console.log('📧 Subject:', options.subject);
      console.log('📧 Using transporter config:', {
        service: this.transporter?.options?.service || 'custom',
        host: this.transporter?.options?.host,
        port: this.transporter?.options?.port
      });

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      console.error('❌ Full error details:', error);

      // Don't throw error - just log and return failure for graceful handling
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email
   * @param {Object} user - User object
   * @returns {Promise<Object>} - Email result
   */
  /**
   * Send welcome email to Sales Manager
   * @param {Object} salesManager - Sales Manager data with tempPassword
   */
  async sendSalesManagerWelcomeEmail(salesManager) {
    try {
      const subject = 'Welcome to PG Maintenance - Sales Manager Account Created';

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to PG Maintenance</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: #ffffff;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .welcome-message {
              font-size: 18px;
              color: #374151;
              margin-bottom: 20px;
            }
            .credentials-box {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .credential-item {
              margin-bottom: 15px;
              padding: 10px;
              background-color: #ffffff;
              border-radius: 5px;
              border-left: 4px solid #2563eb;
            }
            .credential-label {
              font-weight: bold;
              color: #374151;
              margin-bottom: 5px;
            }
            .credential-value {
              font-family: 'Courier New', monospace;
              background-color: #f1f5f9;
              padding: 8px 12px;
              border-radius: 4px;
              font-size: 16px;
              color: #1f2937;
              word-break: break-all;
            }
            .important-note {
              background-color: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
            .important-note h3 {
              color: #92400e;
              margin-top: 0;
              margin-bottom: 10px;
            }
            .login-button {
              display: inline-block;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .login-button:hover {
              background-color: #1d4ed8;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
            .security-note {
              background-color: #fee2e2;
              border: 1px solid #fca5a5;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">PG Maintenance</div>
              <h1>Welcome ${salesManager.firstName} ${salesManager.lastName}!</h1>
              <p class="welcome-message">Your Sales Manager account has been successfully created.</p>
            </div>

            <div class="credentials-box">
              <h2 style="color: #2563eb; margin-bottom: 20px;">Your Login Credentials</h2>

              <div class="credential-item">
                <div class="credential-label">Unique ID:</div>
                <div class="credential-value">${salesManager.salesUniqueId}</div>
              </div>

              <div class="credential-item">
                <div class="credential-label">Email:</div>
                <div class="credential-value">${salesManager.email}</div>
              </div>

              <div class="credential-item">
                <div class="credential-label">Temporary Password:</div>
                <div class="credential-value">${salesManager.tempPassword || 'Not Available'}</div>
              </div>
            </div>

            <div class="important-note">
              <h3>🔐 Security Notice</h3>
              <p><strong>This is your temporary password.</strong> You will be required to change it on your first login for security purposes.</p>
            </div>

            <div class="security-note">
              <h3>🛡️ Important Security Steps</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Change your password immediately</strong> after first login</li>
                <li><strong>Do not share your credentials</strong> with anyone</li>
                <li><strong>Use a strong password</strong> with at least 8 characters</li>
                <li><strong>Keep your account secure</strong> at all times</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${salesManager.loginUrl}" class="login-button">
                Login to Your Account
              </a>
            </div>

            <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
              <h3 style="color: #2563eb; margin-top: 0;">Getting Started</h3>
              <ol style="margin-bottom: 0;">
                <li>Click the login button above or visit: <strong>${salesManager.loginUrl}</strong></li>
                <li>Use your Unique ID or Email to login</li>
                <li>Enter your temporary password</li>
                <li>You will be prompted to change your password</li>
                <li>Set a strong, secure password for your account</li>
                <li>Start managing your sales team and growing your business!</li>
              </ol>
            </div>

            <div class="footer">
              <p><strong>Need Help?</strong> Contact our support team at ${process.env.SUPPORT_EMAIL || 'support@pgmaintenance.com'}</p>
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; 2025 PG Maintenance. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        Welcome ${salesManager.firstName} ${salesManager.lastName}!

        Your Sales Manager account has been successfully created.

        Your Login Credentials:
        - Unique ID: ${salesManager.salesUniqueId}
        - Email: ${salesManager.email}
        - Temporary Password: ${salesManager.tempPassword || 'Not Available'}

        IMPORTANT: This is your temporary password. You will be required to change it on your first login.

        Security Steps:
        - Change your password immediately after first login
        - Do not share your credentials with anyone
        - Use a strong password with at least 8 characters
        - Keep your account secure at all times

        Login URL: ${salesManager.loginUrl}

        Getting Started:
        1. Visit the login URL above
        2. Use your Unique ID or Email to login
        3. Enter your temporary password
        4. You will be prompted to change your password
        5. Set a strong, secure password for your account
        6. Start managing your sales team and growing your business!

        Need Help? Contact our support team at support@pgmaintenance.com

        This is an automated message. Please do not reply to this email.

        © 2025 PG Maintenance. All rights reserved.
      `;

      const emailResult = await this.sendEmail({
        to: salesManager.email,
        subject: subject,
        html: htmlContent,
        text: textContent
      });

      if (emailResult.success) {
        if (emailResult.mock) {
          console.log(`📧 Sales Manager welcome email MOCKED to ${salesManager.email} (development mode)`);
          console.log(`📧 In production, this email would be sent with subject: "${subject}"`);
        } else {
          console.log(`✅ Sales Manager welcome email sent to ${salesManager.email}`);
        }
      } else {
        throw new Error(`Failed to send welcome email: ${emailResult.error}`);
      }

    } catch (error) {
      console.error('❌ Failed to send Sales Manager welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  /**
   * Send welcome email to Sales Staff (Sub-sales staff)
   * @param {Object} salesStaff - Sales Staff data with tempPassword
   */
  async sendSalesStaffWelcomeEmail(salesStaff) {
    try {
      const subject = 'Welcome to PG Maintenance - Sales Staff Account Created';

      const htmlContent = await this.loadTemplate('sales-staff-welcome.html', {
        firstName: salesStaff.firstName,
        lastName: salesStaff.lastName,
        salesUniqueId: salesStaff.salesUniqueId,
        email: salesStaff.email,
        password: salesStaff.tempPassword || salesStaff.password,
        commissionRate: salesStaff.salesCommissionRate || 10,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@pgmaintenance.com',
        companyName: 'PG Maintenance System'
      });

      const textContent = `
        Welcome ${salesStaff.firstName} ${salesStaff.lastName}!

        Your Sales Staff account has been successfully created.

        Your Login Credentials:
        - Unique ID: ${salesStaff.salesUniqueId}
        - Email: ${salesStaff.email}
        - Temporary Password: ${salesStaff.tempPassword || salesStaff.password}
        - Commission Rate: ${salesStaff.salesCommissionRate || 10}%

        IMPORTANT: This is your temporary password. You will be required to change it on your first login.

        Your Responsibilities:
        - Identify and approach potential PG property owners
        - Register new PG properties in the system
        - Ensure accurate property information is entered
        - Meet monthly/quarterly sales targets

        Commission Structure:
        You will earn ${salesStaff.salesCommissionRate || 10}% commission on each PG property you successfully add to our system.

        Security Steps:
        - Change your password immediately after first login
        - Do not share your credentials with anyone
        - Use a strong password with at least 8 characters
        - Keep your account secure at all times

        Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

        Getting Started:
        1. Visit the login URL above
        2. Use your Unique ID or Email to login
        3. Enter your temporary password
        4. You will be prompted to change your password
        5. Complete your profile with banking details
        6. Start adding PG properties and earning commissions!

        Need Help? Contact your sales manager or support team at ${process.env.SUPPORT_EMAIL || 'support@pgmaintenance.com'}

        This is an automated message. Please do not reply to this email.

        © 2025 PG Maintenance. All rights reserved.
      `;

      const emailResult = await this.sendEmail({
        to: salesStaff.email,
        subject: subject,
        html: htmlContent,
        text: textContent
      });

      if (emailResult.success) {
        if (emailResult.mock) {
          console.log(`📧 Sales Staff welcome email MOCKED to ${salesStaff.email} (development mode)`);
          console.log(`📧 In production, this email would be sent with subject: "${subject}"`);
        } else {
          console.log(`✅ Sales Staff welcome email sent to ${salesStaff.email}`);
        }
      } else {
        throw new Error(`Failed to send welcome email: ${emailResult.error}`);
      }

    } catch (error) {
      console.error('❌ Failed to send Sales Staff welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  async sendWelcomeEmail(user) {
    const data = {
      name: user.firstName,
      email: user.email,
      password: user.plainPassword, // Store the plain password temporarily
      loginUrl: `${process.env.FRONTEND_URL}/login`
    };

    const html = await this.loadTemplate('welcome', data);
    
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to PG Maintenance System',
      html: html,
      text: `Welcome ${user.firstName}! Thank you for registering with PG Maintenance System. You can now login at: ${data.loginUrl}`
    });
  }

  /**
   * Send password reset email
   * @param {Object} user - User object
   * @param {string} resetToken - Password reset token
   * @returns {Promise<Object>} - Email result
   */
  async sendPasswordResetEmail(user, resetToken) {
    const data = {
      name: user.firstName,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      expiryTime: '10 minutes'
    };

    const html = await this.loadTemplate('password-reset', data);
    
    return this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request - PG Maintenance System',
      html: html,
      text: `Hello ${user.firstName}, you requested a password reset. Click this link to reset your password: ${data.resetUrl}. This link expires in ${data.expiryTime}.`
    });
  }

  /**
   * Send email verification email
   * @param {Object} user - User object
   * @param {string} verificationToken - Email verification token
   * @returns {Promise<Object>} - Email result
   */
  async sendEmailVerificationEmail(user, verificationToken) {
    const data = {
      name: user.firstName,
      verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
      expiryTime: '24 hours'
    };

    const html = await this.loadTemplate('email-verification', data);
    
    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email - PG Maintenance System',
      html: html,
      text: `Hello ${user.firstName}, please verify your email by clicking this link: ${data.verificationUrl}. This link expires in ${data.expiryTime}.`
    });
  }

  /**
   * Send account locked email
   * @param {Object} user - User object
   * @returns {Promise<Object>} - Email result
   */
  async sendAccountLockedEmail(user) {
    const data = {
      name: user.firstName,
      unlockTime: new Date(user.lockUntil).toLocaleString(),
      supportEmail: process.env.SUPPORT_EMAIL || 'support@pgmaintenance.com'
    };

    const html = await this.loadTemplate('account-locked', data);
    
    return this.sendEmail({
      to: user.email,
      subject: 'Account Temporarily Locked - PG Maintenance System',
      html: html,
      text: `Hello ${user.firstName}, your account has been temporarily locked due to multiple failed login attempts. It will be unlocked at ${data.unlockTime}. Contact support if you need assistance.`
    });
  }

  /**
   * Send login notification email
   * @param {Object} user - User object
   * @param {Object} loginInfo - Login information
   * @returns {Promise<Object>} - Email result
   */
  async sendLoginNotificationEmail(user, loginInfo) {
    const data = {
      name: user.firstName,
      loginTime: new Date().toLocaleString(),
      ipAddress: loginInfo.ipAddress || 'Unknown',
      userAgent: loginInfo.userAgent || 'Unknown',
      location: loginInfo.location || 'Unknown'
    };

    const html = await this.loadTemplate('login-notification', data);
    
    return this.sendEmail({
      to: user.email,
      subject: 'New Login Detected - PG Maintenance System',
      html: html,
      text: `Hello ${user.firstName}, a new login was detected on your account at ${data.loginTime}. If this wasn't you, please contact support immediately.`
    });
  }

  /**
   * Send PG Admin Welcome Email
   * @param {Object} userData - User data including email, name, PG details, and credentials
   */
  async sendPGAdminWelcomeEmail(userData) {
    try {
      const { email, firstName, lastName, pgName, password, loginUrl } = userData;

      const emailData = {
        firstName,
        lastName,
        pgName,
        email,
        password,
        loginUrl,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@pgmaintenance.com',
        companyName: 'PG Maintenance System'
      };

      const htmlContent = await this.loadTemplate('pg-admin-welcome.html', emailData);

      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'PG Maintenance'}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: `Welcome to PG Maintenance - Admin Access for ${pgName}`,
        html: htmlContent,
        text: `Welcome to PG Maintenance System!
        
Your PG "${pgName}" has been successfully registered in our system.

Admin Login Credentials:
- Email: ${email}
- Password: ${password}
- Login URL: ${loginUrl}

Please login and change your password for security.

Best regards,
PG Maintenance Team`
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('PG Admin welcome email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending PG admin welcome email:', error);
      throw new Error(`Failed to send PG admin welcome email: ${error.message}`);
    }
  }

  /**
   * Send Support Staff Welcome Email
   * @param {Object} user - Support staff user data
   */
  async sendSupportWelcomeEmail(user) {
    try {
      const { email, firstName, lastName, plainPassword } = user;

      const emailData = {
        firstName,
        lastName,
        email,
        password: plainPassword || 'Support@123',
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/support-login`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@pgmaintenance.com',
        companyName: 'PG Maintenance System'
      };

      const htmlContent = await this.loadTemplate('support-welcome.html', emailData);

      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'PG Maintenance'}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: 'Welcome to PG Maintenance - Support Staff Access',
        html: htmlContent,
        text: `Welcome to PG Maintenance System!
        
You have been registered as a Support Staff member.

Login Credentials:
- Email: ${email}
- Password: ${emailData.password}
- Login URL: ${emailData.loginUrl}

Please login and change your password for security.

Best regards,
PG Maintenance Team`
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Support staff welcome email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending support staff welcome email:', error);
      throw new Error(`Failed to send support staff welcome email: ${error.message}`);
    }
  }

  /**
   * Send trial expiry notification (3 days before expiry)
   * @param {Object} params - Email parameters
   */
  async sendTrialExpiryNotification({ to, firstName, lastName, daysLeft, expiryDate }) {
    try {
      const subject = `Your PG Maintenance Free Trial Expires in ${daysLeft} Days`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Trial Expiring Soon</h1>
          </div>

          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Hi ${firstName} ${lastName},</h2>

            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Your <strong>7-day free trial</strong> of PG Maintenance is expiring soon!
            </p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
              <h3 style="color: #e74c3c; margin-top: 0;">⏰ ${daysLeft} Days Remaining</h3>
              <p style="margin: 5px 0; color: #666;">
                <strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <p style="color: #666; line-height: 1.6;">
              To continue enjoying all the premium features, upgrade to one of our paid plans before your trial expires.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/subscription-selection"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: bold;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                🚀 Upgrade Now
              </a>
            </div>

            <h3 style="color: #333;">What happens after trial expiry?</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Access to most features will be restricted</li>
              <li>You can still view resident information (read-only)</li>
              <li>You can still view payment history</li>
              <li>All management features will be disabled</li>
            </ul>

            <p style="color: #666; line-height: 1.6; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              Don't miss out on the full PG Maintenance experience! Upgrade today to keep managing your property efficiently.
            </p>

            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              If you have any questions, feel free to reply to this email.<br>
              Best regards,<br>
              <strong>PG Maintenance Team</strong>
            </p>
          </div>
        </div>
      `;

      await this.sendEmail({
        to: to,
        subject: subject,
        html: htmlContent
      });
      console.log(`✅ Trial expiry notification sent to ${to}`);

    } catch (error) {
      console.error('❌ Error sending trial expiry notification:', error);
      throw error;
    }
  }

  /**
   * Send trial expired notification
   * @param {Object} params - Email parameters
   */
  async sendTrialExpiredNotification({ to, firstName, lastName, expiredDate }) {
    try {
      const subject = 'Your PG Maintenance Free Trial Has Expired';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Trial Expired</h1>
          </div>

          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Hi ${firstName} ${lastName},</h2>

            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Your <strong>7-day free trial</strong> of PG Maintenance has expired.
            </p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c;">
              <h3 style="color: #e74c3c; margin-top: 0;">📅 Trial Ended</h3>
              <p style="margin: 5px 0; color: #666;">
                <strong>Expiry Date:</strong> ${new Date(expiredDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <p style="color: #666; line-height: 1.6;">
              Your account has been switched to a <strong>limited access plan</strong>. To regain full functionality, please upgrade to one of our paid plans.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/subscription-selection"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: bold;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                🚀 Upgrade Now
              </a>
            </div>

            <h3 style="color: #333;">What's still available?</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>✅ View resident information (read-only)</li>
              <li>✅ View payment history</li>
              <li>✅ Basic dashboard access</li>
              <li>❌ Add/edit residents</li>
              <li>❌ Create payments</li>
              <li>❌ Access most management features</li>
            </ul>

            <p style="color: #666; line-height: 1.6; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              Ready to unlock all features again? Upgrade now and continue managing your PG efficiently!
            </p>

            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Need help? Reply to this email or contact our support team.<br>
              Best regards,<br>
              <strong>PG Maintenance Team</strong>
            </p>
          </div>
        </div>
      `;

      await this.sendEmail({
        to: to,
        subject: subject,
        html: htmlContent
      });
      console.log(`✅ Trial expired notification sent to ${to}`);

    } catch (error) {
      console.error('❌ Error sending trial expired notification:', error);
      throw error;
    }
  }
}

module.exports = new EmailService(); 