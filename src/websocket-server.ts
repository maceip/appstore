/**
 * JavaScript runtime agnostic WebSocket server
 * 
 * Fork of https://gist.github.com/d0ruk/3921918937e234988dfaccfdee781bd3
 * 
 * The Definitive Guide to HTML5 WebSocket by Vanessa Wang, Frank Salim, and Peter Moskovits
 * p. 51, Building a Simple WebSocket Server
 */

export class WebSocketConnection {
  readable: ReadableStream<Uint8Array>;
  writable?: WritableStream<Uint8Array>;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  incomingStream: ReadableStream<{opcode: number, payload: Uint8Array}>;
  private incomingStreamController!: ReadableStreamDefaultController<{opcode: number, payload: Uint8Array}>;
  buffer = new Uint8Array(1024 ** 2); // Use Uint8Array instead of resizable ArrayBuffer
  bufferLength = 0; // Track actual buffer length
  closed = false;
  opcodes = { TEXT: 1, BINARY: 2, PING: 9, PONG: 10, CLOSE: 8 };
  abortController?: AbortController;

  constructor(readable: ReadableStream<Uint8Array>, writable: WritableStreamDefaultWriter<Uint8Array> | WritableStream<Uint8Array>, abortController?: AbortController) {
    this.readable = readable;
    this.abortController = abortController;
    
    if (writable instanceof WritableStreamDefaultWriter) {
      this.writer = writable;
    } else if (writable instanceof WritableStream) {
      this.writable = writable;
      this.writer = this.writable.getWriter();
    } else {
      throw new Error('Invalid writable stream');
    }

    this.incomingStream = new ReadableStream({
      start: (controller) => {
        this.incomingStreamController = controller;
      },
    });
  }

  async processWebSocketStream(): Promise<void> {
    try {
      const reader = this.readable.getReader();
      
      while (!this.closed) {
        const { value: frame, done } = await reader.read();
        
        if (done || !frame) {
          break;
        }

        // Expand buffer if needed
        if (this.bufferLength + frame.length > this.buffer.length) {
          const newBuffer = new Uint8Array(Math.max(this.buffer.length * 2, this.bufferLength + frame.length));
          newBuffer.set(this.buffer.subarray(0, this.bufferLength));
          this.buffer = newBuffer;
        }
        
        // Copy frame data to buffer
        this.buffer.set(frame, this.bufferLength);
        this.bufferLength += frame.length;
        
        const processedFrame = await this.processFrame();
        if (processedFrame === this.opcodes.CLOSE) {
          console.log('WebSocket close frame received');
          break;
        }
      }
      
      reader.releaseLock();
      console.log("WebSocket connection closed.");
    } catch (e) {
      console.error('WebSocket processing error:', e);
    }
  }

  private async processFrame(): Promise<number | boolean> {
    let length: number, maskBytes: Uint8Array;
    const buffer = this.buffer.subarray(0, this.bufferLength);
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    
    if (buffer.length < 2) {
      return false;
    }

    let idx = 2;
    const b1 = view.getUint8(0);
    const opcode = b1 & 15;
    const b2 = view.getUint8(1);
    
    length = b2 & 127;

    if (length > 125) {
      if (buffer.length < 8) {
        return false;
      }
      if (length === 126) {
        length = view.getUint16(2, false);
        idx += 2;
      } else if (length === 127) {
        if (view.getUint32(2, false) !== 0) {
          await this.close(1009, "");
          return this.opcodes.CLOSE;
        }
        length = view.getUint32(6, false);
        idx += 8;
      }
    }

    if (buffer.length < idx + 4 + length) {
      return false;
    }

    maskBytes = buffer.subarray(idx, idx + 4);
    idx += 4;
    let payload = buffer.subarray(idx, idx + length);
    payload = this.unmask(maskBytes, payload);
    
    this.incomingStreamController.enqueue({ opcode, payload });

    if (this.bufferLength === 0 && this.closed) {
      return true;
    }

    if (idx + length === 0) {
      return false;
    }

    // Shift remaining buffer data
    const remainingLength = this.bufferLength - (idx + length);
    if (remainingLength > 0) {
      this.buffer.copyWithin(0, idx + length, this.bufferLength);
    }
    this.bufferLength = remainingLength;
    return opcode === this.opcodes.CLOSE ? opcode : true;
  }

  async send(obj: string | Uint8Array): Promise<void> {
    let opcode: number, payload: Uint8Array;
    
    if (obj instanceof Uint8Array) {
      opcode = this.opcodes.BINARY;
      payload = obj;
    } else if (typeof obj === "string") {
      opcode = this.opcodes.TEXT;
      payload = new TextEncoder().encode(obj);
    } else {
      throw new Error("Cannot send object. Must be string or Uint8Array");
    }
    
    await this.writeFrame(opcode, payload);
  }

  async writeFrame(opcode: number, buffer: Uint8Array): Promise<void> {
    await this.writer.ready;
    
    if (opcode === this.opcodes.TEXT || opcode === this.opcodes.BINARY) {
      await this.writer.write(this.encodeMessage(opcode, buffer)).catch(console.log);
      return;
    }
    
    if (opcode === this.opcodes.PING) {
      await this.writer.write(this.encodeMessage(this.opcodes.PONG, buffer)).catch(console.log);
      return;
    }
    
    if (opcode === this.opcodes.CLOSE) {
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      let code: number | undefined, reason: Uint8Array;
      
      if (buffer.length >= 2) {
        code = view.getUint16(0, false);
        reason = buffer.subarray(2);
      } else {
        reason = new Uint8Array(0);
      }
      
      const result = await this.close(code, reason);
      console.log({ closeCode: result.closeCode, reason: result.reason });
      return;
    }
    
    await this.close(1002, "unknown opcode");
  }

  async close(code?: number, reason?: Uint8Array | string): Promise<{closeCode: number, reason: string}> {
    const opcode = this.opcodes.CLOSE;
    let buffer: Uint8Array, view: DataView;
    
    const reasonBytes = typeof reason === 'string' ? new TextEncoder().encode(reason) : (reason || new Uint8Array(0));
    
    if (code) {
      buffer = new Uint8Array(reasonBytes.length + 2);
      view = new DataView(buffer.buffer);
      view.setUint16(0, code, false);
      buffer.set(reasonBytes, 2);
    } else {
      buffer = new Uint8Array(0);
      view = new DataView(new ArrayBuffer(2));
      view.setUint16(0, 1000, false); // Default close code
    }

    this.incomingStreamController.close();
    await this.writer.write(this.encodeMessage(opcode, buffer)).catch(console.log);
    await this.writer.close();
    await this.writer.closed;
    
    await Promise.allSettled([this.readable.cancel()]).catch(console.log);
    
    this.bufferLength = 0; // Clear buffer
    this.closed = true;
    
    const closeCodes = {
      closeCode: view.getUint16(0, false),
      reason: new TextDecoder().decode(reasonBytes),
    };
    
    if (closeCodes.closeCode === 1000) {
      console.log(closeCodes);
    }
    
    return closeCodes;
  }

  private unmask(maskBytes: Uint8Array, data: Uint8Array): Uint8Array {
    const payload = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      payload[i] = maskBytes[i % 4] ^ data[i];
    }
    return payload;
  }

  private encodeMessage(opcode: number, payload: Uint8Array): Uint8Array {
    let buffer: Uint8Array;
    const b1 = 128 | opcode; // FIN bit set + opcode
    let b2 = 0;
    const length = payload.length;
    let index: number;
    const extra = [2, 4, 10];

    if (length < 126) {
      index = 0;
      b2 |= length;
    } else if (length < 65536) {
      index = 1;
      b2 |= 126;
    } else {
      index = 2;
      b2 |= 127;
    }

    buffer = new Uint8Array(payload.length + extra[index]);
    const view = new DataView(buffer.buffer);
    view.setUint8(0, b1);
    view.setUint8(1, b2);

    if (length >= 126 && length < 65536) {
      view.setUint16(2, length);
    } else if (length >= 65536) {
      view.setUint32(2, 0, false);
      view.setUint32(6, length, false);
    }

    buffer.set(payload, extra[index]);
    return buffer;
  }

  static readonly KEY_SUFFIX = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

  static async hashWebSocketKey(secKeyWebSocket: string, writable: WritableStreamDefaultWriter<Uint8Array>): Promise<void> {
    console.log('Hashing WebSocket key:', secKeyWebSocket);
    const encoder = new TextEncoder();
    
    let key: string;
    if (globalThis?.crypto?.subtle) {
      const hash = await crypto.subtle.digest(
        "SHA-1",
        encoder.encode(`${secKeyWebSocket}${WebSocketConnection.KEY_SUFFIX}`)
      );
      
      key = btoa(
        String.fromCharCode(...new Uint8Array(hash))
      );
    } else {
      throw new Error('Web Cryptography API not available');
    }

    const header = "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" +
      "Upgrade: WebSocket\r\n" +
      "Connection: Upgrade\r\n" +
      "Sec-Websocket-Accept: " + key + "\r\n\r\n";
    
    await writable.write(encoder.encode(header));
  }
}