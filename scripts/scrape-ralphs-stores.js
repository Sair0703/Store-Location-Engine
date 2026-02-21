/**
 * Ralphs Store Scraper
 * 
 * Scrapes Ralphs (Kroger) store locations from their public store locator API
 * Runtime: ~30 seconds for 200+ stores
 */

import { writeFileSync } from 'fs';

const majorCities = [
  { zip: '90210', lat: 34.0901, lon: -118.4065, name: 'Los Angeles, CA' },
  { zip: '90001', lat: 33.9731, lon: -118.2479, name: 'South LA, CA' },
  { zip: '92101', lat: 32.7157, lon: -117.1611, name: 'San Diego, CA' },
  { zip: '92802', lat: 33.7455, lon: -117.8677, name: 'Anaheim, CA' },
  { zip: '92503', lat: 33.9806, lon: -117.3755, name: 'Riverside, CA' },
  { zip: '91501', lat: 34.1808, lon: -118.3090, name: 'Burbank, CA' },
  { zip: '90803', lat: 33.7701, lon: -118.1148, name: 'Long Beach, CA' },
  { zip: '91101', lat: 34.1478, lon: -118.1445, name: 'Pasadena, CA' },
  { zip: '92373', lat: 34.1064, lon: -117.2897, name: 'Redlands, CA' },
  { zip: '92025', lat: 33.2084, lon: -117.3534, name: 'Escondido, CA' },
  { zip: '93101', lat: 34.4208, lon: -119.6982, name: 'Santa Barbara, CA' },
  { zip: '93454', lat: 35.1428, lon: -120.6596, name: 'Santa Maria, CA' },
  { zip: '91910', lat: 32.6401, lon: -117.0842, name: 'Chula Vista, CA' },
  { zip: '92408', lat: 34.1083, lon: -117.2898, name: 'San Bernardino, CA' },
  { zip: '90620', lat: 33.8703, lon: -118.0262, name: 'Buena Park, CA' },
  { zip: '92544', lat: 33.6803, lon: -117.2148, name: 'Hemet, CA' },
  { zip: '92627', lat: 33.6192, lon: -117.7298, name: 'Costa Mesa, CA' },
  { zip: '90401', lat: 34.0195, lon: -118.4912, name: 'Santa Monica, CA' },
  { zip: '91601', lat: 34.1686, lon: -118.3721, name: 'North Hollywood, CA' },
  { zip: '90501', lat: 33.8358, lon: -118.3406, name: 'Torrance, CA' }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getRalphsStoresNearLocation(lat, lon, radiusMiles = 50, cityName = '') {
  try {
    // Ralphs uses Kroger's store locator API
    // This endpoint returns stores in JSON format
    const url = `https://www.ralphs.com/atlas/v1/stores/v1/search?lat=${lat}&lon=${lon}&radius=${radiusMiles}&limit=50`;
    
    console.log(`Fetching Ralphs stores near ${cityName || `${lat}, ${lon}`}...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.ralphs.com'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch Ralphs stores: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    // Parse Ralphs/Kroger response format
    const storeData = data.data?.stores || data.stores || [];
    
    const stores = storeData.map(store => {
      // Get location data
      const location = store.location || store.address || {};
      const coords = location.geolocation || store.geolocation || {};
      
      return {
        store_name: `Ralphs ${store.name || store.storeName || ''}`,
        address: `${location.address1 || location.street || ''}, ${location.city || ''}, ${location.state || ''} ${location.zipCode || location.zip || ''}`,
        lat: parseFloat(coords.latitude || coords.lat || location.lat),
        lon: parseFloat(coords.longitude || coords.lon || location.lon),
        retailer: 'Ralphs'
      };
    });
    
    const validStores = stores.filter(s => s.lat && s.lon); // Only keep stores with valid coordinates
    console.log(`✅ Found ${validStores.length} Ralphs stores`);
    return validStores;
    
  } catch (error) {
    console.error(`Error fetching Ralphs stores:`, error.message);
    return [];
  }
}

async function scrapeAllRalphsStores() {
  console.log('🛒 Starting Ralphs Store Scraper...\n');
  console.log(`Searching ${majorCities.length} Southern California regions\n`);
  console.log('Note: Ralphs is primarily in Southern California\n');
  
  const allStores = [];
  const seenStoreIds = new Set();
  
  for (let i = 0; i < majorCities.length; i++) {
    const city = majorCities[i];
    console.log(`[${i + 1}/${majorCities.length}] Searching ${city.name}...`);
    
    const stores = await getRalphsStoresNearLocation(city.lat, city.lon, 50, city.name);
    
    // Remove duplicates
    const uniqueStores = stores.filter(store => {
      const storeId = `${store.lat.toFixed(4)},${store.lon.toFixed(4)}`;
      if (seenStoreIds.has(storeId)) {
        return false;
      }
      seenStoreIds.add(storeId);
      return true;
    });
    
    allStores.push(...uniqueStores);
    
    console.log(`  Added ${uniqueStores.length} unique stores (${stores.length - uniqueStores.length} duplicates removed)`);
    console.log(`  Running total: ${allStores.length} stores\n`);
    
    // Respectful rate limiting (1.5 seconds between requests)
    if (i < majorCities.length - 1) {
      await delay(1500);
    }
  }
  
  console.log('\n✅ Scraping complete!\n');
  console.log(`📊 Total unique Ralphs stores found: ${allStores.length}`);
  
  return allStores;
}

// Run if executed directly
scrapeAllRalphsStores()
  .then(stores => {
    // Save to file
    writeFileSync('ralphs-stores.json', JSON.stringify(stores, null, 2));
    console.log('\n💾 Saved to ralphs-stores.json');
    console.log('\nNext step: Run upload-stores.js to add both Walmart and Ralphs stores to your database!');
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });

export { scrapeAllRalphsStores, getRalphsStoresNearLocation };
