/**
 * HTTP Server implementation using Direct Sockets TCPServerSocket
 * Based on the direct-sockets-http-ws-server reference implementation
 */

import { WebSocketConnection } from './websocket-server.js';

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

  constructor(options: HttpServerOptions = {}) {
    this.options = {
      host: '0.0.0.0',
      port: 44818,
      ...options,
    };
  }

  private parseRequest(requestText: string): HttpRequest {
    const lines = requestText.split('\r\n');
    const requestLine = lines[0];
    const [method, uri, protocol] = requestLine.split(' ');
    
    const headerLines = lines.slice(1).filter(line => line && !line.startsWith('\r\n'));
    const headers = new Headers();
    let bodyStartIndex = -1;
    
    for (let i = 0; i < headerLines.length; i++) {
      const line = headerLines[i];
      if (line === '') {
        bodyStartIndex = i + 1;
        break;
      }
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const name = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        headers.set(name, value);
      }
    }
    
    let body: string | undefined;
    if (bodyStartIndex >= 0) {
      body = headerLines.slice(bodyStartIndex).join('\r\n');
    }
    
    const host = headers.get('host') || `${this.options.host}:${this.options.port}`;
    const url = new URL(uri, `http://${host}`);
    
    return {
      method,
      uri,
      protocol,
      headers,
      body,
      url,
    };
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
    const key = request.headers.get('sec-websocket-key');
    if (!key) {
      throw new Error('Missing WebSocket key');
    }

    await WebSocketConnection.hashWebSocketKey(key, writer);
    
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
    
    console.log(`HTTP Server listening on ${localAddress}:${localPort}`);

    await server.pipeTo(
      new WritableStream({
        write: async (connection) => {
          const { readable: client, writable, remoteAddress, remotePort } = await connection.opened;
          console.log(`New connection from ${remoteAddress}:${remotePort}`);

          const writer = writable.getWriter();

          try {
            await client.pipeTo(
              new WritableStream({
                write: async (chunk: Uint8Array) => {
                  const requestText = this.decoder.decode(chunk);
                  console.log('Request:', requestText.split('\r\n')[0]); // Log request line only
                  
                  try {
                    const request = this.parseRequest(requestText);
                    
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
                        message: 'Hello from IWA HTTP Server!',
                        method: request.method,
                        uri: request.uri,
                        timestamp: new Date().toISOString(),
                      });
                    }
                  } catch (error) {
                    console.error('Request handling error:', error);
                    try {
                      const response = new HttpResponse(writer);
                      response.setStatus(500);
                      await response.json({ error: 'Internal Server Error' });
                    } catch (responseError) {
                      console.error('Error response failed:', responseError);
                    }
                  }
                },
                close: () => {
                  console.log('Client connection closed');
                },
                abort: (reason) => {
                  console.log('Client connection aborted:', reason);
                },
              })
            );
          } catch (error) {
            console.error('Connection error:', error);
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
    if (this.socket) {
      // Note: TCPServerSocket doesn't have a close method in the current spec
      // The connection will be closed when the AbortController is aborted
    }
  }
}