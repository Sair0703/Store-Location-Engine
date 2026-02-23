#!/usr/bin/env node

/**
 * Quick API Test - Shows what's really in the database
 */

const API_BASE = 'https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNteWN4cXFmdnptcHZkdHZiYWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0Mzk5NTEsImV4cCI6MjA4NzAxNTk1MX0.zV4smA2wqcVHZYZsD1FNmzKLIbyGFuq1X4zN97PI7lE';

async function test() {
  console.log('\n🔍 TESTING API...\n');
  
  try {
    // Test 1: Get all stores
    console.log('📊 Getting all stores from database...');
    const res = await fetch(`${API_BASE}/stores/all`, {
      headers: { 'Authorization': `Bearer ${ANON_KEY}` }
    });
    
    if (!res.ok) {
      console.error(`❌ API returned ${res.status}`);
      const text = await res.text();
      console.error('Response:', text);
      process.exit(1);
    }
    
    const data = await res.json();
    console.log(`✅ Total stores in database: ${data.total}\n`);
    
    if (data.total === 0) {
      console.log('❌ DATABASE IS EMPTY!\n');
      console.log('Run this to upload stores:');
      console.log('   node scripts/bulk-upload-stores.js\n');
      process.exit(0);
    }
    
    // Count retailers
    const counts = {};
    data.stores.forEach(s => {
      counts[s.retailer] = (counts[s.retailer] || 0) + 1;
    });
    
    console.log('📦 Stores by retailer:');
    Object.entries(counts).forEach(([retailer, count]) => {
      console.log(`   ${retailer}: ${count}`);
    });
    
    // Check Portland
    const portland = data.stores.filter(s => 
      s.address.toLowerCase().includes('portland')
    );
    
    console.log(`\n🏙️  Portland stores: ${portland.length}`);
    if (portland.length > 0) {
      portland.forEach(s => {
        console.log(`   - ${s.store_name} at ${s.address}`);
      });
    }
    
    // Test 2: Search Portland ZIP
    console.log('\n\n🔍 Testing Portland ZIP 97229...');
    const searchRes = await fetch(`${API_BASE}/stores?zip=97229&radius=50`, {
      headers: { 'Authorization': `Bearer ${ANON_KEY}` }
    });
    
    if (!searchRes.ok) {
      console.error(`❌ Search failed: ${searchRes.status}`);
      const text = await searchRes.text();
      console.error('Response:', text);
    } else {
      const searchData = await searchRes.json();
      console.log(`✅ Found ${searchData.total_results} stores near Portland\n`);
      
      if (searchData.stores && searchData.stores.length > 0) {
        searchData.stores.forEach(s => {
          console.log(`   📍 ${s.store_name}`);
          console.log(`      ${s.address}`);
          console.log(`      ${s.distance_miles} miles away\n`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
