/**
 * WebSocket Server implementation for IWAs
 * JavaScript version for browser compatibility
 */

/**
 * Mock WebSocket implementation for QUIC-based WebSockets
 */
export class QUICWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = QUICWebSocket.CONNECTING;
    this.protocol = '';
    this.extensions = '';
    this.bufferedAmount = 0;
    
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;

    // Mock connection establishment
    setTimeout(() => {
      this.readyState = QUICWebSocket.OPEN;
      if (this.onopen) {
        this.onopen({ type: 'open', target: this });
      }
    }, 100);
  }

  send(data) {
    if (this.readyState !== QUICWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }

    // Mock echo response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          type: 'message',
          data: data,
          target: this
        });
      }
    }, 50);
  }

  close(code = 1000, reason = '') {
    if (this.readyState === QUICWebSocket.CLOSED || 
        this.readyState === QUICWebSocket.CLOSING) {
      return;
    }

    this.readyState = QUICWebSocket.CLOSING;
    
    setTimeout(() => {
      this.readyState = QUICWebSocket.CLOSED;
      if (this.onclose) {
        this.onclose({
          type: 'close',
          code,
          reason,
          wasClean: true,
          target: this
        });
      }
    }, 10);
  }

  addEventListener(type, listener) {
    if (type === 'open') this.onopen = listener;
    else if (type === 'close') this.onclose = listener;
    else if (type === 'message') this.onmessage = listener;
    else if (type === 'error') this.onerror = listener;
  }

  removeEventListener(type, listener) {
    if (type === 'open' && this.onopen === listener) this.onopen = null;
    else if (type === 'close' && this.onclose === listener) this.onclose = null;
    else if (type === 'message' && this.onmessage === listener) this.onmessage = null;
    else if (type === 'error' && this.onerror === listener) this.onerror = null;
  }

  static Server = class QUICWebSocketServer {
    constructor(options = {}) {
      this.port = options.port || 8445;
      this.cert = options.cert;
      this.connections = new Set();
      this.isListening = false;
    }

    async start() {
      this.isListening = true;
      console.log(`QUIC WebSocket server started on port ${this.port}`);
    }

    async stop() {
      this.isListening = false;
      for (const connection of this.connections) {
        connection.close();
      }
      this.connections.clear();
      console.log('QUIC WebSocket server stopped');
    }

    on(event, handler) {
      if (event === 'connection') {
        this.connectionHandler = handler;
      }
    }
  };
}

/**
 * WebSocket Connection wrapper for enhanced functionality
 */
export class WebSocketConnection {
  constructor(readable, writer) {
    this.readable = readable;
    this.writer = writer;
    this.closed = false;
    this.opcodes = {
      CONTINUATION: 0x0,
      TEXT: 0x1,
      BINARY: 0x2,
      CLOSE: 0x8,
      PING: 0x9,
      PONG: 0xa
    };
    
    this.incomingStream = new ReadableStream({
      start: (controller) => {
        this.incomingController = controller;
      }
    });
  }

  async processWebSocketStream() {
    try {
      const reader = this.readable.getReader();
      
      while (!this.closed) {
        const { value, done } = await reader.read();
        if (done) break;
        
        // Mock WebSocket frame parsing
        const frame = this.parseWebSocketFrame(value);
        if (frame && this.incomingController) {
          this.incomingController.enqueue(frame);
        }
      }
    } catch (error) {
      console.error('WebSocket stream processing error:', error);
    }
  }

  parseWebSocketFrame(data) {
    // Mock frame parsing - in real implementation, this would parse actual WebSocket frames
    return {
      opcode: this.opcodes.TEXT,
      payload: data
    };
  }

  async writeFrame(opcode, payload) {
    if (this.closed) return;

    try {
      // Mock WebSocket frame creation
      const frame = this.createWebSocketFrame(opcode, payload);
      await this.writer.write(frame);
    } catch (error) {
      console.error('WebSocket frame write error:', error);
    }
  }

  createWebSocketFrame(opcode, payload) {
    // Mock frame creation - in real implementation, this would create proper WebSocket frames
    const header = new Uint8Array([0x80 | opcode, payload.length]);
    const frame = new Uint8Array(header.length + payload.length);
    frame.set(header, 0);
    frame.set(payload, header.length);
    return frame;
  }

  async close(code = 1000, reason = new Uint8Array()) {
    if (this.closed) return;
    
    this.closed = true;
    
    try {
      await this.writeFrame(this.opcodes.CLOSE, reason);
      if (this.incomingController) {
        this.incomingController.close();
      }
    } catch (error) {
      console.error('WebSocket close error:', error);
    }
  }

  async ping(data = new Uint8Array()) {
    await this.writeFrame(this.opcodes.PING, data);
  }

  async pong(data = new Uint8Array()) {
    await this.writeFrame(this.opcodes.PONG, data);
  }
}

/**
 * WebSocket Header Parser for enhanced validation
 */
export class WebSocketHeaderParser {
  static validateWebSocketRequest(headers) {
    const requiredHeaders = [
      'upgrade',
      'connection',
      'sec-websocket-key',
      'sec-websocket-version'
    ];

    const errors = [];

    for (const header of requiredHeaders) {
      if (!headers.has(header)) {
        errors.push(`Missing required header: ${header}`);
      }
    }

    if (headers.get('upgrade')?.toLowerCase() !== 'websocket') {
      errors.push('Invalid upgrade header');
    }

    if (!headers.get('connection')?.toLowerCase().includes('upgrade')) {
      errors.push('Invalid connection header');
    }

    const version = headers.get('sec-websocket-version');
    if (version !== '13') {
      errors.push(`Unsupported WebSocket version: ${version}`);
    }

    return {
      valid: errors.length === 0,
      error: errors.join(', ')
    };
  }

  static async generateAcceptKey(clientKey) {
    const magicString = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    const concatenated = clientKey + magicString;
    const encoder = new TextEncoder();
    const data = encoder.encode(concatenated);
    
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    return btoa(String.fromCharCode(...hashArray));
  }

  static parseExtensions(extensionsHeader) {
    if (!extensionsHeader) return [];
    
    return extensionsHeader.split(',').map(ext => {
      const [name, ...params] = ext.trim().split(';');
      return {
        name: name.trim(),
        params: params.map(p => p.trim())
      };
    });
  }

  static parseSubprotocols(protocolHeader) {
    if (!protocolHeader) return [];
    
    return protocolHeader.split(',').map(protocol => protocol.trim());
  }
}

/**
 * Enhanced WebSocket Server with QUIC support
 */
export class EnhancedWebSocketServer {
  constructor(options = {}) {
    this.port = options.port || 8080;
    this.host = options.host || '0.0.0.0';
    this.enableQUIC = options.enableQUIC ?? false;
    this.connections = new Set();
    this.messageHandlers = new Map();
    this.connectionHandler = null;
  }

  async start() {
    console.log(`Enhanced WebSocket server starting on ${this.host}:${this.port}`);
    
    if (this.enableQUIC) {
      console.log('QUIC WebSocket support enabled');
    }
    
    // Mock server startup
    this.isListening = true;
    console.log('✅ Enhanced WebSocket server started');
  }

  async stop() {
    this.isListening = false;
    
    for (const connection of this.connections) {
      await connection.close();
    }
    
    this.connections.clear();
    console.log('✅ Enhanced WebSocket server stopped');
  }

  onConnection(handler) {
    this.connectionHandler = handler;
  }

  onMessage(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  broadcast(message, filter = null) {
    for (const connection of this.connections) {
      if (!filter || filter(connection)) {
        this.sendToConnection(connection, message);
      }
    }
  }

  async sendToConnection(connection, message) {
    try {
      const payload = new TextEncoder().encode(JSON.stringify(message));
      await connection.writeFrame(connection.opcodes.TEXT, payload);
    } catch (error) {
      console.error('Failed to send message to connection:', error);
    }
  }

  addConnection(connection) {
    this.connections.add(connection);
    
    if (this.connectionHandler) {
      this.connectionHandler(connection);
    }

    // Set up message handling
    connection.incomingStream.pipeTo(
      new WritableStream({
        write: async (frame) => {
          await this.handleIncomingFrame(connection, frame);
        }
      })
    ).catch(error => {
      console.error('Connection stream error:', error);
      this.removeConnection(connection);
    });
  }

  removeConnection(connection) {
    this.connections.delete(connection);
  }

  async handleIncomingFrame(connection, frame) {
    try {
      if (frame.opcode === connection.opcodes.TEXT) {
        const text = new TextDecoder().decode(frame.payload);
        const message = JSON.parse(text);
        
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          await handler(connection, message);
        }
      } else if (frame.opcode === connection.opcodes.PING) {
        await connection.pong(frame.payload);
      } else if (frame.opcode === connection.opcodes.CLOSE) {
        await connection.close();
        this.removeConnection(connection);
      }
    } catch (error) {
      console.error('Frame handling error:', error);
    }
  }

  getStats() {
    return {
      connections: this.connections.size,
      isListening: this.isListening,
      enableQUIC: this.enableQUIC
    };
  }
}

/**
 * WebSocket Connection Pool for managing multiple connections
 */
export class WebSocketConnectionPool {
  constructor(options = {}) {
    this.maxConnections = options.maxConnections || 100;
    this.connectionTimeout = options.connectionTimeout || 30000;
    this.connections = new Map();
    this.stats = {
      created: 0,
      closed: 0,
      active: 0,
      errors: 0
    };
  }

  async createConnection(url, protocols = []) {
    if (this.connections.size >= this.maxConnections) {
      throw new Error('Connection pool limit reached');
    }

    const connectionId = this.generateConnectionId();
    
    try {
      const ws = new QUICWebSocket(url);
      
      const connection = {
        id: connectionId,
        ws,
        created: Date.now(),
        lastActivity: Date.now(),
        url,
        protocols
      };

      ws.onopen = () => {
        this.stats.active++;
        connection.lastActivity = Date.now();
      };

      ws.onclose = () => {
        this.stats.active--;
        this.stats.closed++;
        this.connections.delete(connectionId);
      };

      ws.onerror = () => {
        this.stats.errors++;
      };

      ws.onmessage = () => {
        connection.lastActivity = Date.now();
      };

      this.connections.set(connectionId, connection);
      this.stats.created++;

      return connection;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  getConnection(connectionId) {
    return this.connections.get(connectionId);
  }

  async closeConnection(connectionId, code = 1000, reason = '') {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.ws.close(code, reason);
      this.connections.delete(connectionId);
    }
  }

  async closeAllConnections() {
    for (const [connectionId] of this.connections) {
      await this.closeConnection(connectionId);
    }
  }

  cleanupStaleConnections() {
    const now = Date.now();
    const staleConnections = [];

    for (const [connectionId, connection] of this.connections) {
      if (now - connection.lastActivity > this.connectionTimeout) {
        staleConnections.push(connectionId);
      }
    }

    for (const connectionId of staleConnections) {
      this.closeConnection(connectionId, 1001, 'Connection timeout');
    }

    return staleConnections.length;
  }

  getStats() {
    return {
      ...this.stats,
      poolSize: this.connections.size,
      maxConnections: this.maxConnections
    };
  }

  generateConnectionId() {
    return `ws_conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * WebSocket Message Router for handling different message types
 */
export class WebSocketMessageRouter {
  constructor() {
    this.routes = new Map();
    this.middleware = [];
    this.errorHandler = null;
  }

  route(messageType, handler) {
    this.routes.set(messageType, handler);
  }

  use(middleware) {
    this.middleware.push(middleware);
  }

  onError(handler) {
    this.errorHandler = handler;
  }

  async handleMessage(connection, message) {
    try {
      // Apply middleware
      for (const middleware of this.middleware) {
        const result = await middleware(connection, message);
        if (result === false) {
          return; // Middleware blocked the message
        }
      }

      // Route the message
      const handler = this.routes.get(message.type);
      if (handler) {
        await handler(connection, message);
      } else {
        console.warn(`No handler for message type: ${message.type}`);
      }
    } catch (error) {
      if (this.errorHandler) {
        await this.errorHandler(connection, message, error);
      } else {
        console.error('Message handling error:', error);
      }
    }
  }

  // Built-in middleware
  static authMiddleware(requiredAuth = true) {
    return async (connection, message) => {
      if (requiredAuth && !connection.authenticated) {
        await connection.writeFrame(connection.opcodes.TEXT, 
          new TextEncoder().encode(JSON.stringify({
            type: 'error',
            message: 'Authentication required'
          }))
        );
        return false;
      }
      return true;
    };
  }

  static rateLimitMiddleware(maxMessages = 100, windowMs = 60000) {
    const messageCounts = new Map();
    
    return async (connection, message) => {
      const now = Date.now();
      const connectionId = connection.id || 'unknown';
      
      if (!messageCounts.has(connectionId)) {
        messageCounts.set(connectionId, []);
      }
      
      const messages = messageCounts.get(connectionId);
      const validMessages = messages.filter(time => now - time < windowMs);
      
      if (validMessages.length >= maxMessages) {
        await connection.writeFrame(connection.opcodes.TEXT,
          new TextEncoder().encode(JSON.stringify({
            type: 'error',
            message: 'Rate limit exceeded'
          }))
        );
        return false;
      }
      
      validMessages.push(now);
      messageCounts.set(connectionId, validMessages);
      return true;
    };
  }

  static loggingMiddleware() {
    return async (connection, message) => {
      console.log(`WebSocket message: ${message.type} from ${connection.id || 'unknown'}`);
      return true;
    };
  }
}