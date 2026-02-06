/**
 * TEXT SYNC GAME - Client Script
 * ================================
 * Handles Socket.IO connection and real-time message synchronization.
 * 
 * Features:
 * - Real-time message sending and receiving
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
// SOCKET.IO CONNECTION
// ============================================
// Connect to the server (auto-detects the server URL)
const socket = io();

// Store the socket ID for identifying own messages
let mySocketId = null;

// ============================================
// CONNECTION EVENT HANDLERS
// ============================================

/**
 * Handle successful connection
 */
socket.on('connect', () => {
    console.log('✅ Connected to server:', socket.id);
    mySocketId = socket.id;

    // Update connection status UI
    statusIndicator.classList.remove('offline');
    statusIndicator.classList.add('online');
    statusText.textContent = 'Connected';

    // Enable input
    textInput.disabled = false;
    sendButton.disabled = false;
});

/**
 * Handle disconnection
 */
socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');

    // Update connection status UI
    statusIndicator.classList.remove('online');
    statusIndicator.classList.add('offline');
    statusText.textContent = 'Disconnected';

    // Disable input
    textInput.disabled = true;
    sendButton.disabled = true;
});

/**
 * Handle connection errors
 */
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    statusIndicator.classList.remove('online');
    statusIndicator.classList.add('offline');
    statusText.textContent = 'Connection Error';
});

// ============================================
// MESSAGE HANDLERS
// ============================================

/**
 * Handle incoming messages
 * Receives text from the server and displays it
 */
socket.on('receiveText', (message) => {
    console.log('📨 Received message:', message);
    displayMessage(message);
});

/**
 * Handle user count updates
 */
socket.on('userCount', (count) => {
    console.log('👥 Users online:', count);
    userCount.textContent = `${count} user${count !== 1 ? 's' : ''} online`;
});

// ============================================
// USER INTERACTION HANDLERS
// ============================================

/**
 * Send a message to the server
 */
function sendMessage() {
    const text = textInput.value.trim();

    // Don't send empty messages
    if (!text) {
        // Shake the input to indicate error
        textInput.classList.add('shake');
        setTimeout(() => textInput.classList.remove('shake'), 500);
        return;
    }

    console.log('📤 Sending message:', text);

    // Emit the message to the server
    socket.emit('sendText', { text: text });

    // Clear the input field
    textInput.value = '';

    // Keep focus on input for continuous typing
    textInput.focus();
}

/**
 * Handle send button click
 */
sendButton.addEventListener('click', sendMessage);

/**
 * Handle Enter key press
 */
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
 * @param {Object} message - The message object from the server
 */
function displayMessage(message) {
    // Remove welcome message if it exists
    const welcomeMessage = messageArea.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message';

    // Check if this is our own message
    if (message.senderId === mySocketId) {
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
    const shortId = message.senderId.substring(0, 6);

    // Build the message HTML
    messageElement.innerHTML = `
        <p class="message-text">${escapeHtml(message.text)}</p>
        <div class="message-meta">
            <span class="message-sender">${message.senderId === mySocketId ? 'You' : 'User ' + shortId}</span>
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
 * @param {string} text - The text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// INITIALIZATION
// ============================================

// Focus on input when page loads
textInput.focus();

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

// Log ready state
console.log('🎮 Text Sync Game - Client Ready');
console.log('Waiting for server connection...');
