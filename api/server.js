
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Initialize Express app with security middleware
const app = express();
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGIN : '*'
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Serve static files
app.use('/', express.static(path.join(__dirname, '..'), {
  maxAge: '1h',
  etag: true
}));

// Initialize Supabase with error handling
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ezuyuhakarqlbxszaluq.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dXl1aGFrYXJxbGJ4c3phbHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNDc0NDcsImV4cCI6MjA1NzcyMzQ0N30.j0mwiHHyBDs9LcUe6S1IxMsNujAo3yzrmt7AZpH5_d0'
);

// Create HTTP server
const server = http.createServer(app);
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  clientTracking: true,
  maxPayload: 1024 * 1024 // 1MB max message size
});

// State management with Map for better performance
const clients = new Map();
const rooms = new Map();
const DEFAULT_ROOMS = ['general', 'random', 'support'];
DEFAULT_ROOMS.forEach(room => rooms.set(room, new Set()));

// Message sanitization
function sanitizeMessage(content) {
  return content.slice(0, 1000).trim(); // Limit message length
}

// Helper function for safe JSON parsing
function safeJSONParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

// WebSocket connection handler with improved error handling
wss.on('connection', async (ws, req) => {
  let heartbeatInterval;
  ws.isAlive = true;

  try {
    const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const userData = safeJSONParse(Buffer.from(token, 'base64').toString());
    if (!userData?.id || !userData?.username) {
      throw new Error('Invalid authentication data');
    }

    ws.userId = userData.id;
    ws.username = userData.username;
    clients.set(ws.userId, { ws, userData });

    // Heartbeat mechanism
    heartbeatInterval = setInterval(() => {
      if (!ws.isAlive) {
        clearInterval(heartbeatInterval);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    }, 30000);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Send initial data with error handling
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      ws.send(JSON.stringify({
        type: 'init',
        messages: messages?.reverse() || [],
        rooms: Array.from(rooms.keys()),
        users: Array.from(clients.values()).map(c => ({
          id: c.userData.id,
          username: c.userData.username
        }))
      }));
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to load initial data' 
      }));
    }

    // Message handler with improved validation
    ws.on('message', async (message) => {
      try {
        const data = safeJSONParse(message);
        if (!data?.type) return;

        switch (data.type) {
          case 'message':
            if (!data.content?.trim()) return;
            
            const sanitizedContent = sanitizeMessage(data.content);
            const messageData = {
              user_id: ws.userId,
              username: ws.username,
              content: sanitizedContent,
              room: data.room,
              timestamp: Date.now()
            };

            const { error } = await supabase
              .from('messages')
              .insert([messageData]);

            if (error) throw error;

            broadcastToRoom(data.room, {
              type: 'message',
              ...messageData
            });
            break;

          case 'join_room':
            if (!data.room?.trim()) return;
            
            rooms.forEach((users, roomName) => {
              users.delete(ws.userId);
              broadcastToRoom(roomName, {
                type: 'user_left',
                userId: ws.userId,
                username: ws.username
              });
            });

            const room = rooms.get(data.room) || rooms.set(data.room, new Set()).get(data.room);
            room.add(ws.userId);
            
            ws.send(JSON.stringify({
              type: 'room_joined',
              room: data.room
            }));

            broadcastToRoom(data.room, {
              type: 'user_joined',
              userId: ws.userId,
              username: ws.username
            });
            break;
        }
      } catch (error) {
        console.error('Message handling error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Failed to process message' 
        }));
      }
    });

    // Cleanup on disconnect
    ws.on('close', () => {
      clearInterval(heartbeatInterval);
      clients.delete(ws.userId);
      rooms.forEach(users => users.delete(ws.userId));
      broadcastToAll({
        type: 'user_disconnected',
        userId: ws.userId,
        username: ws.username
      });
    });

  } catch (error) {
    console.error('Connection error:', error);
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'Connection failed' 
    }));
    ws.close();
  }
});

// Optimized broadcast functions
function broadcastToRoom(roomName, message) {
  const room = rooms.get(roomName);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  room.forEach(userId => {
    const client = clients.get(userId);
    if (client?.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  });
}

function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  }
}

// SPA fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server with proper host binding
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  module.exports.handler = serverless(app);
}
