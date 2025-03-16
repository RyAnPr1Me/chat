# # Dark Mode Chat Room

A real-time chat application with dark mode support built using WebSocket, HTML, CSS, and JavaScript.

## Features

- 🌓 Dark/Light theme toggle with persistence
- 💬 Real-time messaging
- 🔐 Secure WebSocket connection
- 👥 User presence indicators
- 🏠 Multiple chat rooms
- 📱 Responsive design
- 🔄 Automatic reconnection
- ⚡ Zero dependencies (client-side)

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

### Chat Rooms
- Create custom rooms
- Join existing rooms
- See active users in each room
- Real-time updates when users join/leave

### Theme Toggle
- Dark/Light mode support
- Theme persistence across sessions
- Automatic system theme detection

### Real-time Features
- Instant messaging
- User presence indicators
- Connection status updates
- Automatic reconnection

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