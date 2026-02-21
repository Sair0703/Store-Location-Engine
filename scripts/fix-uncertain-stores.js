#!/usr/bin/env node

/**
 * Fix Uncertain Store Addresses
 * Updates coordinates for stores with valid addresses but wrong lat/lon
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fix Uncertain Store Addresses');
console.log('='.repeat(60));

// Load verification results
const resultsPath = path.join(__dirname, 'verification-results.json');

if (!fs.existsSync(resultsPath)) {
  console.log('❌ verification-results.json not found!');
  console.log('   Run: node scripts/verify-stores.js first\n');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

console.log(`\n📊 Current status:`);
console.log(`   ✅ Valid:     ${results.valid.length}`);
console.log(`   ⚠️  Uncertain: ${results.uncertain.length}`);
console.log(`   ❌ Invalid:   ${results.invalid.length}\n`);

if (results.uncertain.length === 0) {
  console.log('✅ No uncertain addresses to fix!\n');
  process.exit(0);
}

console.log('🔍 Analyzing uncertain addresses...\n');

// Categorize uncertain by confidence
const fixable = results.uncertain.filter(store => {
  const v = store.verification;
  // If we found coordinates, it means the address is real
  return v.foundLat && v.foundLon;
});

const manualReview = results.uncertain.filter(store => {
  const v = store.verification;
  return !v.foundLat || !v.foundLon;
});

console.log(`   ${fixable.length} stores can be AUTO-FIXED (address found, just update coordinates)`);
console.log(`   ${manualReview.length} stores need MANUAL REVIEW\n`);

if (fixable.length > 0) {
  console.log('🔧 AUTO-FIXABLE stores (updating coordinates):\n');
  
  const fixed = fixable.map(store => {
    const oldLat = store.lat;
    const oldLon = store.lon;
    const newLat = store.verification.foundLat;
    const newLon = store.verification.foundLon;
    
    console.log(`   ✅ ${store.address}`);
    console.log(`      Old: (${oldLat}, ${oldLon})`);
    console.log(`      New: (${newLat}, ${newLon})`);
    console.log(`      ${store.verification.displayName || store.verification.formattedAddress || ''}\n`);
    
    return {
      store_name: store.store_name,
      address: store.address,
      lat: newLat,
      lon: newLon,
      retailer: store.retailer,
      _fixed: true,
      _original_coords: { lat: oldLat, lon: oldLon }
    };
  });
  
  // Combine valid + fixed
  const allValidStores = [
    ...results.valid.map(s => ({
      store_name: s.store_name,
      address: s.address,
      lat: s.lat,
      lon: s.lon,
      retailer: s.retailer
    })),
    ...fixed
  ];
  
  const walmartStores = allValidStores.filter(s => s.retailer === 'Walmart');
  const ralphsStores = allValidStores.filter(s => s.retailer === 'Ralphs');
  
  // Save combined datasets
  fs.writeFileSync(
    path.join(__dirname, 'walmart-stores-fixed.json'),
    JSON.stringify(walmartStores, null, 2)
  );
  
  fs.writeFileSync(
    path.join(__dirname, 'ralphs-stores-fixed.json'),
    JSON.stringify(ralphsStores, null, 2)
  );
  
  console.log('='.repeat(60));
  console.log('✅ FIXED datasets created:\n');
  console.log(`   walmart-stores-fixed.json: ${walmartStores.length} stores`);
  console.log(`   ralphs-stores-fixed.json: ${ralphsStores.length} stores\n`);
  console.log(`   Total: ${allValidStores.length} verified real stores!\n`);
}

if (manualReview.length > 0) {
  console.log('⚠️  MANUAL REVIEW needed for:\n');
  manualReview.forEach(store => {
    console.log(`   ${store.address}`);
    console.log(`   Reason: ${store.verification.reason}\n`);
  });
}

// Save invalid list for removal
if (results.invalid.length > 0) {
  fs.writeFileSync(
    path.join(__dirname, 'invalid-stores.json'),
    JSON.stringify(results.invalid, null, 2)
  );
  console.log(`❌ Invalid stores saved to: invalid-stores.json (${results.invalid.length} stores)\n`);
}

console.log('='.repeat(60));
console.log('🚀 NEXT STEPS:\n');
console.log('1. Review the fixed datasets:');
console.log('   - walmart-stores-fixed.json');
console.log('   - ralphs-stores-fixed.json\n');
console.log('2. Replace your current data:');
console.log('   mv walmart-stores-fixed.json walmart-stores.json');
console.log('   mv ralphs-stores-fixed.json ralphs-stores.json\n');
console.log('3. Upload to database:');
console.log('   node scripts/bulk-upload.js\n');
console.log('4. Test API:');
console.log('   curl "http://localhost:8000/api/stores?zip=90210&radius=10"\n');
