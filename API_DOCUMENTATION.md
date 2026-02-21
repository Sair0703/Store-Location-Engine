# API Documentation

Complete reference for the Store Location Engine API.

---

## Getting Started

The API is pretty straightforward - you search for stores near a ZIP code and get back a sorted list with distances. All responses are JSON, and you need an auth token for every request.

---

## Base URL

```
https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2
```

This is the live, deployed API endpoint. All examples in this documentation use this actual URL.

---

## Authentication

Every request needs the Supabase anonymous key in the Authorization header:

```http
Authorization: Bearer YOUR_ANON_KEY
```

You can find this in your Supabase project settings under "API" → "Project API keys" → "anon public".

---

## Main Endpoints

### 1. Search for Stores

**Endpoint:** `GET /stores`

This is the main endpoint - search for stores near a ZIP code.

**Query Parameters:**

| Parameter | Type | Required? | Default | Valid Range | Description |
|-----------|------|-----------|---------|-------------|-------------|
| `zip` | string | Yes | - | 5 digits | US ZIP code |
| `radius` | number | No | 50 | 1-100 | Search radius in miles |
| `retailer` | string | No | all | - | Filter by retailer name |

**Example Request:**

```bash
curl "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores?zip=90210&radius=10" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Example Response (200 OK):**

```json
{
  "zip_code": "90210",
  "center_location": {
    "lat": 34.0901,
    "lon": -118.4065,
    "city": "Beverly Hills",
    "state": "CA"
  },
  "radius_miles": 10,
  "total_results": 4,
  "stores": [
    {
      "store_name": "Ralphs",
      "address": "9610 Santa Monica Blvd, Beverly Hills, CA 90210",
      "lat": 34.0695,
      "lon": -118.4019,
      "retailer": "Ralphs",
      "distance_miles": 1.2
    },
    {
      "store_name": "Ralphs",
      "address": "10861 Weyburn Ave, Los Angeles, CA 90024",
      "lat": 34.0611,
      "lon": -118.4456,
      "retailer": "Ralphs",
      "distance_miles": 2.5
    }
  ]
}
```

The results are always sorted by distance (nearest first).

**Common Errors:**

**Missing ZIP code:**
```json
{
  "error": "ZIP code is required"
}
```

**Invalid ZIP code:**
```json
{
  "error": "ZIP code 99999 not found. Please enter a valid US ZIP code."
}
```

**Database not initialized:**
```json
{
  "error": "Store database not initialized. Call POST /init-stores first."
}
```

**More Examples:**

```bash
# Only Ralphs stores
curl "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores?zip=90210&radius=10&retailer=Ralphs" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# New York City
curl "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores?zip=10001&radius=15" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Large radius (50 miles)
curl "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores?zip=90210&radius=50" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

### 2. Initialize Store Database

**Endpoint:** `POST /init-stores`

Loads the database with verified real store data (129 stores). You only need to call this once when first setting up the system.

**Example Request:**

```bash
curl -X POST "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/init-stores" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Initialized 129 stores",
  "count": 129
}
```

---

### 3. Add a New Store

**Endpoint:** `POST /stores`

Add a single store to the database. Useful for testing or manually adding stores.

**Request Body:**

```json
{
  "store_name": "Walmart Supercenter",
  "address": "123 Main St, Los Angeles, CA 90001",
  "lat": 34.0522,
  "lon": -118.2437,
  "retailer": "Walmart"
}
```

All fields are required.

**Example Request:**

```bash
curl -X POST "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "Walmart Supercenter",
    "address": "123 Main St, Los Angeles, CA 90001",
    "lat": 34.0522,
    "lon": -118.2437,
    "retailer": "Walmart"
  }'
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Store added successfully",
  "store_id": 133
}
```

**Error Response (400):**

```json
{
  "error": "Missing required fields: store_name, address, lat, lon, retailer"
}
```

---

### 4. Get Available Retailers

**Endpoint:** `GET /retailers`

Returns a list of all retailers currently in the database.

**Example Request:**

```bash
curl "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/retailers" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Response (200 OK):**

```json
{
  "retailers": ["Walmart", "Ralphs"]
}
```

---

### 5. Health Check

**Endpoint:** `GET /health`

Simple health check to verify the API is running.

**Example Request:**

```bash
curl "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/health" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Response (200 OK):**

```json
{
  "status": "ok"
}
```

---

## How Distance Calculation Works

I use the Haversine formula to calculate distances. This accounts for Earth's curvature and gives you accurate "as the crow flies" distances.

**The Formula:**

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1-a))
distance = R × c
```

Where:
- `R` = Earth's radius (3,959 miles)
- `Δlat` = lat2 - lat1 (in radians)
- `Δlon` = lon2 - lon1 (in radians)

**Accuracy:**

- ±0.5% for distances under 100 miles
- ±2% for distances under 1,000 miles

For a store locator, this is more than accurate enough. The distance isn't driving directions - it's straight-line distance, which is what you want for "how far is this store?"

---

## Performance Characteristics

I optimized the API to be fast even on the free tier:

**Typical Response Times:**

| Scenario | Time | Notes |
|----------|------|-------|
| ZIP in database cache | 50-100ms | Most common case |
| ZIP not cached (first search) | 200-500ms | Needs external geocoding API call |
| Search with 132 stores | <500ms | After batch read optimization |
| Search with filters | <100ms | Fewer stores to check |

**Optimizations Applied:**

1. **Bounding box pre-filtering:** Eliminates ~90% of stores before distance calculation
2. **Batch database reads:** 180x improvement (90+ seconds → <500ms)
3. **ZIP coordinate caching:** Avoids repeated geocoding API calls
4. **In-memory result caching:** Sub-10ms for repeated searches

---

## Data Sources

### ZIP Code Geocoding

**Provider:** Zippopotam.us  
**API:** `https://api.zippopotam.us/us/{zipcode}`  
**Coverage:** All 42,000+ US ZIP codes  
**Cost:** Free, unlimited  
**Reliability:** Very good (99%+ uptime in my testing)

When you search for a ZIP code, I first check my cache. If it's not there, I fetch it from Zippopotam and cache it for 24 hours.

### Store Data

Currently, the database has **129 verified real stores**:
- **90 Walmart stores** (across 22 states)
- **39 Ralphs stores** (Southern California)

The data comes from official public sources:
- Walmart Store Finder API
- Ralphs/Kroger store locator

All stores verified as real locations using the scripts in `/scripts/` directory.

---

## Rate Limiting

**Current Implementation:** None (it's a proof-of-concept)

**Recommended for Production:**

- **100 requests per hour** per IP address
- **Burst limit:** 10 requests per minute
- **Headers to include:**
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 87
  X-RateLimit-Reset: 1640995200
  ```

This would prevent abuse while allowing legitimate use.

---

## CORS Support

The API supports cross-origin requests from any domain:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

This lets you call the API from web apps, mobile apps, or anywhere else.

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"  // Optional
}
```

**Common Error Codes:**

| Status | Error | Reason |
|--------|-------|--------|
| 400 | Missing ZIP | The `zip` parameter wasn't provided |
| 400 | Invalid ZIP | ZIP code doesn't exist in the US |
| 400 | Not Initialized | Database is empty, needs initialization |
| 401 | Unauthorized | Missing or invalid auth token |
| 500 | Server Error | Something went wrong on our end |

---

## Code Examples

### JavaScript/TypeScript

```typescript
const API_BASE = 'https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2';
const AUTH_KEY = 'YOUR_ANON_KEY';

async function searchStores(zip: string, radius: number = 10, retailer?: string) {
  const params = new URLSearchParams({
    zip,
    radius: radius.toString()
  });
  
  if (retailer) {
    params.append('retailer', retailer);
  }

  const response = await fetch(`${API_BASE}/stores?${params}`, {
    headers: {
      'Authorization': `Bearer ${AUTH_KEY}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
try {
  const results = await searchStores('90210', 10, 'Ralphs');
  console.log(`Found ${results.total_results} stores`);
  
  results.stores.forEach(store => {
    console.log(`${store.store_name} - ${store.distance_miles} miles`);
  });
} catch (error) {
  console.error('Search failed:', error.message);
}
```

### Python

```python
import requests

API_BASE = 'https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2'
AUTH_KEY = 'YOUR_ANON_KEY'

def search_stores(zip_code, radius=10, retailer=None):
    params = {
        'zip': zip_code,
        'radius': radius
    }
    
    if retailer:
        params['retailer'] = retailer
    
    response = requests.get(
        f'{API_BASE}/stores',
        params=params,
        headers={'Authorization': f'Bearer {AUTH_KEY}'}
    )
    
    response.raise_for_status()
    return response.json()

# Usage
try:
    results = search_stores('90210', radius=10, retailer='Ralphs')
    print(f"Found {results['total_results']} stores")
    
    for store in results['stores']:
        print(f"{store['store_name']} - {store['distance_miles']} miles")
        
except requests.exceptions.RequestException as e:
    print(f"Search failed: {e}")
```

### cURL Test Script

```bash
#!/bin/bash

BASE_URL="https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2"
AUTH="Authorization: Bearer YOUR_ANON_KEY"

echo "=== API Test Suite ==="

echo -e "\n1. Health Check"
curl -s "$BASE_URL/health" -H "$AUTH" | jq

echo -e "\n2. Get Available Retailers"
curl -s "$BASE_URL/retailers" -H "$AUTH" | jq

echo -e "\n3. Search Beverly Hills (All Stores)"
curl -s "$BASE_URL/stores?zip=90210&radius=10" -H "$AUTH" | jq

echo -e "\n4. Search Beverly Hills (Ralphs Only)"
curl -s "$BASE_URL/stores?zip=90210&radius=10&retailer=Ralphs" -H "$AUTH" | jq

echo -e "\n5. Search New York City"
curl -s "$BASE_URL/stores?zip=10001&radius=15" -H "$AUTH" | jq

echo -e "\n6. Invalid ZIP Code (should error)"
curl -s "$BASE_URL/stores?zip=99999&radius=10" -H "$AUTH" | jq

echo -e "\n=== Tests Complete ==="
```

---

## Sample Data Overview

The database includes stores from these major cities:

| City | ZIP Code | Walmart | Ralphs | Total |
|------|----------|---------|--------|-------|
| Los Angeles, CA | 90001 | 44 | 39 | 83 |
| New York, NY | 10001 | 20 | 0 | 20 |
| Chicago, IL | 60601 | 12 | 0 | 12 |
| Other locations | Various | 14 | 0 | 14 |
| **Total** | - | **90** | **39** | **129** |

**Note:** Ralphs is a Southern California grocery chain owned by Kroger, so it only appears in California locations.

---

## Versioning

**Current version:** v1

The API paths don't currently include a version number, but they're designed to be versioned in the future:

```
/v1/stores
/v1/retailers
```

If I need to make breaking changes, I'd deploy a new version at `/v2/` while keeping `/v1/` running for backward compatibility.

---

## Common Use Cases

### Use Case 1: Store Locator Widget

Build a "Find Stores Near You" widget for a website:

```typescript
async function findNearestStores(zipCode: string) {
  const results = await searchStores(zipCode, 25); // 25 mile radius
  
  return results.stores.slice(0, 5); // Show top 5 nearest
}
```

### Use Case 2: Retailer-Specific Search

Find only Walmart stores:

```typescript
const walmartStores = await searchStores('90210', 50, 'Walmart');
```

### Use Case 3: Coverage Analysis

Check if there are any stores in a region:

```typescript
async function hasStoresInArea(zipCode: string, radius: number = 10) {
  const results = await searchStores(zipCode, radius);
  return results.total_results > 0;
}
```

### Use Case 4: Multi-Retailer Comparison

Compare coverage of different retailers:

```typescript
async function compareRetailerCoverage(zipCode: string, radius: number) {
  const walmart = await searchStores(zipCode, radius, 'Walmart');
  const ralphs = await searchStores(zipCode, radius, 'Ralphs');
  
  return {
    walmart: walmart.total_results,
    ralphs: ralphs.total_results
  };
}
```

---

## Performance Tips

**Tip 1: Cache ZIP Coordinates Client-Side**

If you're doing multiple searches for the same ZIP, cache the coordinates locally:

```typescript
const zipCache = new Map();

function getCachedZipCoords(zip: string) {
  if (zipCache.has(zip)) {
    return zipCache.get(zip);
  }
  
  // Make API call, then cache result
  const results = await searchStores(zip, 10);
  zipCache.set(zip, results.center_location);
  return results.center_location;
}
```

**Tip 2: Use Appropriate Radius**

Smaller radius = faster queries:
- 10 miles: Very fast (<100ms)
- 25 miles: Fast (<200ms)
- 50 miles: Moderate (~500ms)
- 100 miles: Slower (~1000ms)

Use the smallest radius that makes sense for your use case.

**Tip 3: Filter by Retailer When Possible**

Filtering by retailer reduces the number of stores to check:

```typescript
// Faster (only checks Walmart stores)
await searchStores('90210', 25, 'Walmart');

// Slower (checks all stores)
await searchStores('90210', 25);
```

---

## Troubleshooting

**Problem: "ZIP code not found" error**

**Solution:** The ZIP code might be invalid or not in the US. Check:
- Is it exactly 5 digits?
- Is it a valid US ZIP code?
- Try a known-good ZIP like 90210 or 10001

**Problem: Slow responses (>2 seconds)**

**Possible causes:**
- First search for a ZIP (geocoding API call takes ~200ms)
- Large radius (100 miles checks more stores)
- Database not initialized

**Solutions:**
- Reduce radius to 25 miles or less
- Use ZIP codes that are already cached
- Initialize the database with `POST /init-stores`

**Problem: "Unauthorized" error**

**Solution:** Check your Authorization header:
- Make sure you're using the anon key, not the service role key
- Header format: `Authorization: Bearer YOUR_ANON_KEY`
- No quotes around the key

---

## What's Next?

I'm planning several improvements for future versions:

**Short Term:**
- Pagination for large result sets
- Sort options (distance, name, retailer)
- Bulk store upload endpoint

**Medium Term:**
- Store hours and contact information
- Filtering by store features (pharmacy, gas station, etc.)
- Batch geocoding for multiple ZIP codes

**Long Term:**
- GraphQL API option
- WebSocket support for real-time updates
- Mobile SDK (React Native)

---

## Questions?

If something's not clear or you run into issues, check:

- **README.md** - General overview and setup instructions
- **ARCHITECTURE.md** - Technical implementation details
- **SCALE_AND_COST_STRATEGY.md** - Scaling and cost analysis

Or feel free to reach out: **sa0316151@gmail.com**

---

**API Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Production-ready for proof-of-concept scale