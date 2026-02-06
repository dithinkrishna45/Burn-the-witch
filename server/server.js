/**
 * TEXT SYNC GAME - Real-Time Server
 * ==================================
 * A WebSocket server using Express.js and Socket.IO for real-time
 * text synchronization between multiple connected clients.
 * 
 * This serves as the core communication system for a multiplayer web game.
 */

// ============================================
// DEPENDENCIES
// ============================================
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// ============================================
// SERVER INITIALIZATION
// ============================================
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
// This allows connections from any origin (useful for development)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Server configuration
const PORT = process.env.PORT || 3000;

// ============================================
// STATIC FILE SERVING
// ============================================
// Serve the client files from the ../client directory
app.use(express.static(path.join(__dirname, '../client')));

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ============================================
// GAME STATE (Prepared for future expansion)
// ============================================
// Track connected users (can be expanded for player management)
const connectedUsers = new Map();

// ============================================
// SOCKET.IO EVENT HANDLERS
// ============================================
io.on('connection', (socket) => {
    // Log when a new client connects
    console.log(`✅ User connected: ${socket.id}`);

    // Store the user (can be expanded with player names, rooms, etc.)
    connectedUsers.set(socket.id, {
        id: socket.id,
        connectedAt: new Date().toISOString()
    });

    // Broadcast the number of connected users to all clients
    io.emit('userCount', connectedUsers.size);

    // -------------------------------------------
    // Handle incoming text messages
    // -------------------------------------------
    socket.on('sendText', (data) => {
        console.log(`📨 Message from ${socket.id}: ${data.text}`);

        // Create the message object with metadata
        const message = {
            id: Date.now(),                    // Unique message ID
            text: data.text,                   // The actual message content
            senderId: socket.id,               // Who sent it
            timestamp: new Date().toISOString() // When it was sent
        };

        // Broadcast the message to ALL connected clients (including sender)
        // For a game, you might want to use socket.broadcast.emit() 
        // to exclude the sender
        io.emit('receiveText', message);
    });

    // -------------------------------------------
    // Handle typing indicator (optional, game-ready)
    // -------------------------------------------
    socket.on('typing', () => {
        socket.broadcast.emit('userTyping', { id: socket.id });
    });

    socket.on('stopTyping', () => {
        socket.broadcast.emit('userStopTyping', { id: socket.id });
    });

    // -------------------------------------------
    // Handle disconnection
    // -------------------------------------------
    socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);

        // Remove user from tracking
        connectedUsers.delete(socket.id);

        // Update all clients with new user count
        io.emit('userCount', connectedUsers.size);
    });
});

// ============================================
// START THE SERVER
// ============================================
server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║      TEXT SYNC GAME - Server Running       ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║  🌐 Local:   http://localhost:${PORT}          ║`);
    console.log(`║  📡 Status:  Ready for connections         ║`);
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log('Open the URL in multiple browser tabs to test real-time sync!');
    console.log('');
});

// ============================================
// GRACEFUL SHUTDOWN (Good practice)
// ============================================
process.on('SIGTERM', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
