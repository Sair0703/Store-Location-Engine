# Project Summary

Quick overview of what this project does and why certain decisions were made.

---

## The Goal

Build a store location search engine that finds nearby stores using ZIP codes and displays results sorted by distance—all without using Google Maps API.

**Assessment Requirements (Track D):**
- Haversine distance formula ✅
- Multi-retailer support ✅
- REST API with structured JSON ✅
- Performance optimization strategy ✅
- Explanation of how to scale to 20+ retailers ✅

---

## What Got Built

**Frontend:** React app hosted on Vercel
- Clean UI with ZIP code search
- Radius filtering (1-50 miles)
- Retailer filtering (Walmart, Ralphs, or both)
- Real-time results with distance display
- Performance metrics shown

**Backend:** Supabase Edge Functions (Hono framework)
- REST API endpoint for store searches
- Haversine distance calculation
- Bounding box optimization
- ZIP code → coordinates lookup
- CORS enabled, properly authenticated

**Database:** PostgreSQL (via Supabase)
- 321 stores total
- 40 Ralphs (California only)
- 281 Walmart (nationwide)
- Simple KV store pattern for fast development

**Deployment:**
- Frontend: Vercel (auto-deploy from GitHub)
- Backend: Supabase Edge Functions
- Database: Supabase PostgreSQL
- Cost: $0/month on free tiers

---

## Key Features

### 1. Haversine Distance Calculation

Implemented the standard great-circle distance formula:

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}
```

**Accuracy:** ±0.5% (standard for Haversine)  
**Performance:** ~10ms for 32 stores after filtering

---

### 2. Bounding Box Optimization

Before calculating exact distances, pre-filter stores using a bounding box:

```javascript
const latDelta = radius / 69;
const lonDelta = radius / (69 * Math.cos(toRadians(userLat)));

const nearbyStores = allStores.filter(store =>
  store.lat >= userLat - latDelta &&
  store.lat <= userLat + latDelta &&
  store.lon >= userLon - lonDelta &&
  store.lon <= userLon + lonDelta
);
```

**Impact:** Reduces stores to check from 321 → ~32 (90% reduction)

---

### 3. Multi-Retailer Support

Database schema designed to support unlimited retailers:

```json
{
  "id": 0,
  "store_name": "Walmart Supercenter",
  "address": "1301 N Victory Pl, Burbank, CA 91502",
  "lat": 34.1808,
  "lon": -118.309,
  "retailer": "Walmart"
}
```

Easy to add new retailers—just upload their store data.

---

### 4. REST API

**Endpoint:** `GET /stores?zip=91502&radius=5&retailer=all`

**Response:**
```json
{
  "success": true,
  "zip": "91502",
  "location": { "lat": 34.1808, "lon": -118.309 },
  "radius": 5,
  "retailer": "all",
  "stores": [
    {
      "store_name": "Walmart Supercenter",
      "address": "1301 N Victory Pl, Burbank, CA 91502",
      "distance_miles": 0.47,
      "retailer": "Walmart"
    }
  ],
  "total_results": 2,
  "query_time_ms": 1478
}
```

Clean, structured JSON with all relevant info.

---

## Technical Decisions

### Why React + Vite?
Fast development, great DX, instant hot reload. Vercel deployment is one click.

### Why Supabase?
Free tier includes PostgreSQL, Edge Functions, and auth. Everything in one place.

### Why Hono for the API?
Lightweight, fast, works great with Deno (Supabase's runtime). Much simpler than Express.

### Why KV Store Instead of Relational Schema?
For 321 stores, it's faster to fetch all and filter in-memory. No complex queries needed.

### Why Not PostGIS From the Start?
Current scale doesn't need it. Haversine in JavaScript is fast enough. Would migrate at 10,000+ stores.

### Why Free Tier Infrastructure?
Proves the concept without spending money. Easy to upgrade when needed.

---

## Performance

**Current (321 stores):**
```
Search: ZIP 91502, Radius 5 miles
Results: 2 stores
Time: ~1.5 seconds

Breakdown:
- ZIP → coordinates: ~150ms (external API)
- Bounding box filter: ~5ms
- Distance calculation: ~10ms
- Sorting: ~1ms
- Network overhead: ~1.3s
```

**Projected (50,000 stores with PostGIS):**
```
Search: ZIP 90210, Radius 10 miles
Results: ~50 stores
Time: ~100-200ms

Breakdown:
- ZIP lookup (cached): ~5ms
- PostGIS spatial query: ~100ms
- Sorting: ~2ms
- Network overhead: ~50ms
```

**13x faster at 155x the scale** with proper optimization.

---

## Data Sources

**Ralphs:** Kaggle dataset, manually verified (40 stores)  
**Walmart:** Kaggle dataset, verified coordinates (281 stores)  
**Geocoding:** OpenCage API (free tier, one-time use)

All coordinates in decimal degrees, verified accurate.

---

## Geographic Coverage

**States covered:**
- California (56 stores - 17.4%)
- Arkansas (25 stores - 7.8%)
- Oklahoma (95 stores - 29.6%)
- Texas (89 stores - 27.7%)
- Plus: Missouri, Louisiana, Alabama, North Carolina, etc.

**Retailer split:**
- Ralphs: 40 stores (California only)
- Walmart: 281 stores (nationwide)

Demonstrates both regional and national coverage patterns.

---

## Scaling Strategy

### Phase 1: 10,000 Stores (10-20 Retailers)

**Data collection:**
- Public APIs from major retailers
- One-time geocoding (~$50)
- Quarterly updates (~$10/month)

**Infrastructure:**
- Supabase Pro: $25/month
- Redis cache: $5/month
- Self-hosted ZIP database: $0 (one-time $200 setup)

**Performance:**
- Response time: 200-500ms
- Concurrent users: 5,000+
- Total cost: ~$30/month

---

### Phase 2: 50,000+ Stores (Regional/National)

**Optimizations:**
- PostGIS spatial indexes
- Geohash partitioning
- CDN layer (Cloudflare)
- Read replicas

**Performance:**
- Response time: <200ms
- Concurrent users: 10,000+
- Total cost: ~$60/month

---

## Cost Comparison

**Google Maps Distance Matrix API:**
- 5,000 users × 60 searches/month = 300k requests
- Cost: $5 per 1,000 requests
- Monthly: $1,500
- Annual: $18,000

**Our Approach:**
- Infrastructure: $60/month
- Data updates: $10/month
- Monthly: $70
- Annual: $840

**Savings: $17,160/year (93% cheaper)**

---

## What Worked Well

1. **Bounding box optimization** - Simple but effective (90% reduction)
2. **KV store pattern** - Fast development, good enough for current scale
3. **Kaggle datasets** - Saved weeks of data collection
4. **Supabase free tier** - Everything needed without spending money
5. **Vercel deployment** - Push to GitHub, instant live site

---

## What Would Change for Production

1. **Add comprehensive caching** - ZIP lookups, popular searches
2. **Migrate to PostGIS** - Spatial queries are the right tool at scale
3. **Build self-hosted ZIP database** - Eliminate external API dependency
4. **Add monitoring** - Sentry for errors, Datadog for performance
5. **Write tests** - Unit, integration, and load tests
6. **Automate updates** - Cron jobs for quarterly data refresh
7. **Add user features** - Save favorites, report closed stores

---

## Lessons Learned

**Store data changes slowly** → Cache aggressively  
**Users search popular ZIPs repeatedly** → Cache those too  
**Simple optimizations go far** → Bounding box gives 90% improvement  
**Free tiers are powerful** → Can build a lot without spending  
**PostGIS is overkill for small datasets** → But critical at scale

---

## Files in This Repo

```
├── API_DOCUMENTATION.md        ← API endpoints, examples
├── ARCHITECTURE.md             ← Technical design, data flow
├── SCALE_AND_COST_STRATEGY.md  ← How to scale to 20+ retailers
├── PROJECT_SUMMARY.md          ← This file
├── README.md                   ← Main docs
├── src/                        ← React frontend
├── supabase/functions/         ← Edge Functions (Hono server)
└── scripts/                    ← Data upload scripts
```

---

## Demo

**Frontend:** [https://your-app.vercel.app](https://your-app.vercel.app)

**Try these searches:**
- ZIP 91502 (Burbank, CA) → 2 stores
- ZIP 90210 (Beverly Hills, CA) → 8+ stores
- ZIP 72712 (Bentonville, AR) → 10+ stores

**API:**
```bash
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores?zip=91502&radius=5"
```

---

## Time Spent

**Total:** ~15-20 hours over 1 week

**Breakdown:**
- Research & planning: 2 hours
- Data collection & geocoding: 3 hours
- Backend implementation: 5 hours
- Frontend implementation: 4 hours
- Testing & debugging: 3 hours
- Documentation: 3 hours

---

## What I'd Do Differently Next Time

1. **Start with PostGIS** - Would've saved refactoring later
2. **Build ZIP database first** - Eliminate external API dependency early
3. **Add tests from the start** - Easier than bolting on later
4. **Use TypeScript** - Would've caught some bugs earlier
5. **Set up monitoring sooner** - Would've caught performance issues faster

---



---

## Questions?

**Sai Anand:** sa0316151@gmail.com

Built with care for the Prox Software Engineering Internship Assessment (Track D).
