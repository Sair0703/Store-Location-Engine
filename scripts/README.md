# Store Data Collection Scripts

Automated tools for scraping and uploading store location data from Walmart and Ralphs public APIs.

---

## Overview

These scripts enable bulk collection of real store location data from public retailer APIs. The system can gather approximately 600 stores in under 10 minutes.

**Scripts:**
- `scrape-walmart-stores.js` - Collects ~400 Walmart store locations
- `scrape-ralphs-stores.js` - Collects ~200 Ralphs store locations
- `upload-stores.js` - Bulk uploads stores to database
- `sample-stores-backup.json` - Fallback dataset (40 stores)

---

## Quick Start

```bash
# 1. Scrape Walmart stores (30 seconds)
node scripts/scrape-walmart-stores.js

# 2. Scrape Ralphs stores (40 seconds)
node scripts/scrape-ralphs-stores.js

# 3. Upload all stores to database (5 minutes)
node scripts/upload-stores.js
```

**Result:** ~600 real stores added to database.

---

## Script Details

### scrape-walmart-stores.js

**Purpose:** Query Walmart's public store finder API for locations across major US cities.

**Functionality:**
- Queries 20 major metropolitan areas
- Fetches stores within 50-mile radius of each city center
- Removes duplicate stores (same coordinates)
- Outputs to `walmart-stores.json`

**Coverage:**
- Cities: Los Angeles, New York, Chicago, Houston, Phoenix, Philadelphia, Austin, Seattle, Denver, Boston, Atlanta, Miami, Washington DC, Portland, Minneapolis, Detroit, Nashville, St. Louis, Charlotte, San Diego
- Expected stores: ~400
- Runtime: ~30 seconds

**Usage:**
```bash
node scripts/scrape-walmart-stores.js
```

**Output:**
```json
[
  {
    "store_name": "Walmart Supercenter",
    "address": "2150 Hawthorne Blvd, Redondo Beach, CA 90278",
    "lat": 33.8736,
    "lon": -118.3527,
    "retailer": "Walmart"
  }
]
```

### scrape-ralphs-stores.js

**Purpose:** Query Ralphs/Kroger store locator API for Southern California locations.

**Functionality:**
- Queries 20 Southern California regions
- Fetches stores within 50-mile radius of each location
- Removes duplicate stores
- Outputs to `ralphs-stores.json`

**Coverage:**
- Regions: Los Angeles County, Orange County, San Diego, Riverside, San Bernardino, Ventura, Santa Barbara
- Expected stores: ~200
- Runtime: ~40 seconds

**Usage:**
```bash
node scripts/scrape-ralphs-stores.js
```

### upload-stores.js

**Purpose:** Bulk upload scraped store data to Supabase database.

**Functionality:**
- Reads JSON files from current directory
- Uploads stores via POST /stores endpoint
- Progress tracking every 50 stores
- Comprehensive error reporting

**Configuration:**
```javascript
const API_BASE_URL = 'https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1';
const ENDPOINT = '/make-server-26050ec2/stores';
const API_KEY = 'your-anon-key-here'; // Update if needed
```

**Usage:**
```bash
# Upload all JSON files in current directory
node scripts/upload-stores.js

# Or specify a file
node scripts/upload-stores.js sample-stores-backup.json
```

**Output:**
```
🚀 BULK STORE UPLOADER

📁 Found store data files:
  1. walmart-stores.json
  2. ralphs-stores.json

📤 Starting bulk upload from walmart-stores.json...

📊 Found 412 stores to upload

✅ [1/412] Uploaded: Walmart Supercenter (ID: 19)
✅ [2/412] Uploaded: Walmart Neighborhood Market (ID: 20)
...
📊 Progress: 50/412 (12%)
...

============================================================
📊 UPLOAD SUMMARY
============================================================
✅ Successfully uploaded: 410 stores
❌ Failed: 2 stores
📈 Success rate: 99%
============================================================
```

---

## Data Sources

### Walmart Store Finder API

**Endpoint:** `https://www.walmart.com/store/finder/electrode/api/stores`

**Parameters:**
- `zip` - 5-digit ZIP code
- `distance` - Radius in miles

**Rate Limit:** ~2 requests/second (respectful scraping)

**Data Quality:**
- Official Walmart data
- Includes address and coordinates
- Updated regularly by Walmart

### Ralphs/Kroger Store Locator API

**Endpoint:** `https://www.ralphs.com/atlas/v1/stores/v1/search`

**Parameters:**
- `lat` - Latitude
- `lon` - Longitude  
- `radius` - Radius in miles
- `limit` - Max results (typically 50)

**Rate Limit:** ~1 request/second

**Data Quality:**
- Official Kroger/Ralphs data
- Southern California focus (where Ralphs operates)
- Includes full address and coordinates

---

## Sample Data

### sample-stores-backup.json

Curated dataset of 40 stores (20 Walmart, 20 Ralphs) across Southern California.

**Use Cases:**
- API scrapers not working
- Quick testing
- Demonstration purposes

**Usage:**
```bash
node scripts/upload-stores.js sample-stores-backup.json
```

---

## Technical Implementation

### Major Cities Configuration

```javascript
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
  { zip: '20001', name: 'Washington DC, DC' },
  { zip: '97201', name: 'Portland, OR' },
  { zip: '55401', name: 'Minneapolis, MN' },
  { zip: '48201', name: 'Detroit, MI' },
  { zip: '37201', name: 'Nashville, TN' },
  { zip: '63101', name: 'St. Louis, MO' },
  { zip: '28201', name: 'Charlotte, NC' },
  { zip: '92101', name: 'San Diego, CA' }
];
```

### Duplicate Detection

Stores are deduplicated using coordinate-based hashing:

```javascript
const seenStores = new Set();

stores.filter(store => {
  const storeId = `${store.lat.toFixed(4)},${store.lon.toFixed(4)}`;
  if (seenStores.has(storeId)) {
    return false; // Duplicate
  }
  seenStores.add(storeId);
  return true; // Unique
});
```

### Rate Limiting

Respectful delays between API requests:

```javascript
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Between city queries
for (const city of cities) {
  await fetchStores(city);
  await delay(1500); // 1.5 second delay
}
```

---

## Troubleshooting

### Issue: "fetch is not defined"

**Cause:** Node.js version <18

**Solution:**
```bash
node --version  # Check version

# Upgrade to Node 18+
# Download from: https://nodejs.org
```

### Issue: Scrapers return 0 stores

**Possible Causes:**
- API endpoint changed
- Network issues
- Rate limiting

**Solutions:**
1. Check API endpoints are still valid
2. Verify network connectivity
3. Use backup data:
   ```bash
   node scripts/upload-stores.js sample-stores-backup.json
   ```

### Issue: Upload fails with 401 Unauthorized

**Cause:** Incorrect API key

**Solution:**
Update `API_KEY` in `upload-stores.js`:
```javascript
const API_KEY = 'your-supabase-anon-key';
```

### Issue: Upload fails with 404 Not Found

**Cause:** Server endpoint URL incorrect

**Solution:**
Verify `API_BASE_URL` in `upload-stores.js`:
```javascript
const API_BASE_URL = 'https://your-project.supabase.co/functions/v1';
```

---

## Performance Optimization

### Parallel Uploads

Current implementation uploads sequentially for clarity. For production, consider parallel uploads:

```javascript
// Sequential (current)
for (const store of stores) {
  await uploadStore(store);
}

// Parallel (10 at a time)
const chunks = chunkArray(stores, 10);
for (const chunk of chunks) {
  await Promise.all(chunk.map(uploadStore));
}
```

### Batch API Endpoint

For future optimization, implement bulk endpoint:

```typescript
// POST /stores/bulk
{
  "stores": [
    { "store_name": "...", "address": "...", "lat": ..., "lon": ..., "retailer": "..." },
    // ... up to 1000 stores
  ]
}
```

This would reduce upload time from 5 minutes to ~10 seconds.

---

## Data Validation

All scripts validate data before storage:

**Coordinate Validation:**
```javascript
function isValidCoordinate(lat, lon) {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  );
}
```

**Required Fields:**
- `store_name` (non-empty string)
- `address` (non-empty string)
- `lat` (valid latitude)
- `lon` (valid longitude)
- `retailer` (non-empty string)

---

## Extending to New Retailers

To add a new retailer (e.g., Target):

1. **Create scraper script:**
   ```javascript
   // scripts/scrape-target-stores.js
   const stores = await fetchTargetStores();
   fs.writeFileSync('target-stores.json', JSON.stringify(stores));
   ```

2. **Find data source:**
   - Check retailer's store locator page
   - Look for JSON API endpoints
   - Inspect network requests in browser DevTools

3. **Run scraper:**
   ```bash
   node scripts/scrape-target-stores.js
   ```

4. **Upload data:**
   ```bash
   node scripts/upload-stores.js target-stores.json
   ```

**Scaling to 20+ Retailers:**
- Automate with cron jobs (weekly updates)
- Implement differential updates (only changes)
- Use bulk API endpoint for efficiency
- Monitor for data quality issues

---

## License

These scripts are provided for educational purposes as part of a software engineering internship assessment. Use responsibly and respect retailer API rate limits.

---

## Contact

For questions about these scripts or data collection approach, refer to the main project documentation.