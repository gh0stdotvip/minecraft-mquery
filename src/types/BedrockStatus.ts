/**
 * Bedrock Edition specific status types
 */

import type { BaseStatusOptions, BaseStatusResponse, ServerInfo } from './Common';

export interface BedrockStatusOptions extends BaseStatusOptions {
  clientGUID?: number;
  timeout?: number;
}

export interface BedrockStatusResponse extends BaseStatusResponse, ServerInfo {
  // Bedrock-specific fields
  edition: 'MCPE' | 'MCEE';
  gameMode: string;
  gameModeId: number;
  portIPv4: number | null;
  portIPv6: number | null;
  serverGUID: bigint;
  serverID: string;
  srvRecord: import('./Common').SRVRecord | null;
  roundTripLatency: number;
}

export interface BedrockServerInfo {
  serverGUID: number;
  edition: string;
  motd1: string;
  protocolVersion: number;
  version: string;
  playerCount: number;
  maxPlayerCount: number;
  gameMode: string;
  gameModeId: number;
  portIPv4: number;
  portIPv6: number;
  motd2: string;
  unknown1: string;
  unknown2: string;
} 