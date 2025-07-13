/**
 * Tests for the status function
 */

import { status, resolveSRV } from '../index';

describe('status', () => {
  it('should throw error for invalid host', async () => {
    await expect(status('')).rejects.toThrow('Expected host to have a length greater than 0');
  });

  it('should throw error for invalid port', async () => {
    await expect(status('localhost', -1)).rejects.toThrow('Expected \'port\' to be between 0 and 65535');
    await expect(status('localhost', 70000)).rejects.toThrow('Expected \'port\' to be between 0 and 65535');
  });

  it('should throw error for invalid options', async () => {
    await expect(status('localhost', 25565, { timeout: -1 } as any)).rejects.toThrow('Expected \'options.timeout\' to be greater than or equal to 0');
  });

  it('should handle offline server gracefully', async () => {
    await expect(status('invalid-server-that-does-not-exist.com')).rejects.toThrow();
  });
});

describe('resolveSRV', () => {
  it('should return null for non-existent SRV records', async () => {
    const result = await resolveSRV('invalid-domain-that-does-not-exist.com');
    expect(result).toBeNull();
  });

  it('should handle invalid hostnames gracefully', async () => {
    const result = await resolveSRV('');
    expect(result).toBeNull();
  });
}); 