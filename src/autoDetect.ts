/**
 * Auto-detection for Minecraft server type (Java vs Bedrock)
 */

import { status } from './status';
import { statusBedrock } from './statusBedrock';
import type { JavaStatusResponse } from './types/JavaStatus';
import type { BedrockStatusResponse } from './types/BedrockStatus';
import { MinecraftServerError, ErrorCodes } from './types/Common';

export type AutoDetectResponse = 
  | { type: 'java'; data: JavaStatusResponse }
  | { type: 'bedrock'; data: BedrockStatusResponse };

export interface AutoDetectOptions {
  timeout?: number;
  enableSRV?: boolean;
  protocol?: number;
  tryJavaFirst?: boolean;
}

/**
 * Automatically detects if a server is Java Edition or Bedrock Edition
 * @param host - Server hostname or IP address
 * @param port - Server port (default: 25565 for Java, 19132 for Bedrock)
 * @param options - Detection options
 * @returns Promise resolving to server type and data
 */
export async function autoDetect(
  host: string,
  port?: number,
  options?: AutoDetectOptions
): Promise<AutoDetectResponse> {
  const timeout = options?.timeout ?? 5000;
  const tryJavaFirst = options?.tryJavaFirst ?? true;

  // Default ports
  const javaPort = port || 25565;
  const bedrockPort = port || 19132;

  // Try Java first if specified, otherwise try Bedrock first
  if (tryJavaFirst) {
    try {
      const javaOptions: any = {
        timeout: Math.floor(timeout / 2) // Half timeout for each attempt
      };
      
      if (options?.enableSRV !== undefined) {
        javaOptions.enableSRV = options.enableSRV;
      }
      
      if (options?.protocol !== undefined) {
        javaOptions.protocol = options.protocol;
      }
      
      const javaData = await status(host, javaPort, javaOptions);
      
      return { type: 'java', data: javaData };
    } catch (error) {
      // Java failed, try Bedrock
    }

    try {
      const bedrockOptions: any = {
        timeout: Math.floor(timeout / 2)
      };
      
      if (options?.enableSRV !== undefined) {
        bedrockOptions.enableSRV = options.enableSRV;
      }
      
      const bedrockData = await statusBedrock(host, bedrockPort, bedrockOptions);
      
      return { type: 'bedrock', data: bedrockData };
    } catch (error) {
      // Bedrock failed
    }
  } else {
    // Try Bedrock first
    try {
      const bedrockOptions: any = {
        timeout: Math.floor(timeout / 2)
      };
      
      if (options?.enableSRV !== undefined) {
        bedrockOptions.enableSRV = options.enableSRV;
      }
      
      const bedrockData = await statusBedrock(host, bedrockPort, bedrockOptions);
      
      return { type: 'bedrock', data: bedrockData };
    } catch (error) {
      // Bedrock failed, try Java
    }

    try {
      const javaOptions: any = {
        timeout: Math.floor(timeout / 2)
      };
      
      if (options?.enableSRV !== undefined) {
        javaOptions.enableSRV = options.enableSRV;
      }
      
      if (options?.protocol !== undefined) {
        javaOptions.protocol = options.protocol;
      }
      
      const javaData = await status(host, javaPort, javaOptions);
      
      return { type: 'java', data: javaData };
    } catch (error) {
      // Java failed
    }
  }

  // If both failed, throw an error
  throw new MinecraftServerError(
    'Server is offline or unreachable on both Java and Bedrock protocols',
    ErrorCodes.SERVER_OFFLINE,
    host,
    port || 25565
  );
}

/**
 * Quick check if a server is online (any type)
 * @param host - Server hostname or IP address
 * @param port - Server port
 * @param options - Detection options
 * @returns Promise resolving to true if server is online
 */
export async function isOnline(
  host: string,
  port?: number,
  options?: AutoDetectOptions
): Promise<boolean> {
  try {
    await autoDetect(host, port, options);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get server type without full status data
 * @param host - Server hostname or IP address
 * @param port - Server port
 * @param options - Detection options
 * @returns Promise resolving to server type
 */
export async function getServerType(
  host: string,
  port?: number,
  options?: AutoDetectOptions
): Promise<'java' | 'bedrock' | 'offline'> {
  try {
    const result = await autoDetect(host, port, options);
    return result.type;
  } catch {
    return 'offline';
  }
} 