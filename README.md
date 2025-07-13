# minecraft-mquery

Modern TypeScript library for querying Minecraft servers (Java & Bedrock) with auto-detection and CLI support. (minecraft-server-util rewritten for 2025)

## Installation

```bash
npm install minecraft-mquery
```

## Quick Start

### CLI Usage

```bash
# Auto-detect server type
npx minecraft-mquery mc.example.net

# Force Java protocol
npx minecraft-mquery mc.example.net --java

# Force Bedrock protocol  
npx minecraft-mquery mc.example.net --bedrock

# Custom port
npx minecraft-mquery mc.example.net:25565

# Help
npx minecraft-mquery --help
```

### Programmatic Usage

```typescript
import { queryServer, autoDetect } from 'minecraft-mquery';

// Auto-detect server type
const serverInfo = await autoDetect('mc.example.net');
console.log(serverInfo);

// Manual Java server query
const javaInfo = await queryServer('mc.example.net', { protocol: 'java' });
console.log(javaInfo);

// Manual Bedrock server query
const bedrockInfo = await queryServer('mc.example.net', { protocol: 'bedrock' });
console.log(bedrockInfo);
```

## API Reference

### `queryServer(host, options?)`

Query a specific Minecraft server.

**Parameters:**
- `host` (string): Server hostname/IP with optional port (default: 25565 for Java, 19132 for Bedrock)
- `options` (object, optional):
  - `protocol` ('java' | 'bedrock'): Force specific protocol
  - `timeout` (number): Connection timeout in milliseconds (default: 5000)

**Returns:** Promise<ServerInfo>

### `autoDetect(host, timeout?)`

Automatically detect server type and query it.

**Parameters:**
- `host` (string): Server hostname/IP with optional port
- `timeout` (number): Connection timeout in milliseconds (default: 5000)

**Returns:** Promise<ServerInfo>

### ServerInfo Interface

```typescript
interface ServerInfo {
  host: string;
  port: number;
  protocol: 'java' | 'bedrock';
  online: boolean;
  version?: string;
  players?: {
    online: number;
    max: number;
    list?: string[];
  };
  description?: string;
  favicon?: string;
  ping?: number;
  error?: string;
}
```

## Examples

### Basic Usage

```typescript
import { autoDetect } from 'minecraft-mquery';

const info = await autoDetect('mc.example.net');
console.log(`${info.host} is ${info.online ? 'online' : 'offline'}`);
if (info.online) {
  console.log(`Players: ${info.players?.online}/${info.players?.max}`);
  console.log(`Version: ${info.version}`);
}
```

### Batch Server Checking

```typescript
import { autoDetect } from 'minecraft-mquery';

const servers = ['mc.example.net', 'play.example.com', 'example.com'];
const results = await Promise.allSettled(
  servers.map(server => autoDetect(server))
);

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`${servers[index]}: ${result.value.online ? '🟢' : '🔴'}`);
  } else {
    console.log(`${servers[index]}: ❌ Error`);
  }
});
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build project
npm run build

# Run CLI
npm run cli mc.example.net
```

## License

MIT 