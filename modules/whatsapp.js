const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

let whatsappClient = null;
let isReady = false;
const messageLogs = [];

// Initialize WhatsApp client
function initializeWhatsApp() {
  // Check if running in production/cloud environment
  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = process.env.RENDER === 'true' || process.env.RENDER_EXTERNAL_URL;
  
  if (isProduction || isRender) {
    console.log('⚠️ WhatsApp Web.js requires QR code scanning which is not available in cloud environments.');
    console.log('📱 WhatsApp feature is disabled in production. Use a cloud WhatsApp API service instead.');
    return null;
  }

  if (whatsappClient) {
    return whatsappClient;
  }

  whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  whatsappClient.on('qr', (qr) => {
    console.log('📱 WhatsApp QR Code:');
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above with WhatsApp to connect.');
  });

  whatsappClient.on('ready', () => {
    console.log('✅ WhatsApp client is ready!');
    isReady = true;
  });

  whatsappClient.on('authenticated', () => {
    console.log('✅ WhatsApp authenticated!');
  });

  whatsappClient.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp authentication failed:', msg);
    isReady = false;
  });

  whatsappClient.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp client disconnected:', reason);
    isReady = false;
  });

  whatsappClient.initialize().catch(err => {
    console.error('Error initializing WhatsApp:', err);
  });

  return whatsappClient;
}

// Format WhatsApp number
function formatWhatsAppNumber(number) {
  // Remove all non-digit characters except +
  let cleaned = number.replace(/[^\d+]/g, '');
  
  // Remove leading + if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // If number doesn't start with country code, assume it's a local number
  // You might need to add your default country code here
  // For now, we'll use the number as-is if it looks like it has a country code
  
  // Add @c.us suffix for WhatsApp Web.js
  return cleaned + '@c.us';
}

// Send WhatsApp message
async function sendWhatsAppMessage(recipientNumber, messageText, devKey) {
  try {
    // Check if running in production/cloud environment
    const isProduction = process.env.NODE_ENV === 'production';
    const isRender = process.env.RENDER === 'true' || process.env.RENDER_EXTERNAL_URL;
    
    if (isProduction || isRender) {
      return {
        success: false,
        message: '⚠️ WhatsApp Web.js is not available in cloud environments (Render, Heroku, etc.)\n\n' +
                 'WhatsApp Web.js requires QR code scanning which cannot be done on cloud servers.\n\n' +
                 '**Solutions:**\n' +
                 '1. Use WhatsApp locally (run `npm start` on your computer)\n' +
                 '2. Use a cloud WhatsApp API service (Twilio, WhatsApp Business API)\n' +
                 '3. Set up a local WhatsApp bridge service\n\n' +
                 'For now, WhatsApp features work only in local development environment.'
      };
    }

    if (!whatsappClient) {
      initializeWhatsApp();
      return {
        success: false,
        message: '⚠️ WhatsApp client is initializing. Please wait for QR code scan and authentication.'
      };
    }

    if (!isReady) {
      return {
        success: false,
        message: '⚠️ WhatsApp client is not ready. Please wait for QR code scan and authentication.\n\n' +
                 'Check the console/terminal for QR code to scan with WhatsApp.\n' +
                 'Look for the QR code in the server output.'
      };
    }

    // Format number properly
    const formattedNumber = formatWhatsAppNumber(recipientNumber);
    
    console.log(`📱 Attempting to send WhatsApp message to: ${formattedNumber}`);
    console.log(`   Original number: ${recipientNumber}`);
    console.log(`   Message: ${messageText.substring(0, 50)}...`);

    // Check if number exists in WhatsApp
    const isRegistered = await whatsappClient.isRegisteredUser(formattedNumber);
    if (!isRegistered) {
      return {
        success: false,
        message: `❌ The number ${recipientNumber} is not registered on WhatsApp.\n\nPlease verify the number is correct and includes country code (e.g., +234 for Nigeria, +1 for US).`
      };
    }

    // Send message
    const result = await whatsappClient.sendMessage(formattedNumber, messageText);
    
    // Verify message was sent
    if (!result || !result.id) {
      return {
        success: false,
        message: `❌ Message sending failed. No confirmation received.`
      };
    }
    
    // Log message
    const logEntry = {
      timestamp: Date.now(),
      recipient: recipientNumber,
      formattedRecipient: formattedNumber,
      message: messageText,
      messageId: result.id._serialized,
      status: 'sent',
      devKey: devKey ? '***' + devKey.slice(-4) : 'none'
    };
    
    messageLogs.push(logEntry);
    saveMessageLogs();

    console.log(`✅ WhatsApp message sent successfully! Message ID: ${result.id._serialized}`);

    return {
      success: true,
      message: `✅ WhatsApp message sent successfully to ${recipientNumber}!\n\nMessage ID: ${result.id._serialized}\nFormatted number: ${formattedNumber}`,
      messageId: result.id._serialized
    };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    
    const logEntry = {
      timestamp: Date.now(),
      recipient: recipientNumber,
      message: messageText,
      status: 'failed',
      error: error.message,
      devKey: devKey ? '***' + devKey.slice(-4) : 'none'
    };
    
    messageLogs.push(logEntry);
    saveMessageLogs();

    let errorMessage = `❌ Failed to send WhatsApp message: ${error.message}`;
    
    // Provide helpful error messages
    if (error.message.includes('not registered')) {
      errorMessage += '\n\nThe number is not registered on WhatsApp. Please verify the number format includes country code.';
    } else if (error.message.includes('timeout')) {
      errorMessage += '\n\nRequest timed out. Please check your internet connection.';
    }

    return {
      success: false,
      message: errorMessage
    };
  }
}

// Get WhatsApp status
function getWhatsAppStatus() {
  return {
    isReady: isReady,
    isInitialized: !!whatsappClient,
    totalMessagesSent: messageLogs.filter(log => log.status === 'sent').length
  };
}

// Get message logs
function getMessageLogs(limit = 20) {
  return messageLogs.slice(-limit).reverse();
}

// Save message logs to file
function saveMessageLogs() {
  try {
    const logsPath = path.join(__dirname, '../data/whatsapp_logs.json');
    const logsDir = path.dirname(logsPath);
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(logsPath, JSON.stringify(messageLogs, null, 2));
  } catch (error) {
    console.error('Error saving WhatsApp logs:', error);
  }
}

// Load message logs from file
function loadMessageLogs() {
  try {
    const logsPath = path.join(__dirname, '../data/whatsapp_logs.json');
    if (fs.existsSync(logsPath)) {
      const data = fs.readFileSync(logsPath, 'utf8');
      const logs = JSON.parse(data);
      messageLogs.push(...logs);
    }
  } catch (error) {
    console.error('Error loading WhatsApp logs:', error);
  }
}

// Initialize on module load
loadMessageLogs();

module.exports = {
  initializeWhatsApp,
  sendWhatsAppMessage,
  getWhatsAppStatus,
  getMessageLogs
};

