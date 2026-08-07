const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to load and render email templates
const loadTemplate = (templateName, variables = {}) => {
  const templatePath = path.join(__dirname, '../../templates/emails', `${templateName}.html`);
  
  try {
    let html = fs.readFileSync(templatePath, 'utf-8');
    
    // Replace variables in the template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, variables[key]);
    });
    
    return html;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
};

const sendEmail = async (to, subject, html, text = '') => {
  try {
    console.log('Sending email to:', to);
    console.log('From:', process.env.RESEND_FROM_EMAIL);
    console.log('Subject:', subject);
    console.log('API Key present:', !!process.env.RESEND_API_KEY);
    
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: to,
      subject: subject,
      html: html
    });
    
    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Error response:', JSON.stringify(error.response, null, 2));
    }
    if (error.statusCode) {
      console.error('Status code:', error.statusCode);
    }
    
    throw error;
  }
};

const sendVerificationEmail = async (email, verificationCode) => {
  const html = loadTemplate('verification', { verificationCode });
  return sendEmail(email, 'Verify Your Email Address', html);
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
  const html = loadTemplate('password-reset', { resetUrl });
  return sendEmail(email, 'Reset Your Password', html);
};

const sendWelcomeEmail = async (email, name) => {
  const html = loadTemplate('welcome', { name });
  return sendEmail(email, 'Welcome to PayMi!', html);
};

const sendKYCStatusEmail = async (email, name, status, rejectionReason = '') => {
  let templateName;
  
  if (status === 'APPROVED') {
    templateName = 'kyc-approved';
  } else if (status === 'REJECTED') {
    templateName = 'kyc-rejected';
  } else {
    templateName = 'kyc-review';
  }
  
  const html = loadTemplate(templateName, { name, rejectionReason });
  return sendEmail(email, `KYC Verification Status: ${status}`, html);
};

const sendAccessTokenEmail = async (email, name, accessToken, keyName = 'API Access Token') => {
  const html = loadTemplate('access-token', { name, accessToken, keyName });
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
