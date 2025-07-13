/**
 * Modern TCP client for Minecraft server communication (patched for legacy compatibility)
 */

import { Socket, createConnection } from 'net';
import type { ConnectionOptions } from '../types/Common';

export class TCPClient {
  private socket: Socket | null = null;
  private buffer: Buffer = Buffer.alloc(0);
  private writeBuffer: Buffer = Buffer.alloc(0); // Patch: buffer for outgoing data
  private connected = false;

  /**
   * Connects to a server
   */
  async connect(options: ConnectionOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout ?? 5000;
      
      this.socket = createConnection({
        host: options.host,
        port: options.port,
        timeout
      });

      const timeoutId = setTimeout(() => {
        this.socket?.destroy();
        reject(new Error(`Connection timeout after ${timeout}ms`));
      }, timeout);

      this.socket.on('connect', () => {
        clearTimeout(timeoutId);
        this.connected = true;
        resolve();
      });

      this.socket.on('error', (error) => {
        clearTimeout(timeoutId);
        this.connected = false;
        reject(error);
      });

      this.socket.on('close', () => {
        this.connected = false;
      });

      this.socket.on('data', (data) => {
        this.buffer = Buffer.concat([this.buffer, data]);
      });
    });
  }

  /**
   * Writes data to the write buffer (patched)
   */
  write(data: Buffer | string): void {
    if (typeof data === 'string') {
      this.writeBuffer = Buffer.concat([this.writeBuffer, Buffer.from(data, 'utf8')]);
    } else {
      this.writeBuffer = Buffer.concat([this.writeBuffer, data]);
    }
  }

  /**
   * Writes a VarInt to the socket
   */
  writeVarInt(value: number): void {
    const buffer = this.encodeVarInt(value);
    this.write(buffer);
  }

  /**
   * Writes a string with VarInt length prefix
   */
  writeStringVarInt(value: string): void {
    const stringBuffer = Buffer.from(value, 'utf8');
    this.writeVarInt(stringBuffer.length);
    this.write(stringBuffer);
  }

  /**
   * Writes a 16-bit unsigned integer in big-endian format
   */
  writeUInt16BE(value: number): void {
    const buffer = Buffer.alloc(2);
    buffer.writeUInt16BE(value, 0);
    this.write(buffer);
  }

  /**
   * Writes a 64-bit signed integer in big-endian format
   */
  writeInt64BE(value: bigint): void {
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(value, 0);
    this.write(buffer);
  }

  /**
   * Flushes the write buffer to the socket (patched)
   */
  async flush(): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    if (this.writeBuffer.length > 0) {
      // PATCH: prefix with packet length as VarInt (like deprecated version)
      const lengthPrefix = this.encodeVarInt(this.writeBuffer.length);
      const packet = Buffer.concat([lengthPrefix, this.writeBuffer]);
      
      await new Promise<void>((resolve, reject) => {
        this.socket!.write(packet, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      this.writeBuffer = Buffer.alloc(0);
    }
  }

  /**
   * Reads a VarInt from the buffer
   */
  async readVarInt(): Promise<number> {
    let numRead = 0;
    let result = 0;
    let read: number = 0, value: number;

    do {
      const byteBuf = await this.readBytes(1);
      if (byteBuf[0] === undefined) throw new Error('Unexpected end of buffer');
      read = byteBuf[0];
      value = (read & 0b01111111);
      result |= (value << (7 * numRead));
      numRead++;
      if (numRead > 5) throw new Error('VarInt is too big');
    } while ((read & 0b10000000) !== 0);

    return result;
  }

  /**
   * Reads a string with VarInt length prefix
   */
  async readStringVarInt(): Promise<string> {
    const length = await this.readVarInt();
    const buffer = await this.readBytes(length);
    return buffer.toString('utf8');
  }

  /**
   * Reads a 64-bit signed integer in big-endian format
   */
  async readInt64BE(): Promise<bigint> {
    const buffer = await this.readBytes(8);
    return buffer.readBigInt64BE(0);
  }

  /**
   * Ensures the buffer has enough data
   */
  async ensureBufferedData(length: number): Promise<void> {
    while (this.buffer.length < length) {
      await this.waitForData();
    }
  }

  /**
   * Reads a specific number of bytes from the buffer
   */
  async readBytes(length: number): Promise<Buffer> {
    await this.ensureBufferedData(length);
    
    const data = this.buffer.subarray(0, length);
    this.buffer = this.buffer.subarray(length);
    
    return data;
  }

  /**
   * Waits for more data to arrive
   */
  private waitForData(): Promise<void> {
    return new Promise((resolve) => {
      const onData = () => {
        this.socket?.off('data', onData);
        resolve();
      };
      
      this.socket?.on('data', onData);
    });
  }

  /**
   * Encodes a VarInt
   */
  private encodeVarInt(value: number): Buffer {
    const bytes: number[] = [];
    
    do {
      let temp = value & 0x7F;
      value >>>= 7;
      
      if (value !== 0) {
        temp |= 0x80;
      }
      
      bytes.push(temp);
    } while (value !== 0);
    
    return Buffer.from(bytes);
  }

  /**
   * Closes the connection
   */
  close(): void {
    this.connected = false;
    this.socket?.destroy();
    this.socket = null;
  }

  /**
   * Checks if the socket is connected
   */
  isConnected(): boolean {
    return this.connected && this.socket !== null;
  }
} 