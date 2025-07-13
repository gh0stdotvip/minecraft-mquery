/**
 * Java Edition server status checker
 */

import crypto from 'crypto';
import { clean, format, parse, toHTML } from 'minecraft-motd-util';
import { TCPClient } from './structure/TCPClient';
import { resolveSRV } from './util/srvRecord';
import type { JavaStatusOptions, JavaStatusResponse } from './types/JavaStatus';
import { MinecraftServerError, ErrorCodes } from './types/Common';

export async function status(
  host: string, 
  port = 25565, 
  options?: JavaStatusOptions
): Promise<JavaStatusResponse> {
  const trimmedHost = host.trim();
  if (typeof trimmedHost !== 'string') throw new TypeError(`Expected 'host' to be a 'string', got '${typeof host}'`);
  if (trimmedHost.length === 0) throw new Error('Expected host to have a length greater than 0');
  if (typeof port !== 'number') throw new TypeError(`Expected 'port' to be a 'number', got '${typeof port}'`);
  if (!Number.isInteger(port)) throw new Error(`Expected 'port' to be an integer, got '${port}'`);
  if (port < 0 || port > 65535) throw new Error(`Expected 'port' to be between 0 and 65535, got '${port}'`);
  if (options !== undefined && typeof options !== 'object') throw new TypeError(`Expected 'options' to be an 'object' or 'undefined', got '${typeof options}'`);
  if (options) {
    if (options.enableSRV !== undefined && typeof options.enableSRV !== 'boolean') throw new TypeError(`Expected 'options.enableSRV' to be a 'boolean' or 'undefined', got '${typeof options.enableSRV}'`);
    if (options.timeout !== undefined) {
      if (typeof options.timeout !== 'number') throw new TypeError(`Expected 'options.timeout' to be a 'number' or 'undefined', got '${typeof options.timeout}'`);
      if (!Number.isInteger(options.timeout)) throw new Error(`Expected 'options.timeout' to be an integer, got '${options.timeout}'`);
      if (options.timeout < 0) throw new Error(`Expected 'options.timeout' to be greater than or equal to 0, got '${options.timeout}'`);
    }
  }

  const socket = new TCPClient();
  const timeout = options?.timeout ?? 5000;

  try {
    let srvRecord = null;
    let finalHost = trimmedHost;
    let finalPort = port;
    if (options?.enableSRV !== false) {
      srvRecord = await resolveSRV(trimmedHost);
      if (srvRecord) {
        finalHost = srvRecord.host;
        finalPort = srvRecord.port;
      }
    }

    await socket.connect({ host: finalHost, port: finalPort, timeout });

    // Handshake packet (hardcoded protocol 47)
    socket.writeVarInt(0x00);
    socket.writeVarInt(47); // PATCH: always use 47
    socket.writeStringVarInt(finalHost);
    socket.writeUInt16BE(finalPort);
    socket.writeVarInt(1);
    await socket.flush();

    // Request packet
    socket.writeVarInt(0x00);
    await socket.flush();

    // Response packet
    const packetLength = await socket.readVarInt();
    await socket.ensureBufferedData(packetLength);
    const packetType = await socket.readVarInt();
    if (packetType !== 0x00) throw new Error(`Expected server to send packet type 0x00, received ${packetType}`);
    const responseJson = await socket.readStringVarInt();
    const response = JSON.parse(responseJson);

    // Ping packet
    const payload = crypto.randomBytes(8).readBigInt64BE();
    socket.writeVarInt(0x01);
    socket.writeInt64BE(payload);
    await socket.flush();
    const pingStart = Date.now();

    // Pong packet
    const pongPacketLength = await socket.readVarInt();
    await socket.ensureBufferedData(pongPacketLength);
    const pongPacketType = await socket.readVarInt();
    if (pongPacketType !== 0x01) throw new Error(`Expected server to send packet type 0x01, received ${pongPacketType}`);
    const receivedPayload = await socket.readInt64BE();
    if (receivedPayload !== payload) throw new Error('Ping payload did not match received payload');
    const roundTripLatency = Date.now() - pingStart;
    const motd = parse(response.description);
    socket.close();
    
    return {
      version: {
        name: response.version.name,
        protocol: response.version.protocol
      },
      players: {
        online: response.players.online,
        max: response.players.max,
        sample: response.players.sample ?? null
      },
      motd: {
        raw: format(motd),
        clean: clean(motd),
        html: toHTML(motd)
      },
      favicon: response.favicon ?? null,
      srvRecord,
      roundTripLatency
    };
  } catch (error) {
    socket.close();
    if (error instanceof Error) {
      throw new MinecraftServerError(
        error.message,
        ErrorCodes.SERVER_OFFLINE,
        trimmedHost,
        port
      );
    }
    throw error;
  }
} 