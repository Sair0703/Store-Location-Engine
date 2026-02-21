#!/usr/bin/env node

/**
 * Store Address Verification Script
 * Checks if store addresses are real using Google Maps Geocoding API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Store Address Verification Tool');
console.log('='.repeat(60));
console.log('\nThis script will verify store addresses using geocoding.\n');

// Load current store data
const walmartPath = path.join(__dirname, 'walmart-stores.json');
const ralphsPath = path.join(__dirname, 'ralphs-stores.json');

let walmartStores = [];
let ralphsStores = [];

if (fs.existsSync(walmartPath)) {
  walmartStores = JSON.parse(fs.readFileSync(walmartPath, 'utf-8'));
}

if (fs.existsSync(ralphsPath)) {
  ralphsStores = JSON.parse(fs.readFileSync(ralphsPath, 'utf-8'));
}

const allStores = [...walmartStores, ...ralphsStores];

console.log(`📊 Total stores to verify: ${allStores.length}`);
console.log(`   Walmart: ${walmartStores.length}`);
console.log(`   Ralphs: ${ralphsStores.length}\n`);

console.log('⚠️  VERIFICATION OPTIONS:\n');
console.log('Option 1: Google Maps Geocoding API');
console.log('  - Accurate and reliable');
console.log('  - Requires API key from: https://console.cloud.google.com/');
console.log('  - Free tier: 40,000 requests/month');
console.log('  - Set env variable: GOOGLE_MAPS_API_KEY\n');

console.log('Option 2: Nominatim (OpenStreetMap)');
console.log('  - Free, no API key needed');
console.log('  - Rate limited: 1 request/second');
console.log('  - Less accurate for retail stores\n');

console.log('Option 3: Manual Google Search (what you just did)');
console.log('  - Copy each address to Google');
console.log('  - Tedious but free and accurate\n');

console.log('='.repeat(60));

// Function to verify address using Nominatim (free)
async function verifyAddressNominatim(store) {
  const encodedAddress = encodeURIComponent(store.address);
  const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Store-Locator-Verification/1.0'
      }
    });
    
    if (!response.ok) {
      return { valid: false, reason: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
      return { valid: false, reason: 'Address not found' };
    }
    
    const result = data[0];
    const foundLat = parseFloat(result.lat);
    const foundLon = parseFloat(result.lon);
    
    // Check if coordinates match (within 0.01 degrees ~ 1km)
    const latDiff = Math.abs(foundLat - store.lat);
    const lonDiff = Math.abs(foundLon - store.lon);
    
    if (latDiff < 0.01 && lonDiff < 0.01) {
      return { 
        valid: true, 
        confidence: 'high',
        foundLat,
        foundLon,
        displayName: result.display_name
      };
    } else {
      return { 
        valid: 'uncertain', 
        confidence: 'low',
        reason: `Coordinates mismatch (Δlat: ${latDiff.toFixed(4)}, Δlon: ${lonDiff.toFixed(4)})`,
        foundLat,
        foundLon,
        displayName: result.display_name
      };
    }
    
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

// Function to verify using Google Maps API
async function verifyAddressGoogle(store, apiKey) {
  const encodedAddress = encodeURIComponent(store.address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      return { valid: false, reason: data.status };
    }
    
    if (data.results.length === 0) {
      return { valid: false, reason: 'Address not found' };
    }
    
    const result = data.results[0];
    const foundLat = result.geometry.location.lat;
    const foundLon = result.geometry.location.lng;
    
    // Check if coordinates match (within 0.001 degrees ~ 100m)
    const latDiff = Math.abs(foundLat - store.lat);
    const lonDiff = Math.abs(foundLon - store.lon);
    
    if (latDiff < 0.001 && lonDiff < 0.001) {
      return { 
        valid: true, 
        confidence: 'high',
        foundLat,
        foundLon,
        formattedAddress: result.formatted_address,
        types: result.types
      };
    } else {
      return { 
        valid: 'uncertain', 
        confidence: 'low',
        reason: `Coordinates mismatch (Δlat: ${latDiff.toFixed(4)}, Δlon: ${lonDiff.toFixed(4)})`,
        foundLat,
        foundLon,
        formattedAddress: result.formatted_address
      };
    }
    
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

async function runVerification() {
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (googleApiKey) {
    console.log('\n✅ Google Maps API key found. Using Google Geocoding API...\n');
  } else {
    console.log('\n⚠️  No Google API key found. Using free Nominatim API (slower)...');
    console.log('   To use Google: export GOOGLE_MAPS_API_KEY=your_key_here\n');
  }
  
  const results = {
    valid: [],
    invalid: [],
    uncertain: []
  };
  
  for (let i = 0; i < allStores.length; i++) {
    const store = allStores[i];
    
    process.stdout.write(`\r[${i + 1}/${allStores.length}] Verifying: ${store.address.substring(0, 50)}...`);
    
    let verification;
    if (googleApiKey) {
      verification = await verifyAddressGoogle(store, googleApiKey);
    } else {
      verification = await verifyAddressNominatim(store);
      // Nominatim rate limit: 1 request/second
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
    
    const result = {
      ...store,
      verification
    };
    
    if (verification.valid === true) {
      results.valid.push(result);
    } else if (verification.valid === 'uncertain') {
      results.uncertain.push(result);
    } else {
      results.invalid.push(result);
    }
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 VERIFICATION RESULTS:\n');
  console.log(`✅ Valid addresses:     ${results.valid.length}`);
  console.log(`⚠️  Uncertain addresses: ${results.uncertain.length}`);
  console.log(`❌ Invalid addresses:   ${results.invalid.length}\n`);
  
  // Save results
  const outputPath = path.join(__dirname, 'verification-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`💾 Full results saved to: ${outputPath}\n`);
  
  // Show sample invalid addresses
  if (results.invalid.length > 0) {
    console.log('❌ Sample INVALID addresses:\n');
    results.invalid.slice(0, 5).forEach(store => {
      console.log(`   ${store.address}`);
      console.log(`   Reason: ${store.verification.reason}\n`);
    });
  }
  
  // Show sample uncertain addresses
  if (results.uncertain.length > 0) {
    console.log('⚠️  Sample UNCERTAIN addresses:\n');
    results.uncertain.slice(0, 5).forEach(store => {
      console.log(`   ${store.address}`);
      console.log(`   Reason: ${store.verification.reason}\n`);
    });
  }
  
  // Create cleaned datasets with only valid stores
  const validWalmart = results.valid.filter(s => s.retailer === 'Walmart');
  const validRalphs = results.valid.filter(s => s.retailer === 'Ralphs');
  
  if (results.valid.length > 0) {
    fs.writeFileSync(
      path.join(__dirname, 'walmart-stores-verified.json'),
      JSON.stringify(validWalmart.map(s => ({
        store_name: s.store_name,
        address: s.address,
        lat: s.lat,
        lon: s.lon,
        retailer: s.retailer
      })), null, 2)
    );
    
    fs.writeFileSync(
      path.join(__dirname, 'ralphs-stores-verified.json'),
      JSON.stringify(validRalphs.map(s => ({
        store_name: s.store_name,
        address: s.address,
        lat: s.lat,
        lon: s.lon,
        retailer: s.retailer
      })), null, 2)
    );
    
    console.log(`✅ Verified datasets created:`);
    console.log(`   - walmart-stores-verified.json (${validWalmart.length} stores)`);
    console.log(`   - ralphs-stores-verified.json (${validRalphs.length} stores)\n`);
  }
  
  console.log('🚀 Next steps:');
  if (results.valid.length > 20) {
    console.log('   1. Review verification-results.json');
    console.log('   2. Use verified datasets: cp *-verified.json to replace originals');
    console.log('   3. Run: node scripts/bulk-upload.js\n');
  } else {
    console.log('   ⚠️  Too few valid stores found!');
    console.log('   - Review verification-results.json');
    console.log('   - Consider manually adding real store data\n');
  }
}

if (allStores.length === 0) {
  console.log('❌ No stores found in JSON files!\n');
  process.exit(1);
}

runVerification().catch(console.error);
