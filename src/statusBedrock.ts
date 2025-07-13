/**
 * Bedrock Edition server status checker
 */

import { clean, format, parse, toHTML } from 'minecraft-motd-util';
import { UDPClient } from './structure/UDPClient';
import { resolveSRV } from './util/srvRecord';
import type { BedrockStatusOptions, BedrockStatusResponse } from './types/BedrockStatus';
import { MinecraftServerError, ErrorCodes } from './types/Common';

export async function statusBedrock(
  host: string,
  port = 19132,
  options?: BedrockStatusOptions
): Promise<BedrockStatusResponse> {
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

    const socket = new UDPClient(finalHost, finalPort);
    await socket.connect({ host: finalHost, port: finalPort, timeout });

    // Unconnected ping packet
    socket.writeByte(0x01);
    socket.writeInt64BE(BigInt(Date.now()));
    socket.writeBytes(Uint8Array.from([
      0x00, 0xFF, 0xFF, 0x00, 0xFE, 0xFE, 0xFE, 0xFE, 
      0xFD, 0xFD, 0xFD, 0xFD, 0x12, 0x34, 0x56, 0x78
    ]));
    socket.writeInt64BE(BigInt(2));
    await socket.flush(false);

    // Unconnected pong packet
    const packetType = await socket.readByte();
    if (packetType !== 0x1C) {
      throw new Error(`Expected server to send packet type 0x1C, received ${packetType}`);
    }

    await socket.readInt64BE(); // Skip ping time
    const serverGUID = await socket.readInt64BE();
    await socket.readBytes(16); // Skip magic bytes

    const responseLength = await socket.readInt16BE();
    const response = await socket.readString(responseLength);

    const parts = response.split(';');
    const [
      edition = 'MCPE', motdLine1 = '', protocolVersion = '0', version = 'Unknown', 
      onlinePlayers = '0', maxPlayers = '0', serverID = '', motdLine2 = '', 
      gameMode = 'Unknown', gameModeID = '0', portIPv4 = '', portIPv6 = ''
    ] = parts;

    const motd = parse(motdLine1 + (motdLine2 ? '\n' + motdLine2 : ''));
    socket.close();

    return {
      edition: edition as 'MCPE' | 'MCEE',
      motd: {
        raw: format(motd),
        clean: clean(motd),
        html: toHTML(motd)
      },
      version: {
        name: version,
        protocol: parseInt(protocolVersion) || 0
      },
      players: {
        online: parseInt(onlinePlayers) || 0,
        max: parseInt(maxPlayers) || 0,
        sample: null
      },
      favicon: null,
      serverGUID,
      serverID,
      gameMode,
      gameModeId: parseInt(gameModeID) || 0,
      portIPv4: portIPv4 ? parseInt(portIPv4) : null,
      portIPv6: portIPv6 ? parseInt(portIPv6) : null,
      srvRecord,
      roundTripLatency: 0
    };
  } catch (error) {
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