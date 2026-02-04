const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const createTransporter = () => {
  // For Gmail, you'll need to use an App Password
  // For other services, adjust accordingly
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // App Password for Gmail
    },
  });
};

// Send shop credentials email
const sendShopCredentials = async (shopData, credentials) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Rental SaaS Platform" <${process.env.SMTP_USER}>`,
      to: shopData.email,
      subject: 'Welcome to Rental SaaS Platform - Your Account Credentials',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .credentials { background: white; padding: 15px; border-left: 4px solid #0ea5e9; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Rental SaaS Platform</h1>
            </div>
            <div class="content">
              <p>Dear ${shopData.name || 'Shop Owner'},</p>
              
              <p>Your shop has been successfully registered on our Rental SaaS Platform. Below are your login credentials:</p>
              
              <div class="credentials">
                <p><strong>Shop Name:</strong> ${shopData.name}</p>
                <p><strong>Email:</strong> ${credentials.email}</p>
                <p><strong>Password:</strong> ${credentials.password}</p>
                <p><strong>Login URL:</strong> <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">${process.env.FRONTEND_URL || 'http://localhost:3000'}/login</a></p>
              </div>
              
              <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <p>Best regards,<br>Rental SaaS Platform Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send password change verification email
const sendPasswordChangeVerification = async (email, token, type = 'link') => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-password-change?token=${token}&email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: `"Rental SaaS Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Change Verification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .otp { background: white; padding: 15px; border-left: 4px solid #0ea5e9; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Change Verification</h1>
            </div>
            <div class="content">
              <p>You have requested to change your password. Please verify this action:</p>
              
              ${type === 'link' ? `
                <p>Click the button below to verify and change your password:</p>
                <a href="${verificationUrl}" class="button">Verify & Change Password</a>
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #0ea5e9;">${verificationUrl}</p>
              ` : `
                <p>Your verification code is:</p>
                <div class="otp">${token}</div>
                <p>This code will expire in 15 minutes.</p>
              `}
              
              <p><strong>If you did not request this change, please ignore this email or contact support immediately.</strong></p>
              
              <p>Best regards,<br>Rental SaaS Platform Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send password change confirmation
const sendPasswordChangeConfirmation = async (email) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Rental SaaS Platform" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Changed Successfully',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Changed Successfully</h1>
            </div>
            <div class="content">
              <p>Your password has been successfully changed.</p>
              <p>If you did not make this change, please contact our support team immediately.</p>
              <p>Best regards,<br>Rental SaaS Platform Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendShopCredentials,
  sendPasswordChangeVerification,
  sendPasswordChangeConfirmation,
};
