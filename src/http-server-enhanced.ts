/**
 * Enhanced HTTP Server implementation using Direct Sockets TCPServerSocket
 * With improved header parsing and WebSocket support
 */

import { WebSocketConnection } from './websocket-server.js';
import { HttpRequestParser, WebSocketHeaderParser } from './http-parser.js';

export interface HttpRequest {
  method: string;
  uri: string;
  protocol: string;
  headers: Headers;
  body?: string;
  url: URL;
}

export interface HttpServerOptions {
  host?: string;
  port?: number;
  onRequest?: (request: HttpRequest, response: HttpResponse) => Promise<void> | void;
  onWebSocket?: (ws: WebSocketConnection) => Promise<void> | void;
}

export class HttpResponse {
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private encoder = new TextEncoder();
  private headersSent = false;
  private statusCode = 200;
  private statusText = 'OK';
  private responseHeaders = new Map<string, string>();

  constructor(writer: WritableStreamDefaultWriter<Uint8Array>) {
    this.writer = writer;
    
    // Set default CORS headers for IWA
    this.setHeader('Access-Control-Allow-Origin', '*');
    this.setHeader('Access-Control-Allow-Private-Network', 'true');
    this.setHeader('Access-Control-Allow-Headers', 'Access-Control-Request-Private-Network');
  }

  setStatus(code: number, text?: string): void {
    if (this.headersSent) {
      throw new Error('Headers already sent');
    }
    this.statusCode = code;
    this.statusText = text || this.getDefaultStatusText(code);
  }

  setHeader(name: string, value: string): void {
    if (this.headersSent) {
      throw new Error('Headers already sent');
    }
    this.responseHeaders.set(name.toLowerCase(), value);
  }

  async writeHead(): Promise<void> {
    if (this.headersSent) return;
    
    await this.writer.ready;
    await this.writer.write(this.encoder.encode(`HTTP/1.1 ${this.statusCode} ${this.statusText}\r\n`));
    
    for (const [name, value] of this.responseHeaders) {
      await this.writer.write(this.encoder.encode(`${name}: ${value}\r\n`));
    }
    
    await this.writer.write(this.encoder.encode('\r\n'));
    this.headersSent = true;
  }

  async write(data: string | Uint8Array): Promise<void> {
    if (!this.headersSent) {
      await this.writeHead();
    }
    
    await this.writer.ready;
    if (typeof data === 'string') {
      await this.writer.write(this.encoder.encode(data));
    } else {
      await this.writer.write(data);
    }
  }

  async end(data?: string | Uint8Array): Promise<void> {
    if (data) {
      await this.write(data);
    }
    if (!this.headersSent) {
      await this.writeHead();
    }
    await this.writer.close();
  }

  async json(obj: any): Promise<void> {
    this.setHeader('content-type', 'application/json');
    await this.end(JSON.stringify(obj));
  }

  async text(text: string): Promise<void> {
    this.setHeader('content-type', 'text/plain');
    await this.end(text);
  }

  async html(html: string): Promise<void> {
    this.setHeader('content-type', 'text/html');
    await this.end(html);
  }

  private getDefaultStatusText(code: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      500: 'Internal Server Error',
    };
    return statusTexts[code] || 'Unknown';
  }
}

export class HttpServer {
  private socket?: TCPServerSocket;
  private options: HttpServerOptions;
  private decoder = new TextDecoder();
  private abortController = new AbortController();
  private pendingRequests = new Map<string, { buffer: Uint8Array; timestamp: number }>();

  constructor(options: HttpServerOptions = {}) {
    this.options = {
      host: '0.0.0.0',
      port: 44818,
      ...options,
    };

    // Clean up old pending requests every 30 seconds
    setInterval(() => this.cleanupPendingRequests(), 30000);
  }

  private cleanupPendingRequests(): void {
    const now = Date.now();
    const timeout = 30000; // 30 seconds

    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > timeout) {
        console.log(`Cleaning up stale request: ${key}`);
        this.pendingRequests.delete(key);
      }
    }
  }

  private parseRequest(data: Uint8Array, connectionId: string): HttpRequest | null {
    try {
      // Check if we have a pending partial request
      const existing = this.pendingRequests.get(connectionId);
      let fullData = data;

      if (existing) {
        // Combine with existing data
        const combined = new Uint8Array(existing.buffer.length + data.length);
        combined.set(existing.buffer);
        combined.set(data, existing.buffer.length);
        fullData = combined;
      }

      const baseUrl = `http://${this.options.host}:${this.options.port}`;
      const parsed = HttpRequestParser.parseRequest(fullData, baseUrl);

      if (!parsed.isComplete) {
        // Store partial request for later
        this.pendingRequests.set(connectionId, {
          buffer: fullData,
          timestamp: Date.now(),
        });
        return null;
      }

      // Request is complete, remove from pending
      this.pendingRequests.delete(connectionId);

      // Convert to our HttpRequest interface
      return {
        method: parsed.method,
        uri: parsed.uri,
        protocol: parsed.protocol,
        headers: parsed.headers,
        body: parsed.body ? this.decoder.decode(parsed.body) : undefined,
        url: parsed.url,
      };

    } catch (error) {
      console.error('Request parsing error:', error);
      this.pendingRequests.delete(connectionId);
      throw error;
    }
  }

  private async handleOptionsRequest(response: HttpResponse): Promise<void> {
    response.setStatus(204);
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Request-Private-Network');
    await response.end();
  }

  private async handleWebSocketUpgrade(
    request: HttpRequest,
    writer: WritableStreamDefaultWriter<Uint8Array>,
    readable: ReadableStream<Uint8Array>
  ): Promise<void> {
    // Enhanced WebSocket validation
    const validation = WebSocketHeaderParser.validateWebSocketRequest(request.headers);
    if (!validation.valid) {
      throw new Error(`WebSocket validation failed: ${validation.error}`);
    }

    const key = request.headers.get('sec-websocket-key')!;
    const acceptKey = await WebSocketHeaderParser.generateAcceptKey(key);

    // Parse extensions and subprotocols
    const extensions = WebSocketHeaderParser.parseExtensions(
      request.headers.get('sec-websocket-extensions') || undefined
    );
    const subprotocols = WebSocketHeaderParser.parseSubprotocols(
      request.headers.get('sec-websocket-protocol') || undefined
    );

    console.log('WebSocket upgrade:', { extensions, subprotocols });

    // Send upgrade response
    const encoder = new TextEncoder();
    let response = 'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${acceptKey}\r\n`;

    // Add subprotocol if supported (for now, just echo the first one)
    if (subprotocols.length > 0) {
      response += `Sec-WebSocket-Protocol: ${subprotocols[0]}\r\n`;
    }

    response += '\r\n';

    await writer.write(encoder.encode(response));
    
    const { readable: wsReadable, writable: wsWritable } = new TransformStream<Uint8Array, Uint8Array>();
    
    const ws = new WebSocketConnection(wsReadable, writer);
    
    // Start processing WebSocket frames
    ws.processWebSocketStream().catch(console.error);
    
    // Handle incoming WebSocket messages
    ws.incomingStream.pipeTo(
      new WritableStream({
        write: async ({ opcode, payload }) => {
          if (opcode === ws.opcodes.CLOSE && payload.buffer.byteLength === 0) {
            await ws.close(1000, payload);
            return;
          }
          
          // Echo back the message for now (can be customized)
          await ws.writeFrame(opcode, payload);
        },
      })
    ).catch(() => {
      console.log('WebSocket stream closed');
      if (!ws.closed) {
        Promise.allSettled([
          ws.close(),
        ]).catch(console.log);
      }
    });

    // Pipe the TCP readable stream to WebSocket writable stream
    readable.pipeTo(wsWritable).catch(console.error);
    
    // Call user WebSocket handler if provided
    if (this.options.onWebSocket) {
      try {
        await this.options.onWebSocket(ws);
      } catch (error) {
        console.error('WebSocket handler error:', error);
      }
    }
  }

  async listen(): Promise<void> {
    this.socket = new TCPServerSocket(this.options.host!, {
      localPort: this.options.port!,
    });

    const { readable: server, localAddress, localPort } = await this.socket.opened;
    
    console.log(`Enhanced HTTP Server listening on ${localAddress}:${localPort}`);

    await server.pipeTo(
      new WritableStream({
        write: async (connection) => {
          const { readable: client, writable, remoteAddress, remotePort } = await connection.opened;
          const connectionId = `${remoteAddress}:${remotePort}:${Date.now()}`;
          console.log(`New connection: ${connectionId}`);

          const writer = writable.getWriter();

          try {
            await client.pipeTo(
              new WritableStream({
                write: async (chunk: Uint8Array) => {
                  try {
                    const request = this.parseRequest(chunk, connectionId);
                    
                    if (!request) {
                      // Partial request, waiting for more data
                      return;
                    }

                    console.log('Request:', request.method, request.uri);
                    
                    // Handle WebSocket upgrade
                    if (request.method === 'GET' && 
                        request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
                      await this.handleWebSocketUpgrade(request, writer, client);
                      return;
                    }
                    
                    const response = new HttpResponse(writer);
                    
                    // Handle OPTIONS (CORS preflight)
                    if (request.method === 'OPTIONS') {
                      await this.handleOptionsRequest(response);
                      return;
                    }
                    
                    // Call user request handler
                    if (this.options.onRequest) {
                      await this.options.onRequest(request, response);
                    } else {
                      // Default response
                      response.setStatus(200);
                      await response.json({
                        message: 'Hello from Enhanced IWA HTTP Server!',
                        method: request.method,
                        uri: request.uri,
                        timestamp: new Date().toISOString(),
                        features: ['Enhanced parsing', 'WebSocket validation', 'Partial request handling']
                      });
                    }
                  } catch (error) {
                    console.error('Request handling error:', error);
                    try {
                      const response = new HttpResponse(writer);
                      response.setStatus(400);
                      await response.json({ 
                        error: 'Bad Request',
                        message: error instanceof Error ? error.message : 'Unknown error'
                      });
                    } catch (responseError) {
                      console.error('Error response failed:', responseError);
                    }
                  }
                },
                close: () => {
                  console.log(`Client connection closed: ${connectionId}`);
                  this.pendingRequests.delete(connectionId);
                },
                abort: (reason) => {
                  console.log(`Client connection aborted: ${connectionId}`, reason);
                  this.pendingRequests.delete(connectionId);
                },
              })
            );
          } catch (error) {
            console.error('Connection error:', error);
            this.pendingRequests.delete(connectionId);
          }
        },
        close: () => {
          console.log('Server closed');
        },
        abort: (reason) => {
          console.log('Server aborted:', reason);
        },
      }),
      { signal: this.abortController.signal }
    );
  }

  async close(): Promise<void> {
    this.abortController.abort();
    this.pendingRequests.clear();
    if (this.socket) {
      // Note: TCPServerSocket doesn't have a close method in the current spec
      // The connection will be closed when the AbortController is aborted
    }
  }
}