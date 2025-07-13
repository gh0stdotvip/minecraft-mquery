#!/usr/bin/env node

import { autoDetect, status, statusBedrock } from './dist/index.js';
import type { JavaStatusResponse, BedrockStatusResponse } from './dist/index.js';

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
Minecraft MQuery CLI - Check Minecraft server status

Usage:
  npx ts-node cli.ts <host> [port] [options]
  npx ts-node cli.ts <host>:<port> [options]

Examples:
  npx ts-node cli.ts mc.pixelcash.pl
  npx ts-node cli.ts mc.hypixel.net 25565
  npx ts-node cli.ts bmc.mc-complex.com 19132
  npx ts-node cli.ts mc.pixelcash.pl --java
  npx ts-node cli.ts bmc.mc-complex.com --bedrock

Options:
  --java     Force Java Edition check
  --bedrock  Force Bedrock Edition check
  --auto     Auto-detect (default)
  --help     Show this help

Examples:
  npx ts-node cli.ts mc.pixelcash.pl
  npx ts-node cli.ts mc.hypixel.net --java
  npx ts-node cli.ts bmc.mc-complex.com --bedrock
`);
}

async function checkServer(host: string, port?: number, forceType?: 'java' | 'bedrock') {
  console.log(`🔍 Checking server: ${host}${port ? ':' + port : ''}`);
  console.log('─'.repeat(50));

  try {
    let result;

    if (forceType === 'java') {
      console.log('📦 Checking Java Edition...');
      const javaResult = await status(host, port || 25565);
      result = { type: 'java', data: javaResult };
    } else if (forceType === 'bedrock') {
      console.log('🎮 Checking Bedrock Edition...');
      const bedrockResult = await statusBedrock(host, port || 19132);
      result = { type: 'bedrock', data: bedrockResult };
    } else {
      console.log('🔍 Auto-detecting server type...');
      result = await autoDetect(host, port);
    }

    // Display results
    console.log(`✅ Server Type: ${result.type.toUpperCase()}`);
    console.log(`📊 Players: ${result.data.players.online}/${result.data.players.max}`);
    console.log(`📋 Version: ${result.data.version.name} (Protocol: ${result.data.version.protocol})`);
    console.log(`📝 MOTD: ${result.data.motd.clean}`);

    if (result.type === 'java') {
      const javaData = result.data as JavaStatusResponse;
      if (javaData.favicon) {
        console.log(`🖼️  Favicon: Available`);
      }
      if (javaData.players.sample && javaData.players.sample.length > 0) {
        const players = javaData.players.sample.slice(0, 5).map(p => p.name).join(', ');
        console.log(`👥 Sample players: ${players}`);
      }
      if (javaData.roundTripLatency) {
        console.log(`⏱️  Ping: ${javaData.roundTripLatency}ms`);
      }
    } else if (result.type === 'bedrock') {
      const bedrockData = result.data as BedrockStatusResponse;
      console.log(`🎮 Game Mode: ${bedrockData.gameMode} (ID: ${bedrockData.gameModeId})`);
      console.log(`🌍 Edition: ${bedrockData.edition}`);
      console.log(`🆔 Server GUID: ${bedrockData.serverGUID}`);
    }

    console.log('─'.repeat(50));
    console.log('✅ Server is online!');

  } catch (error) {
    console.log('─'.repeat(50));
    console.log('❌ Server is offline or unreachable');
    if (error instanceof Error) {
      console.log(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Parse arguments
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

const host = args[0];
let port: number | undefined;
let forceType: 'java' | 'bedrock' | undefined;

// Parse host:port format
if (host && host.includes(':')) {
  const [, portPart] = host.split(':');
  if (portPart) {
    port = parseInt(portPart);
    if (isNaN(port)) {
      console.error('❌ Invalid port number');
      process.exit(1);
    }
  }
}

// Parse options
for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--java') {
    forceType = 'java';
  } else if (arg === '--bedrock') {
    forceType = 'bedrock';
  } else if (arg === '--auto') {
    forceType = undefined;
  } else if (arg && !isNaN(parseInt(arg)) && !port) {
    port = parseInt(arg);
  } else if (arg) {
    console.error(`❌ Unknown option: ${arg}`);
    showHelp();
    process.exit(1);
  }
}

// Validate host
if (!host || host.trim() === '') {
  console.error('❌ Host is required');
  process.exit(1);
}

// Run the check
checkServer(host, port, forceType).catch(error => {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
}); 