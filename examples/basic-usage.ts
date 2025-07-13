/**
 * Basic Usage Examples for minecraft-mquery
 */

import { status, statusBedrock, MinecraftServerError } from '../dist/index.js';

async function basicUsageExamples(): Promise<void> {
  console.log('Minecraft MQuery - Basic Usage Examples');
  console.log('=====================================');

  // Example 1: Java Edition Server
  console.log('\nExample 1: Java Edition Server');
  console.log('-------------------------------');
  
  try {
    const javaStatus = await status('mc.pixelcash.pl', 25565, {
      timeout: 5000,
      enableSRV: true
    });

    console.log(`✅ Server: mc.pixelcash.pl`);
    console.log(`Players: ${javaStatus.players.online}/${javaStatus.players.max}`);
    console.log(`Version: ${javaStatus.version.name} (Protocol: ${javaStatus.version.protocol})`);
    console.log(`MOTD: ${javaStatus.motd.clean}`);
    
    if (javaStatus.favicon) {
      console.log(`Favicon: Available`);
    }
    
    if (javaStatus.players.sample && javaStatus.players.sample.length > 0) {
      console.log(`Sample players: ${javaStatus.players.sample.slice(0, 3).map(p => p.name).join(', ')}`);
    }

  } catch (error) {
    if (error instanceof MinecraftServerError) {
      console.log(`❌ Error: ${error.code} - ${error.message}`);
    } else {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Example 2: Bedrock Edition Server
  console.log('\nExample 2: Bedrock Edition Server');
  console.log('---------------------------------');
  
  try {
    const bedrockStatus = await statusBedrock('bmc.mc-complex.com', 19132, {
      timeout: 5000,
      enableSRV: true
    });

    console.log(`✅ Server: bmc.mc-complex.com`);
    console.log(`Players: ${bedrockStatus.players.online}/${bedrockStatus.players.max}`);
    console.log(`Version: ${bedrockStatus.version.name} (Protocol: ${bedrockStatus.version.protocol})`);
    console.log(`Game Mode: ${bedrockStatus.gameMode} (ID: ${bedrockStatus.gameModeId})`);
    console.log(`Edition: ${bedrockStatus.edition}`);
    console.log(`MOTD: ${bedrockStatus.motd.clean}`);
    console.log(`Server GUID: ${bedrockStatus.serverGUID}`);

  } catch (error) {
    if (error instanceof MinecraftServerError) {
      console.log(`❌ Error: ${error.code} - ${error.message}`);
    } else {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Example 3: Error Handling
  console.log('\nExample 3: Error Handling');
  console.log('-------------------------');
  
  try {
    await status('offline.server.example', 25565, { timeout: 2000 });
  } catch (error) {
    if (error instanceof MinecraftServerError) {
      console.log(`Proper error handling:`);
      console.log(`  Code: ${error.code}`);
      console.log(`  Message: ${error.message}`);
      console.log(`  Host: ${error.host}`);
      console.log(`  Port: ${error.port}`);
    }
  }

  console.log('\nLibrary Features:');
  console.log('- Java Edition support');
  console.log('- Bedrock Edition support');
  console.log('- TypeScript support');
  console.log('- Error handling');
  console.log('- SRV record resolution');
  console.log('- Timeout configuration');
  console.log('- Modern async/await API');
}

// Run the examples
basicUsageExamples().catch(console.error); 