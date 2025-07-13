/**
 * Bedrock Edition Server Test for minecraft-mquery
 * Tests multiple Bedrock servers to verify functionality
 */

import { statusBedrock, MinecraftServerError } from '../dist/index.js';

interface BedrockServerTest {
  name: string;
  host: string;
  port?: number;
}

const bedrockServers: BedrockServerTest[] = [
  { name: 'MC Complex', host: 'bmc.mc-complex.com', port: 19132 },
  { name: 'CubeCraft', host: 'play.cubecraft.net' },
  { name: 'NetherGames', host: 'play.nethergames.org' },
  { name: 'Galaxite', host: 'play.galaxite.net' },
  { name: 'Mineplex', host: 'mco.mineplex.com' }
];

async function testBedrockServers(): Promise<void> {
  console.log('🎮 Minecraft MQuery - Bedrock Edition Test');
  console.log('=' .repeat(60));
  console.log(`Testing ${bedrockServers.length} Bedrock servers...\n`);

  const results: Array<{
    server: BedrockServerTest;
    online: boolean;
    data?: any;
    error?: any;
  }> = [];
  let onlineCount = 0;

  for (const server of bedrockServers) {
    try {
      console.log(`🔍 Testing ${server.name} (${server.host})...`);
      
      const data = await statusBedrock(server.host, server.port || 19132, {
        timeout: 10000,
        enableSRV: true
      });

      onlineCount++;
      results.push({ server, online: true, data });

      console.log(`   ✅ ONLINE - ${data.players.online}/${data.players.max} players`);
      console.log(`   📊 Version: ${data.version.name} (Protocol: ${data.version.protocol})`);
      console.log(`   🎮 Game Mode: ${data.gameMode} (ID: ${data.gameModeId})`);
      console.log(`   🌍 Edition: ${data.edition}`);
      console.log(`   📝 MOTD: ${data.motd.clean.substring(0, 50)}${data.motd.clean.length > 50 ? '...' : ''}`);
      
    } catch (error) {
      results.push({ server, online: false, error });
      
      if (error instanceof MinecraftServerError) {
        console.log(`   ❌ OFFLINE - ${error.code}: ${error.message}`);
      } else {
        console.log(`   ❌ ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BEDROCK TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Online: ${onlineCount}/${bedrockServers.length}`);
  console.log(`❌ Offline: ${bedrockServers.length - onlineCount}/${bedrockServers.length}`);

  if (onlineCount > 0) {
    console.log('\n🏆 ONLINE SERVERS:');
    results.filter(r => r.online).forEach(result => {
      const data = result.data!;
      console.log(`   ${result.server.name}: ${data.players.online}/${data.players.max} players`);
    });
  }

  console.log('\n🎯 BEDROCK LIBRARY STATUS:');
  if (onlineCount > 0) {
    console.log('✅ Bedrock support is working correctly!');
  } else {
    console.log('❌ Bedrock support may have issues');
  }
}

// Run the tests
testBedrockServers().catch(console.error); 