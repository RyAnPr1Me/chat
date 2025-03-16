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
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const clients = new Map();
const rooms = new Map();

wss.on('connection', async (ws, req) => {
  const token = new URL(req.url, 'http://localhost').searchParams.get('token');
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    ws.userId = user.id;
    clients.set(ws.userId, ws);

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
            break;
          case 'create_room':
            if (!rooms.has(data.room)) {
              rooms.set(data.room, new Set());
              rooms.get(data.room).add(ws.userId);
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

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server (Netlify function) running locally on port ${PORT}`));
} else {
  module.exports.handler = serverless(app);
}
