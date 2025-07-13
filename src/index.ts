/**
 * Minecraft Server Util 2025 - Modernized Minecraft Server Utility Library
 * 
 * A modern Node.js library for Minecraft servers that can retrieve status 
 * for both Java Edition and Bedrock Edition servers. Remastered for 2025 
 * with modern TypeScript features, better error handling, and improved performance.
 */

// Core status functions
export { status } from './status';
export { statusBedrock } from './statusBedrock';
export { autoDetect, isOnline, getServerType } from './autoDetect';

// Type exports
export * from './types';
export type { AutoDetectResponse, AutoDetectOptions } from './autoDetect';

// Utility functions
export { resolveSRV, hasSRVRecords, getAllSRVRecords } from './util/srvRecord';

// Structure classes
export { TCPClient } from './structure/TCPClient';
export { UDPClient } from './structure/UDPClient';

// Error classes and constants
export { MinecraftServerError, ErrorCodes } from './types/Common';

// Re-export minecraft-motd-util for convenience
export { clean, format, parse, toHTML } from 'minecraft-motd-util'; 