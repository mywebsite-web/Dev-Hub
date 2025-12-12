# How to Use WhatsApp Locally with Dev-GPT AI

This guide shows you how to use WhatsApp messaging through your Dev-GPT AI chatbot when running locally.

## Step 1: Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

This installs:
- `whatsapp-web.js` - WhatsApp Web client
- `qrcode-terminal` - QR code display in terminal
- Other required packages

## Step 2: Start the Server Locally

Run the server on your computer:

```bash
npm start
```

You should see:
```
🚀 Dev GPT server is running on port 3000
📱 WhatsApp: Initializing... (scan QR code when prompted)
```

## Step 3: Scan QR Code

1. **Wait for QR code** - After a few seconds, you'll see a QR code in your terminal/console
2. **Open WhatsApp** on your phone
3. **Go to Settings** → **Linked Devices** → **Link a Device**
4. **Scan the QR code** from your terminal
5. **Wait for confirmation** - You should see: `✅ WhatsApp client is ready!`

## Step 4: Activate Developer Chat Mode

1. Open your browser: `http://localhost:3000`
2. In the chat, say: **"hi dev"** or **"hello abdulsalam"**
3. You'll see: "Developer chat mode activated" (or similar)

## Step 5: Send WhatsApp Messages via AI

Now you can send WhatsApp messages through the AI chat interface!

### Format:
```
/whatsapp +2349074350932 Your message here
```

### Examples:

**Send a simple message:**
```
/whatsapp +2349074350932 Hello! This is a test message from Dev-GPT AI.
```

**Send to a saved contact:**
First add the contact:
```
/addcontact John +2349074350932
```

Then use the contact name:
```
/whatsapp John Hello John!
```

## Complete Example Workflow

1. **Start server:**
   ```bash
   npm start
   ```

2. **Scan QR code** when it appears

3. **Open browser:** `http://localhost:3000`

4. **Activate developer mode:**
   ```
   hi dev
   ```

5. **Send WhatsApp message:**
   ```
   /whatsapp +2349074350932 Hello from Dev-GPT AI! This message was sent through the AI chatbot.
   ```

6. **Check your phone** - You should receive the message!

## Tips & Troubleshooting

### ✅ Number Format
- **Correct:** `+2349074350932` (with country code, no spaces)
- **Wrong:** `09074350932` (missing country code)
- **Wrong:** `+234 907 435 0932` (spaces not allowed)

### ✅ Keep WhatsApp Connected
- Keep your phone's WhatsApp connected to the internet
- Don't log out of WhatsApp Web on your phone
- The connection persists between server restarts (uses LocalAuth)

### ✅ Check Connection Status
If messages aren't sending:
1. Check terminal for: `✅ WhatsApp client is ready!`
2. Verify QR code was scanned successfully
3. Make sure your phone has internet connection
4. Check that the number format is correct

### ✅ Test with Your Own Number
Try sending a message to yourself first:
```
/whatsapp +YOUR_NUMBER Test message to myself
```

## Advanced: Using AI to Send Messages

You can even ask the AI to send messages naturally:

**Example conversation:**
```
You: hi dev
AI: Hello! Developer chat mode activated. How can I help?

You: Send a WhatsApp message to +2349074350932 saying "Hello, this is from Dev-GPT"
AI: [Processes and sends via /whatsapp command]
```

## What Gets Logged

All WhatsApp messages are logged in:
- Console output (for debugging)
- `data/whatsapp_logs.json` (persistent storage)

You can check logs via:
```
/contacts  (if you want to see message history)
```

## Security Notes

- WhatsApp uses your personal WhatsApp account
- Messages are sent from YOUR number
- All messages are logged locally
- QR code authentication is secure (same as WhatsApp Web)

---

**That's it!** You can now send WhatsApp messages through your Dev-GPT AI chatbot when running locally. 🚀📱

