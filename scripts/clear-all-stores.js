/**
 * Clear All Stores Script
 * 
 * Deletes all stores from the database
 * Use this to start fresh before re-uploading
 */

// Your API configuration
const API_BASE_URL = `https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1`;
const API_ENDPOINT = '/make-server-26050ec2/stores';

// Read from environment or use the actual key
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNteWN4cXFmdnptcHZkdHZiYWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0Mzk5NTEsImV4cCI6MjA4NzAxNTk1MX0.zV4smA2wqcVHZYZsD1FNmzKLIbyGFuq1X4zN97PI7lE';

async function clearAllStores() {
  console.log('\n🗑️  CLEARING ALL STORES FROM DATABASE\n');
  console.log('⚠️  This will delete ALL stores from your database!\n');
  
  try {
    // Use the DELETE /stores endpoint to clear everything in ONE request
    console.log('⏳ Sending DELETE request...');
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to clear stores: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('='.repeat(60));
    console.log('✅ DATABASE CLEARED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`🗑️  Deleted: ${result.deleted} stores`);
    console.log('='.repeat(60) + '\n');
    
    console.log('🎯 Next step: Upload your stores');
    console.log('   node scripts/bulk-upload-stores.js\n');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run
clearAllStores()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });

export { clearAllStores };