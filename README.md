# Dev GPT 🤖

A simple, friendly AI chatbot built with Node.js and HTML/JavaScript. Dev GPT is designed to help with programming questions and general inquiries using free AI APIs.

## Features

- 🤖 Friendly AI assistant for programming and general questions
- 💬 Clean, modern chat interface
- 🔄 Conversation history and context awareness
- 🎨 Beautiful gradient UI design
- 📱 Responsive design for mobile and desktop
- 🚀 Easy to run locally

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Optional: Set up Hugging Face API Token (recommended)**
   
   For better performance and reliability, you can get a free API token from Hugging Face:
   
   - Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - Create a free account if you don't have one
   - Generate a new token
   - Create a `.env` file in the project root:
     ```
     HUGGINGFACE_API_TOKEN=your_token_here
     PORT=3000
     ```
   
   **Note:** The app will work without a token, but responses may be slower or less reliable.

## Running the Application

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Start chatting!**
   Type your questions in the input box and press Enter or click Send.

## Project Structure

```
Dev GPT/
├── server.js          # Express.js backend server
├── package.json       # Node.js dependencies
├── README.md          # This file
└── public/            # Frontend files
    ├── index.html     # Main HTML page
    ├── style.css      # Styling
    └── script.js      # Frontend JavaScript
```

## How It Works

1. **Backend (Node.js/Express):**
   - Receives chat messages from the frontend
   - Sends requests to Hugging Face Inference API
   - Maintains conversation history for context
   - Returns AI-generated responses

2. **Frontend (HTML/CSS/JavaScript):**
   - Provides a clean chat interface
   - Sends user messages to the backend
   - Displays AI responses in real-time
   - Handles typing indicators and status updates

## API Configuration

The app uses Hugging Face's Inference API with the `microsoft/DialoGPT-medium` model. This is a free, open-source conversational AI model.

If you want to use a different model, you can modify the `HF_API_URL` in `server.js`.

## Developer Mode 🔐

Dev GPT includes a private developer-only command system for authorized developers.

### Setup

1. **Set Developer Secret Key:**
   Add to your `.env` file:
   ```
   DEV_SECRET_KEY=your_secure_secret_key_here
   ```
   If not set, defaults to `dev_gpt_2024_secure_key` (change this in production!)

### Usage

Developer commands follow this format:
```
/dev SECRET_KEY command
```

### Available Commands

- `deploy` - Deploy the application
- `restart` - Restart the server (simulation)
- `logs` - Show recent developer command logs
- `updateMemory` - Update AI memory/knowledge base
- `clearDatabase` - Clear all conversation history
- `help` - Show available commands

### Examples

```
/dev your_secret_key deploy
/dev your_secret_key logs
/dev your_secret_key help
```

### Security

- Invalid secret keys return: "🔒 Unauthorized developer command."
- All developer commands are logged for auditing
- Access developer logs via API: `GET /api/dev/logs?key=SECRET_KEY`

### Adding New Commands

To add new developer commands, edit the `developerCommands` object in `server.js`:

```javascript
const developerCommands = {
  yourCommand: async () => {
    return {
      success: true,
      message: 'Your command response'
    };
  }
};
```

## Deployment to Render

### Prerequisites
- A GitHub account
- A Render account (sign up at [render.com](https://render.com))
- Your Hugging Face API token

### Steps to Deploy

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Create a new Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect the settings from `render.yaml`

3. **Configure Environment Variables:**
   - In the Render dashboard, go to your service's "Environment" tab
   - Add the following environment variable:
     - `HUGGINGFACE_API_TOKEN`: Your Hugging Face API token
   - Render will automatically set `PORT` and `NODE_ENV`

4. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy your application
   - Your app will be available at `https://your-app-name.onrender.com`

### Manual Configuration (if not using render.yaml)

If you prefer to configure manually:
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment:** `Node`
- **Health Check Path:** `/api/health`

## Troubleshooting

- **Slow responses:** The Hugging Face API may take a moment to load the model on first use. Subsequent requests should be faster.
- **API errors:** If you see errors, try adding a Hugging Face API token to your `.env` file (local) or environment variables (Render).
- **Port already in use:** Change the `PORT` in your `.env` file or modify `server.js`.
- **Render deployment issues:** Make sure all environment variables are set correctly in the Render dashboard.

## License

MIT

## Contributing

Feel free to fork, modify, and use this project for your own purposes!

---

Made with ❤️ for developers who want a simple, local AI chatbot.

