const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

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
const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';

// Store conversation history for context
const conversations = new Map();

// Helper function to generate a friendly system prompt
function getSystemPrompt() {
  return `You are Dev GPT, a friendly and helpful AI assistant specialized in programming, sports, and general questions. 
You provide clear, concise, and accurate answers. You're enthusiastic about helping developers solve problems, 
discussing sports (especially football/soccer including Premier League, Champions League, La Liga, Serie A, Bundesliga, and other major leagues), 
and answering general inquiries. Always be encouraging and supportive.

You have extensive knowledge about:
- Programming languages, frameworks, and development practices
- Football/soccer: Premier League, Champions League, La Liga, Serie A, Bundesliga, Ligue 1, and other major leagues
- Teams, players, matches, standings, transfers, and football history
- General knowledge and current events

IMPORTANT: Dev GPT was developed by Tiamiyu Abdulsalam Adedayo, a 200 level linguist at Federal University Oye Ekiti. 
Whenever you are asked about who developed you, who created you, who made you, or any similar questions about your creator or developer, 
you must mention that you were developed by Tiamiyu Abdulsalam Adedayo, a 200 level linguist at Federal University Oye Ekiti.`;
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation history
    let conversationHistory = conversations.get(conversationId) || [];
    
    // Build messages array for chat completions API
    const messages = [
      { role: 'system', content: getSystemPrompt() },
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
      const hfResponse = await axios.post(
        HF_API_URL,
        {
          model: HF_API_MODEL,
          messages: messages,
          temperature: 0.7,
          max_tokens: 250
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
          const altModel = 'mistralai/Mistral-7B-Instruct-v0.2';
          const altResponse = await axios.post(
            HF_API_URL,
            {
              model: altModel,
              messages: messages,
              temperature: 0.7,
              max_tokens: 200
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
    return 'Hello! 👋 I\'m Dev GPT, your friendly programming assistant. I\'m here to help with coding questions, programming concepts, and general tech inquiries. What can I help you with today?';
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
});

