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

// WebSocket connection handling
wss.on('connection', async (ws, req) => {
    const token = new URL(req.url, 'http://localhost').searchParams.get('token');
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        ws.userId = user.id;
    } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.close();
    }
});

function broadcastToRoom(room, message) {
}

function broadcastUserList() {
}

// If run locally, start the server; otherwise export the Netlify handler.
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
} else {
    module.exports.handler = serverless(app);
}
