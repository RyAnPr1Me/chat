require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connected clients and room maps
const clients = new Map();
const rooms = new Map();

// WebSocket connection handling with improved logging
wss.on('connection', async (ws, req) => {
  const token = new URL(req.url, 'http://localhost').searchParams.get('token');
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    ws.userId = user.id;
    clients.set(ws.userId, ws);
    console.debug(`User ${ws.userId} connected via WebSocket`);
    
    // Send initial data
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    ws.send(JSON.stringify({
      type: 'init',
      messages,
      users: Array.from(clients.keys())
    }));

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.debug('Received message:', data);
        switch (data.type) {
          case 'message':
            const { data: newMessage } = await supabase
              .from('messages')
              .insert([{ user_id: ws.userId, content: data.content, room: data.room }])
              .single();
            broadcastToRoom(data.room, { type: 'message', message: newMessage });
            break;
          case 'join_room':
            if (!rooms.has(data.room)) { rooms.set(data.room, new Set()); }
            rooms.get(data.room).add(ws.userId);
            console.debug(`User ${ws.userId} joined room ${data.room}`);
            break;
          case 'create_room':
            if (!rooms.has(data.room)) {
              rooms.set(data.room, new Set());
              rooms.get(data.room).add(ws.userId);
              console.info(`Room created: ${data.room}`);
            } else {
              console.warn(`Room ${data.room} already exists`);
            }
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      clients.delete(ws.userId);
      broadcastUserList();
      console.debug(`User ${ws.userId} disconnected`);
    });
    
  } catch (error) {
    console.error('JWT verification failed:', error);
    ws.close();
  }
});

function broadcastToRoom(room, message) {
  const roomClients = rooms.get(room) || new Set();
  roomClients.forEach(userId => {
    const client = clients.get(userId);
    if (client?.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function broadcastUserList() {
  const message = JSON.stringify({ type: 'user_list', users: Array.from(clients.keys()) });
  for (const client of clients.values()) {
    if (client.readyState === WebSocket.OPEN) { client.send(message); }
  }
}

// Local debugging startup; export handler for Netlify
if (!process.env.NETLIFY) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
} else {
  module.exports.handler = serverless(app);
}
