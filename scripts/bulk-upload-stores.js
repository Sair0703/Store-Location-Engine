/**
 * FAST Bulk Upload Script
 *
 * Uploads ALL stores in ONE request (100x faster!)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API configuration
const API_BASE_URL = `https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1`;
const API_ENDPOINT = '/make-server-26050ec2/stores/bulk';

// Read from environment or use the actual key
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNteWN4cXFmdnptcHZkdHZiYWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0Mzk5NTEsImV4cCI6MjA4NzAxNTk1MX0.zV4smA2wqcVHZYZsD1FNmzKLIbyGFuq1X4zN97PI7lE';

// Files to upload (NO BACKUP FILE!)
const STORE_FILES = [
  'ralphs-stores.json',
  'walmart-stores.json'
];

async function bulkUpload() {
  console.log('\n🚀 FAST BULK UPLOAD STARTING...\n');
  
  const allStores = [];
  
  // Load all stores from files
  for (const filename of STORE_FILES) {
    // Try multiple paths: current dir, parent dir, and absolute root
    const possiblePaths = [
      path.join(process.cwd(), filename),  // From where script is run
      path.join(__dirname, '..', filename),  // Parent of scripts/
      path.join(__dirname, filename),  // scripts/ directory itself
    ];
    
    let filePath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }
    
    if (!filePath) {
      console.log(`⚠️  Skipping ${filename} - file not found`);
      console.log(`   Searched in:`, possiblePaths);
      continue;
    }
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const stores = JSON.parse(fileContent);
      
      console.log(`✅ Loaded ${stores.length} stores from ${filePath}`);
      allStores.push(...stores);
    } catch (error) {
      console.error(`❌ Error reading ${filename}:`, error.message);
    }
  }
  
  if (allStores.length === 0) {
    console.log('❌ No stores to upload!');
    return;
  }
  
  console.log(`\n📦 Total stores to upload: ${allStores.length}`);
  console.log('⏳ Uploading in ONE request...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ stores: allStores })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('='.repeat(60));
    console.log('✅ BULK UPLOAD COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Total stores uploaded: ${result.count}`);
    console.log(`⚡ Speed: ALL stores in ONE request!`);
    console.log('='.repeat(60) + '\n');
    
    console.log('🎯 Next steps:');
    console.log('   1. Test your API: GET /stores?zip=90210&radius=10');
    console.log('   2. Check your frontend');
    console.log(`   3. You now have ${result.count} stores! 🎉\n`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run
bulkUpload()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });