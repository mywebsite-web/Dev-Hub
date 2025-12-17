// Storage keys
const CHATS_STORAGE_KEY = 'devGPT_chats';
const CURRENT_CHAT_KEY = 'devGPT_currentChatId';

// Current chat state
let currentChatId = null;
let chats = {}; // { chatId: { id, title, messages, createdAt, updatedAt } }

// DOM elements
const chatDisplay = document.getElementById('chatDisplay');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const status = document.getElementById('status');
const clearChatButton = document.getElementById('clearChatButton');
const newChatButton = document.getElementById('newChatButton');
const chatList = document.getElementById('chatList');
const showSidebarButton = document.getElementById('showSidebarButton');
const closeSidebarButton = document.getElementById('closeSidebarButton');
const sidebar = document.getElementById('sidebar');
const modeSelect = document.getElementById('modeSelect');

// API endpoint
const API_URL = '/api/chat';

// Current mode
let currentMode = 'normal';

// Load all chats from localStorage
function loadChats() {
    try {
        const savedChats = localStorage.getItem(CHATS_STORAGE_KEY);
        if (savedChats) {
            chats = JSON.parse(savedChats);
        }
        
        // Load current chat ID
        const savedCurrentChatId = localStorage.getItem(CURRENT_CHAT_KEY);
        if (savedCurrentChatId && chats[savedCurrentChatId]) {
            currentChatId = savedCurrentChatId;
        } else if (Object.keys(chats).length > 0) {
            // Use the most recent chat
            const chatIds = Object.keys(chats);
            chatIds.sort((a, b) => chats[b].updatedAt - chats[a].updatedAt);
            currentChatId = chatIds[0];
        }
    } catch (error) {
        console.error('Error loading chats:', error);
        chats = {};
    }
}

// Save all chats to localStorage
function saveChats() {
    try {
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
        if (currentChatId) {
            localStorage.setItem(CURRENT_CHAT_KEY, currentChatId);
        }
    } catch (error) {
        console.error('Error saving chats:', error);
    }
}

// Create a new chat
function createNewChat() {
    const chatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const now = Date.now();
    
    chats[chatId] = {
        id: chatId,
        title: 'New Chat',
        messages: [],
        createdAt: now,
        updatedAt: now
    };
    
    currentChatId = chatId;
    saveChats();
    renderChatList();
    loadCurrentChat();
    
    // Show welcome message
    const welcomeMessage = "Hello! 👋 I'm Dev GPT, your friendly programming assistant. I'm here to help you with coding questions, programming concepts, sports (Premier League, Champions League, etc.), and general inquiries. What would you like to know today?";
    addMessageToDisplay(welcomeMessage, false, true);
    
    // Close sidebar on mobile after creating new chat
    if (window.innerWidth <= 768) {
        hideSidebar();
    }
}

// Load current chat
function loadCurrentChat() {
    chatDisplay.innerHTML = '';
    
    if (!currentChatId || !chats[currentChatId]) {
        // No chat selected, show welcome
        const welcomeMessage = "Hello! 👋 I'm Dev GPT, your friendly programming assistant. I'm here to help you with coding questions, programming concepts, sports (Premier League, Champions League, etc.), and general inquiries. What would you like to know today?";
        addMessageToDisplay(welcomeMessage, false, false);
        return;
    }
    
    const chat = chats[currentChatId];
    chat.messages.forEach(msg => {
        addMessageToDisplay(msg.content, msg.isUser, false);
    });
    
    setTimeout(() => {
        scrollToBottom();
    }, 100);
}

// Switch to a different chat
function switchChat(chatId) {
    if (chats[chatId]) {
        currentChatId = chatId;
        saveChats();
        renderChatList();
        loadCurrentChat();
        // Close sidebar on mobile after switching
        if (window.innerWidth <= 768) {
            hideSidebar();
        }
    }
}

// Delete a chat
function deleteChat(chatId, event) {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this chat?')) {
        delete chats[chatId];
        
        // If deleted chat was current, switch to another or create new
        if (currentChatId === chatId) {
            const remainingChats = Object.keys(chats);
            if (remainingChats.length > 0) {
                remainingChats.sort((a, b) => chats[b].updatedAt - chats[a].updatedAt);
                currentChatId = remainingChats[0];
            } else {
                currentChatId = null;
            }
        }
        
        saveChats();
        renderChatList();
        loadCurrentChat();
    }
}

// Render chat list in sidebar
function renderChatList() {
    chatList.innerHTML = '';
    
    const chatIds = Object.keys(chats);
    chatIds.sort((a, b) => chats[b].updatedAt - chats[a].updatedAt);
    
    chatIds.forEach(chatId => {
        const chat = chats[chatId];
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chatId === currentChatId ? 'active' : ''}`;
        chatItem.onclick = () => switchChat(chatId);
        
        const title = document.createElement('div');
        title.className = 'chat-item-title';
        title.textContent = chat.title;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'chat-item-delete';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = (e) => deleteChat(chatId, e);
        
        chatItem.appendChild(title);
        chatItem.appendChild(deleteBtn);
        chatList.appendChild(chatItem);
    });
}

// Update chat title based on first user message
function updateChatTitle(chatId, firstMessage) {
    if (chats[chatId]) {
        const title = firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
        chats[chatId].title = title;
        chats[chatId].updatedAt = Date.now();
        saveChats();
        renderChatList();
    }
}

// Show sidebar
function showSidebar() {
    sidebar.classList.add('open');
    // Create overlay for mobile
    let overlay = document.getElementById('sidebarOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.className = 'sidebar-overlay';
        overlay.onclick = hideSidebar;
        document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
}

// Hide sidebar
function hideSidebar() {
    sidebar.classList.remove('open');
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Update placeholder based on mode
function updatePlaceholderForMode() {
    if (!modeSelect || !userInput) return;
    
    const placeholders = {
        normal: 'Type your message here...',
        write: 'Describe the code you want me to write...',
        debug: 'Paste your code and error message...',
        explain: 'Paste the code you want explained...',
        refactor: 'Paste the code you want refactored...'
    };
    const mode = modeSelect.value || 'normal';
    userInput.placeholder = placeholders[mode] || placeholders.normal;
}

// Initialize app
function initializeApp() {
    loadChats();
    renderChatList();
    
    if (!currentChatId || Object.keys(chats).length === 0) {
        createNewChat();
    } else {
        loadCurrentChat();
    }
    
    // Sidebar toggle buttons
    showSidebarButton.addEventListener('click', showSidebar);
    closeSidebarButton.addEventListener('click', hideSidebar);
    
    // Mode selector change handler
    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            currentMode = e.target.value;
            updatePlaceholderForMode();
        });
        
        // Initialize placeholder
        updatePlaceholderForMode();
    }
}

// Initialize on page load
initializeApp();
userInput.focus();

// Format code blocks in message content
function formatCodeBlocks(text) {
    // First, protect code blocks by replacing them with placeholders
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const codeBlockPlaceholders = [];
    let placeholderIndex = 0;
    
    // Replace code blocks with placeholders
    let textWithPlaceholders = text.replace(codeBlockRegex, (match, lang, code) => {
        const placeholder = `__CODE_BLOCK_${placeholderIndex}__`;
        codeBlockPlaceholders.push({
            placeholder,
            language: lang || 'text',
            code: escapeHtml(code.trim())
        });
        placeholderIndex++;
        return placeholder;
    });
    
    // Now handle inline code in the remaining text
    textWithPlaceholders = textWithPlaceholders.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');
    
    // Convert newlines to <br> for regular text
    textWithPlaceholders = textWithPlaceholders.replace(/\n/g, '<br>');
    
    // Replace placeholders back with formatted code blocks
    codeBlockPlaceholders.forEach(({ placeholder, language, code }) => {
        const codeBlock = `<pre><code class="language-${language}"><span class="code-lang">${language}</span>${code}</code></pre>`;
        textWithPlaceholders = textWithPlaceholders.replace(placeholder, codeBlock);
    });
    
    return textWithPlaceholders;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add message to chat display (internal function, doesn't save to localStorage)
function addMessageToDisplay(content, isUser = false, saveToStorage = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    if (isUser) {
        messageContent.textContent = content;
    } else {
        const formattedContent = formatCodeBlocks(content);
        messageContent.innerHTML = `<strong>Dev GPT:</strong> ${formattedContent}`;
    }
    
    messageDiv.appendChild(messageContent);
    chatDisplay.appendChild(messageDiv);
    
    // Save to current chat if requested
    if (saveToStorage && currentChatId && chats[currentChatId]) {
        chats[currentChatId].messages.push({
            content: content,
            isUser: isUser,
            timestamp: Date.now()
        });
        chats[currentChatId].updatedAt = Date.now();
        saveChats();
        
        // Update title if this is the first user message
        if (isUser && chats[currentChatId].messages.filter(m => m.isUser).length === 1) {
            updateChatTitle(currentChatId, content);
        }
        
        renderChatList();
    }
    
    // Scroll to bottom
    scrollToBottom();
}

// Add message to chat display (public function)
function addMessage(content, isUser = false) {
    addMessageToDisplay(content, isUser, true);
}

// Scroll to bottom of chat
function scrollToBottom() {
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    });
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typingIndicator';
    
    const typingContent = document.createElement('div');
    typingContent.className = 'typing-indicator';
    typingContent.innerHTML = '<span></span><span></span><span></span>';
    
    typingDiv.appendChild(typingContent);
    chatDisplay.appendChild(typingDiv);
    scrollToBottom();
}

// Remove typing indicator
function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Update status
function updateStatus(message, type = '') {
    status.textContent = message;
    status.className = 'status ' + type;
}

// Clear chat function
function clearChat() {
    if (!currentChatId || !chats[currentChatId]) {
        return;
    }
    
    // Confirm with user
    if (confirm('Are you sure you want to clear this chat? This action cannot be undone.')) {
        // Clear messages in current chat
        chats[currentChatId].messages = [];
        chats[currentChatId].title = 'New Chat';
        chats[currentChatId].updatedAt = Date.now();
        saveChats();
        
        // Clear the chat display
        chatDisplay.innerHTML = '';
        
        // Show welcome message
        const welcomeMessage = "Hello! 👋 I'm Dev GPT, your friendly programming assistant. I'm here to help you with coding questions, programming concepts, sports (Premier League, Champions League, etc.), and general inquiries. What would you like to know today?";
        addMessageToDisplay(welcomeMessage, false, true); // Display and save
        
        // Update status
        updateStatus('Chat cleared');
        renderChatList();
        
        // Focus on input
        userInput.focus();
    }
}

// Send message to API
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) {
        return;
    }
    
    // Create new chat if none exists
    if (!currentChatId || !chats[currentChatId]) {
        createNewChat();
    }
    
    // Disable input while processing
    userInput.disabled = true;
    sendButton.disabled = true;
    
    // Add user message to chat
    addMessage(message, true);
    userInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    updateStatus('Dev GPT is thinking...', 'typing');
    
    try {
        // Get current mode
        const selectedMode = modeSelect ? modeSelect.value : 'normal';
        currentMode = selectedMode;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                conversationId: currentChatId || 'default',
                mode: selectedMode
            })
        });
        
        const data = await response.json();
        
        removeTypingIndicator();
        
        if (response.ok) {
            addMessage(data.response, false);
            updateStatus('Ready');
        } else {
            const errorMessage = data.response || 'Sorry, I encountered an error. Please try again!';
            addMessage(errorMessage, false);
            updateStatus('Error occurred', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator();
        const errorMessage = 'Sorry, I\'m having trouble connecting. Please check your internet connection and try again!';
        addMessage(errorMessage, false);
        updateStatus('Connection error', 'error');
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
        updateStatus('Ready');
    }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Clear chat button event listener
clearChatButton.addEventListener('click', clearChat);

// New chat button event listener
newChatButton.addEventListener('click', createNewChat);

// Check server health on load
fetch('/api/health')
    .then(response => response.json())
    .then(data => {
        updateStatus('Connected and ready!');
    })
    .catch(error => {
        updateStatus('Connecting...', 'typing');
    });

