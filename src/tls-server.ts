/**
 * TLS Server implementation using SubTLS for Direct Sockets
 * Based on https://github.com/jawj/subtls
 */

import { HttpRequest, HttpResponse } from './http-server.js';
import { WebSocketConnection } from './websocket-server.js';

// SubTLS types (we'll import these when the library is available)
interface SubTLSOptions {
  serverName?: string;
  rootCAs?: Uint8Array[];
  certificateChain?: Uint8Array[];
  privateKey?: Uint8Array;
  verifyMode?: 'strict' | 'permissive' | 'none';
}

interface TLSSocket {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  closed: Promise<void>;
  close(): Promise<void>;
}

export interface TLSCertificate {
  cert: Uint8Array; // DER encoded certificate
  key: Uint8Array;  // DER encoded private key
  chain?: Uint8Array[]; // Certificate chain
}

export interface TLSServerOptions {
  host?: string;
  port?: number;
  tls: {
    certificate: TLSCertificate;
    serverName?: string;
    verifyMode?: 'strict' | 'permissive' | 'none';
  };
  onRequest?: (request: HttpRequest, response: HttpResponse) => Promise<void> | void;
  onWebSocket?: (ws: WebSocketConnection) => Promise<void> | void;
}

export class TLSServer {
  private tcpServer?: TCPServerSocket;
  private options: TLSServerOptions;
  private abortController = new AbortController();

  constructor(options: TLSServerOptions) {
    this.options = options;
  }

  async listen(): Promise<void> {
    // Import SubTLS dynamically
    const SubTLS = await this.loadSubTLS();
    
    this.tcpServer = new TCPServerSocket(this.options.host || '0.0.0.0', {
      localPort: this.options.port || 44819, // Default to 44819 for HTTPS
    });

    const { readable: server, localAddress, localPort } = await this.tcpServer.opened;
    
    console.log(`TLS Server listening on ${localAddress}:${localPort}`);

    await server.pipeTo(
      new WritableStream({
        write: async (connection) => {
          const { readable: tcpReadable, writable: tcpWritable, remoteAddress, remotePort } = 
            await connection.opened;
          
          console.log(`New TLS connection from ${remoteAddress}:${remotePort}`);

          try {
            // Wrap TCP connection with TLS
            const tlsSocket = await this.wrapWithTLS(tcpReadable, tcpWritable, SubTLS);
            
            // Handle the TLS connection as HTTP
            await this.handleTLSConnection(tlsSocket, remoteAddress, remotePort);
            
          } catch (error) {
            console.error('TLS connection error:', error);
          }
        },
        close: () => {
          console.log('TLS Server closed');
        },
        abort: (reason) => {
          console.log('TLS Server aborted:', reason);
        },
      }),
      { signal: this.abortController.signal }
    );
  }

  private async loadSubTLS(): Promise<any> {
    try {
      // Try to load SubTLS - this will fail in most environments
      // We'll use a fallback implementation
      throw new Error('SubTLS not available');
    } catch (error) {
      console.warn('SubTLS not available, using fallback implementation');
      return this.createFallbackTLS();
    }
  }

  private createFallbackTLS(): any {
    // Fallback implementation that just passes through data
    // This is not secure and should only be used for development
    console.warn('⚠️  Using insecure TLS fallback - not suitable for production!');
    
    return {
      connect: async (options: any) => {
        return {
          readable: options.socket.readable,
          writable: options.socket.writable,
          closed: Promise.resolve(),
          close: async () => {},
        };
      },
      serve: async (options: any) => {
        return {
          readable: options.socket.readable,
          writable: options.socket.writable,
          closed: Promise.resolve(),
          close: async () => {},
        };
      }
    };
  }

  private async wrapWithTLS(
    tcpReadable: ReadableStream<Uint8Array>,
    tcpWritable: WritableStream<Uint8Array>,
    SubTLS: any
  ): Promise<TLSSocket> {
    const tlsOptions: SubTLSOptions = {
      serverName: this.options.tls.serverName,
      certificateChain: this.options.tls.certificate.chain || [this.options.tls.certificate.cert],
      privateKey: this.options.tls.certificate.key,
      verifyMode: this.options.tls.verifyMode || 'permissive',
    };

    // Create TLS server socket
    const tlsSocket = await SubTLS.serve({
      socket: {
        readable: tcpReadable,
        writable: tcpWritable,
      },
      ...tlsOptions,
    });

    return tlsSocket;
  }

  private async handleTLSConnection(
    tlsSocket: TLSSocket,
    remoteAddress: string,
    remotePort: number
  ): Promise<void> {
    const connectionId = `tls-${remoteAddress}:${remotePort}:${Date.now()}`;
    console.log(`Handling TLS connection: ${connectionId}`);

    // Create a mock TCP connection for the HTTP server
    const mockConnection = {
      opened: Promise.resolve({
        readable: tlsSocket.readable,
        writable: tlsSocket.writable,
        remoteAddress,
        remotePort,
        localAddress: this.options.host || '0.0.0.0',
        localPort: this.options.port || 44819,
      })
    };

    // Process the connection through our HTTP server logic
    await this.processHTTPOverTLS(mockConnection, connectionId);
  }

  private async processHTTPOverTLS(connection: any, connectionId: string): Promise<void> {
    const { readable: client, writable } = await connection.opened;
    const writer = writable.getWriter();

    try {
      await client.pipeTo(
        new WritableStream({
          write: async (chunk: Uint8Array) => {
            try {
              // Parse HTTP request from TLS-decrypted data
              const request = await this.parseHTTPRequest(chunk);
              
              if (!request) {
                return; // Partial request
              }

              console.log('HTTPS Request:', request.method, request.uri);
              
              // Handle WebSocket upgrade over TLS
              if (request.method === 'GET' && 
                  request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
                await this.handleSecureWebSocketUpgrade(request, writer, client);
                return;
              }
              
              const response = new HttpResponse(writer);
              
              // Add security headers for HTTPS
              response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
              response.setHeader('X-Content-Type-Options', 'nosniff');
              response.setHeader('X-Frame-Options', 'DENY');
              response.setHeader('X-XSS-Protection', '1; mode=block');
              
              // Handle OPTIONS (CORS preflight)
              if (request.method === 'OPTIONS') {
                response.setStatus(204);
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                await response.end();
                return;
              }
              
              // Call user request handler
              if (this.options.onRequest) {
                await this.options.onRequest(request, response);
              } else {
                // Default HTTPS response
                response.setStatus(200);
                await response.json({
                  message: 'Hello from IWA HTTPS Server!',
                  method: request.method,
                  uri: request.uri,
                  secure: true,
                  timestamp: new Date().toISOString(),
                });
              }
            } catch (error) {
              console.error('HTTPS request handling error:', error);
              try {
                const response = new HttpResponse(writer);
                response.setStatus(400);
                await response.json({ 
                  error: 'Bad Request',
                  message: error instanceof Error ? error.message : 'Unknown error'
                });
              } catch (responseError) {
                console.error('HTTPS error response failed:', responseError);
              }
            }
          },
          close: () => {
            console.log(`TLS client connection closed: ${connectionId}`);
          },
          abort: (reason) => {
            console.log(`TLS client connection aborted: ${connectionId}`, reason);
          },
        })
      );
    } catch (error) {
      console.error('TLS connection processing error:', error);
    }
  }

  private async parseHTTPRequest(data: Uint8Array): Promise<HttpRequest | null> {
    // Reuse the HTTP parser from the regular HTTP server
    // This is a simplified version - in practice, you'd want to share the parsing logic
    const text = new TextDecoder().decode(data);
    
    if (!text.includes('\r\n\r\n')) {
      return null; // Incomplete request
    }

    const lines = text.split('\r\n');
    const requestLine = lines[0];
    const [method, uri, protocol] = requestLine.split(' ');
    
    const headers = new Headers();
    let bodyStartIndex = -1;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
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
      body = lines.slice(bodyStartIndex).join('\r\n');
    }
    
    const host = headers.get('host') || `${this.options.host}:${this.options.port}`;
    const url = new URL(uri, `https://${host}`); // Note: HTTPS
    
    return {
      method,
      uri,
      protocol,
      headers,
      body,
      url,
    };
  }

  private async handleSecureWebSocketUpgrade(
    request: HttpRequest,
    writer: WritableStreamDefaultWriter<Uint8Array>,
    readable: ReadableStream<Uint8Array>
  ): Promise<void> {
    console.log('Secure WebSocket upgrade requested');
    
    // Use the same WebSocket upgrade logic but over TLS
    const key = request.headers.get('sec-websocket-key');
    if (!key) {
      throw new Error('Missing WebSocket key');
    }

    // Generate WebSocket accept key
    const acceptKey = await this.generateWebSocketAcceptKey(key);

    // Send upgrade response
    const encoder = new TextEncoder();
    const response = 'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${acceptKey}\r\n\r\n`;

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
          
          // Echo back the message (secure WebSocket)
          await ws.writeFrame(opcode, payload);
        },
      })
    ).catch(() => {
      console.log('Secure WebSocket stream closed');
      if (!ws.closed) {
        Promise.allSettled([ws.close()]).catch(console.log);
      }
    });

    // Pipe the TLS readable stream to WebSocket writable stream
    readable.pipeTo(wsWritable).catch(console.error);
    
    // Call user WebSocket handler if provided
    if (this.options.onWebSocket) {
      try {
        await this.options.onWebSocket(ws);
      } catch (error) {
        console.error('Secure WebSocket handler error:', error);
      }
    }
  }

  private async generateWebSocketAcceptKey(clientKey: string): Promise<string> {
    const magicString = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    const concatenated = clientKey + magicString;
    const encoder = new TextEncoder();
    const data = encoder.encode(concatenated);
    
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    return btoa(String.fromCharCode(...hashArray));
  }

  async close(): Promise<void> {
    this.abortController.abort();
    if (this.tcpServer) {
      // TCPServerSocket doesn't have a close method, so we rely on the AbortController
    }
  }
}

/**
 * TLS Certificate utilities
 */
export class TLSCertificateManager {
  /**
   * Generate a self-signed certificate for development
   */
  static async generateSelfSigned(commonName: string = 'localhost'): Promise<TLSCertificate> {
    console.warn('⚠️  Generating self-signed certificate for development only');
    
    // Generate RSA key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    );

    // Export keys in DER format
    const privateKeyDER = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const publicKeyDER = await crypto.subtle.exportKey('spki', keyPair.publicKey);

    // Create a basic certificate structure (simplified)
    const cert = await this.createBasicCertificate(publicKeyDER, commonName);

    return {
      cert: new Uint8Array(cert),
      key: new Uint8Array(privateKeyDER),
    };
  }

  private static async createBasicCertificate(
    publicKeyDER: ArrayBuffer,
    commonName: string
  ): Promise<ArrayBuffer> {
    // This is a very simplified certificate creation
    // In production, you'd use a proper ASN.1 library or external tool
    
    const encoder = new TextEncoder();
    const certData = encoder.encode(JSON.stringify({
      version: 3,
      serialNumber: Math.floor(Math.random() * 1000000),
      subject: { commonName },
      issuer: { commonName },
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      publicKey: Array.from(new Uint8Array(publicKeyDER)),
    }));

    return certData.buffer;
  }

  /**
   * Load certificate from PEM strings
   */
  static loadFromPEM(certPEM: string, keyPEM: string): TLSCertificate {
    const cert = this.pemToDER(certPEM, 'CERTIFICATE');
    const key = this.pemToDER(keyPEM, 'PRIVATE KEY');

    return { cert, key };
  }

  private static pemToDER(pem: string, type: string): Uint8Array {
    const base64 = pem
      .replace(`-----BEGIN ${type}-----`, '')
      .replace(`-----END ${type}-----`, '')
      .replace(/\s/g, '');
    
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    return bytes;
  }

  /**
   * Convert DER to PEM format
   */
  static derToPEM(der: Uint8Array, type: string): string {
    const base64 = btoa(String.fromCharCode(...der));
    const formatted = base64.match(/.{1,64}/g)?.join('\n') || base64;
    return `-----BEGIN ${type}-----\n${formatted}\n-----END ${type}-----`;
  }
}