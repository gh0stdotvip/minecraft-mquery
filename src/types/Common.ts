// Common types used across the minecraft-mquery library

export interface ServerAddress {
  host: string;
  port: number;
}

export interface SRVRecord {
  host: string;
  port: number;
  priority: number;
  weight: number;
}

export interface BaseStatusOptions {
  timeout?: number;
  enableSRV?: boolean;
}

export interface BaseStatusResponse {
  srvRecord: SRVRecord | null;
  roundTripLatency: number;
}

export interface Player {
  name: string;
  id: string;
}

export interface MOTD {
  raw: string;
  clean: string;
  html: string;
}

export interface Version {
  name: string;
  protocol: number;
}

export interface Players {
  online: number;
  max: number;
  sample: Player[] | null;
}

export interface ServerInfo {
  version: Version;
  players: Players;
  motd: MOTD;
  favicon: string | null;
}

export type MinecraftEdition = 'java' | 'bedrock';

export interface ConnectionOptions {
  host: string;
  port: number;
  timeout?: number;
}

export class MinecraftServerError extends Error {
  public readonly code: string;
  public readonly host: string;
  public readonly port: number;

  constructor(message: string, code: string, host: string, port: number) {
    super(message);
    this.name = 'MinecraftServerError';
    this.code = code;
    this.host = host;
    this.port = port;
  }
}

export const ErrorCodes = {
  TIMEOUT: 'TIMEOUT',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  UNSUPPORTED_PROTOCOL: 'UNSUPPORTED_PROTOCOL',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  SERVER_OFFLINE: 'SERVER_OFFLINE'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]; 