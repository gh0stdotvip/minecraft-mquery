/**
 * SRV record resolution utilities
 */

import { promises as dns } from 'dns';
import type { SRVRecord } from '../types/Common';

interface DNSSRVRecord {
  name: string;
  port: number;
  priority: number;
  weight: number;
}

/**
 * Resolves SRV records for a given hostname
 * @param host - The hostname to resolve SRV records for
 * @returns Promise resolving to SRV record or null if not found
 */
export async function resolveSRV(host: string): Promise<SRVRecord | null> {
  try {
    const srvRecords = await dns.resolveSrv(`_minecraft._tcp.${host}`);
    
    if (srvRecords.length === 0) {
      return null;
    }

    // Sort by priority and weight (lower priority first, then by weight)
    const sortedRecords = srvRecords.sort((a: DNSSRVRecord, b: DNSSRVRecord) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.weight - a.weight; // Higher weight first
    });

    const record = sortedRecords[0];
    
    if (!record) {
      return null;
    }
    
    return {
      host: record.name,
      port: record.port,
      priority: record.priority,
      weight: record.weight
    };
  } catch (error) {
    // SRV record not found or DNS error
    return null;
  }
}

/**
 * Checks if a hostname has SRV records
 * @param host - The hostname to check
 * @returns Promise resolving to true if SRV records exist
 */
export async function hasSRVRecords(host: string): Promise<boolean> {
  const srvRecord = await resolveSRV(host);
  return srvRecord !== null;
}

/**
 * Gets all SRV records for a hostname
 * @param host - The hostname to get SRV records for
 * @returns Promise resolving to array of SRV records
 */
export async function getAllSRVRecords(host: string): Promise<SRVRecord[]> {
  try {
    const srvRecords = await dns.resolveSrv(`_minecraft._tcp.${host}`);
    
    return srvRecords.map((record: DNSSRVRecord) => ({
      host: record.name,
      port: record.port,
      priority: record.priority,
      weight: record.weight
    }));
  } catch (error) {
    return [];
  }
} 