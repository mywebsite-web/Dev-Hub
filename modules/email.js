const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

let transporter = null;
const emailLogs = [];

// Initialize email transporter
function initializeEmail() {
  if (transporter) {
    return transporter;
  }

  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  };

  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('⚠️ Email credentials not configured. Email functionality will be limited.');
    return null;
  }

  transporter = nodemailer.createTransport(emailConfig);

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter verification failed:', error);
    } else {
      console.log('✅ Email transporter is ready!');
    }
  });

  return transporter;
}

// Send email
async function sendEmail(recipientEmail, subject, messageText, devKey) {
  try {
    if (!transporter) {
      initializeEmail();
    }

    if (!transporter) {
      return {
        success: false,
        message: '❌ Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env file.'
      };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: subject,
      text: messageText,
      html: messageText.replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log email
    const logEntry = {
      timestamp: Date.now(),
      recipient: recipientEmail,
      subject: subject,
      message: messageText,
      messageId: info.messageId,
      status: 'sent',
      devKey: devKey ? '***' + devKey.slice(-4) : 'none'
    };
    
    emailLogs.push(logEntry);
    saveEmailLogs();

    return {
      success: true,
      message: `✅ Email sent successfully to ${recipientEmail}!\n\nMessage ID: ${info.messageId}`,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email send error:', error);
    
    const logEntry = {
      timestamp: Date.now(),
      recipient: recipientEmail,
      subject: subject,
      message: messageText,
      status: 'failed',
      error: error.message,
      devKey: devKey ? '***' + devKey.slice(-4) : 'none'
    };
    
    emailLogs.push(logEntry);
    saveEmailLogs();

    return {
      success: false,
      message: `❌ Failed to send email: ${error.message}`
    };
  }
}

// Get email status
function getEmailStatus() {
  return {
    isConfigured: !!transporter && !!process.env.EMAIL_USER,
    totalEmailsSent: emailLogs.filter(log => log.status === 'sent').length
  };
}

// Get email logs
function getEmailLogs(limit = 20) {
  return emailLogs.slice(-limit).reverse();
}

// Save email logs to file
function saveEmailLogs() {
  try {
    const logsPath = path.join(__dirname, '../data/email_logs.json');
    const logsDir = path.dirname(logsPath);
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(logsPath, JSON.stringify(emailLogs, null, 2));
  } catch (error) {
    console.error('Error saving email logs:', error);
  }
}

// Load email logs from file
function loadEmailLogs() {
  try {
    const logsPath = path.join(__dirname, '../data/email_logs.json');
    if (fs.existsSync(logsPath)) {
      const data = fs.readFileSync(logsPath, 'utf8');
      const logs = JSON.parse(data);
      emailLogs.push(...logs);
    }
  } catch (error) {
    console.error('Error loading email logs:', error);
  }
}

// Initialize on module load
loadEmailLogs();

module.exports = {
  initializeEmail,
  sendEmail,
  getEmailStatus,
  getEmailLogs
};

