
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Initialize Express app with security middleware
const app = express();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'ws:', 'wss:']
    }
  }
}));
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

// Create HTTP server
const server = http.createServer(app);
const wss = new WebSocket.Server({
  server,
  path: '/ws',
  clientTracking: true,
  maxPayload: 1024 * 1024 // 1MB max message size
});

// State management - devices connected to the relay server
const devices = new Map(); // deviceId -> { ws, deviceId, connectedTo }

// Helper function for safe JSON parsing
function safeJSONParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

// WebSocket connection handler for P2P encrypted chat
wss.on('connection', (ws, req) => {
  let heartbeatInterval;
  ws.isAlive = true;

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const deviceId = url.searchParams.get('deviceId');

    if (!deviceId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Device ID required' }));
      ws.close();
      return;
    }

    // Register device
    ws.deviceId = deviceId;
    devices.set(deviceId, { ws, deviceId, connectedTo: null });

    console.log(`Device ${deviceId} connected`);

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

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      deviceId: deviceId,
      online: Array.from(devices.keys()).filter(id => id !== deviceId)
    }));

    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = safeJSONParse(message);
        if (!data?.type) return;

        switch (data.type) {
        case 'connect_request': {
          // Request to connect to another device
          if (!data.targetDeviceId) return;

          const targetDevice = devices.get(data.targetDeviceId);
          if (targetDevice && targetDevice.ws.readyState === WebSocket.OPEN) {
            // Forward connection request to target
            targetDevice.ws.send(JSON.stringify({
              type: 'connect_request',
              fromDeviceId: deviceId,
              publicKey: data.publicKey
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Target device not found or offline'
            }));
          }
          break;
        }

        case 'connect_accept': {
          // Accept connection from another device
          if (!data.targetDeviceId) return;

          const requesterDevice = devices.get(data.targetDeviceId);
          if (requesterDevice && requesterDevice.ws.readyState === WebSocket.OPEN) {
            // Update connection state
            devices.get(deviceId).connectedTo = data.targetDeviceId;
            devices.get(data.targetDeviceId).connectedTo = deviceId;

            // Forward acceptance to requester
            requesterDevice.ws.send(JSON.stringify({
              type: 'connect_accepted',
              fromDeviceId: deviceId,
              publicKey: data.publicKey
            }));
          }
          break;
        }

        case 'encrypted_message': {
          // Relay encrypted message to connected peer
          if (!data.targetDeviceId || !data.encryptedContent) return;

          const peerDevice = devices.get(data.targetDeviceId);
          if (peerDevice && peerDevice.ws.readyState === WebSocket.OPEN) {
            peerDevice.ws.send(JSON.stringify({
              type: 'encrypted_message',
              fromDeviceId: deviceId,
              encryptedContent: data.encryptedContent,
              iv: data.iv,
              timestamp: data.timestamp
            }));
          }
          break;
        }

        case 'disconnect_peer': {
          // Disconnect from current peer
          const currentDevice = devices.get(deviceId);
          if (currentDevice && currentDevice.connectedTo) {
            const peer = devices.get(currentDevice.connectedTo);
            if (peer) {
              peer.connectedTo = null;
              if (peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(JSON.stringify({
                  type: 'peer_disconnected',
                  deviceId: deviceId
                }));
              }
            }
            currentDevice.connectedTo = null;
          }
          break;
        }
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
      const device = devices.get(deviceId);

      // Notify connected peer if any
      if (device && device.connectedTo) {
        const peer = devices.get(device.connectedTo);
        if (peer && peer.ws.readyState === WebSocket.OPEN) {
          peer.ws.send(JSON.stringify({
            type: 'peer_disconnected',
            deviceId: deviceId
          }));
          peer.connectedTo = null;
        }
      }

      devices.delete(deviceId);
      console.log(`Device ${deviceId} disconnected`);
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// SPA fallback route - Express 5.x compatible
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, _next) => {
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
