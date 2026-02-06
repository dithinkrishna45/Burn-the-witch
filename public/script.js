/**
 * TEXT SYNC GAME - Client Script (Vercel Compatible)
 * ===================================================
 * Uses polling API instead of WebSockets for Vercel compatibility.
 * 
 * Features:
 * - Real-time message sending and receiving via polling
 * - Connection status indicator
 * - User count display
 * - Auto-scroll on new messages
 * - Enter key support for sending
 */

// ============================================
// DOM ELEMENTS
// ============================================
const textInput = document.getElementById('text-input');
const sendButton = document.getElementById('send-button');
const messageArea = document.getElementById('message-area');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const userCount = document.getElementById('user-count');

// ============================================
// CONFIGURATION
// ============================================
const API_BASE = '/api';
const POLL_INTERVAL = 1000; // Poll every 1 second
const CLIENT_ID = 'user_' + Math.random().toString(36).substring(2, 10);

// State
let lastMessageId = 0;
let isConnected = false;
let pollTimer = null;

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Check API status and establish "connection"
 */
async function connect() {
    try {
        const response = await fetch(`${API_BASE}/status`);
        if (response.ok) {
            setConnected(true);
            startPolling();
        } else {
            throw new Error('API not available');
        }
    } catch (error) {
        console.error('Connection error:', error);
        setConnected(false);
        // Retry connection after 3 seconds
        setTimeout(connect, 3000);
    }
}

/**
 * Send a message to the server
 */
async function sendMessage() {
    const text = textInput.value.trim();

    // Don't send empty messages
    if (!text) {
        textInput.classList.add('shake');
        setTimeout(() => textInput.classList.remove('shake'), 500);
        return;
    }

    console.log('📤 Sending message:', text);

    try {
        const response = await fetch(`${API_BASE}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                senderId: CLIENT_ID
            })
        });

        if (response.ok) {
            const data = await response.json();
            // Display our own message immediately
            displayMessage(data.message);
            textInput.value = '';
            textInput.focus();
        } else {
            console.error('Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

/**
 * Poll for new messages
 */
async function pollMessages() {
    if (!isConnected) return;

    try {
        const response = await fetch(`${API_BASE}/messages?since=${lastMessageId}`);

        if (response.ok) {
            const data = await response.json();

            // Display new messages (excluding our own - we show those immediately)
            data.messages.forEach(message => {
                if (message.senderId !== CLIENT_ID) {
                    displayMessage(message);
                }
                if (message.id > lastMessageId) {
                    lastMessageId = message.id;
                }
            });

            // Update user count
            userCount.textContent = `${data.userCount} user${data.userCount !== 1 ? 's' : ''} online`;
        }
    } catch (error) {
        console.error('Polling error:', error);
        setConnected(false);
        setTimeout(connect, 3000);
    }
}

/**
 * Start polling for messages
 */
function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(pollMessages, POLL_INTERVAL);
    pollMessages(); // Initial poll
}

/**
 * Set connection status
 */
function setConnected(connected) {
    isConnected = connected;

    if (connected) {
        statusIndicator.classList.remove('offline');
        statusIndicator.classList.add('online');
        statusText.textContent = 'Connected';
        textInput.disabled = false;
        sendButton.disabled = false;
    } else {
        statusIndicator.classList.remove('online');
        statusIndicator.classList.add('offline');
        statusText.textContent = 'Reconnecting...';
        textInput.disabled = true;
        sendButton.disabled = true;
        if (pollTimer) clearInterval(pollTimer);
    }
}

// ============================================
// USER INTERACTION HANDLERS
// ============================================

sendButton.addEventListener('click', sendMessage);

textInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

// ============================================
// UI HELPER FUNCTIONS
// ============================================

/**
 * Display a message in the message area
 */
function displayMessage(message) {
    // Remove welcome message if it exists
    const welcomeMessage = messageArea.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    // Check if message already exists
    if (document.querySelector(`[data-message-id="${message.id}"]`)) {
        return;
    }

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.setAttribute('data-message-id', message.id);

    // Check if this is our own message
    if (message.senderId === CLIENT_ID) {
        messageElement.classList.add('own');
    } else {
        messageElement.classList.add('other');
    }

    // Format the timestamp
    const timestamp = new Date(message.timestamp);
    const timeString = timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Create shortened sender ID for display
    const shortId = message.senderId.substring(0, 8);

    // Build the message HTML
    messageElement.innerHTML = `
        <p class="message-text">${escapeHtml(message.text)}</p>
        <div class="message-meta">
            <span class="message-sender">${message.senderId === CLIENT_ID ? 'You' : 'User ' + shortId}</span>
            <span class="message-time">${timeString}</span>
        </div>
    `;

    // Add to message area
    messageArea.appendChild(messageElement);

    // Auto-scroll to bottom
    scrollToBottom();
}

/**
 * Scroll the message area to the bottom
 */
function scrollToBottom() {
    messageArea.scrollTo({
        top: messageArea.scrollHeight,
        behavior: 'smooth'
    });
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// INITIALIZATION
// ============================================

// Add CSS for shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    .shake {
        animation: shake 0.3s ease-in-out;
    }
`;
document.head.appendChild(style);

// Focus on input when page loads
textInput.focus();

// Start connection
console.log('🎮 Text Sync Game - Client Ready');
console.log('Client ID:', CLIENT_ID);
connect();
