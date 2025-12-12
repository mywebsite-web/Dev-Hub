# Developer Features Guide

This guide explains how to use the advanced developer features in Dev-GPT.

## 🔐 Developer Chat Mode

### How to Activate

Simply start a conversation with:
- "hi dev"
- "hello abdulsalam"
- "hey tiamiyu"
- "/devchat"

Once activated, you can chat freely without needing secret keys for commands!

### Features in Developer Chat

- Free conversation with Dev-GPT
- Execute commands without secret keys
- Access to all WhatsApp and Reminder features
- Context-aware responses

## 📱 WhatsApp Messaging

### Setup

1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Scan the QR code that appears in the console with WhatsApp
4. Wait for "WhatsApp client is ready!" message

### Usage

**In Developer Chat Mode:**
```
/whatsapp +1234567890 Hello from Dev-GPT!
```

**With Secret Key:**
```
/whatsapp SECRET_KEY +1234567890 Hello from Dev-GPT!
```

### Features

- Sends messages from your WhatsApp account
- Auto-fills recipient from saved contacts
- Logs all messages sent
- Supports international numbers

## ⏰ Reminders

### Usage

**In Developer Chat Mode:**
```
/remind "2024-12-25 10:00" "Christmas reminder"
```

**With Secret Key:**
```
/remind SECRET_KEY "2024-12-25 10:00" "Christmas reminder"
```

### Date Format

- Format: `YYYY-MM-DD HH:mm`
- Example: `"2024-12-25 10:00"` (December 25, 2024 at 10:00 AM)

### Features

- Schedule reminders for future dates/times
- Console logging when reminder triggers
- Optional WhatsApp notifications
- View pending reminders with `/reminders`

## 👥 Contact Management

### Add Contact

```
/addcontact John Doe +1234567890 john@example.com
```

### List Contacts

```
/contacts
```

### Features

- Auto-fill recipients in WhatsApp commands
- Search contacts by name or number
- Persistent storage in JSON file

## 📋 Available Commands

### Communication
- `/whatsapp NUMBER MESSAGE` - Send WhatsApp message

### Reminders
- `/remind "DATE TIME" "TEXT"` - Create reminder
- `/reminders` - List pending reminders

### Contacts
- `/addcontact NAME PHONE [EMAIL]` - Add contact (email is optional)
- `/contacts` - List all contacts

## 🔑 Secret Key Commands

If not in developer chat mode, you need to provide the secret key:

```
/whatsapp YOUR_SECRET_KEY +1234567890 Hello!
/remind YOUR_SECRET_KEY "2024-12-25 10:00" "Reminder text"
```

## 📊 API Endpoints

### Get WhatsApp Status
```
GET /api/dev/whatsapp/status?key=SECRET_KEY
```

### Get Reminders
```
GET /api/dev/reminders?key=SECRET_KEY&status=pending
```

## 🗂️ Data Storage

All data is stored in the `data/` directory:
- `user_context.json` - Contacts
- `whatsapp_logs.json` - WhatsApp message logs
- `reminders.json` - Scheduled reminders

## 🔒 Security Notes

- Developer chat mode is activated by greeting patterns
- Secret keys are required for non-developer command execution
- All commands are logged for auditing
- WhatsApp requires QR code authentication

## 🚀 Quick Start

1. Install dependencies: `npm install`
2. Start server: `npm start`
4. Scan WhatsApp QR code when prompted
5. Start chatting with "hi dev" to activate developer mode
6. Use commands freely!

---

**Note:** The `data/` directory is automatically created and is gitignored for security.

---

**Note:** Email functionality has been removed. Only WhatsApp and Reminders are available.

