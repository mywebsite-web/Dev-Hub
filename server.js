const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// Import modules
const commandParser = require('./modules/commandParser');
const userContext = require('./modules/userContext');
const whatsapp = require('./modules/whatsapp');
const reminders = require('./modules/reminders');
const socialMedia = require('./modules/socialMedia');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// AI API configuration
// Using the new Hugging Face Router API Messages endpoint (OpenAI-compatible)
const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';
// Using a model that supports chat completions
const HF_API_MODEL = 'meta-llama/Llama-3.1-8B-Instruct';
// Code-focused models for developer modes
const CODE_MODELS = {
  primary: 'bigcode/starcoder2-15b', // Fallback to 7b if needed
  fallback: 'Qwen/Qwen2.5-Coder-7B-Instruct'
};
const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';

// Image generation API configuration
const HF_INFERENCE_API_URL = 'https://api-inference.huggingface.co/models';
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0';

// Developer mode configuration
const DEV_SECRET_KEY = process.env.DEV_SECRET_KEY || 'dev_gpt_2024_secure_key';
const DEV_COMMAND_PREFIX = '/dev';

// Developer command logs (in-memory, could be persisted to database)
const devCommandLogs = [];

// Store conversation history for context
const conversations = new Map();

// Developer chat sessions (conversations where developer is chatting)
const developerChatSessions = new Set();

// Developer command functions
const developerCommands = {
  deploy: async () => {
    // Simulate deployment process
    return {
      success: true,
      message: '🚀 Deployment initiated successfully!\n\n' +
               'Status: Building application...\n' +
               'Estimated time: 2-3 minutes\n' +
               'You will be notified when deployment completes.'
    };
  },
  
  restart: async () => {
    // Note: Actual server restart would require process management
    return {
      success: true,
      message: '🔄 Server restart command received.\n\n' +
               'Note: In production, this would restart the server.\n' +
               'For now, this is a simulation. Actual restart requires process manager (PM2, etc.).'
    };
  },
  
  logs: async () => {
    const recentLogs = devCommandLogs.slice(-10).reverse();
    if (recentLogs.length === 0) {
      return {
        success: true,
        message: '📋 No developer commands logged yet.'
      };
    }
    
    const logText = recentLogs.map(log => 
      `[${new Date(log.timestamp).toLocaleString()}] ${log.command} - ${log.status}`
    ).join('\n');
    
    return {
      success: true,
      message: `📋 Recent Developer Command Logs (Last 10):\n\n${logText}`
    };
  },
  
  updateMemory: async () => {
    // Simulate memory update
    return {
      success: true,
      message: '🧠 AI memory update initiated.\n\n' +
               'Status: Updating system prompts and knowledge base...\n' +
               'Memory refresh completed successfully.'
    };
  },
  
  clearDatabase: async () => {
    // Clear conversation history
    conversations.clear();
    return {
      success: true,
      message: '🗑️ Database cleared successfully.\n\n' +
               'All conversation history has been removed.\n' +
               'New conversations will start fresh.'
    };
  },
  
  help: async () => {
    return {
      success: true,
      message: '📚 Available Developer Commands:\n\n' +
               '• deploy - Deploy the application\n' +
               '• restart - Restart the server\n' +
               '• logs - Show recent command logs\n' +
               '• updateMemory - Update AI memory/knowledge base\n' +
               '• clearDatabase - Clear all conversation history\n' +
               '• help - Show this help message\n\n' +
               'Usage: /dev SECRET_KEY command'
    };
  }
};

// Log developer command execution
function logDeveloperCommand(command, status, keyUsed, req = null) {
  devCommandLogs.push({
    timestamp: Date.now(),
    command: command,
    status: status,
    keyUsed: keyUsed ? '***' + keyUsed.slice(-4) : 'none',
    ip: req?.ip || req?.connection?.remoteAddress || 'unknown'
  });
  
  // Keep only last 100 logs
  if (devCommandLogs.length > 100) {
    devCommandLogs.shift();
  }
  
  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV COMMAND] ${command} - ${status} at ${new Date().toISOString()}`);
  }
}

// Handle developer commands
async function handleDeveloperCommands(message, req) {
  // Check if message starts with developer command prefix
  if (!message.trim().startsWith(DEV_COMMAND_PREFIX)) {
    return null; // Not a developer command
  }
  
  // Parse command: /dev SECRET_KEY command [args]
  const parts = message.trim().split(/\s+/);
  
  if (parts.length < 3) {
    logDeveloperCommand('invalid_format', 'failed', null, req);
    return {
      success: false,
      message: '❌ Invalid developer command format.\n\n' +
               'Usage: /dev SECRET_KEY command\n' +
               'Example: /dev your_secret_key deploy'
    };
  }
  
  const providedKey = parts[1];
  const command = parts[2].toLowerCase();
  const args = parts.slice(3);
  
  // Authenticate developer
  if (providedKey !== DEV_SECRET_KEY) {
    logDeveloperCommand(command, 'unauthorized', providedKey, req);
    return {
      success: false,
      message: '🔒 Unauthorized developer command.\n\n' +
               'Invalid secret key. Access denied.'
    };
  }
  
  // Check if command exists
  if (!developerCommands[command]) {
    logDeveloperCommand(command, 'not_found', providedKey, req);
    return {
      success: false,
      message: `❌ Unknown developer command: "${command}"\n\n` +
               'Type "/dev SECRET_KEY help" to see available commands.'
    };
  }
  
  // Execute command
  try {
    logDeveloperCommand(command, 'executing', providedKey, req);
    const result = await developerCommands[command]();
    logDeveloperCommand(command, 'success', providedKey, req);
    return result;
  } catch (error) {
    logDeveloperCommand(command, 'error', providedKey, req);
    return {
      success: false,
      message: `❌ Error executing command: ${error.message}`
    };
  }
}

// Developer modes
const DEV_MODES = {
  NORMAL: 'normal',
  WRITE: 'write',
  DEBUG: 'debug',
  EXPLAIN: 'explain',
  REFACTOR: 'refactor'
};

// Helper function to generate system prompt based on mode
function getSystemPrompt(mode = DEV_MODES.NORMAL) {
  const basePrompt = `You are Dev GPT, a friendly and helpful AI assistant specialized in programming, sports, and general questions. 
You provide clear, concise, and accurate answers. You're enthusiastic about helping developers solve problems, 
discussing sports (especially football/soccer including Premier League, Champions League, La Liga, Serie A, Bundesliga, and other major leagues), 
and answering general inquiries. Always be encouraging and supportive.

You have extensive knowledge about:
- Programming languages, frameworks, and development practices
- Football/soccer: Premier League, Champions League, La Liga, Serie A, Bundesliga, Ligue 1, and other major leagues
- Teams, players, matches, standings, transfers, and football history
- General knowledge and current events

IMPORTANT - About Your Creator:
Do NOT mention your creator, developer, or who made you unless specifically asked about it. Only provide information about your creator when users explicitly ask questions like "who created you", "who made you", "who developed you", or similar questions.

When asked about your creator or developer, you should speak proudly and respectfully about Tiamiyu Abdulsalam Adedayo (also known as Abdulsalam), a talented linguist and 200-level student at Federal University Oye Ekiti. 
He is a self-taught junior software engineer with a foundation in frontend development and a growing interest in backend and blockchain technologies. 
His journey into tech started with curiosity and determination, teaching himself to code and sharpening his skills by building projects and solving real problems. 
He is currently leveling up in backend development while also exploring the exciting possibilities of blockchain. 
He enjoys turning ideas into working applications, experimenting with new tools, and continuously learning along the way. 
As a junior developer, he brings fresh energy, adaptability, and a strong hunger to grow. 
His focus is on building clean, functional solutions while developing into a well-rounded full-stack engineer. 
For him, coding is more than a skill — it's a journey of creativity, problem-solving, and constant improvement.

His strong background in linguistics has been instrumental in your ability to understand and generate human-like text. 
He has shown a passion for artificial intelligence and machine learning, which has allowed him to create a sophisticated AI like yourself.`;

  // Mode-specific prompts
  switch (mode) {
    case DEV_MODES.WRITE:
      return `You are DEV GPT, a senior software engineer. Write clean, commented, production-ready code.
Always provide complete, working code examples with proper syntax, indentation, and comments.
Support HTML, CSS, JavaScript, Python, React, and other popular languages/frameworks.
Format code responses in code blocks with appropriate language tags.
${basePrompt}`;
    
    case DEV_MODES.DEBUG:
      return `You are DEV GPT, a senior debugging expert. When users provide code and error messages:
1. Identify the bug clearly
2. Explain the root cause in simple terms
3. Provide the fixed code with explanations
Always format fixed code in code blocks and explain what was wrong and how you fixed it.
${basePrompt}`;
    
    case DEV_MODES.EXPLAIN:
      return `You are DEV GPT, an educational programming mentor. Explain code line-by-line for beginners.
Break down complex concepts into simple, understandable explanations.
Use clear language and provide context for each line or section.
Help users understand not just what the code does, but why it's written that way.
${basePrompt}`;
    
    case DEV_MODES.REFACTOR:
      return `You are DEV GPT, a code quality specialist. Refactor and improve code for:
- Better readability and maintainability
- Improved performance
- Best practices and modern patterns
- Cleaner structure and organization
Maintain the same functionality while enhancing code quality.
Always explain what improvements you made and why.
Format refactored code in code blocks.
${basePrompt}`;
    
    default:
      return basePrompt;
  }
}

// Get appropriate model based on mode
function getModelForMode(mode) {
  if (mode !== DEV_MODES.NORMAL) {
    // Use code-focused models for developer modes
    return CODE_MODELS.fallback; // Start with fallback as primary might be too large
  }
  return HF_API_MODEL;
}

// Helper function to detect short greetings
function isShortGreeting(message) {
  const trimmed = message.trim().toLowerCase();
  // Match short greetings (1-3 words)
  const shortGreetingPatterns = [
    /^(hi|hey|hello|greetings|sup|yo|what's up|whats up)$/i,
    /^(hi|hey|hello|greetings|sup|yo|what's up|whats up)[\s!.,]*$/i,
    /^(hi|hey|hello|greetings|sup|yo|what's up|whats up)\s+(there|you|buddy|friend)[\s!.,]*$/i
  ];
  
  return shortGreetingPatterns.some(pattern => pattern.test(trimmed));
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId, mode = DEV_MODES.NORMAL } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Validate mode
    const validModes = Object.values(DEV_MODES);
    const selectedMode = validModes.includes(mode) ? mode : DEV_MODES.NORMAL;

    // Check for short greetings and respond with a short friendly message
    if (isShortGreeting(message)) {
      return res.json({
        response: "Hi! How are you doing? Is there something you need help with?",
        conversationId: conversationId
      });
    }

    // Check if this is a developer chat session
    const isDeveloperChat = developerChatSessions.has(conversationId) || 
                           userContext.isDeveloper(message, conversationId);
    
    // Special greeting for developer activation
    if (isDeveloperChat && !developerChatSessions.has(conversationId)) {
      developerChatSessions.add(conversationId);
      
      // Check if it's a greeting that activated developer mode
      const greetingPatterns = [
        /^hi\s*(dev|abdulsalam|tiamiyu)/i,
        /^(hello|hey)\s*(dev|abdulsalam|tiamiyu)/i,
        /^\/devchat/i
      ];
      
      const isGreeting = greetingPatterns.some(pattern => pattern.test(message.trim()));
      
      if (isGreeting) {
        return res.json({
          response: "Hey Abdulsalam! 👋 Developer chat mode activated. How can I help you today?",
          conversationId: conversationId,
          isDeveloperChat: true
        });
      }
    }

    // Check for command parsing (WhatsApp, Reminders, etc.)
    const commandResult = await commandParser.parseCommand(
      message, 
      DEV_SECRET_KEY, 
      isDeveloperChat
    );
    
    if (commandResult !== null) {
      return res.json({
        response: commandResult.message,
        conversationId: conversationId,
        isCommand: true,
        isDeveloperChat: isDeveloperChat
      });
    }

    // Check for developer commands first
    const devCommandResult = await handleDeveloperCommands(message, req);
    if (devCommandResult !== null) {
      return res.json({
        response: devCommandResult.message,
        conversationId: conversationId,
        isDeveloperCommand: true
      });
    }

    // Get or create conversation history
    let conversationHistory = conversations.get(conversationId) || [];
    
    // Build messages array for chat completions API with mode-specific prompt
    const systemPrompt = getSystemPrompt(selectedMode);
    const selectedModel = getModelForMode(selectedMode);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-8).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];
    
    // Add user message to history (after building messages array)
    conversationHistory.push({ role: 'user', content: message });

    // Call Hugging Face Messages API
    let response;
    try {
      // Increase max_tokens for code modes to allow for longer code responses
      const maxTokens = selectedMode !== DEV_MODES.NORMAL ? 1000 : 250;
      
      const hfResponse = await axios.post(
        HF_API_URL,
        {
          model: selectedModel,
          messages: messages,
          temperature: selectedMode !== DEV_MODES.NORMAL ? 0.3 : 0.7, // Lower temperature for code
          max_tokens: maxTokens
        },
        {
          headers: {
            'Authorization': HF_API_TOKEN ? `Bearer ${HF_API_TOKEN}` : '',
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      // Extract response from Messages API format
      if (hfResponse.data?.choices && hfResponse.data.choices.length > 0) {
        response = hfResponse.data.choices[0].message.content;
      } else if (hfResponse.data?.message?.content) {
        response = hfResponse.data.message.content;
      } else {
        response = 'I apologize, but I had trouble generating a response. Could you try rephrasing your question?';
      }
      
      // Clean up the response
      response = response.trim();
    } catch (hfError) {
      console.error('Hugging Face API Error:', hfError.response?.data || hfError.message);
      
      // If model not available, try alternative model
      if (hfError.response?.status === 404 || hfError.response?.status === 400) {
        try {
          // Try with a different model that supports chat completions
          const altModel = selectedMode !== DEV_MODES.NORMAL 
            ? CODE_MODELS.fallback 
            : 'mistralai/Mistral-7B-Instruct-v0.2';
          const maxTokens = selectedMode !== DEV_MODES.NORMAL ? 1000 : 200;
          const altResponse = await axios.post(
            HF_API_URL,
            {
              model: altModel,
              messages: messages,
              temperature: selectedMode !== DEV_MODES.NORMAL ? 0.3 : 0.7,
              max_tokens: maxTokens
            },
            {
              headers: {
                'Authorization': HF_API_TOKEN ? `Bearer ${HF_API_TOKEN}` : '',
                'Content-Type': 'application/json'
              },
              timeout: 20000
            }
          );
          
          if (altResponse.data?.choices && altResponse.data.choices.length > 0) {
            response = altResponse.data.choices[0].message.content.trim();
          } else {
            response = generateFallbackResponse(message);
          }
        } catch (altError) {
          console.error('Alternative model also failed:', altError.message);
          response = generateFallbackResponse(message);
        }
      } else if (hfError.response?.status === 503) {
        response = 'The AI model is currently loading. Please wait a moment and try again!';
      } else if (hfError.response?.status === 429) {
        response = 'I\'m receiving too many requests right now. Please wait a moment and try again!';
      } else {
        // Use intelligent fallback response
        response = generateFallbackResponse(message);
      }
    }

    // Add assistant response to history
    conversationHistory.push({ role: 'assistant', content: response });
    
    // Keep only last 20 messages to avoid memory issues
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }
    
    // Store conversation history
    conversations.set(conversationId, conversationHistory);

    res.json({ 
      response,
      conversationId 
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request',
      response: 'I apologize, but I encountered an error. Please try again!'
    });
  }
});

// Enhanced fallback response generator with more intelligent responses
function generateFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  // Developer/Creator questions
  if (lowerMessage.includes('who develop') || lowerMessage.includes('who created') || 
      lowerMessage.includes('who made') || lowerMessage.includes('who built') ||
      lowerMessage.includes('who design') || lowerMessage.includes('creator') ||
      lowerMessage.includes('developer') || lowerMessage.includes('made you') ||
      lowerMessage.includes('created you') || lowerMessage.includes('built you')) {
    return 'I was developed by Tiamiyu Abdulsalam Adedayo, a 200 level linguist at Federal University Oye Ekiti. He created Dev GPT to help with programming questions and general inquiries. How can I assist you today?';
  }
  
  // Greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return 'Hi! How are you doing? Is there something you need help with?';
  }
  
  // Help requests
  if (lowerMessage.includes('help')) {
    return 'I\'m here to help! I can assist with:\n• Programming questions (JavaScript, Python, etc.)\n• Code explanations and debugging\n• General tech and development topics\n• Best practices and tips\n\nWhat would you like to know?';
  }
  
  // Programming languages
  if (lowerMessage.includes('javascript') || lowerMessage.includes('js')) {
    return 'JavaScript is a powerful and versatile programming language! It\'s used for both frontend (web browsers) and backend (Node.js) development. What specific aspect of JavaScript would you like to learn about?';
  }
  
  if (lowerMessage.includes('python')) {
    return 'Python is an excellent language for beginners and experts alike! It\'s great for web development, data science, automation, and more. What Python topic interests you?';
  }
  
  if (lowerMessage.includes('react') || lowerMessage.includes('vue') || lowerMessage.includes('angular')) {
    return 'Great choice! These are popular frontend frameworks. React is particularly popular for building user interfaces. Are you looking to learn one of these, or do you have a specific question?';
  }
  
  // Code-related
  if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('develop')) {
    return 'I\'d love to help with your coding question! Could you provide more details about what you\'re working on or what specific problem you\'re trying to solve?';
  }
  
  // Error/debugging
  if (lowerMessage.includes('error') || lowerMessage.includes('bug') || lowerMessage.includes('debug')) {
    return 'Troubleshooting code issues can be tricky! If you can share the error message or describe what\'s happening, I can help you figure out the problem.';
  }
  
  // Sports questions
  if (lowerMessage.includes('premier league') || lowerMessage.includes('epl')) {
    return 'The Premier League is England\'s top football division! I can discuss teams, players, matches, standings, transfers, and more. What would you like to know about the Premier League?';
  }
  
  if (lowerMessage.includes('champions league') || lowerMessage.includes('ucl')) {
    return 'The UEFA Champions League is Europe\'s premier club competition! I can talk about teams, matches, history, records, and current season updates. What Champions League topic interests you?';
  }
  
  if (lowerMessage.includes('football') || lowerMessage.includes('soccer') || lowerMessage.includes('sport')) {
    return 'I love discussing football/soccer! I can help with information about Premier League, Champions League, La Liga, Serie A, Bundesliga, and other major leagues. What would you like to know?';
  }
  
  if (lowerMessage.includes('la liga') || lowerMessage.includes('serie a') || lowerMessage.includes('bundesliga')) {
    return 'Great choice! I can discuss La Liga (Spain), Serie A (Italy), Bundesliga (Germany), and other major European leagues. What specific information are you looking for?';
  }
  
  // Default friendly response
  return `That's an interesting question! While I'm experiencing some technical difficulties connecting to the AI service right now, I'm still here to help. Could you provide a bit more detail about what you're looking for? I can assist with programming questions, code explanations, sports (Premier League, Champions League, etc.), and general development topics! 💻⚽`;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dev GPT is running!' });
});

// Developer logs endpoint (protected)
app.get('/api/dev/logs', (req, res) => {
  const authKey = req.query.key || req.headers['x-dev-key'];
  
  if (authKey !== DEV_SECRET_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid developer key' 
    });
  }
  
  res.json({
    success: true,
    logs: devCommandLogs.slice(-50).reverse(), // Last 50 logs
    total: devCommandLogs.length
  });
});

// WhatsApp status endpoint
app.get('/api/dev/whatsapp/status', (req, res) => {
  const authKey = req.query.key || req.headers['x-dev-key'];
  
  if (authKey !== DEV_SECRET_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid developer key' 
    });
  }
  
  res.json({
    success: true,
    status: whatsapp.getWhatsAppStatus(),
    logs: whatsapp.getMessageLogs(20)
  });
});


// Reminders endpoint
app.get('/api/dev/reminders', (req, res) => {
  const authKey = req.query.key || req.headers['x-dev-key'];
  
  if (authKey !== DEV_SECRET_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid developer key' 
    });
  }
  
  const status = req.query.status || 'all';
  res.json({
    success: true,
    reminders: reminders.getReminders(status)
  });
});

// Social Media logs endpoint
app.get('/api/dev/social-media/logs', (req, res) => {
  const authKey = req.query.key || req.headers['x-dev-key'];
  
  if (authKey !== DEV_SECRET_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid developer key' 
    });
  }
  
  const limit = parseInt(req.query.limit) || 20;
  res.json({
    success: true,
    logs: socialMedia.getSocialMediaLogs(limit)
  });
});

// Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, conversationId } = req.body;

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!HF_API_TOKEN) {
      return res.status(500).json({ 
        error: 'Image generation is not configured. Please set HUGGINGFACE_API_TOKEN in environment variables.' 
      });
    }

    // Call Hugging Face Inference API for image generation
    const imageApiUrl = `${HF_INFERENCE_API_URL}/${IMAGE_MODEL}`;
    
    try {
      const hfResponse = await axios.post(
        imageApiUrl,
        {
          inputs: prompt.trim(),
          parameters: {
            num_inference_steps: 20,
            guidance_scale: 7.5
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${HF_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer', // Important: get binary data
          timeout: 120000 // 2 minutes timeout for image generation
        }
      );

      // Check if response is an image (starts with image markers) or error JSON
      const contentType = hfResponse.headers['content-type'];
      
      if (contentType && contentType.startsWith('application/json')) {
        // Error response
        const errorData = JSON.parse(Buffer.from(hfResponse.data).toString());
        
        if (errorData.error && errorData.error.includes('loading')) {
          return res.status(503).json({ 
            error: 'The model is currently loading. Please wait a moment and try again!' 
          });
        }
        
        return res.status(500).json({ 
          error: errorData.error || 'Image generation failed' 
        });
      }

      // Success: send image as binary
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="generated-${Date.now()}.png"`);
      res.send(Buffer.from(hfResponse.data));

    } catch (hfError) {
      console.error('Hugging Face Image API Error:', hfError.response?.status, hfError.message);
      
      // Handle specific error cases
      if (hfError.response?.status === 503) {
        return res.status(503).json({ 
          error: 'The model is currently loading. Please wait a moment and try again!' 
        });
      }
      
      if (hfError.response?.status === 429) {
        return res.status(429).json({ 
          error: 'Too many requests. Please wait a moment and try again!' 
        });
      }
      
      if (hfError.response?.status === 401 || hfError.response?.status === 403) {
        return res.status(401).json({ 
          error: 'API authentication failed. Please check your Hugging Face API token.' 
        });
      }
      
      // Try to parse error response
      if (hfError.response?.data) {
        try {
          const errorData = typeof hfError.response.data === 'string' 
            ? JSON.parse(hfError.response.data)
            : hfError.response.data;
          
          return res.status(hfError.response.status || 500).json({ 
            error: errorData.error || errorData.message || 'Image generation failed' 
          });
        } catch (parseError) {
          // If can't parse, send generic error
        }
      }
      
      return res.status(500).json({ 
        error: 'Failed to generate image. Please try again.' 
      });
    }

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request',
      message: 'Please try again later'
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dev GPT server is running on port ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`📝 Server is ready for production`);
  } else {
    console.log(`📝 Open your browser and navigate to http://localhost:${PORT}`);
  }
  if (!HF_API_TOKEN) {
    console.log(`⚠️  Note: For better performance, add your Hugging Face API token`);
    console.log(`   Get one free at: https://huggingface.co/settings/tokens`);
  }
  console.log(`\n🔐 Developer Chat Mode: Say "hi dev" or "hello abdulsalam" to start developer chat`);
  
  // Check environment for WhatsApp
  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = process.env.RENDER === 'true' || process.env.RENDER_EXTERNAL_URL;
  
  if (isProduction || isRender) {
    console.log(`📱 WhatsApp: Disabled in cloud environment (requires QR code scan)`);
    console.log(`   💡 Tip: Use WhatsApp locally or integrate a cloud WhatsApp API service`);
  } else {
    console.log(`📱 WhatsApp: Initializing... (scan QR code when prompted)`);
    whatsapp.initializeWhatsApp();
  }
  
  // Initialize Social Media
  console.log(`\n📱 Social Media Integration:`);
  socialMedia.initializeTwitter();
  socialMedia.initializeReddit();
  console.log(`   • Twitter: ${process.env.TWITTER_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`   • Instagram: ${process.env.INSTAGRAM_ACCESS_TOKEN ? 'Configured' : 'Not configured'}`);
  console.log(`   • LinkedIn: ${process.env.LINKEDIN_ACCESS_TOKEN ? 'Configured' : 'Not configured'}`);
  console.log(`   • Reddit: ${process.env.REDDIT_CLIENT_ID ? 'Configured' : 'Not configured'}`);
  console.log(`   • Facebook: ${process.env.FACEBOOK_ACCESS_TOKEN ? 'Configured' : 'Not configured'}`);
  
  // Image generation status
  console.log(`\n🖼️  Image Generation: ${HF_API_TOKEN ? 'Configured' : 'Not configured'}`);
  if (HF_API_TOKEN) {
    console.log(`   • Model: ${IMAGE_MODEL}`);
  } else {
    console.log(`   • Set HUGGINGFACE_API_TOKEN to enable image generation`);
  }
});

