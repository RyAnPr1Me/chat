const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Add security headers
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

const PORT = process.env.PORT || 3000;
const clients = new Map();
const rooms = new Set(['general', 'random', 'support']);

const CONFIG = {
    MAX_ROOMS: 50,
    MAX_USERS_PER_ROOM: 100,
    PING_INTERVAL: 30000,
    PING_TIMEOUT: 5000,
    MAX_MESSAGE_SIZE: 1024 * 16, // 16KB
    CLEANUP_INTERVAL: 60000 // 1 minute
};

// Improved client tracking with Map
const clientsMap = new Map();

wss.on('connection', (ws) => {
    const clientId = Date.now();
    clients.set(ws, { 
        id: clientId, 
        room: 'general',
        lastPing: Date.now(),
        isAlive: true
    });

    // Setup ping-pong
    ws.on('pong', () => {
        const client = clients.get(ws);
        if (client) {
            client.isAlive = true;
            client.lastPing = Date.now();
        }
    });

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('Message handling error:', error);
        }
    });

    ws.on('close', () => {
        const client = clients.get(ws);
        clients.delete(ws);
        broadcastUserList();
    });

    // Send initial data
    ws.send(JSON.stringify({ 
        type: 'init',
        rooms: Array.from(rooms)
    }));
});

function handleMessage(ws, data) {
    const client = clients.get(ws);
    if (!client) return;
    
    try {
        if (Buffer.from(JSON.stringify(data)).length > CONFIG.MAX_MESSAGE_SIZE) {
            throw new Error('Message too large');
        }
        switch(data.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
                
            case 'message':
                if (!validateMessage(data)) return;
                broadcastToRoom(data.room, {
                    type: 'message',
                    content: data.content,
                    user: data.user,
                    timestamp: Date.now()
                });
                break;
                
            case 'join_room':
                if (!validateRoom(data.room)) return;
                client.room = data.room;
                clients.set(ws, client);
                broadcastUserList();
                break;
                
            case 'create_room':
                if (rooms.size >= CONFIG.MAX_ROOMS) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Maximum number of rooms reached'
                    }));
                    return;
                }
                if (validateRoom(data.room) && !rooms.has(data.room)) {
                    rooms.add(data.room);
                    broadcastRoomList();
                }
                break;
        }
    } catch (error) {
        ws.send(JSON.stringify({
            type: 'error',
            message: error.message
        }));
    }
}

// Add new validation functions
function validateMessage(data) {
    return data.content && 
           typeof data.content === 'string' && 
           data.content.length <= 1000 &&
           data.room && 
           rooms.has(data.room);
}

function validateRoom(room) {
    return room && 
           typeof room === 'string' && 
           room.length >= 3 && 
           room.length <= 30 &&
           /^[a-zA-Z0-9_-]+$/.test(room);
}

// Add cleanup interval
const interval = setInterval(() => {
    wss.clients.forEach(ws => {
        const client = clients.get(ws);
        if (!client) return;

        if (!client.isAlive && Date.now() - client.lastPing > CONFIG.PING_TIMEOUT) {
            clients.delete(ws);
            ws.terminate();
            return;
        }

        client.isAlive = false;
        ws.ping();
    });
}, CONFIG.PING_INTERVAL);

wss.on('close', () => {
    clearInterval(interval);
});

function broadcastToRoom(room, message) {
    for (const [client, data] of clients.entries()) {
        if (data.room === room) {
            client.send(JSON.stringify(message));
        }
    }
}

function broadcastUserList() {
    const users = Array.from(clients.values())
        .map(client => ({ id: client.id, room: client.room }));
    wss.clients.forEach(client => {
        client.send(JSON.stringify({
            type: 'user_list',
            users
        }));
    });
}

function broadcastRoomList() {
    wss.clients.forEach(client => {
        client.send(JSON.stringify({
            type: 'room_list',
            rooms: Array.from(rooms)
        }));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Add clean disconnect handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing WebSocket server...');
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
});

server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});
