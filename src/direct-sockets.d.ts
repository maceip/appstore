/**
 * Type definitions for Direct Sockets API
 * Based on the WICG Direct Sockets specification
 */

declare global {
  interface TCPServerSocketOptions {
    localPort?: number;
    backlog?: number;
    ipv6Only?: boolean;
  }

  interface TCPServerSocketOpenInfo {
    readable: ReadableStream<TCPServerSocketConnection>;
    localAddress: string;
    localPort: number;
  }

  interface TCPServerSocketConnection {
    opened: Promise<TCPSocketOpenInfo>;
  }

  interface TCPSocketOpenInfo {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    remoteAddress: string;
    remotePort: number;
    localAddress: string;
    localPort: number;
  }

  class TCPServerSocket {
    constructor(localAddress: string, options?: TCPServerSocketOptions);
    readonly opened: Promise<TCPServerSocketOpenInfo>;
    readonly closed: Promise<void>;
  }

  interface TCPSocketOptions {
    sendBufferSize?: number;
    receiveBufferSize?: number;
    noDelay?: boolean;
    keepAliveDelay?: number;
  }

  class TCPSocket {
    constructor(remoteAddress: string, remotePort: number, options?: TCPSocketOptions);
    readonly opened: Promise<TCPSocketOpenInfo>;
    readonly closed: Promise<void>;
    close(): Promise<void>;
  }

  interface UDPSocketOptions {
    localAddress?: string;
    localPort?: number;
    remoteAddress?: string;
    remotePort?: number;
    sendBufferSize?: number;
    receiveBufferSize?: number;
  }

  interface UDPMessage {
    data: Uint8Array;
    remoteAddress: string;
    remotePort: number;
  }

  interface UDPSocketOpenInfo {
    readable: ReadableStream<UDPMessage>;
    writable: WritableStream<UDPMessage>;
    localAddress: string;
    localPort: number;
  }

  class UDPSocket {
    constructor(options?: UDPSocketOptions);
    readonly opened: Promise<UDPSocketOpenInfo>;
    readonly closed: Promise<void>;
    close(): Promise<void>;
  }
}

export {};