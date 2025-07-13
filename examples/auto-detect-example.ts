/**
 * Auto-Detection Example for minecraft-mquery
 * Shows how to automatically detect server type (Java vs Bedrock)
 */

import { autoDetect, isOnline, getServerType, MinecraftServerError } from '../dist/index.js';

async function autoDetectExample(): Promise<void> {
  console.log('🎮 Minecraft MQuery - Auto-Detection Example');
  console.log('=' .repeat(60));

  const servers = [
    { name: 'PixelCash (Java)', host: 'mc.pixelcash.pl' },
    { name: 'MC Complex (Bedrock)', host: 'bmc.mc-complex.com' },
    { name: 'Hypixel (Java)', host: 'mc.hypixel.net' },
    { name: 'Offline Server', host: 'offline.server.example' }
  ];

  for (const server of servers) {
    console.log(`\n🔍 Testing: ${server.name} (${server.host})`);
    console.log('-'.repeat(50));

    try {
      // Method 1: Full auto-detection with data
      console.log('📊 Method 1: Full auto-detection...');
      const result = await autoDetect(server.host, undefined, {
        timeout: 10000,
        enableSRV: true,
        tryJavaFirst: true
      });

      if (result.type === 'java') {
        console.log(`✅ Detected: Java Edition`);
        console.log(`   Players: ${result.data.players.online}/${result.data.players.max}`);
        console.log(`   Version: ${result.data.version.name}`);
        console.log(`   MOTD: ${result.data.motd.clean.substring(0, 50)}...`);
      } else {
        console.log(`✅ Detected: Bedrock Edition`);
        console.log(`   Players: ${result.data.players.online}/${result.data.players.max}`);
        console.log(`   Game Mode: ${result.data.gameMode}`);
        console.log(`   Edition: ${result.data.edition}`);
        console.log(`   MOTD: ${result.data.motd.clean.substring(0, 50)}...`);
      }

      // Method 2: Quick online check
      console.log('\n📊 Method 2: Quick online check...');
      const online = await isOnline(server.host);
      console.log(`   Online: ${online ? 'Yes' : 'No'}`);

      // Method 3: Server type only
      console.log('\n📊 Method 3: Server type only...');
      const type = await getServerType(server.host);
      console.log(`   Type: ${type}`);

    } catch (error) {
      if (error instanceof MinecraftServerError) {
        console.log(`❌ Error: ${error.code} - ${error.message}`);
      } else {
        console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  // Example with custom port
  console.log('\n' + '='.repeat(60));
  console.log('🔧 Example with custom port:');
  console.log('-'.repeat(30));
  
  try {
    const result = await autoDetect('bmc.mc-complex.com', 19132, {
      tryJavaFirst: false // Try Bedrock first
    });
    
    console.log(`✅ Server type: ${result.type}`);
    console.log(`📊 Players: ${result.data.players.online}/${result.data.players.max}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n🎯 Auto-Detection Features:');
  console.log('✅ Automatically detects Java vs Bedrock');
  console.log('✅ Tries both protocols if needed');
  console.log('✅ Configurable timeout and options');
  console.log('✅ Quick online/offline checks');
  console.log('✅ Server type detection only');
  console.log('✅ Smart port handling');
}

// Run the example
autoDetectExample().catch(console.error); 