/**
 * Java Edition specific status types
 */

import type { BaseStatusOptions, BaseStatusResponse, ServerInfo } from './Common';

export interface JavaStatusOptions extends BaseStatusOptions {
  protocol?: number;
  enableSRV?: boolean;
  timeout?: number;
}

export interface JavaStatusResponse extends BaseStatusResponse, ServerInfo {
  // Java-specific fields
  srvRecord: import('./Common').SRVRecord | null;
  roundTripLatency: number;
}

// Legacy protocol support
export interface JavaStatusLegacyOptions extends JavaStatusOptions {
  protocol?: number;
}

export interface JavaStatusLegacyResponse extends JavaStatusResponse {
  // Legacy-specific fields
  protocol?: number;
}

// Forge/Fabric support
export interface JavaStatusFE01Options extends JavaStatusOptions {
  // FE01 specific options
}

export interface JavaStatusFE01Response extends JavaStatusResponse {
  // FE01 specific fields
  forgeData?: {
    channels: Array<{
      name: string;
      version: string;
    }>;
    mods: Array<{
      id: string;
      version: string;
    }>;
  };
}

export interface JavaStatusFE01FAOptions extends JavaStatusFE01Options {
  // FE01FA specific options
}

export interface JavaStatusFE01FAResponse extends JavaStatusFE01Response {
  // FE01FA specific fields
  forgeData?: {
    channels: Array<{
      name: string;
      version: string;
    }>;
    mods: Array<{
      id: string;
      version: string;
    }>;
    fmlNetworkVersion: number;
  };
} 