<div align="center">
<img width="225" height="225" alt="image (4)" src="https://github.com/user-attachments/assets/3538cfec-d5aa-4fa7-8d36-c8a248689fcc" />



</div>

# AppStore

A browser embedable http server running inside an Isolated Web App (IWA) using the Direct Sockets API. TLS, QUIC, and WS are supported.

## Motivations

This project is driven by a vision of **decentralized local computing** where services run directly on user devices and participate in collaborative networks. Our core motivations include:

### Local-First Architecture
- **Device Autonomy**: Run powerful services directly on your local machine without relying on remote servers
- **Privacy by Design**: Keep your data and processing local, reducing exposure to external services
- **Offline Capability**: Maintain full functionality even without internet connectivity
- **Resource Efficiency**: Leverage local computing power instead of consuming remote resources

### Collaborative Network Participation
- **Peer-to-Peer Services**: Enable devices to serve content and APIs to other devices in the network
- **Distributed Computing**: Participate in distributed workloads where each device contributes processing power
- **Local Service Discovery**: Automatically discover and connect to services running on nearby devices
- **Edge Computing**: Bring computation closer to where data is generated and consumed

### Local Serving Focus
- **Direct Device Communication**: Bypass traditional client-server models with direct device-to-device communication
- **Local API Ecosystems**: Create rich local API environments that can operate independently
- **Reduced Latency**: Eliminate network round-trips by serving content directly from local devices
- **Bandwidth Conservation**: Reduce internet bandwidth usage by serving content locally
- **Community Networks**: Enable local communities to create their own service networks

This approach represents a fundamental shift toward **user-controlled computing environments** where individuals and communities can run their own services, participate in local networks, and maintain sovereignty over their digital infrastructure.

## Chrome Installation & Quickstart

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

## Features

- **HTTP/1.1 Server**: Full HTTP server with support for GET, POST, OPTIONS, and other methods
- **WebSocket Server**: Real-time bidirectional communication with WebSocket protocol support
- **CORS Support**: Proper Cross-Origin Resource Sharing headers for web compatibility
- **Private Network Access**: Handles Chrome's Private Network Access requirements
- **TypeScript**: Fully typed implementation with Direct Sockets API definitions
- **Bun Integration**: Built with Bun for modern development experience

## 🏆 Heroes

The implementations we're using for core protocols:

### **QUIC**
- **[MatrixAI js-quic](https://github.com/MatrixAI/js-quic)** - Pure JavaScript QUIC implementation with HTTP/3 and WebTransport support

### **TLS** 
- **[SubTLS](https://github.com/jawj/subtls)** - Lightweight TLS 1.3 implementation in TypeScript for browsers and Deno

### **HTTP**
- **Custom HTTP/1.1 Implementation** - Built from scratch using Direct Sockets API with full RFC compliance

### **WebSocket**
- **Custom WebSocket Implementation** - RFC 6455 compliant WebSocket server with frame parsing and connection management

### **LLM**
- **[Claude Opus 4.1](claude-opus-4-1-20250805)** - Advanced AI model for intelligent code generation and system design

### **Direct Sockets API**
- **Adam Roach** (Mozilla) - API specification and implementation
- **Thomas Nattestad** (Google) - API design and Chrome integration

### **Isolated Web Apps (IWA)**
- **Dominic Farolino** (Google) - IWA architecture and standards
- **Luai Al-assar** (Google) - IWA implementation and tooling
- **Alan Cutter** (Google) - IWA security and deployment

### **WebAuthn**
- **Michael B. Jones** (Microsoft) - Authentication standards and protocols
- **Akshay Kumar** (Google) - WebAuthn implementation
- **Jeff Hodges** (Google) - Security architecture
- **J.C. Jones** (Mozilla) - Cross-browser compatibility
- **Christiaan Brand** (Google) - Authentication UX and integration

## Project Structure

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

## Development Setup

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

## Usage

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

### AI/ML Endpoints

The server includes integrated AI and machine learning capabilities for local processing:

- `POST /api/ai/chat` - Local chat completion using embedded language models
- `POST /api/ai/embedding` - Generate text embeddings for semantic search
- `POST /api/ai/classification` - Text classification and sentiment analysis
- `POST /api/ai/summarization` - Document summarization and key point extraction
- `GET /api/ai/models` - List available local AI models and their capabilities
- `POST /api/ai/vision` - Image analysis and object detection using MediaPipe
- `POST /api/ai/audio` - Audio processing and speech recognition
- `WebSocket ws://localhost:44818/ai-stream` - Real-time AI processing with streaming responses

#### AI Model Management
- `GET /api/ai/models/status` - Check model loading status and memory usage
- `POST /api/ai/models/load` - Load specific AI models into memory
- `POST /api/ai/models/unload` - Unload models to free memory
- `GET /api/ai/models/benchmark` - Performance benchmarks for loaded models

#### Edge AI Features
- **Local Inference**: All AI processing happens locally without sending data to external services
- **Model Caching**: Intelligent caching of frequently used models for faster response times
- **Resource Management**: Automatic memory management and model lifecycle handling
- **Multi-Modal Support**: Text, image, and audio processing capabilities
- **Real-time Processing**: Streaming responses for interactive AI applications

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

## MCP (Model Context Protocol) Configuration

This project includes a built-in MCP server implementation that enables AI models to connect with external tools and data sources using standardized communication protocols.

### MCP Server Features

- **HTTP Resumable Transport**: Implements MCP specification with resumable HTTP transport
- **Session Management**: Automatic session creation and cleanup
- **JSON-RPC 2.0 Compliance**: Full JSON-RPC 2.0 protocol support
- **Tool Integration**: Connect AI models with MediaPipe, Kotlin.js RAG, and function calling
- **Real-time Communication**: WebSocket support for streaming AI responses

### MCP Configuration

The MCP server is automatically configured when the AI/ML server initializes. No additional configuration files are required.

#### Default MCP Settings

```typescript
// MCP Server Configuration (automatically applied)
const mcpConfig = {
  endpoint: '/api/ai/mcp',
  protocolVersion: '2025-03-26',
  transport: 'http-resumable',
  sessionTimeout: 300000, // 5 minutes
  maxSessions: 100,
  features: {
    tools: true,
    resources: true,
    prompts: true,
    sampling: true
  }
};
```

#### MCP Client Configuration

To connect an MCP client to this server, use the following configuration:

```json
{
  "mcpServers": {
    "iwa-local-server": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-H", "x-mcp-session-id: your-session-id",
        "http://localhost:44818/api/ai/mcp"
      ],
      "transport": "http"
    }
  }
}
```

#### Claude Desktop MCP Configuration

For Claude Desktop integration, add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "iwa-project-templates": {
      "command": "node",
      "args": ["-e", "
        const http = require('http');
        const options = {
          hostname: 'localhost',
          port: 44818,
          path: '/api/ai/mcp',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        };
        process.stdin.on('data', (data) => {
          const req = http.request(options, (res) => {
            res.on('data', (chunk) => process.stdout.write(chunk));
          });
          req.write(data);
          req.end();
        });
      "],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Available MCP Tools

The server exposes the following tools through the MCP protocol:

#### Core Tools
- `get_server_status` - Get current server status and capabilities
- `list_endpoints` - List all available API endpoints
- `get_system_info` - Retrieve system information and resource usage

#### AI/ML Tools
- `generate_text` - Generate text using local language models
- `process_image` - Analyze images using MediaPipe computer vision
- `execute_rag_query` - Perform retrieval-augmented generation queries
- `call_function` - Execute Kotlin.js function calls
- `get_embeddings` - Generate text embeddings for semantic search

#### MediaPipe Tools
- `detect_objects` - Object detection in images
- `analyze_pose` - Human pose estimation
- `recognize_gestures` - Hand gesture recognition
- `segment_image` - Image segmentation and masking

### MCP Usage Examples

#### Initialize MCP Connection

```bash
curl -X POST http://localhost:44818/api/ai/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {
        "tools": {},
        "resources": {},
        "prompts": {}
      },
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'
```

#### List Available Tools

```bash
curl -X POST http://localhost:44818/api/ai/mcp \
  -H "Content-Type: application/json" \
  -H "x-mcp-session-id: your-session-id" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'
```

#### Execute a Tool

```bash
curl -X POST http://localhost:44818/api/ai/mcp \
  -H "Content-Type: application/json" \
  -H "x-mcp-session-id: your-session-id" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "generate_text",
      "arguments": {
        "prompt": "Explain quantum computing",
        "max_tokens": 100
      }
    }
  }'
```

### MCP Session Management

Sessions are automatically created and managed:

- **Session Creation**: Automatic on first request or via `x-mcp-session-id` header
- **Session Timeout**: 5 minutes of inactivity
- **Session Cleanup**: Automatic cleanup every 5 minutes
- **Session Persistence**: Messages stored for resumability

### Troubleshooting MCP

#### Common Issues

1. **Connection Refused**: Ensure the IWA server is running on port 44818
2. **Invalid JSON-RPC**: Verify `jsonrpc: "2.0"` is included in all requests
3. **Session Expired**: Check session timeout and create a new session
4. **Tool Not Found**: Use `tools/list` to see available tools

#### Debug Mode

Enable MCP debug logging by setting the debug flag:

```javascript
// In browser console when server is running
localStorage.setItem('mcp-debug', 'true');
// Reload the page to see detailed MCP logs
```

### MCP Protocol Compliance

This implementation follows the official MCP specification:

- **Protocol Version**: 2025-03-26
- **Transport**: HTTP with resumable support
- **Message Format**: JSON-RPC 2.0
- **Capabilities**: Tools, Resources, Prompts, Sampling
- **Error Handling**: Standard JSON-RPC error codes
- **Session Management**: Custom session handling for HTTP transport

For more information about the MCP protocol, visit: https://modelcontextprotocol.io/

## Architecture

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

### QUIC Server (`src/quic-server.ts`)

The `QuicServer` class provides HTTP/3 and WebTransport support using the MatrixAI js-quic library:

```typescript
import { QuicServer } from './quic-server.js';

const server = new QuicServer({
  host: '0.0.0.0',
  port: 44819,
  onStream: async (stream) => {
    // Handle QUIC streams
    const reader = stream.readable.getReader();
    const writer = stream.writable.getWriter();
    // Process HTTP/3 or WebTransport data
  }
});

await server.listen();
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

## Security Considerations

### Private Network Access
The server includes proper CORS headers for Chrome's Private Network Access:
- `Access-Control-Allow-Private-Network: true`
- `Access-Control-Allow-Origin: *`
- Handles OPTIONS preflight requests

### Isolated Web App Context
- Runs in a secure IWA environment
- No access to user's file system or sensitive APIs
- Network access limited to Direct Sockets API

### Controlled Frames
- **What they are**: Controlled Frames allow IWAs to embed and control external web content within secure, sandboxed iframe-like containers with enhanced permissions and communication capabilities
- **Benefits**: Enable secure integration of third-party services, controlled cross-origin communication, and the ability to grant specific permissions to embedded content while maintaining isolation
- **Security model**: Provides fine-grained control over what embedded content can access, including network permissions, storage access, and API capabilities
- **Potential abuse vectors**: 
  - **Permission escalation**: Malicious embedded content could attempt to exploit granted permissions beyond intended scope
  - **Data exfiltration**: Compromised frames might try to access or transmit sensitive local data through permitted communication channels
  - **Resource exhaustion**: Embedded content could consume excessive system resources (CPU, memory, network) affecting the host IWA performance
  - **Social engineering**: Malicious frames could present deceptive UI to trick users into granting additional permissions or revealing sensitive information
- **Mitigation strategies**: Implement strict Content Security Policy (CSP), validate all frame communications, limit granted permissions to minimum required, and regularly audit embedded content sources

## Testing

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

## API Reference

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the original license headers in the source files.

## References

- [WICG Direct Sockets Specification](https://wicg.github.io/direct-sockets/)
- [Isolated Web Apps](https://github.com/WICG/isolated-web-apps)
- [Private Network Access](https://developer.chrome.com/blog/private-network-access-preflight)
- [WebSocket Protocol RFC 6455](https://tools.ietf.org/html/rfc6455)
- [HTTP/1.1 Specification](https://tools.ietf.org/html/rfc7230)

## Troubleshooting

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

<img width="3691" height="284" alt="Untitled 8@2x" src="https://github.com/user-attachments/assets/88d6cb05-ca95-4247-aea9-68022b91adda" />

