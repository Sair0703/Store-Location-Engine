/**
 * Store Bulk Uploader
 * 
 * Uploads store data to your Store Location API
 * Runtime: ~2-5 minutes for 500 stores
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Your API configuration
const API_BASE_URL = `https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1`; // Updated with actual Supabase URL
const API_ENDPOINT = '/make-server-26050ec2/stores';

// Read from environment or use the actual key
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNteWN4cXFmdnptcHZkdHZiYWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0Mzk5NTEsImV4cCI6MjA4NzAxNTk1MX0.zV4smA2wqcVHZYZsD1FNmzKLIbyGFuq1X4zN97PI7lE';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadStore(store, index, total) {
  try {
    // First, check if this store already exists (same name + address)
    const checkResponse = await fetch(`${API_BASE_URL}${API_ENDPOINT}/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    if (checkResponse.ok) {
      const existingStores = await checkResponse.json();
      const duplicate = existingStores.find(s => 
        s.store_name === store.store_name && 
        s.address === store.address
      );
      
      if (duplicate) {
        console.log(`⏭️  [${index + 1}/${total}] Skipped (duplicate): ${store.store_name}`);
        return { success: true, skipped: true, store };
      }
    }
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify(store)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ [${index + 1}/${total}] Uploaded: ${store.store_name} (ID: ${result.id})`);
    return { success: true, store, result };
    
  } catch (error) {
    console.error(`❌ [${index + 1}/${total}] Failed: ${store.store_name} - ${error.message}`);
    return { success: false, store, error: error.message };
  }
}

async function uploadStoresFromFile(filename) {
  console.log(`\n📤 Starting bulk upload from ${filename}...\n`);
  
  // Read the JSON file
  const filePath = join(__dirname, filename);
  
  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    console.log('\nAvailable files:');
    const files = readdirSync(__dirname).filter(f => f.endsWith('.json'));
    files.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  }
  
  const fileContent = readFileSync(filePath, 'utf8');
  const stores = JSON.parse(fileContent);
  
  console.log(`📊 Found ${stores.length} stores to upload\n`);
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  // Upload stores with progress tracking
  for (let i = 0; i < stores.length; i++) {
    const result = await uploadStore(stores[i], i, stores.length);
    
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({
        store: stores[i].store_name,
        error: result.error
      });
    }
    
    // Small delay to avoid overwhelming the server (100ms = 10 stores/second)
    await delay(100);
    
    // Progress update every 50 stores
    if ((i + 1) % 50 === 0) {
      console.log(`\n📊 Progress: ${i + 1}/${stores.length} (${Math.round((i + 1) / stores.length * 100)}%)\n`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully uploaded: ${results.success} stores`);
  console.log(`❌ Failed: ${results.failed} stores`);
  console.log(`📈 Success rate: ${Math.round(results.success / stores.length * 100)}%`);
  console.log('='.repeat(60) + '\n');
  
  if (results.errors.length > 0 && results.errors.length <= 10) {
    console.log('❌ Errors:');
    results.errors.forEach(err => {
      console.log(`  - ${err.store}: ${err.error}`);
    });
  }
  
  return results;
}

async function uploadAllStores() {
  console.log('\n🚀 BULK STORE UPLOADER\n');
  
  // Find all JSON files in the directory
  const storeFiles = readdirSync(__dirname).filter(f => 
    f.endsWith('.json') && !f.includes('package')
  );
  
  if (storeFiles.length === 0) {
    console.log('❌ No store JSON files found!');
    console.log('\nMake sure you have run the scrapers first:');
    console.log('  node scrape-walmart-stores.js');
    console.log('  node scrape-ralphs-stores.js');
    return;
  }
  
  console.log('📁 Found store data files:');
  storeFiles.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  console.log('');
  
  const allResults = {
    totalStores: 0,
    totalSuccess: 0,
    totalFailed: 0
  };
  
  // Upload each file
  for (const file of storeFiles) {
    const results = await uploadStoresFromFile(file);
    allResults.totalStores += results.success + results.failed;
    allResults.totalSuccess += results.success;
    allResults.totalFailed += results.failed;
    
    console.log(`\n✅ Completed uploading ${file}\n`);
    
    // Short delay between files
    await delay(1000);
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 ALL UPLOADS COMPLETE!');
  console.log('='.repeat(60));
  console.log(`📊 Total stores processed: ${allResults.totalStores}`);
  console.log(`✅ Successfully uploaded: ${allResults.totalSuccess}`);
  console.log(`❌ Failed: ${allResults.totalFailed}`);
  console.log(`📈 Overall success rate: ${Math.round(allResults.totalSuccess / allResults.totalStores * 100)}%`);
  console.log('='.repeat(60) + '\n');
  
  console.log('🎯 Next steps:');
  console.log('  1. Test your API: GET /stores?zip=90210&radius=10');
  console.log('  2. Check your frontend');
  console.log(`  3. You now have ${allResults.totalSuccess} stores in your database! 🎉\n`);
}

// Run if executed directly
const args = process.argv.slice(2);

if (args.length > 0) {
  // Upload specific file
  uploadStoresFromFile(args[0])
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} else {
  // Upload all files
  uploadAllStores()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { uploadStoresFromFile, uploadStore };