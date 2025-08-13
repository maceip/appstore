<div align="center">

```
   ▄▄▄       ██▓███   ██▓███    ██████ ▄▄▄█████▓ ▒█████   ██▀███  ▓█████ 
  ▒████▄    ▓██░  ██▒▓██░  ██▒▒██    ▒ ▓  ██▒ ▓▒▒██▒  ██▒▓██ ▒ ██▒▓█   ▀ 
  ▒██  ▀█▄  ▓██░ ██▓▒▓██░ ██▓▒░ ▓██▄   ▒ ▓██░ ▒░▒██░  ██▒▓██ ░▄█ ▒▒███   
  ░██▄▄▄▄██ ▒██▄█▓▒ ▒▒██▄█▓▒ ▒  ▒   ██▒░ ▓██▓ ░ ▒██   ██░▒██▀▀█▄  ▒▓█  ▄ 
   ▓█   ▓██▒▒██▒ ░  ░▒██▒ ░  ░▒██████▒▒  ▒██▒ ░ ░ ████▓▒░░██▓ ▒██▒░▒████▒
   ▒▒   ▓▒█░▒▓▒░ ░  ░▒▓▒░ ░  ░▒ ▒▓▒ ▒ ░  ▒ ░░   ░ ▒░▒░▒░ ░ ▒▓ ░▒▓░░░ ▒░ ░
    ▒   ▒▒ ░░▒ ░     ░▒ ░     ░ ░▒  ░ ░    ░      ░ ▒ ▒░   ░▒ ░ ▒░ ░ ░  ░
    ░   ▒   ░░       ░░       ░  ░  ░    ░      ░ ░ ░ ▒    ░░   ░    ░   
        ░  ░                        ░               ░ ░     ░        ░  ░
```

</div>

# AppStore

A powerful HTTP and WebSocket server running inside an Isolated Web App (IWA) using the Direct Sockets API.

## 🚀 Chrome Installation & Quickstart

### Prerequisites
- Chrome browser (version 113+)
- Direct Sockets API support

### Step 1: Install Dependencies
```bash
bun install
```

### Step 2: Start Development Server
```bash
bun run dev
```

### Step 3: Install as Chrome App
1. Open Chrome and navigate to `chrome://flags`
2. Enable the following flags:
   - `#enable-isolated-web-apps`
   - `#enable-experimental-web-platform-features`
   - `#unrestricted-usb` (if using USB features)
3. Restart Chrome
4. Navigate to the development server URL (typically `http://localhost:5173`)
5. Click the "Install" button when prompted, or use the browser menu → "Install app"

### Step 4: Launch AppStore
1. Open Chrome Apps (chrome://apps) or find "AppStore" in your applications
2. Click to launch the isolated web app
3. Click "Start Server" to begin the HTTP/WebSocket server
4. Server will be available at `http://localhost:44818`

### Step 5: Test the Server
- Click "Open Server Page" to access the built-in test interface
- Or navigate directly to `http://localhost:44818` in any browser
- Use the interactive test buttons to verify HTTP and WebSocket functionality

## 🚀 Features

- **HTTP/1.1 Server**: Full HTTP server with support for GET, POST, OPTIONS, and other methods
- **WebSocket Server**: Real-time bidirectional communication with WebSocket protocol support
- **CORS Support**: Proper Cross-Origin Resource Sharing headers for web compatibility
- **Private Network Access**: Handles Chrome's Private Network Access requirements
- **TypeScript**: Fully typed implementation with Direct Sockets API definitions
- **Bun Integration**: Built with Bun for modern development experience

## 🏆 Champions

The implementations we're using for core protocols:

### **QUIC**
- **[MatrixAI js-quic](https://github.com/MatrixAI/js-quic)** - Pure JavaScript QUIC implementation with HTTP/3 and WebTransport support

### **TLS** 
- **[SubTLS](https://github.com/jawj/subtls)** - Lightweight TLS 1.3 implementation in TypeScript for browsers and Deno

### **HTTP**
- **Custom HTTP/1.1 Implementation** - Built from scratch using Direct Sockets API with full RFC compliance

### **WebSocket**
- **Custom WebSocket Implementation** - RFC 6455 compliant WebSocket server with frame parsing and connection management

## 📁 Project Structure

```
src/
├── main.ts                 # Main IWA application with server UI
├── server.ts              # Demo server implementation
├── http-server.ts         # Core HTTP server class
├── websocket-server.ts    # WebSocket connection handler
├── direct-sockets.d.ts    # TypeScript definitions for Direct Sockets API
├── service-worker.ts      # Service worker for offline support
└── style.css             # Application styles

examples/
├── test-http.html         # Interactive HTML test client
└── test-client.js         # Programmatic test utilities
```

## 🛠️ Development Setup

1. **Clone and install dependencies:**
   ```bash
   bun install
   ```

2. **Start development server:**
   ```bash
   bun run dev
   ```

3. **Build for production:**
   ```bash
   bun run build
   ```

## 🔧 Usage

### Starting the HTTP Server

1. Open your AppStore IWA in Chrome with Direct Sockets support
2. Click the "Start Server" button in the UI
3. The server will start on `http://localhost:44818`
4. Click "Open Server Page" to test the server

### Available Endpoints

- `GET /` - Server homepage with interactive tests
- `GET /api/status` - Server status and information
- `GET /api/time` - Current server time
- `POST /api/echo` - Echo back the request body
- `WebSocket ws://localhost:44818/ws` - WebSocket echo server

### Testing the Server

#### Option 1: Built-in Web Interface
1. Start the server in your IWA
2. Click "Open Server Page" 
3. Use the interactive test buttons

#### Option 2: External Test Client
1. Open `examples/test-http.html` in any browser
2. Use the test buttons to verify functionality

#### Option 3: Programmatic Testing
```javascript
// Load the test utilities
// In browser console or include examples/test-client.js

// Run all tests
await IWAServerTests.runAllTests();

// Or run individual tests
await IWAServerTests.testHttpEndpoints();
await IWAServerTests.testWebSocket();
await IWAServerTests.testCors();
```

## 🏗️ Architecture

### HTTP Server (`src/http-server.ts`)

The `HttpServer` class provides a complete HTTP/1.1 server implementation:

```typescript
import { HttpServer } from './http-server.js';

const server = new HttpServer({
  host: '0.0.0.0',
  port: 44818,
  onRequest: async (request, response) => {
    // Handle HTTP requests
    await response.json({ message: 'Hello World!' });
  },
  onWebSocket: async (ws) => {
    // Handle WebSocket connections
    await ws.send('Welcome!');
  }
});

await server.listen();
```

### WebSocket Server (`src/websocket-server.ts`)

The `WebSocketConnection` class handles WebSocket protocol:

```typescript
import { WebSocketConnection } from './websocket-server.js';

// WebSocket connection is automatically created during HTTP upgrade
// Handle incoming messages:
const reader = ws.incomingStream.getReader();
while (!ws.closed) {
  const { value } = await reader.read();
  const { opcode, payload } = value;
  
  if (opcode === ws.opcodes.TEXT) {
    const message = new TextDecoder().decode(payload);
    await ws.send(`Echo: ${message}`);
  }
}
```

### Direct Sockets Integration

The server uses Chrome's Direct Sockets API:

```typescript
// Create TCP server socket
const socket = new TCPServerSocket('0.0.0.0', { localPort: 44818 });
const { readable: server } = await socket.opened;

// Handle incoming connections
await server.pipeTo(new WritableStream({
  write: async (connection) => {
    const { readable, writable } = await connection.opened;
    // Handle HTTP/WebSocket protocols
  }
}));
```

## 🔒 Security Considerations

### Private Network Access
The server includes proper CORS headers for Chrome's Private Network Access:
- `Access-Control-Allow-Private-Network: true`
- `Access-Control-Allow-Origin: *`
- Handles OPTIONS preflight requests

### Isolated Web App Context
- Runs in a secure IWA environment
- No access to user's file system or sensitive APIs
- Network access limited to Direct Sockets API

## 🧪 Testing

### Chrome Launch Flags
For testing, launch Chrome with:
```bash
chrome --unsafely-treat-insecure-origin-as-secure=http://localhost:44818
```

### Test Scenarios
1. **HTTP Requests**: GET, POST, OPTIONS methods
2. **WebSocket**: Connection, messaging, close handling
3. **CORS**: Preflight requests and headers
4. **Error Handling**: 404 responses, malformed requests

## 📚 API Reference

### HttpServer Class

```typescript
class HttpServer {
  constructor(options: HttpServerOptions)
  async listen(): Promise<void>
  async close(): Promise<void>
}

interface HttpServerOptions {
  host?: string;
  port?: number;
  onRequest?: (request: HttpRequest, response: HttpResponse) => Promise<void>;
  onWebSocket?: (ws: WebSocketConnection) => Promise<void>;
}
```

### HttpResponse Class

```typescript
class HttpResponse {
  setStatus(code: number, text?: string): void
  setHeader(name: string, value: string): void
  async write(data: string | Uint8Array): Promise<void>
  async end(data?: string | Uint8Array): Promise<void>
  async json(obj: any): Promise<void>
  async text(text: string): Promise<void>
  async html(html: string): Promise<void>
}
```

### WebSocketConnection Class

```typescript
class WebSocketConnection {
  readonly incomingStream: ReadableStream<{opcode: number, payload: Uint8Array}>
  readonly opcodes: { TEXT: 1, BINARY: 2, PING: 9, PONG: 10, CLOSE: 8 }
  
  async send(data: string | Uint8Array): Promise<void>
  async close(code?: number, reason?: string): Promise<void>
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the Apache License 2.0 - see the original license headers in the source files.

## 🔗 References

- [WICG Direct Sockets Specification](https://wicg.github.io/direct-sockets/)
- [Isolated Web Apps](https://github.com/WICG/isolated-web-apps)
- [Private Network Access](https://developer.chrome.com/blog/private-network-access-preflight)
- [WebSocket Protocol RFC 6455](https://tools.ietf.org/html/rfc6455)
- [HTTP/1.1 Specification](https://tools.ietf.org/html/rfc7230)

## 🐛 Troubleshooting

### Common Issues

1. **Server won't start**: Ensure Chrome supports Direct Sockets and IWA is properly installed
2. **CORS errors**: Check that proper headers are being sent
3. **WebSocket connection fails**: Verify the WebSocket URL and protocol
4. **Port already in use**: Change the port in server configuration

### Debug Tips

1. Check browser console for errors
2. Use Chrome DevTools Network tab to inspect requests
3. Enable verbose logging in the server code
4. Test with the provided example clients first