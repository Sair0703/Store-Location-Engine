/**
 * Walmart Store Scraper
 * 
 * Scrapes Walmart store locations from their public store finder API
 * Runtime: ~30 seconds for 400+ stores
 */

import { writeFileSync } from 'fs';

const majorCities = [
  { zip: '90210', name: 'Los Angeles, CA' },
  { zip: '10001', name: 'New York, NY' },
  { zip: '60601', name: 'Chicago, IL' },
  { zip: '77001', name: 'Houston, TX' },
  { zip: '85001', name: 'Phoenix, AZ' },
  { zip: '19101', name: 'Philadelphia, PA' },
  { zip: '78701', name: 'Austin, TX' },
  { zip: '98101', name: 'Seattle, WA' },
  { zip: '80201', name: 'Denver, CO' },
  { zip: '02101', name: 'Boston, MA' },
  { zip: '30301', name: 'Atlanta, GA' },
  { zip: '33101', name: 'Miami, FL' },
  { zip: '20001', name: 'Washington, DC' },
  { zip: '97201', name: 'Portland, OR' },
  { zip: '55401', name: 'Minneapolis, MN' },
  { zip: '48201', name: 'Detroit, MI' },
  { zip: '37201', name: 'Nashville, TN' },
  { zip: '63101', name: 'St. Louis, MO' },
  { zip: '28201', name: 'Charlotte, NC' },
  { zip: '92101', name: 'San Diego, CA' }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWalmartStoresNearZip(zip, radiusMiles = 50) {
  try {
    // Walmart's public store finder API
    const url = `https://www.walmart.com/store/finder/electrode/api/stores?zip=${zip}&distance=${radiusMiles}`;
    
    console.log(`Fetching Walmart stores near ZIP ${zip}...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch stores for ZIP ${zip}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    // Parse Walmart's response format
    const stores = (data.stores || []).map(store => ({
      store_name: `Walmart ${store.displayName || store.name || 'Store'}`,
      address: `${store.address?.address}, ${store.address?.city}, ${store.address?.state} ${store.address?.postalCode || zip}`,
      lat: parseFloat(store.geoPoint?.latitude || store.latitude),
      lon: parseFloat(store.geoPoint?.longitude || store.longitude),
      retailer: 'Walmart'
    }));
    
    console.log(`✅ Found ${stores.length} Walmart stores near ${zip}`);
    return stores;
    
  } catch (error) {
    console.error(`Error fetching stores for ZIP ${zip}:`, error.message);
    return [];
  }
}

async function scrapeAllWalmartStores() {
  console.log('🏪 Starting Walmart Store Scraper...\n');
  console.log(`Searching ${majorCities.length} major cities\n`);
  
  const allStores = [];
  const seenStoreIds = new Set();
  
  for (let i = 0; i < majorCities.length; i++) {
    const city = majorCities[i];
    console.log(`[${i + 1}/${majorCities.length}] Searching ${city.name}...`);
    
    const stores = await getWalmartStoresNearZip(city.zip);
    
    // Remove duplicates (stores might appear in multiple city searches)
    const uniqueStores = stores.filter(store => {
      const storeId = `${store.lat},${store.lon}`;
      if (seenStoreIds.has(storeId)) {
        return false;
      }
      seenStoreIds.add(storeId);
      return true;
    });
    
    allStores.push(...uniqueStores);
    
    console.log(`  Added ${uniqueStores.length} unique stores (${stores.length - uniqueStores.length} duplicates removed)`);
    console.log(`  Running total: ${allStores.length} stores\n`);
    
    // Respectful rate limiting (1 second between requests)
    if (i < majorCities.length - 1) {
      await delay(1000);
    }
  }
  
  console.log('\n✅ Scraping complete!\n');
  console.log(`📊 Total unique Walmart stores found: ${allStores.length}`);
  
  return allStores;
}

// Run if executed directly
scrapeAllWalmartStores()
  .then(stores => {
    // Save to file
    writeFileSync('walmart-stores.json', JSON.stringify(stores, null, 2));
    console.log('\n💾 Saved to walmart-stores.json');
    console.log('\nNext step: Run scrape-ralphs-stores.js to collect Ralphs stores!');
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });

export { scrapeAllWalmartStores, getWalmartStoresNearZip };
