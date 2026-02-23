/**
 * Geocode Ralphs Stores Script
 * 
 * Uses free Nominatim API (OpenStreetMap) to get accurate lat/lon coordinates
 * for all 57 Ralphs store addresses
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Ralphs stores file
const ralphsFilePath = path.join(__dirname, 'ralphs-stores.json');
const stores = JSON.parse(fs.readFileSync(ralphsFilePath, 'utf8'));

console.log('\n🌍 GEOCODING RALPHS STORES\n');
console.log(`📍 Found ${stores.length} stores to geocode\n`);
console.log('⏱️  Using Nominatim API (free, rate-limited to 1 req/sec)\n');
console.log('=' .repeat(70));

// Sleep function to respect rate limits
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Geocode a single address using Nominatim (OpenStreetMap)
async function geocodeAddress(address) {
  try {
    // Nominatim requires a User-Agent header
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'ProxStoreLocator/1.0 (Internship Assessment)'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      return null;
    }

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    };
  } catch (error) {
    console.error(`   ❌ Geocoding error: ${error.message}`);
    return null;
  }
}

// Main geocoding function
async function geocodeAllStores() {
  let successCount = 0;
  let failCount = 0;
  const updatedStores = [];

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];
    const storeNum = i + 1;

    console.log(`\n[${storeNum}/${stores.length}] ${store.address}`);
    console.log(`   Old: (${store.lat}, ${store.lon})`);

    // Geocode the address
    const coords = await geocodeAddress(store.address);

    if (coords) {
      // Round to 4 decimal places (~11 meters accuracy)
      coords.lat = Math.round(coords.lat * 10000) / 10000;
      coords.lon = Math.round(coords.lon * 10000) / 10000;

      console.log(`   New: (${coords.lat}, ${coords.lon}) ✅`);

      updatedStores.push({
        ...store,
        lat: coords.lat,
        lon: coords.lon
      });

      successCount++;
    } else {
      console.log(`   ⚠️  Geocoding failed - keeping original coordinates`);
      updatedStores.push(store);
      failCount++;
    }

    // Rate limit: Wait 1.1 seconds between requests (Nominatim requires max 1 req/sec)
    if (i < stores.length - 1) {
      await sleep(1100);
    }
  }

  // Save updated stores
  fs.writeFileSync(
    ralphsFilePath,
    JSON.stringify(updatedStores, null, 2),
    'utf8'
  );

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ GEOCODING COMPLETE!\n');
  console.log(`📊 Results:`);
  console.log(`   ✅ Success: ${successCount} stores`);
  console.log(`   ⚠️  Failed: ${failCount} stores`);
  console.log(`   📁 Saved to: ${ralphsFilePath}\n`);
  console.log('=' .repeat(70));
  console.log('\n🎯 Next steps:');
  console.log('   1. node scripts/clear-all-stores.js');
  console.log('   2. node scripts/bulk-upload-stores.js\n');
}

// Run the geocoding
geocodeAllStores()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });