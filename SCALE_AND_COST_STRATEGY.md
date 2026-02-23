# Scale and Cost Strategy

How to go from 321 stores to 20+ retailers without breaking the bank.

---

## Current State

**What we have:**
- 321 stores (40 Ralphs, 281 Walmart)
- Hosted on Supabase + Vercel free tiers
- Monthly cost: **$0**
- Response time: ~1.5 seconds
- Coverage: 15+ states

**Good enough for:** Proof of concept, assessment, initial testing

**Not good enough for:** Production traffic, 20+ retailers, thousands of users

---

## The Challenge

Build a store locator that:
1. Supports 20+ national retailers
2. Handles 50,000+ store locations
3. Serves 5,000+ concurrent users
4. Costs way less than Google Maps API
5. Updates without constant scraping

---

## Scaling to 20+ Retailers

### Data Acquisition Strategy

**Option 1: Public APIs (Free to $50/month)**

Many retailers have public store locator APIs or structured data:

```
✅ Free/Easy:
- Walmart: Store Locator API
- Target: Public JSON endpoints
- CVS: Store finder API
- Walgreens: Location services API
- Kroger family: Single API for Ralphs, Fred Meyer, etc.

⚠️ Moderate effort:
- Costco: Scrape with rate limiting
- Whole Foods: Amazon API (requires approval)
- 7-Eleven: Public locator with CORS

❌ Difficult:
- Small chains without public APIs
- Regional grocers with outdated tech
```

**Implementation plan:**
1. Start with the easy ones (Walmart, Target, CVS, Walgreens)
2. Write respectful scrapers for the rest
3. Run data collection once, cache forever
4. Update quarterly, not daily

**Estimated time:** 2-3 weeks to collect 10,000+ stores from 10 retailers

---

**Option 2: Buy Verified Data ($500-1500/year)**

Companies like SafeGraph and Factual sell POI (Point of Interest) data:

```
SafeGraph:
- 50,000+ retail locations
- Monthly updates included
- Verified addresses + coordinates
- Cost: ~$500-1000/year for retail category

Factual/Foursquare:
- API access to live data
- More expensive but always current
- Cost: ~$1000-2000/year
```

**When this makes sense:** Production deployment where accuracy matters more than cost.

---

**Option 3: Crowdsourced Updates (Hybrid Approach)**

Let users help maintain the database:

```javascript
// Feature: "Report a Problem"
{
  type: "closed_store",
  store_id: 42,
  user_email: "user@example.com",
  date_reported: "2026-02-22"
}

// Review reports monthly
// Verify and update database
// Send thank-you email to reporter
```

**Cost:** Developer time to review reports (~2 hours/month)

**Benefit:** Community helps keep data fresh

---

### Geocoding Strategy

**For 10,000+ new addresses:**

```
OpenCage Geocoding API:
- 2,500 free requests per day
- 10,000 addresses = 4 days
- Cost: $0

Nominatim (Self-hosted):
- Unlimited requests
- Requires server to run OpenStreetMap geocoder
- Cost: ~$20/month for small DigitalOcean droplet

Google Geocoding API:
- $5 per 1,000 requests
- 10,000 addresses = $50
- Use only as fallback for failed addresses
```

**Recommended approach:**
1. Try OpenCage first (free, rate-limited)
2. Fall back to self-hosted Nominatim
3. Use Google only for addresses that fail both

**Total one-time cost:** ~$50-100 for 10,000 new stores

---

## Update Strategy

### Why Stores Don't Change Often

Physical retail locations are sticky:
- **New openings:** 2-3 per month per major retailer
- **Closures:** Announced weeks in advance (press releases)
- **Relocations:** Extremely rare
- **Address changes:** Almost never (remodels don't move buildings)

**Insight:** We can update quarterly and still maintain 95%+ accuracy.

---

### Update Schedule

**Quarterly Full Refresh (Every 3 months):**

```javascript
// Automated script runs:
1. Scrape all retailer store locators
2. Compare with current database
3. Identify new stores, closed stores, changed addresses
4. Update database with diff only
5. Send summary report

Estimated time: 2-3 hours automated
Cost: ~$10 in API calls
```

**Monthly Delta Updates:**

```javascript
// Track changes only:
1. Monitor retailer press release RSS feeds
2. Check for "new store opening" announcements
3. Scrape only new locations
4. Add to database

Estimated time: 30 minutes
Cost: <$5
```

**Real-time Critical Updates:**

```javascript
// User reports + manual verification:
1. User submits "Store Closed" report
2. Admin verifies via retailer website
3. Update database immediately
4. Optional: Email user when fixed

Cost: Free (developer time)
```

**Annual update cost:** ~$80-120 total

---

## Distance Computation at Scale

### Current Approach (321 Stores)

```javascript
// 1. Get all stores from database
const allStores = await kv.getByPrefix('store'); // ~10ms

// 2. Calculate bounding box
const box = calculateBoundingBox(userLat, userLon, radius);

// 3. Filter by bounding box (90% reduction)
const nearbyStores = allStores.filter(store => 
  isInBoundingBox(store, box)
); // ~5ms

// 4. Calculate exact distances
const withDistances = nearbyStores.map(store => ({
  ...store,
  distance_miles: haversine(userLat, userLon, store.lat, store.lon)
})); // ~10ms for 32 stores

// 5. Sort by distance
const sorted = withDistances.sort((a, b) => 
  a.distance_miles - b.distance_miles
); // ~1ms

Total: ~26ms of computation
```

**Works great up to ~5,000 stores.**

---

### Scaling to 50,000 Stores

**Problem:** Fetching and filtering 50,000 stores in memory is slow.

**Solution 1: PostGIS Spatial Queries**

Migrate to PostgreSQL with PostGIS extension:

```sql
-- Create spatial index (one-time setup)
CREATE INDEX idx_stores_location 
ON stores 
USING GIST(ST_MakePoint(lon, lat));

-- Query with spatial filtering
SELECT 
  id,
  store_name,
  address,
  lat,
  lon,
  retailer,
  ST_Distance(
    ST_MakePoint(lon, lat)::geography,
    ST_MakePoint($userLon, $userLat)::geography
  ) / 1609.34 AS distance_miles
FROM stores
WHERE ST_DWithin(
  ST_MakePoint(lon, lat)::geography,
  ST_MakePoint($userLon, $userLat)::geography,
  $radiusInMeters
)
ORDER BY distance_miles
LIMIT 50;
```

**Performance:**
- Current: ~1.5s for 321 stores (mostly ZIP API)
- With PostGIS: ~100-200ms for 50,000 stores
- **10x faster at 155x scale**

**Cost:** Included in Supabase Pro ($25/month)

---

**Solution 2: Geohash Partitioning**

Group stores by geohash to avoid scanning the entire database:

```javascript
// Assign geohash to each store (one-time preprocessing)
store.geohash = geohash.encode(store.lat, store.lon, 5);
// Example: "9q5ct" covers ~5km × 5km area

// Search only relevant geohashes
const userGeohash = geohash.encode(userLat, userLon, 5);
const adjacentHashes = geohash.neighbors(userGeohash);

// Query only stores in these 9 geohashes (user + 8 neighbors)
const nearbyStores = await db.query(
  'SELECT * FROM stores WHERE geohash IN (?)',
  [userGeohash, ...adjacentHashes]
);

// Reduces search space by 95%
```

**Performance:**
- Search 500 stores instead of 50,000
- Still use Haversine for exact distances
- Response time: ~200-300ms

**Cost:** $0 additional (just preprocessing)

---

## Caching Strategy

### Why Caching Works Here

**Store locations change slowly:**
- 99% of stores: No change in 3 months
- Cache aggressively with 24-hour TTL

**User searches are repetitive:**
- 80/20 rule: 80% of searches are for 20% of ZIP codes
- Popular ZIPs: 90210, 10001, 60601, 77001, 94102
- Cache these and hit 70%+ cache rate

---

### Cache Layers

**Layer 1: ZIP Code → Coordinates (Critical)**

```javascript
// In-memory Map on the server
const zipCache = new Map();

async function geocodeZip(zip) {
  if (zipCache.has(zip)) {
    return zipCache.get(zip); // Instant
  }
  
  const coords = await fetchFromAPI(zip); // 150ms
  zipCache.set(zip, coords);
  return coords;
}

// Cache persists across requests
// Size: ~40,000 US ZIPs × 16 bytes = 640KB
// Hit rate: 95%+
```

**Benefit:** Eliminates 150ms external API call  
**Cost:** FREE (server memory)

---

**Layer 2: Search Results Cache (High Value)**

```javascript
// Redis cache
const cacheKey = `stores:${zip}:${radius}:${retailer}`;

// Check cache first
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached); // <10ms
}

// Cache miss: compute fresh results
const results = await searchStores(zip, radius, retailer);

// Cache for 24 hours
await redis.setex(cacheKey, 86400, JSON.stringify(results));

return results;
```

**Hit rate:** 60-70% (popular ZIPs searched repeatedly)  
**Response time:** <50ms for cached results  
**Cost:** Redis Cloud 30MB free tier, or $5/month for production

---

**Layer 3: CDN for Static Assets**

```
Cloudflare CDN (free tier):
- Store logos, retailer info
- Frontend JavaScript/CSS bundles
- Map tiles (if we add maps later)

Benefit: Faster page loads globally
Cost: $0
```

---

## Handling 5,000 Concurrent Users

### Architecture at Scale

```
┌──────────────────┐
│  Cloudflare CDN  │ ← DDoS protection, bot filtering
└────────┬─────────┘   Rate limiting: 100 req/min per IP
         │
┌────────▼─────────┐
│  Vercel Edge     │ ← Auto-scaling, edge caching
│   (Frontend)     │   Response cache: 60 seconds
└────────┬─────────┘
         │
┌────────▼─────────┐
│  Redis Cache     │ ← Search results, ZIP lookups
│  (Optional)      │   TTL: 24 hours
└────────┬─────────┘   Hit rate: 70%
         │
┌────────▼─────────┐
│ Supabase Edge    │ ← Serverless functions
│   Functions      │   Auto-scaling
└────────┬─────────┘   Connection pooling
         │
┌────────▼─────────┐
│  PostgreSQL +    │ ← Spatial indexes
│    PostGIS       │   Read replicas (if needed)
└──────────────────┘
```

---

### Load Analysis

**Scenario: 5,000 users, 2 searches per minute each**

```
Raw load: 5,000 × 2 = 10,000 requests/min = 167 req/sec

After Cloudflare (block bots):
  - Filter out 40% bot traffic
  - Remaining: 100 req/sec

After Vercel edge cache (60s TTL):
  - Same search within 60s = cache hit
  - Reduces to: ~70 req/sec

After Redis cache (popular ZIPs):
  - 70% cache hit rate
  - Reduces to: ~21 req/sec actual DB queries

Database capacity:
  - PostgreSQL with PostGIS: 200+ queries/sec
  - Current load: 21 queries/sec
  - Headroom: 90%+ capacity remaining
```

**Verdict:** Easy to handle with proper caching.

---

### Cost at 5,000 Users

```
Infrastructure:
- Vercel Pro: $20/month (custom domain, analytics)
- Supabase Pro: $25/month (500k requests)
- Redis Cloud: $5/month (caching layer)
- Cloudflare: $0/month (free tier)

Data:
- Quarterly updates: ~$10/month amortized
- Monitoring (Sentry): $0/month (free tier)

────────────────────────────────
TOTAL: $60/month

Cost per user: $0.012/month (1.2 cents!)
Cost per search: $0.0002 (0.02 cents!)
```

---

## Cost Comparison: Us vs. Google Maps

### Google Maps Distance Matrix API

```
Pricing: $5 per 1,000 requests
Usage: 5,000 users × 60 searches/month = 300k requests/month

Monthly cost: 300 × $5 = $1,500
Annual cost: $18,000
```

**Plus:** You still need to maintain the store database yourself.

---

### Our Approach

```
Infrastructure: $60/month
Data acquisition: $500/year (one-time for verified dataset)
Updates: $120/year
Monitoring: $0 (free tier)

Monthly cost: ~$70
Annual cost: ~$840 + $500 one-time = $1,340 first year
             ~$840 ongoing

SAVINGS: $16,660/year (93% cheaper!)
```

---

## Real-World Trade-offs

### Current (Free Tier): Good for MVP

**Pros:**
- Zero cost
- Fast to develop
- Easy to test
- Proves the concept

**Cons:**
- Limited data (321 stores)
- Slow response (~1.5s)
- No caching
- ZIP API rate limit

**Best for:** Assessment, proof-of-concept, demo

---

### Production ($60/month): Ready for Real Users

**Pros:**
- 50,000+ stores
- <200ms response time
- Spatial indexes
- Redis caching
- 5,000+ concurrent users
- Automated updates

**Cons:**
- Requires paid infrastructure
- More complex deployment
- Need monitoring setup
- Developer time for maintenance

**Best for:** Production launch, growing user base

---

### Enterprise ($200+/month): National Scale

**Pros:**
- Unlimited stores
- Multi-region deployment
- <50ms response time
- 99.99% uptime SLA
- Advanced analytics
- Dedicated support

**Cons:**
- Higher cost
- Complex infrastructure
- Requires DevOps expertise

**Best for:** Fortune 500 companies, high-traffic apps

---

## Migration Path

### Phase 1: Current State → Production Ready (Month 1-2)

**Week 1-2: Infrastructure**
- [ ] Upgrade to Supabase Pro ($25/month)
- [ ] Add PostGIS extension
- [ ] Create spatial indexes
- [ ] Set up Redis cache ($5/month)

**Week 3-4: Data Expansion**
- [ ] Collect data from 10 retailers
- [ ] Geocode new addresses
- [ ] Load into database
- [ ] Verify accuracy

**Week 5-6: Optimization**
- [ ] Implement result caching
- [ ] Build self-hosted ZIP database
- [ ] Add monitoring (Sentry)
- [ ] Load testing

**Week 7-8: Polish**
- [ ] Write automated update scripts
- [ ] Set up quarterly refresh cron job
- [ ] Build admin dashboard
- [ ] Documentation

**Launch:** 10,000+ stores, <200ms response, 5,000 users

---

### Phase 2: Production → Scale (Month 3-6)

**If growth demands:**
- Add geohash partitioning
- Implement read replicas
- Deploy Cloudflare in front
- Expand to 20+ retailers
- Add user accounts and favorites

**Cost:** $100-150/month for 10,000+ concurrent users

---

## Key Insights

1. **Store data changes slowly** → Aggressive caching is safe
2. **Users search the same ZIPs repeatedly** → Cache popular locations
3. **Bounding box + spatial indexes** → 95% performance improvement
4. **Quarterly updates** → 95%+ accuracy at 1/100th the cost
5. **Haversine is good enough** → No need for Google's routing engine

---

## Bottom Line

**For this assessment:** Current free tier setup demonstrates understanding of:
- Distance algorithms (Haversine)
- Performance optimization (bounding box)
- Scalable architecture (designed for growth)
- Cost-effectiveness (vs. Google Maps)

**For production:** $60/month gets you to 50,000+ stores and 5,000 users, which is **93% cheaper than Google Maps** while maintaining accuracy and speed.

The key is understanding that store locations are **static data that changes slowly**, not dynamic data that needs constant API calls.

---

## Questions?

Want to dive deeper on any of this? Hit me up:  
**sa0316151@gmail.com**
