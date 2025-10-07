# Encrypted P2P Chat

A secure peer-to-peer chat application with end-to-end encryption built using WebSocket, Web Crypto API, and modern web technologies.

## Features

- 🔒 **End-to-End Encryption** - Messages encrypted using AES-GCM with ECDH key exchange
- 🆔 **Unique Device IDs** - Each device gets a persistent unique identifier
- 🔗 **Direct P2P Connection** - Connect directly to another device using their ID
- 🌑 **Google Material Dark Mode** - Modern, clean dark theme UI
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔄 **Automatic Reconnection** - Smart reconnection with exponential backoff
- 🛡️ **Privacy First** - No message storage, complete privacy
- ⚡ **Zero External Dependencies** - Pure client-side encryption
- 🎨 **Material Design** - Google-style modern interface
- 🔔 **Real-time Notifications** - Connection and message alerts
- ⌨️ **Typing Indicators** - See when your peer is typing
- 🚦 **Rate Limiting** - Client and server-side protection against spam
- ♿ **Accessibility** - ARIA labels and keyboard shortcuts
- 🔐 **Input Validation** - Comprehensive validation on both client and server

## Getting Started

### Prerequisites

- Node.js (>= 16.0.0)
- npm (>= 8.0.0)
- Modern web browser with Web Crypto API support

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RyAnPr1Me/chat.git
cd chat
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

5. Share your Device ID with someone or get their Device ID to connect

## Project Structure

```
encrypted-p2p-chat/
├── index.html       # Main application with embedded styles and scripts
├── api/
│   └── server.js   # WebSocket relay server
├── package.json    # Project configuration
└── README.md       # Documentation
```

## Usage

1. **Get Your Device ID**: When you open the app, a unique Device ID is automatically generated and displayed in the header
2. **Copy Your ID**: Click the "Copy" button to copy your Device ID
3. **Share Your ID**: Send your Device ID to someone you want to chat with securely
4. **Connect**: Enter their Device ID in the "Connect to Device" field and click "Connect"
5. **Accept Connection**: They will receive a connection request - once accepted, you're connected!
6. **Chat Securely**: All messages are end-to-end encrypted - only you and your peer can read them

### Keyboard Shortcuts

- **Enter**: Send message (when typing in message input)
- **Enter**: Connect to device (when typing in device ID input)
- **Escape**: Dismiss connection requests

## Features in Detail

### Security & Encryption
- **End-to-End Encryption**: Uses AES-GCM (256-bit) for message encryption
- **Key Exchange**: ECDH (P-384 curve) for secure key derivation
- **No Storage**: Messages are never stored on the server - complete privacy
- **Unique Keys**: Each peer connection has a unique encryption key
- **XSS Protection**: Input sanitization and secure HTML rendering
- **Rate Limiting**: Server-side protection against abuse

### Device Management
- **Persistent Device ID**: Automatically generated and stored in browser
- **No Registration**: No accounts or personal information required
- **Copy & Share**: Easy Device ID copying to clipboard
- **Connection Requests**: Accept or reject incoming connections
- **Single Connection**: One secure connection at a time per device

### Real-time Communication
- **WebSocket Relay**: Server relays encrypted messages between peers
- **Instant Delivery**: Real-time message transmission
- **Connection Status**: Live connection state indicators
- **Automatic Reconnect**: Maintains connection reliability
- **Peer Notifications**: Get notified when peer disconnects

### User Interface
- **Material Design**: Google-style dark theme
- **Responsive Layout**: Adapts to all screen sizes
- **Modern Animations**: Smooth transitions and effects
- **Status Indicators**: Visual feedback for all actions
- **Toast Notifications**: Non-intrusive status messages
- **Clean Typography**: Readable and accessible text

## How It Works

### Architecture
```
Device A                    Relay Server                    Device B
   |                             |                              |
   |-- Connect with DeviceID --->|                              |
   |                             |<--- Connect with DeviceID ---|
   |                             |                              |
   |-- Connection Request ------>|                              |
   |                             |---- Forward Request -------->|
   |                             |                              |
   |                             |<---- Accept + Public Key ----|
   |<--- Public Key + Accept ----|                              |
   |                             |                              |
   [Derive Shared Key]           |                   [Derive Shared Key]
   |                             |                              |
   |-- Encrypted Message ------->|                              |
   |                             |---- Forward Encrypted ------>|
   |                             |                              |
```

### Encryption Process
1. Each device generates an ECDH key pair on startup
2. When connecting, devices exchange public keys through the server
3. Both devices derive the same AES-GCM encryption key using ECDH
4. Messages are encrypted locally before transmission
5. Server only relays encrypted messages without decrypting
6. Only the intended peer can decrypt the messages

## Browser Support

- Chrome 60+ (recommended)
- Firefox 75+
- Safari 11.1+
- Edge 79+

**Note:** Web Crypto API support required for encryption features

## Security Considerations

### Protections in Place
- ✅ End-to-end encryption using Web Crypto API (AES-GCM 256-bit)
- ✅ Secure key exchange using ECDH (P-384 curve)
- ✅ No message storage on server
- ✅ Unique encryption key per connection
- ✅ XSS protection with input sanitization
- ✅ Rate limiting on both client and server
- ✅ Message size validation to prevent DoS
- ✅ Duplicate device ID detection
- ✅ Input validation on all user inputs
- ✅ WebSocket heartbeat mechanism for connection health

### Important Notes
- ⚠️ Server can see Device IDs (not message content)
- ⚠️ No authentication - anyone with Device ID can connect
- ⚠️ Single connection limit per device
- ⚠️ Messages are not persisted - close the tab and they're gone

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Roadmap

- [ ] Group chat support (3+ participants)
- [ ] File sharing with encryption
- [ ] Voice/Video call support
- [ ] Message formatting (markdown)
- [ ] QR code for Device ID sharing
- [ ] Mobile app versions

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Encryption**: Web Crypto API (AES-GCM, ECDH)
- **Backend**: Node.js, Express, WebSocket (ws)
- **Styling**: CSS Variables, Material Design principles
- **Storage**: LocalStorage for Device ID persistence