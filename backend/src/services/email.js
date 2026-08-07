const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html, text = '') => {
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
      text: text
    });
    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

const sendVerificationEmail = async (email, verificationCode) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Verify Your Email</h2>
      <p>Your verification code is:</p>
      <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
        ${verificationCode}
      </div>
      <p>This code will expire in 15 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
  `;
  
  return sendEmail(email, 'Verify Your Email Address', html);
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Reset Your Password</h2>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;
  
  return sendEmail(email, 'Reset Your Password', html);
};

const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to PayMe!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for joining PayMe. We're excited to have you on board!</p>
      <p>With PayMe, you can:</p>
      <ul>
        <li>Accept payments from customers</li>
        <li>Manage your transactions</li>
        <li>Send and receive money</li>
        <li>Track your business analytics</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The PayMe Team</p>
    </div>
  `;
  
  return sendEmail(email, 'Welcome to PayMe!', html);
};

const sendKYCStatusEmail = async (email, name, status, rejectionReason = '') => {
  let html = '';
  
  if (status === 'APPROVED') {
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">KYC Verification Approved!</h2>
        <p>Hi ${name},</p>
        <p>Great news! Your KYC verification has been approved.</p>
        <p>You can now access all features of your PayMe account.</p>
        <p>Best regards,<br>The PayMe Team</p>
      </div>
    `;
  } else if (status === 'REJECTED') {
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">KYC Verification Rejected</h2>
        <p>Hi ${name},</p>
        <p>Your KYC verification has been rejected.</p>
        <p><strong>Reason:</strong> ${rejectionReason}</p>
        <p>Please review the reason and submit your documents again.</p>
        <p>Best regards,<br>The PayMe Team</p>
      </div>
    `;
  } else {
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ffc107;">KYC Verification Under Review</h2>
        <p>Hi ${name},</p>
        <p>Your KYC verification is currently under review.</p>
        <p>We'll notify you once the review is complete.</p>
        <p>Best regards,<br>The PayMe Team</p>
      </div>
    `;
  }
  
  return sendEmail(email, `KYC Verification Status: ${status}`, html);
};

const sendAccessTokenEmail = async (email, name, accessToken, keyName = 'API Access Token') => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Your ${keyName}</h2>
      <p>Hi ${name},</p>
      <p>Your ${keyName} has been generated successfully.</p>
      <p><strong>Access Token:</strong></p>
      <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 16px; font-family: monospace; word-break: break-all; margin: 20px 0; border: 1px solid #ddd; border-radius: 5px;">
        ${accessToken}
      </div>
      <p style="color: #dc3545;"><strong>Important Security Notice:</strong></p>
      <ul style="color: #666;">
        <li>Keep this token secure and do not share it with anyone.</li>
        <li>This token provides full access to your account.</li>
        <li>If you suspect this token has been compromised, revoke it immediately from your dashboard.</li>
        <li>Store this token in a secure location (e.g., password manager).</li>
      </ul>
      <p>If you did not request this token, please contact support immediately.</p>
      <p>Best regards,<br>The PayMi Team</p>
    </div>
  `;
  
  return sendEmail(email, `Your ${keyName}`, html);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendKYCStatusEmail,
  sendAccessTokenEmail
};
