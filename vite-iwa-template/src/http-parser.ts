/**
 * Enhanced HTTP request parser with RFC compliance
 * Handles edge cases and provides better error handling
 */

export interface ParsedHttpRequest {
  method: string;
  uri: string;
  protocol: string;
  headers: Headers;
  body?: Uint8Array;
  url: URL;
  contentLength?: number;
  isComplete: boolean;
}

export class HttpRequestParser {
  private static readonly CRLF = '\r\n';
  private static readonly DOUBLE_CRLF = '\r\n\r\n';
  private static readonly MAX_HEADER_SIZE = 8192; // 8KB max headers
  private static readonly MAX_REQUEST_LINE_SIZE = 2048; // 2KB max request line

  /**
   * Parse HTTP request from raw bytes
   */
  static parseRequest(data: Uint8Array, baseUrl?: string): ParsedHttpRequest {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(data);
    
    // Find header/body boundary
    const headerEndIndex = text.indexOf(this.DOUBLE_CRLF);
    if (headerEndIndex === -1) {
      throw new Error('Incomplete HTTP request - no header boundary found');
    }

    const headerText = text.substring(0, headerEndIndex);
    const bodyStartIndex = headerEndIndex + this.DOUBLE_CRLF.length;
    
    // Validate header size
    if (headerText.length > this.MAX_HEADER_SIZE) {
      throw new Error('Request headers too large');
    }

    // Parse request line and headers
    const lines = headerText.split(this.CRLF);
    const requestLine = lines[0];
    
    if (!requestLine || requestLine.length > this.MAX_REQUEST_LINE_SIZE) {
      throw new Error('Invalid or oversized request line');
    }

    const { method, uri, protocol } = this.parseRequestLine(requestLine);
    const headers = this.parseHeaders(lines.slice(1));
    
    // Build URL
    const host = headers.get('host');
    if (!host) {
      throw new Error('Missing Host header');
    }
    
    const url = new URL(uri, baseUrl || `http://${host}`);
    
    // Handle request body
    const contentLength = this.parseContentLength(headers);
    let body: Uint8Array | undefined;
    let isComplete = true;

    if (contentLength !== undefined) {
      const bodyBytes = data.slice(new TextEncoder().encode(text.substring(0, bodyStartIndex)).length);
      
      if (bodyBytes.length < contentLength) {
        isComplete = false;
      } else {
        body = bodyBytes.slice(0, contentLength);
      }
    } else if (headers.get('transfer-encoding')?.toLowerCase().includes('chunked')) {
      // Handle chunked encoding (basic implementation)
      const bodyText = text.substring(bodyStartIndex);
      const { body: chunkedBody, complete } = this.parseChunkedBody(bodyText);
      body = chunkedBody;
      isComplete = complete;
    }

    return {
      method,
      uri,
      protocol,
      headers,
      body,
      url,
      contentLength,
      isComplete,
    };
  }

  /**
   * Parse HTTP request line (method, URI, protocol)
   */
  private static parseRequestLine(line: string): { method: string; uri: string; protocol: string } {
    const parts = line.trim().split(/\s+/);
    
    if (parts.length !== 3) {
      throw new Error(`Invalid request line format: ${line}`);
    }

    const [method, uri, protocol] = parts;

    // Validate method
    if (!/^[A-Z]+$/.test(method)) {
      throw new Error(`Invalid HTTP method: ${method}`);
    }

    // Validate URI
    if (!uri.startsWith('/') && !uri.startsWith('http')) {
      throw new Error(`Invalid URI format: ${uri}`);
    }

    // Validate protocol
    if (!protocol.startsWith('HTTP/')) {
      throw new Error(`Invalid HTTP protocol: ${protocol}`);
    }

    return { method, uri, protocol };
  }

  /**
   * Parse HTTP headers with RFC compliance
   */
  private static parseHeaders(headerLines: string[]): Headers {
    const headers = new Headers();
    let currentHeader: { name: string; value: string } | null = null;

    for (const line of headerLines) {
      if (!line.trim()) {
        continue; // Skip empty lines
      }

      // Handle header continuation (obsolete but still supported)
      if (line.startsWith(' ') || line.startsWith('\t')) {
        if (currentHeader) {
          currentHeader.value += ' ' + line.trim();
        }
        continue;
      }

      // Finalize previous header
      if (currentHeader) {
        this.setHeaderSafely(headers, currentHeader.name, currentHeader.value);
      }

      // Parse new header
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) {
        throw new Error(`Invalid header format: ${line}`);
      }

      const name = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      // Validate header name
      if (!/^[a-zA-Z0-9!#$%&'*+\-.^_`|~]+$/.test(name)) {
        throw new Error(`Invalid header name: ${name}`);
      }

      currentHeader = { name, value };
    }

    // Finalize last header
    if (currentHeader) {
      this.setHeaderSafely(headers, currentHeader.name, currentHeader.value);
    }

    return headers;
  }

  /**
   * Safely set header, handling duplicates according to RFC
   */
  private static setHeaderSafely(headers: Headers, name: string, value: string): void {
    const lowerName = name.toLowerCase();
    
    // Headers that should be combined with comma separation
    const combinableHeaders = new Set([
      'accept', 'accept-charset', 'accept-encoding', 'accept-language',
      'cache-control', 'connection', 'cookie', 'pragma', 'trailer',
      'transfer-encoding', 'upgrade', 'via', 'warning'
    ]);

    if (headers.has(name) && combinableHeaders.has(lowerName)) {
      const existing = headers.get(name)!;
      headers.set(name, `${existing}, ${value}`);
    } else {
      headers.set(name, value);
    }
  }

  /**
   * Parse Content-Length header
   */
  private static parseContentLength(headers: Headers): number | undefined {
    const contentLength = headers.get('content-length');
    if (!contentLength) {
      return undefined;
    }

    const length = parseInt(contentLength, 10);
    if (isNaN(length) || length < 0) {
      throw new Error(`Invalid Content-Length: ${contentLength}`);
    }

    return length;
  }

  /**
   * Basic chunked encoding parser
   */
  private static parseChunkedBody(bodyText: string): { body: Uint8Array; complete: boolean } {
    const chunks: Uint8Array[] = [];
    let offset = 0;
    let complete = false;

    while (offset < bodyText.length) {
      const crlfIndex = bodyText.indexOf(this.CRLF, offset);
      if (crlfIndex === -1) {
        break; // Incomplete chunk size line
      }

      const chunkSizeLine = bodyText.substring(offset, crlfIndex);
      const chunkSize = parseInt(chunkSizeLine.split(';')[0], 16); // Parse hex, ignore extensions

      if (isNaN(chunkSize)) {
        throw new Error(`Invalid chunk size: ${chunkSizeLine}`);
      }

      if (chunkSize === 0) {
        // Last chunk
        complete = true;
        break;
      }

      const chunkStart = crlfIndex + this.CRLF.length;
      const chunkEnd = chunkStart + chunkSize;

      if (chunkEnd + this.CRLF.length > bodyText.length) {
        break; // Incomplete chunk data
      }

      const chunkData = bodyText.substring(chunkStart, chunkEnd);
      chunks.push(new TextEncoder().encode(chunkData));

      offset = chunkEnd + this.CRLF.length;
    }

    // Combine all chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const body = new Uint8Array(totalLength);
    let bodyOffset = 0;

    for (const chunk of chunks) {
      body.set(chunk, bodyOffset);
      bodyOffset += chunk.length;
    }

    return { body, complete };
  }
}

/**
 * Enhanced WebSocket header parser
 */
export class WebSocketHeaderParser {
  private static readonly WEBSOCKET_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

  /**
   * Validate WebSocket upgrade request
   */
  static validateWebSocketRequest(headers: Headers): { valid: boolean; error?: string } {
    // Check required headers
    const requiredHeaders = {
      'upgrade': 'websocket',
      'connection': 'upgrade',
      'sec-websocket-version': '13',
    };

    for (const [name, expectedValue] of Object.entries(requiredHeaders)) {
      const value = headers.get(name)?.toLowerCase();
      if (!value || !value.includes(expectedValue.toLowerCase())) {
        return { valid: false, error: `Missing or invalid ${name} header` };
      }
    }

    // Check WebSocket key
    const wsKey = headers.get('sec-websocket-key');
    if (!wsKey) {
      return { valid: false, error: 'Missing Sec-WebSocket-Key header' };
    }

    // Validate key format (should be base64, 16 bytes when decoded)
    try {
      const decoded = atob(wsKey);
      if (decoded.length !== 16) {
        return { valid: false, error: 'Invalid Sec-WebSocket-Key length' };
      }
    } catch {
      return { valid: false, error: 'Invalid Sec-WebSocket-Key format' };
    }

    return { valid: true };
  }

  /**
   * Generate WebSocket accept key
   */
  static async generateAcceptKey(clientKey: string): Promise<string> {
    const concatenated = clientKey + this.WEBSOCKET_MAGIC_STRING;
    const encoder = new TextEncoder();
    const data = encoder.encode(concatenated);
    
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    return btoa(String.fromCharCode(...hashArray));
  }

  /**
   * Parse WebSocket extensions
   */
  static parseExtensions(extensionHeader?: string): Map<string, Map<string, string>> {
    const extensions = new Map<string, Map<string, string>>();
    
    if (!extensionHeader) {
      return extensions;
    }

    const extensionList = extensionHeader.split(',');
    
    for (const ext of extensionList) {
      const parts = ext.trim().split(';');
      const name = parts[0].trim();
      const params = new Map<string, string>();
      
      for (let i = 1; i < parts.length; i++) {
        const param = parts[i].trim();
        const eqIndex = param.indexOf('=');
        
        if (eqIndex === -1) {
          params.set(param, '');
        } else {
          const key = param.substring(0, eqIndex).trim();
          const value = param.substring(eqIndex + 1).trim().replace(/^"(.*)"$/, '$1');
          params.set(key, value);
        }
      }
      
      extensions.set(name, params);
    }
    
    return extensions;
  }

  /**
   * Parse WebSocket subprotocols
   */
  static parseSubprotocols(protocolHeader?: string): string[] {
    if (!protocolHeader) {
      return [];
    }

    return protocolHeader
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }
}