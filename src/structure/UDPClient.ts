/**
 * Modern UDP client for Bedrock Edition server communication
 */

import dgram, { Socket } from 'dgram';
import { EventEmitter } from 'events';
import type { ConnectionOptions } from '../types/Common';

export class UDPClient extends EventEmitter {
  private host: string;
  private port: number;
  private socket: Socket;
  private data: Buffer = Buffer.alloc(0);
  private connected = false;

  constructor(host: string, port: number) {
    super();
    this.host = host;
    this.port = port;
    this.socket = dgram.createSocket('udp4');

    this.socket.on('message', (data) => {
      this.data = Buffer.concat([this.data, data]);
      this.emit('data');
    });

    this.socket.on('error', (error) => {
      this.emit('error', error);
    });

    this.socket.on('close', () => {
      this.connected = false;
      this.emit('close');
    });
  }

  /**
   * Connects to the server (UDP doesn't actually connect, but we simulate it)
   */
  async connect(options?: ConnectionOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = options?.timeout ?? 5000;
      
      const timeoutId = setTimeout(() => {
        this.socket.close();
        reject(new Error(`Connection timeout after ${timeout}ms`));
      }, timeout);

      // UDP doesn't actually connect, but we can test if the socket is ready
      this.socket.once('listening', () => {
        clearTimeout(timeoutId);
        this.connected = true;
        resolve();
      });

      // For UDP, we consider it "connected" when the socket is ready
      this.connected = true;
      clearTimeout(timeoutId);
      resolve();
    });
  }

  /**
   * Writes data to the data buffer (like deprecated version)
   */
  write(data: Buffer | string): void {
    if (typeof data === 'string') {
      this.data = Buffer.concat([this.data, Buffer.from(data, 'utf8')]);
    } else {
      this.data = Buffer.concat([this.data, data]);
    }
  }

  writeByte(value: number): void {
    const buffer = Buffer.alloc(1);
    buffer.writeUInt8(value, 0);
    this.write(buffer);
  }

  writeBytes(data: Uint8Array): void {
    this.write(Buffer.from(data));
  }

  writeUInt8(value: number): void {
    const buffer = Buffer.alloc(1);
    buffer.writeUInt8(value, 0);
    this.write(buffer);
  }

  writeInt8(value: number): void {
    const buffer = Buffer.alloc(1);
    buffer.writeInt8(value, 0);
    this.write(buffer);
  }

  writeUInt16BE(value: number): void {
    const buffer = Buffer.alloc(2);
    buffer.writeUInt16BE(value, 0);
    this.write(buffer);
  }

  writeInt16BE(value: number): void {
    const buffer = Buffer.alloc(2);
    buffer.writeInt16BE(value, 0);
    this.write(buffer);
  }

  writeUInt32BE(value: number): void {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value, 0);
    this.write(buffer);
  }

  writeInt32BE(value: number): void {
    const buffer = Buffer.alloc(4);
    buffer.writeInt32BE(value, 0);
    this.write(buffer);
  }

  writeInt64BE(value: bigint): void {
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(value, 0);
    this.write(buffer);
  }

  /**
   * Flushes the data buffer to the server (like deprecated version)
   */
  async flush(prefixLength = false): Promise<void> {
    if (this.data.length === 0) return;

    let dataToSend = this.data;
    
    if (prefixLength) {
      // Add length prefix for some Bedrock packets
      const lengthBuffer = Buffer.alloc(2);
      lengthBuffer.writeUInt16BE(this.data.length, 0);
      dataToSend = Buffer.concat([lengthBuffer, this.data]);
    }

    return new Promise<void>((resolve, reject) => {
      this.socket.send(dataToSend, 0, dataToSend.length, this.port, this.host, (error) => {
        if (error) {
          reject(error);
        } else {
          this.data = Buffer.alloc(0); // Clear the data buffer after sending
          resolve();
        }
      });
    });
  }

  /**
   * Reads a single byte
   */
  async readByte(): Promise<number> {
    return this.readUInt8();
  }

  /**
   * Reads an unsigned 8-bit integer
   */
  async readUInt8(): Promise<number> {
    const buffer = await this.readBytes(1);
    return buffer.readUInt8(0);
  }

  /**
   * Reads a signed 8-bit integer
   */
  async readInt8(): Promise<number> {
    const buffer = await this.readBytes(1);
    return buffer.readInt8(0);
  }

  /**
   * Reads an unsigned 16-bit integer (big-endian)
   */
  async readUInt16BE(): Promise<number> {
    const buffer = await this.readBytes(2);
    return buffer.readUInt16BE(0);
  }

  /**
   * Reads a signed 16-bit integer (big-endian)
   */
  async readInt16BE(): Promise<number> {
    const buffer = await this.readBytes(2);
    return buffer.readInt16BE(0);
  }

  /**
   * Reads a signed 64-bit integer (big-endian)
   */
  async readInt64BE(): Promise<bigint> {
    const buffer = await this.readBytes(8);
    return buffer.readBigInt64BE(0);
  }

  /**
   * Reads a string with specified length
   */
  async readString(length: number): Promise<string> {
    const buffer = await this.readBytes(length);
    return buffer.toString('utf8');
  }

  /**
   * Ensures the buffer has enough data
   */
  async ensureBufferedData(length: number): Promise<void> {
    while (this.data.length < length) {
      await this.waitForData();
    }
  }

  /**
   * Reads a specific number of bytes from the buffer
   */
  async readBytes(length: number): Promise<Buffer> {
    await this.ensureBufferedData(length);
    
    const data = this.data.subarray(0, length);
    this.data = this.data.subarray(length);
    
    return data;
  }

  /**
   * Waits for more data to arrive (like deprecated version)
   */
  private waitForData(byteLength = 1): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const dataHandler = () => {
        if (this.data.length >= byteLength) {
          this.removeListener('data', dataHandler);
          this.socket.removeListener('error', errorHandler);
          resolve();
        }
      };

      const errorHandler = (error: Error) => {
        this.removeListener('data', dataHandler);
        this.socket.removeListener('error', errorHandler);
        reject(error);
      };

      this.once('data', () => dataHandler());
      this.socket.on('error', errorHandler);
    });
  }

  /**
   * Closes the connection
   */
  close(): void {
    this.connected = false;
    this.socket.close();
  }

  /**
   * Checks if the socket is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
} 