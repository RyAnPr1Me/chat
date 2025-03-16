# Dark Mode Chat Room

A real-time chat application with dark mode support built using WebSocket, HTML, CSS, and JavaScript.

## Features

- 🌓 Dark/Light theme toggle with persistence
- 💬 Real-time messaging with encryption
- 🔐 Secure WebSocket connection
- 👥 User presence indicators
- 🏠 Multiple chat rooms with dynamic creation
- 📱 Responsive design for mobile devices
- 🔄 Automatic reconnection with retry limits
- 🔒 Message encryption using Caesar cipher
- 💾 Message persistence using Supabase
- ⚡ Zero dependencies (client-side)
- 🎨 Modern UI with CSS variables
- 🔔 Connection status notifications

## Getting Started

### Prerequisites

- Node.js (>= 14.0.0)
- npm (>= 6.0.0)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/username/dark-mode-chat-room.git
cd dark-mode-chat-room
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
dark-mode-chat-room/
├── index.html       # Main application file
├── styles/
│   └── main.css    # Styling
├── package.json    # Project configuration
└── README.md      # Documentation
```

## Usage

1. Enter your username when prompted
2. Join existing rooms or create new ones
3. Send messages using the input field
4. Toggle theme using the theme button (☀️/🌙)

## Features in Detail

### Chat Security
- Message encryption using Caesar cipher algorithm
- Input sanitization for XSS prevention
- Rate limiting and message length restrictions
- Secure WebSocket connection with auto-reconnect
- Message validation and sanitization

### Real-time Features
- Instant messaging with WebSocket
- User presence indicators
- Connection status updates
- Automatic reconnection with configurable retries
- Real-time room updates
- Message persistence across sessions

### Chat Rooms
- Create custom rooms dynamically
- Join existing rooms in real-time
- See active users in each room
- Real-time updates when users join/leave
- Default rooms: general, random, support
- Room-specific message history

### Data Persistence
- Messages stored in Supabase database
- Room persistence across sessions
- Theme preference storage
- Message history retrieval
- Real-time database synchronization

### Theme System
- Dark/Light mode support
- Theme persistence across sessions
- CSS variable-based theming
- Smooth theme transitions
- System theme detection
- Custom color schemes

### UI Features
- Responsive mobile-first design
- Modern messaging interface
- User avatars and status indicators
- Message timestamps
- Typing indicators
- Scroll-to-bottom on new messages

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch:
```bash
git checkout -b feature/YourFeature
```
3. Commit your changes:
```bash
git commit -m 'Add some feature'
```
4. Push to the branch:
```bash
git push origin feature/YourFeature
```
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security

- Input sanitization
- XSS protection
- Secure WebSocket connection
- Rate limiting
- Message length restrictions

## Known Issues

- Reconnection might fail in areas with poor network connectivity
- Some emoji may not display correctly in older browsers
- Theme toggle animation may lag on lower-end devices

## Roadmap

- [ ] Add file sharing support
- [ ] Implement user authentication
- [ ] Add message history
- [ ] Support for message formatting
- [ ] Add voice messages
- [ ] Implement private messaging

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Technical Details

### Configuration
- Maximum message length: 1000 characters
- Maximum reconnection attempts: 3
- Reconnection delay: 2000ms
- Connection timeout: 5000ms
- Username requirements: 3-20 alphanumeric characters
- Room name requirements: 3-30 alphanumeric characters

### WebSocket Events
- message: Handle incoming chat messages
- user_list: Update online users
- room_list: Update available rooms
- join_room: Handle room transitions
- create_room: Handle new room creation

### Error Handling
- Connection failure recovery
- Message validation
- Input sanitization
- Encrypted message handling
- Database error handling
- WebSocket error recovery