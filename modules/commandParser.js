const whatsapp = require('./whatsapp');
const reminders = require('./reminders');
const userContext = require('./userContext');

// Parse and execute commands
async function parseCommand(message, devKey, isDeveloperChat = false) {
  const trimmedMessage = message.trim();
  
  // WhatsApp command: /whatsapp RECIPIENT_NUMBER MESSAGE_TEXT
  if (trimmedMessage.startsWith('/whatsapp ')) {
    if (!isDeveloperChat && !devKey) {
      return {
        success: false,
        message: '🔒 Unauthorized. Developer secret key required for WhatsApp commands.'
      };
    }
    
    const parts = trimmedMessage.substring(10).trim().split(/\s+/);
    if (parts.length < 2) {
      return {
        success: false,
        message: '❌ Invalid WhatsApp command format.\n\nUsage: /whatsapp RECIPIENT_NUMBER MESSAGE_TEXT\nExample: /whatsapp +1234567890 Hello from Dev-GPT!'
      };
    }
    
    const recipientNumber = parts[0];
    const messageText = parts.slice(1).join(' ');
    
    // Check if recipient is in contacts
    const contact = userContext.findContact(recipientNumber);
    const finalNumber = contact ? contact.phoneNumber : recipientNumber;
    
    return await whatsapp.sendWhatsAppMessage(finalNumber, messageText, devKey);
  }
  
  // Reminder command: /remind "YYYY-MM-DD HH:mm" "REMINDER_TEXT"
  if (trimmedMessage.startsWith('/remind ')) {
    if (!isDeveloperChat && !devKey) {
      return {
        success: false,
        message: '🔒 Unauthorized. Developer secret key required for reminder commands.'
      };
    }
    
    const content = trimmedMessage.substring(8).trim();
    
    // Parse quoted strings
    const dateMatch = content.match(/"([^"]+)"/);
    const textMatch = content.match(/"([^"]+)"/g);
    
    if (!dateMatch || !textMatch || textMatch.length < 2) {
      return {
        success: false,
        message: '❌ Invalid reminder command format.\n\nUsage: /remind "YYYY-MM-DD HH:mm" "REMINDER_TEXT"\nExample: /remind "2024-12-25 10:00" "Christmas reminder"'
      };
    }
    
    const dateTimeString = dateMatch[1];
    const reminderText = textMatch[1];
    
    return reminders.createReminder(dateTimeString, reminderText);
  }
  
  // Add contact command: /addcontact NAME PHONE_NUMBER [EMAIL]
  if (trimmedMessage.startsWith('/addcontact ')) {
    if (!isDeveloperChat && !devKey) {
      return {
        success: false,
        message: '🔒 Unauthorized. Developer secret key required.'
      };
    }
    
    const parts = trimmedMessage.substring(12).trim().split(/\s+/);
    if (parts.length < 2) {
      return {
        success: false,
        message: '❌ Invalid add contact format.\n\nUsage: /addcontact NAME PHONE_NUMBER [EMAIL]'
      };
    }
    
    const name = parts[0];
    const phoneNumber = parts[1];
    const email = parts[2] || null;
    
    const contact = userContext.addContact(name, phoneNumber, email);
    return {
      success: true,
      message: `✅ Contact added!\n\nName: ${contact.name}\nPhone: ${contact.phoneNumber}${contact.email ? `\nEmail: ${contact.email}` : ''}`
    };
  }
  
  // List contacts command
  if (trimmedMessage === '/contacts' || trimmedMessage === '/listcontacts') {
    if (!isDeveloperChat && !devKey) {
      return {
        success: false,
        message: '🔒 Unauthorized. Developer secret key required.'
      };
    }
    
    const contacts = userContext.getContext().contacts;
    if (contacts.length === 0) {
      return {
        success: true,
        message: '📋 No contacts saved yet.\n\nUse /addcontact to add contacts.'
      };
    }
    
    const contactsList = contacts.map(c => 
      `• ${c.name} - ${c.phoneNumber}${c.email ? ` (${c.email})` : ''}`
    ).join('\n');
    
    return {
      success: true,
      message: `📋 Saved Contacts (${contacts.length}):\n\n${contactsList}`
    };
  }
  
  // List reminders command
  if (trimmedMessage === '/reminders' || trimmedMessage === '/listreminders') {
    if (!isDeveloperChat && !devKey) {
      return {
        success: false,
        message: '🔒 Unauthorized. Developer secret key required.'
      };
    }
    
    const pendingReminders = reminders.getReminders('pending');
    if (pendingReminders.length === 0) {
      return {
        success: true,
        message: '⏰ No pending reminders.'
      };
    }
    
    const remindersList = pendingReminders.map(r => 
      `• ${new Date(r.scheduledTime).toLocaleString()}: ${r.text}`
    ).join('\n');
    
    return {
      success: true,
      message: `⏰ Pending Reminders (${pendingReminders.length}):\n\n${remindersList}`
    };
  }
  
  // Not a command
  return null;
}

module.exports = {
  parseCommand
};

