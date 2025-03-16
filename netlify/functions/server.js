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

// Use public folder from project root
app.use(express.static(path.join(process.cwd(), 'public')));

app.use(cors());
app.use(express.json());
// ...existing Express middleware and routes...

// Create HTTP server and initialize WebSocket on that server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// ...existing WebSocket connection handling and functions...
// ...existing code for handling connections, messages, broadcasts, etc...

// Remove or comment out original server.listen(...) call
// For local debugging, start the server if this file is run directly.
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
} else {
    // When deployed as a Netlify function
    module.exports.handler = serverless(app);
}
