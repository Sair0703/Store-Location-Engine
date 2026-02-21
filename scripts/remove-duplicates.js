const SUPABASE_URL = 'https://cmycxqqfvzmpvdtvbakl.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNteWN4cXFmdnptcHZkdHZiYWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0Mzk5NTEsImV4cCI6MjA4NzAxNTk1MX0.zV4smA2wqcVHZYZsD1FNmzKLIbyGFuq1X4zN97PI7lE';

async function removeDuplicates() {
  console.log('🔍 Finding and removing duplicate stores...\n');

  try {
    // Get all stores
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/make-server-26050ec2/stores/all`,
      {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch stores: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 Total stores in database: ${data.stores.length}\n`);

    // Group stores by address to find duplicates
    const storesByAddress = new Map();
    
    for (const store of data.stores) {
      const key = store.address.trim().toLowerCase();
      if (!storesByAddress.has(key)) {
        storesByAddress.set(key, []);
      }
      storesByAddress.get(key).push(store);
    }

    // Find duplicates
    const duplicates = [];
    for (const [address, stores] of storesByAddress.entries()) {
      if (stores.length > 1) {
        duplicates.push({ address, stores });
      }
    }

    console.log(`🔴 Found ${duplicates.length} addresses with duplicates:\n`);
    
    let totalDuplicates = 0;
    const storeIdsToDelete = [];

    for (const { address, stores } of duplicates) {
      console.log(`   📍 ${stores[0].address}`);
      console.log(`      Duplicates: ${stores.length} copies`);
      console.log(`      Retailer: ${stores[0].retailer}`);
      
      // Keep the first one, delete the rest
      for (let i = 1; i < stores.length; i++) {
        storeIdsToDelete.push(stores[i].id);
        totalDuplicates++;
      }
      console.log('');
    }

    if (storeIdsToDelete.length === 0) {
      console.log('✅ No duplicates found! Database is clean.\n');
      return;
    }

    console.log(`🗑️  Deleting ${totalDuplicates} duplicate stores...\n`);

    // Delete duplicates one by one
    let deleted = 0;
    for (const storeId of storeIdsToDelete) {
      const deleteResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/make-server-26050ec2/stores/${storeId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${ANON_KEY}`,
          },
        }
      );

      if (deleteResponse.ok) {
        deleted++;
        process.stdout.write(`\r   Deleted: ${deleted}/${totalDuplicates}`);
      } else {
        console.error(`\n❌ Failed to delete store ${storeId}`);
      }
    }

    console.log('\n\n✅ Cleanup complete!');
    console.log(`   Removed: ${deleted} duplicate stores`);
    console.log(`   Remaining: ${data.stores.length - deleted} unique stores\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

removeDuplicates();
