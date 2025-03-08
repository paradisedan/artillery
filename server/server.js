const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { handleGameState } = require('./game/gameState');
const { initializeMatchmaking } = require('./game/matchmaking');

// Initialize Express app
const app = express();
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIO(server);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('find_match', (data) => {
        initializeMatchmaking(socket, data);
    });

    socket.on('game_action', (data) => {
        handleGameState(io, socket, data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
