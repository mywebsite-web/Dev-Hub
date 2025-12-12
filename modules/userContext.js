const fs = require('fs');
const path = require('path');

const CONTEXT_FILE = path.join(__dirname, '../data/user_context.json');

let userContext = {
  developer: {
    name: 'Tiamiyu Abdulsalam Adedayo',
    alias: 'Abdulsalam Dev',
    isDeveloper: true
  },
  contacts: [],
  emailAddresses: []
};

// Load user context from file
function loadContext() {
  try {
    if (fs.existsSync(CONTEXT_FILE)) {
      const data = fs.readFileSync(CONTEXT_FILE, 'utf8');
      userContext = JSON.parse(data);
    } else {
      // Create default context file
      saveContext();
    }
  } catch (error) {
    console.error('Error loading user context:', error);
  }
}

// Save user context to file
function saveContext() {
  try {
    const contextDir = path.dirname(CONTEXT_FILE);
    if (!fs.existsSync(contextDir)) {
      fs.mkdirSync(contextDir, { recursive: true });
    }
    fs.writeFileSync(CONTEXT_FILE, JSON.stringify(userContext, null, 2));
  } catch (error) {
    console.error('Error saving user context:', error);
  }
}

// Get user context
function getContext() {
  return userContext;
}

// Add contact
function addContact(name, phoneNumber, email = null) {
  const contact = {
    id: 'contact_' + Date.now(),
    name: name,
    phoneNumber: phoneNumber,
    email: email,
    addedAt: new Date().toISOString()
  };
  
  userContext.contacts.push(contact);
  saveContext();
  
  return contact;
}

// Add email address
function addEmailAddress(name, email) {
  const emailEntry = {
    id: 'email_' + Date.now(),
    name: name,
    email: email,
    addedAt: new Date().toISOString()
  };
  
  userContext.emailAddresses.push(emailEntry);
  saveContext();
  
  return emailEntry;
}

// Find contact by name or number
function findContact(query) {
  const lowerQuery = query.toLowerCase();
  return userContext.contacts.find(contact => 
    contact.name.toLowerCase().includes(lowerQuery) ||
    contact.phoneNumber.includes(query)
  );
}

// Find email by name or address
function findEmail(query) {
  const lowerQuery = query.toLowerCase();
  return userContext.emailAddresses.find(emailEntry => 
    emailEntry.name.toLowerCase().includes(lowerQuery) ||
    emailEntry.email.toLowerCase().includes(lowerQuery)
  );
}

// Check if user is developer
function isDeveloper(userMessage, conversationId) {
  // Simple check - can be enhanced with more sophisticated detection
  // For now, we'll use a special conversation ID or message pattern
  const devPatterns = [
    /^hi\s*(dev|abdulsalam|tiamiyu)/i,
    /^(hello|hey)\s*(dev|abdulsalam|tiamiyu)/i,
    /^\/devchat/i
  ];
  
  return devPatterns.some(pattern => pattern.test(userMessage));
}

// Initialize on module load
loadContext();

module.exports = {
  getContext,
  addContact,
  addEmailAddress,
  findContact,
  findEmail,
  isDeveloper,
  saveContext
};

