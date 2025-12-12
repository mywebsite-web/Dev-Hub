const whatsapp = require('./whatsapp');
const reminders = require('./reminders');
const userContext = require('./userContext');
const socialMedia = require('./socialMedia');

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

  // X/Twitter: Post
  if (trimmedMessage.startsWith('/x-post ') || trimmedMessage.startsWith('/twitter-post ')) {
    if (!isDeveloperChat && !devKey) {
      return {
        success: false,
        message: '🔒 Unauthorized. Developer secret key required for social media commands.'
      };
    }
    
    const text = trimmedMessage.substring(trimmedMessage.startsWith('/x-post ') ? 8 : 14).trim();
    if (!text) {
      return {
        success: false,
        message: '❌ Invalid Twitter post format.\n\nUsage: /x-post "TEXT"\nExample: /x-post "Hello from Dev-GPT!"'
      };
    }
    
    // Remove quotes if present
    const cleanText = text.replace(/^"|"$/g, '');
    return await socialMedia.postToTwitter(cleanText, devKey);
  }

  // X/Twitter: Search
  if (trimmedMessage.startsWith('/x-search ') || trimmedMessage.startsWith('/twitter-search ')) {
    if (!isDeveloperChat && !devKey) {
      return {
        success: false,
        message: '🔒 Unauthorized. Developer secret key required for social media commands.'
      };
    }
    
    const query = trimmedMessage.substring(trimmedMessage.startsWith('/x-search ') ? 10 : 16).trim();
    if (!query) {
      return {
        success: false,
        message: '❌ Invalid Twitter search format.\n\nUsage: /x-search "QUERY"\nExample: /x-search "Dev-GPT"'
      };
    }
    
    const cleanQuery = query.replace(/^"|"$/g, '');
    return await socialMedia.searchTwitter(cleanQuery, devKey);
  }

  // Instagram: Post
  if (trimmedMessage.startsWith('/instagram-post ')) {
    if (!isDeveloperChat && !devKey) {
      return {
        success: false,
        message: '🔒 Unauthorized. Developer secret key required for social media commands.'
      };
    }
    
    const parts = trimmedMessage.substring(16).trim().split(/\s+/);
    if (parts.length < 1) {
      return {
        success: false,
        message: '❌ Invalid Instagram post format.\n\nUsage: /instagram-post "TEXT" [IMAGE_URL]\nExample: /instagram-post "Hello!" https://example.com/image.jpg'
      };
    }
    
    const text = parts[0].replace(/^"|"$/g, '');
    const imagePath = parts[1] || null;
    return await socialMedia.postToInstagram(text, imagePath, devKey);
  }

  // LinkedIn: Post
  if (trimmedMessage.startsWith('/linkedin-post ')) {
    if (!isDeveloperChat && !devKey) {
      return {
        success: false,
        message: '🔒 Unauthorized. Developer secret key required for social media commands.'
      };
    }
    
    const text = trimmedMessage.substring(15).trim();
    if (!text) {
      return {
        success: false,
        message: '❌ Invalid LinkedIn post format.\n\nUsage: /linkedin-post "TEXT"\nExample: /linkedin-post "Hello from Dev-GPT!"'
      };
    }
    
    const cleanText = text.replace(/^"|"$/g, '');
    return await socialMedia.postToLinkedIn(cleanText, devKey);
  }

  // Reddit: Comment
  if (trimmedMessage.startsWith('/reddit-comment ')) {
    if (!isDeveloperChat && !devKey) {
      return {
        success: false,
        message: '🔒 Unauthorized. Developer secret key required for social media commands.'
      };
    }
    
    const parts = trimmedMessage.substring(16).trim().split(/\s+/);
    if (parts.length < 2) {
      return {
        success: false,
        message: '❌ Invalid Reddit comment format.\n\nUsage: /reddit-comment "TEXT" SUBREDDIT\nExample: /reddit-comment "Great post!" programming'
      };
    }
    
    const text = parts[0].replace(/^"|"$/g, '');
    const subreddit = parts[1];
    return await socialMedia.commentOnReddit(subreddit, text, devKey);
  }

  // Reddit: Post
  if (trimmedMessage.startsWith('/reddit-post ')) {
    if (!isDeveloperChat && !devKey) {
      return {
        success: false,
        message: '🔒 Unauthorized. Developer secret key required for social media commands.'
      };
    }
    
    const content = trimmedMessage.substring(13).trim();
    const textMatch = content.match(/"([^"]+)"/g);
    
    if (!textMatch || textMatch.length < 2) {
      return {
        success: false,
        message: '❌ Invalid Reddit post format.\n\nUsage: /reddit-post "TITLE" "TEXT" SUBREDDIT\nExample: /reddit-post "My Post" "Content here" programming'
      };
    }
    
    const title = textMatch[0].replace(/^"|"$/g, '');
    const text = textMatch[1].replace(/^"|"$/g, '');
    const subreddit = content.split('"').pop().trim();
    
    return await socialMedia.postToReddit(subreddit, title, text, devKey);
  }

  // Facebook: Post
  if (trimmedMessage.startsWith('/facebook-post ') || trimmedMessage.startsWith('/fb-post ')) {
    if (!isDeveloperChat && !devKey) {
      return {
        success: false,
        message: '🔒 Unauthorized. Developer secret key required for social media commands.'
      };
    }
    
    const text = trimmedMessage.substring(trimmedMessage.startsWith('/facebook-post ') ? 15 : 9).trim();
    if (!text) {
      return {
        success: false,
        message: '❌ Invalid Facebook post format.\n\nUsage: /facebook-post "TEXT"\nExample: /facebook-post "Hello from Dev-GPT!"'
      };
    }
    
    const cleanText = text.replace(/^"|"$/g, '');
    return await socialMedia.postToFacebook(cleanText, devKey);
  }
  
  // Not a command
  return null;
}

module.exports = {
  parseCommand
};

