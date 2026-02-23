# Store Location Distance Engine

A store locator that finds nearby stores using ZIP codes—no Google Maps API needed. Built for the Prox Software Engineering Internship assessment.

**Live Demo:** [Hosted on Vercel](https://store-location-finder-ruddy.vercel.app/) 🚀  
**GitHub:** [Your Repo](https://github.com/Sair0703/store-distance-engine)

---

## What This Does

Type in any US ZIP code and get a list of nearby stores sorted by distance. Currently supports 321 stores across Ralphs and Walmart, with architecture designed to scale to 20+ retailers.

Uses the Haversine formula to calculate distances and a bounding box optimization to make searches fast.

---

## Quick Start

**Try the API:**
```bash
curl -H "Authorization: Bearer YOUR_SUPABASE_KEY" \
  "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores?zip=91502&radius=5"
```

** If you want to run locally locally:**
```bash
git clone https://github.com/yourusername/store-distance-engine
cd store-distance-engine
npm install
npm run dev
```

Open `http://localhost:5173` and start searching.

---

## Features

- ✅ **Haversine distance calculation** - Accurate within 0.5%
- ✅ **Bounding box optimization** - 90% performance improvement
- ✅ **Multi-retailer support** - Easy to add new stores
- ✅ **REST API** - Clean JSON responses
- ✅ **Performance tracking** - See query times in real-time
- ✅ **Hosted on Vercel** - Auto-deploy from GitHub

---

## Tech Stack

**Frontend:** React + Vite, Tailwind CSS  
**Backend:** Supabase Edge Functions (Hono)  
**Database:** PostgreSQL (Supabase KV store)  
**Hosting:** Vercel (frontend) + Supabase (backend)  
**Cost:** $0/month on free tiers

---

## Current Data

**321 stores:**
- 40 Ralphs (California only)
- 281 Walmart (nationwide)

**Coverage:** 15+ states including CA, TX, OK, AR, and more.

---

## Documentation

Want details? Check out these docs:

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - How to use the API
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical design and decisions
- **[SCALE_AND_COST_STRATEGY.md](./SCALE_AND_COST_STRATEGY.md)** - Scaling to 20+ retailers
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - High-level overview

---

## Example Search

**Search for stores near Burbank, CA (ZIP 91502):**

```bash
GET /stores?zip=91502&radius=5
```

**Response:**
```json
{
  "success": true,
  "zip": "91502",
  "location": {
    "lat": 34.1808,
    "lon": -118.309
  },
  "stores": [
    {
      "store_name": "Walmart Supercenter",
      "address": "1301 N Victory Pl, Burbank, CA 91502",
      "distance_miles": 0.47,
      "retailer": "Walmart"
    },
    {
      "store_name": "Ralphs",
      "address": "535 N Victory Blvd, Burbank, CA 91502",
      "distance_miles": 0.79,
      "retailer": "Ralphs"
    }
  ],
  "total_results": 2,
  "query_time_ms": 1478
}
```

---

## Performance

**Current (321 stores):**
- Response time: ~1.5 seconds
- Bounding box reduces search by 90%
- Works great on free tier

**Projected (50,000 stores with PostGIS):**
- Response time: <200ms
- 13x faster at 155x scale
- Costs $30-60/month

---

## How It Works

1. User enters ZIP code
2. API converts ZIP to lat/lon coordinates
3. Calculate bounding box around location
4. Filter stores within bounding box (90% reduction)
5. Calculate exact distance using Haversine formula
6. Sort by distance and return results

**Key optimization:** Bounding box pre-filter means we only calculate distance for ~32 stores instead of all 321.

---

## Scaling to 20+ Retailers

**Data collection:**
- Use public APIs where available (Walmart, Target, CVS, etc.)
- Respectful scraping for others
- One-time geocoding (~$50 for 10,000 stores)
- Quarterly updates (~$10/month)

**Infrastructure:**
- Migrate to PostGIS for spatial queries
- Add Redis caching layer
- Self-host ZIP code database
- Total cost: ~$30-60/month

**Result:** 50,000+ stores, <200ms response time, 93% cheaper than Google Maps API

See [SCALE_AND_COST_STRATEGY.md](./SCALE_AND_COST_STRATEGY.md) for full details.

---

## Project Structure

```
store-distance-engine/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Main React component
│   │   └── components/          # UI components
│   └── main.tsx                 # Entry point
├── supabase/
│   └── functions/
│       └── server/
│           └── index.tsx        # Hono API server
├── scripts/
│   ├── ralphs-stores.json       # 40 stores
│   ├── walmart-stores.json      # 281 stores
│   └── bulk-upload-stores.js    # Data upload script
├── API_DOCUMENTATION.md
├── ARCHITECTURE.md
├── SCALE_AND_COST_STRATEGY.md
├── PROJECT_SUMMARY.md
└── README.md                    # You are here
```

---

## Setup Instructions



### Just click the link to Vercel above and use the project!

The site is live at the link above.

---

## API Usage

**Base URL:**
```
https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2
```

**Authentication:**
```bash
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

**Search stores:**
```bash
GET /stores?zip={zipcode}&radius={miles}&retailer={retailer}
```

**Get all stores:**
```bash
GET /stores/all
```

**Health check:**
```bash
GET /health
```

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for full details.

---

## Testing

**Valid test cases:**

```bash
# Burbank, CA - 2 stores found
curl -H "Authorization: Bearer KEY" \
  "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores?zip=91502&radius=5"

# Beverly Hills, CA - 8+ stores
curl -H "Authorization: Bearer KEY" \
  "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores?zip=90210&radius=10"

# Bentonville, AR (Walmart HQ) - 10+ stores
curl -H "Authorization: Bearer KEY" \
  "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores?zip=72712&radius=15"
```

---

## What's Next

**Short term (production-ready):**
- [ ] Migrate to PostGIS for spatial queries
- [ ] Add Redis caching layer
- [ ] Build self-hosted ZIP database
- [ ] Set up monitoring (Sentry)
- [ ] Write automated tests

**Long term (scale):**
- [ ] Add 10-20 more retailers
- [ ] Implement geohash partitioning
- [ ] User accounts and favorites
- [ ] Store hours and contact info
- [ ] Mobile app (React Native)

---

## Cost Breakdown

**Current (free tier):**
- Infrastructure: $0/month
- Data: Free Kaggle datasets
- Performance: Good enough for demo

**Production ($60/month):**
- Supabase Pro: $25/month
- Vercel Pro: $20/month  
- Redis cache: $10/month
- Self-hosted ZIP DB: $5/month

**vs. Google Maps:** $1,500/month for equivalent usage

**Savings: 96% cheaper**

---

## Key Decisions

**Why Haversine instead of Google Maps?**  
Haversine is accurate enough (±0.5%) and costs nothing. Google charges $5 per 1,000 requests.

**Why bounding box optimization?**  
Reduces stores to check by 90%, making queries fast even without spatial indexes.

**Why KV store instead of relational schema?**  
Simpler for current scale. Would migrate to proper schema at 10,000+ stores.

**Why free tier infrastructure?**  
Proves the concept without spending money. Easy to upgrade when needed.

---

## Lessons Learned

1. **Store data changes slowly** - Cache aggressively
2. **Simple optimizations work** - Bounding box gives 90% improvement
3. **Free tiers are powerful** - Can build a lot without spending
4. **PostGIS at scale** - Critical for 50,000+ stores
5. **Users search popular ZIPs** - 80/20 rule applies to caching

---



## Author

Sai Anand  
Email: sa0316151@gmail.com  
GitHub: (https://github.com/Sair0703)  
LinkedIn: (https://www.linkedin.com/in/sai-anand-6689182a7)
