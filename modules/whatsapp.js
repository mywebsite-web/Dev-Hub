const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

let whatsappClient = null;
let isReady = false;
const messageLogs = [];

// Initialize WhatsApp client
function initializeWhatsApp() {
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

// Send WhatsApp message
async function sendWhatsAppMessage(recipientNumber, messageText, devKey) {
  try {
    if (!whatsappClient || !isReady) {
      initializeWhatsApp();
      return {
        success: false,
        message: '⚠️ WhatsApp client is not ready. Please wait for QR code scan and authentication.'
      };
    }

    // Format number (remove spaces, add country code if needed)
    let formattedNumber = recipientNumber.replace(/\s+/g, '');
    if (!formattedNumber.includes('@c.us')) {
      formattedNumber = formattedNumber + '@c.us';
    }

    // Send message
    const result = await whatsappClient.sendMessage(formattedNumber, messageText);
    
    // Log message
    const logEntry = {
      timestamp: Date.now(),
      recipient: recipientNumber,
      message: messageText,
      messageId: result.id._serialized,
      status: 'sent',
      devKey: devKey ? '***' + devKey.slice(-4) : 'none'
    };
    
    messageLogs.push(logEntry);
    saveMessageLogs();

    return {
      success: true,
      message: `✅ WhatsApp message sent successfully to ${recipientNumber}!\n\nMessage ID: ${result.id._serialized}`,
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

    return {
      success: false,
      message: `❌ Failed to send WhatsApp message: ${error.message}`
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

