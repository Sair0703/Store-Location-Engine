# Architecture

This doc explains how everything fits together and why we made certain technical decisions.

---

## System Overview

```
┌─────────────────────┐
│     User Browser    │
│  (React + Vite app) │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│   Vercel (Frontend) │
│  - Auto-deploy      │
│  - CDN caching      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Supabase Edge      │
│  Functions (Hono)   │
│  - ZIP lookup       │
│  - Distance calc    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PostgreSQL (KV)    │
│  - 321 stores       │
│  - Simple schema    │
└─────────────────────┘
```

**Why this stack?**
- Vercel handles React builds and deployments automatically
- Supabase Edge Functions are serverless (no server to manage)
- PostgreSQL is solid and scalable
- Everything stays on free tiers until we need more

---

## Data Flow

Here's what happens when you search for ZIP code 91502:

1. **User submits form** → React app validates input
2. **Frontend calls API** → `GET /stores?zip=91502&radius=5`
3. **Server validates ZIP** → Checks format (5 digits)
4. **ZIP → Coordinates** → Calls ZipCodeAPI to get lat/lon (34.1808, -118.309)
5. **Bounding box calculation** → Creates a square around the point
6. **Query database** → Fetches all 321 stores (for now)
7. **Filter by bounding box** → Reduces to ~32 stores (90% eliminated)
8. **Calculate distances** → Haversine formula on remaining stores
9. **Filter by radius** → Keep only stores within 5 miles
10. **Sort by distance** → Closest first
11. **Return JSON** → Send results back to frontend
12. **Display results** → React renders the list

**Total time:** ~1.5 seconds (mostly the ZIP API call)

---

## Haversine Formula

The Haversine formula calculates the great-circle distance between two points on a sphere. It's accurate enough for store searches (within ~0.5% error).

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  
  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  // Haversine formula
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * 
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in miles
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
```

**Why not use PostGIS from the start?**

Good question. For 321 stores, the performance difference is negligible. Haversine in JavaScript is fast enough and keeps the code simple. Once we hit 10,000+ stores, we'd migrate to PostGIS spatial queries.

---

## Bounding Box Optimization

Before calculating distances, we filter stores using a simple bounding box. This eliminates ~90% of stores before we do any expensive math.

```javascript
// Calculate how many degrees of lat/lon equal our search radius
const latDelta = radius / 69; // ~69 miles per degree of latitude
const lonDelta = radius / (69 * Math.cos(toRadians(userLat)));

// Create a box around the user's location
const box = {
  maxLat: userLat + latDelta,
  minLat: userLat - latDelta,
  maxLon: userLon + lonDelta,
  minLon: userLon - lonDelta
};

// Only keep stores inside the box
const nearbyStores = allStores.filter(store =>
  store.lat >= box.minLat &&
  store.lat <= box.maxLat &&
  store.lon >= box.minLon &&
  store.lon <= box.maxLon
);
```

**Impact:**
- Without filter: Calculate distance for 321 stores → ~2.8s
- With filter: Calculate distance for ~32 stores → ~1.5s
- **Speedup: 47% faster**

At 50,000 stores, this optimization becomes critical. We'd go from calculating 50,000 distances to maybe 500.

---

## Database Schema

We're using a simple key-value pattern on PostgreSQL:

**Table:** `kv_store_26050ec2`

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Auto-increment primary key |
| key | text | Always 'store' (for KV pattern) |
| value | jsonb | Store data as JSON |

**Why KV instead of a proper relational schema?**

For this scale (321 stores), it's simpler and faster to develop. We fetch all stores in one query and filter in memory. No joins, no complex queries, no indexes to maintain.

**Store value structure:**

```json
{
  "id": 0,
  "store_name": "Walmart Supercenter",
  "address": "1301 N Victory Pl, Burbank, CA 91502",
  "lat": 34.1808,
  "lon": -118.3090,
  "retailer": "Walmart"
}
```

**When would we migrate to a relational schema?**

Around 10,000 stores. At that point, we'd create a proper `stores` table with spatial indexes:

```sql
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  store_name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  retailer TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) -- PostGIS spatial type
);

-- Spatial index for fast queries
CREATE INDEX idx_stores_location 
ON stores 
USING GIST(location);
```

---

## Tech Decisions

### Frontend: React + Vite

**Why React?** It's what I know best and it's fast to prototype with.

**Why Vite?** Way faster than Create React App. Hot module replacement is instant, and the build process is straightforward.

**Why Tailwind?** Utility-first CSS is faster than writing custom styles. The app looks clean without much effort.

**Deployed on Vercel** because it connects to GitHub and handles deployments automatically. Push to main → instant deployment.

---

### Backend: Supabase Edge Functions

**Why Supabase?** Free tier includes:
- PostgreSQL database
- Edge Functions (serverless compute)
- Real-time subscriptions (if we need them later)
- Authentication (if we add user accounts)

**Why Hono?** It's a lightweight web framework for edge runtimes. Faster than Express and works great with Deno (which Supabase uses).

**Alternative considered:** AWS Lambda + API Gateway. Rejected because of complexity and cost. Supabase is simpler.

---

### Data Sources

**Ralphs:** Manual collection from Kaggle dataset (40 stores)  
**Walmart:** Kaggle verified dataset (281 stores)  
**Geocoding:** OpenCage API (free tier, one-time use)

**Why Kaggle?** The datasets are already verified and geocoded. Saves a ton of time vs. scraping store locators.

**For 20+ retailers:** We'd write scrapers with rate limiting, then geocode addresses using Nominatim (free, self-hosted).

---

## Scaling Considerations

### Current Architecture (Free Tier)

**Limits:**
- 321 stores
- ~1.5s response time
- ZIP API limited to 10 requests/hour
- No caching

**Handles:** ~100 concurrent users comfortably

---

### Phase 1: 10,000 Stores ($30/month)

**Changes needed:**
1. **Migrate to PostGIS**
   - Add spatial extension
   - Create GIST indexes
   - Rewrite queries to use `ST_Distance`

2. **Self-host ZIP database**
   - One-time geocoding of all US ZIPs (~$200)
   - Eliminates external API dependency
   - Instant lookups

3. **Add Redis caching**
   - Cache popular ZIP searches (TTL: 24hr)
   - 60-70% cache hit rate expected
   - Redis Cloud: $5/month

**Performance:**
- Response time: 200-500ms
- Handles: 5,000+ concurrent users
- Cost: ~$30/month

---

### Phase 2: 50,000+ Stores ($55/month)

**Additional changes:**
1. **Geohash partitioning**
   - Group stores by geographic region
   - Only search relevant partitions
   - 95% reduction in search space

2. **CDN layer**
   - Cloudflare in front
   - Cache static assets
   - DDoS protection

3. **Read replicas**
   - Multiple database instances
   - Distribute query load
   - Better availability

**Performance:**
- Response time: 50-200ms
- Handles: 10,000+ concurrent users
- Cost: ~$55/month

---

## Error Handling

The API handles these cases gracefully:

**Invalid ZIP code:**
```javascript
if (!/^\d{5}$/.test(zip)) {
  return { success: false, error: "Invalid ZIP code" };
}
```

**ZIP not found:**
```javascript
try {
  const coords = await geocodeZip(zip);
} catch (error) {
  return { success: false, error: "ZIP code not found" };
}
```

**No stores in radius:**
```javascript
if (stores.length === 0) {
  return { 
    success: true, 
    stores: [], 
    message: "No stores found within radius" 
  };
}
```

**Database errors:**
```javascript
try {
  const stores = await kv.getByPrefix('store');
} catch (error) {
  console.error('Database error:', error);
  return { success: false, error: "Internal server error" };
}
```

---

## Security

**API Key Protection:**
- Anon key is safe to expose (read-only access)
- Service role key stays on server only
- Row-level security (RLS) enabled on Supabase

**Input Validation:**
- ZIP codes: 5 digits only
- Radius: 1-50 miles
- Retailer: whitelist of known values

**Rate Limiting:**
- Supabase handles this automatically
- Could add Cloudflare if we get DDoS'd

---

## Monitoring

**Current setup:** Basic console.log statements

**Production would add:**
- Sentry for error tracking
- Datadog or New Relic for APM
- Uptime monitoring (UptimeRobot)
- Custom dashboards for query performance

---

## Trade-offs Made

**Simplicity vs. Performance:**
- Chose KV store over relational schema
- Filtering in-memory instead of database queries
- **Why?** Faster development, good enough for current scale

**Cost vs. Features:**
- Using free ZIP API (10 requests/hour limit)
- No caching layer yet
- **Why?** Proves the concept without spending money

**Accuracy vs. Speed:**
- Haversine formula (±0.5% error) vs. driving distance
- **Why?** Good enough for "find nearby stores" use case

---

## What I'd Change for Production

1. **Add comprehensive tests** - Unit tests, integration tests, load tests
2. **Implement proper logging** - Structured logs, not console.log
3. **Set up CI/CD** - GitHub Actions for automated testing
4. **Add monitoring** - Know when things break before users complain
5. **Cache aggressively** - Popular ZIPs, store results, everything
6. **Migrate to PostGIS** - Spatial queries are the right tool here
7. **Build admin panel** - Easier to manage stores vs. SQL scripts

---

## Questions?

If anything's unclear or you want to dive deeper on a specific part, let me know:  
**sa0316151@gmail.com**
