const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const clients = new Map();
const rooms = new Set(['general', 'random', 'support']);

wss.on('connection', (ws) => {
    const clientId = Date.now();
    clients.set(ws, { id: clientId, room: 'general' });

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
    
    switch(data.type) {
        case 'message':
            broadcastToRoom(data.room, {
                type: 'message',
                content: data.content,
                user: data.user,
                timestamp: Date.now()
            });
            break;
            
        case 'join_room':
            client.room = data.room;
            clients.set(ws, client);
            broadcastUserList();
            break;
            
        case 'create_room':
            if (!rooms.has(data.room)) {
                rooms.add(data.room);
                broadcastRoomList();
            }
            break;
    }
}

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

server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});
