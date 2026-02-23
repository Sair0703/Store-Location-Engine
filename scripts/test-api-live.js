#!/usr/bin/env node

/**
 * Test API - Live Backend Test Script
 * 
 * Tests the deployed Supabase Edge Function API with real store data.
 * 
 * Usage:
 *   node scripts/test-api-live.js
 *   node scripts/test-api-live.js 90210 10
 *   node scripts/test-api-live.js 90210 10 Ralphs
 */

const API_URL = 'https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNteWN4cXFmdnptcHZkdHZiYWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0Mzk5NTEsImV4cCI6MjA4NzAxNTk1MX0.zV4smA2wqcVHZYZsD1FNmzKLIbyGFuq1X4zN97PI7lE';

// Get command line arguments
const [zip = '90210', radius = '10', retailer = null] = process.argv.slice(2);

async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint...');
  console.log('━'.repeat(60));
  
  try {
    const response = await fetch(`${API_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('📊 Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testRetailersEndpoint() {
  console.log('\n🏪 Testing Retailers Endpoint...');
  console.log('━'.repeat(60));
  
  try {
    const response = await fetch(`${API_URL}/retailers`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('📊 Available Retailers:', data.retailers);
    console.log('📈 Total Count:', data.count);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testStoresEndpoint() {
  console.log('\n📍 Testing Stores Search Endpoint...');
  console.log('━'.repeat(60));
  console.log(`📮 ZIP Code: ${zip}`);
  console.log(`📏 Radius: ${radius} miles`);
  if (retailer) console.log(`🏪 Retailer: ${retailer}`);
  console.log('');
  
  try {
    const params = new URLSearchParams({
      zip: zip,
      radius: radius,
    });
    
    if (retailer) {
      params.append('retailer', retailer);
    }
    
    const startTime = Date.now();
    const response = await fetch(`${API_URL}/stores?${params}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });
    const endTime = Date.now();
    
    const data = await response.json();
    
    console.log('✅ Status:', response.status);
    console.log('⏱️  Response Time:', `${endTime - startTime}ms`);
    console.log('');
    
    if (response.ok) {
      console.log('📊 Search Results:');
      console.log('  • ZIP Code:', data.zip_code);
      console.log('  • Center:', `${data.center_location.city}, ${data.center_location.state}`);
      console.log('  • Coordinates:', `${data.center_location.lat}, ${data.center_location.lon}`);
      console.log('  • Radius:', `${data.radius_miles} miles`);
      console.log('  • Total Results:', data.total_results);
      console.log('');
      
      if (data.stores.length > 0) {
        console.log('🏪 Stores Found (top 10):');
        console.log('━'.repeat(60));
        data.stores.slice(0, 10).forEach((store, index) => {
          console.log(`\n${index + 1}. ${store.store_name} (${store.retailer})`);
          console.log(`   📍 ${store.address}`);
          console.log(`   📏 ${store.distance_miles} miles away`);
        });
        
        if (data.stores.length > 10) {
          console.log(`\n... and ${data.stores.length - 10} more stores`);
        }
      } else {
        console.log('❌ No stores found in this area. Try increasing the radius.');
      }
    } else {
      console.error('❌ API Error:', data);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

async function runAllTests() {
  console.log('');
  console.log('═'.repeat(60));
  console.log('  🧪 STORE LOCATION API - LIVE TEST SUITE');
  console.log('═'.repeat(60));
  
  await testHealthEndpoint();
  await testRetailersEndpoint();
  await testStoresEndpoint();
  
  console.log('\n' + '═'.repeat(60));
  console.log('  ✅ ALL TESTS COMPLETE!');
  console.log('═'.repeat(60));
  console.log('');
  console.log('💡 TIP: Run with custom parameters:');
  console.log('   node scripts/test-api-live.js <zip> <radius> [retailer]');
  console.log('');
  console.log('   Examples:');
  console.log('   • node scripts/test-api-live.js 90210 10');
  console.log('   • node scripts/test-api-live.js 10001 25 Walmart');
  console.log('   • node scripts/test-api-live.js 94102 15 Ralphs');
  console.log('');
}

// Run all tests
runAllTests().catch(console.error);
