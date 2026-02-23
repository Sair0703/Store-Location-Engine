# API Documentation

**Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Production-ready for proof-of-concept scale  
**Base URL:** `https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2`

---

## Authentication

All requests need the Supabase anon key in the Authorization header:

```bash
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

You can find your key in the Supabase dashboard under Project Settings → API.

---

## Endpoints

### 1. Search Stores by ZIP Code

**GET** `/stores`

Find stores within a radius of any US ZIP code.

**Query Parameters:**

| Parameter | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| `zip` | string | Yes | - | 5-digit US ZIP code |
| `radius` | number | No | 10 | Search radius in miles (1-50) |
| `retailer` | string | No | all | Filter: `walmart`, `ralphs`, or `all` |

**Example Request:**

```bash
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores?zip=91502&radius=5&retailer=all"
```

**Example Response:**

```json
{
  "success": true,
  "zip": "91502",
  "location": {
    "lat": 34.1808,
    "lon": -118.309
  },
  "radius": 5,
  "retailer": "all",
  "stores": [
    {
      "id": 2,
      "store_name": "Walmart Supercenter",
      "address": "1301 N Victory Pl, Burbank, CA 91502",
      "retailer": "Walmart",
      "lat": 34.1808,
      "lon": -118.309,
      "distance_miles": 0.47
    },
    {
      "id": 22,
      "store_name": "Ralphs",
      "address": "535 N Victory Blvd, Burbank, CA 91502",
      "retailer": "Ralphs",
      "lat": 34.1783,
      "lon": -118.3189,
      "distance_miles": 0.79
    }
  ],
  "total_results": 2,
  "query_time_ms": 1478
}
```

**Error Responses:**

```json
// Invalid ZIP code
{
  "success": false,
  "error": "Invalid ZIP code",
  "message": "ZIP code must be 5 digits"
}

// ZIP not found
{
  "success": false,
  "error": "ZIP code not found",
  "message": "Could not geocode ZIP code 99999"
}
```

---

### 2. Get All Stores

**GET** `/stores/all`

Returns the complete store database. Useful for debugging or downloading the full dataset.

**Example Request:**

```bash
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://cmycxqqfvzmpvdtvbakl.supabase.co/functions/v1/make-server-26050ec2/stores/all"
```

**Example Response:**

```json
{
  "total": 321,
  "stores": [
    {
      "id": 0,
      "store_name": "Ralphs",
      "address": "9040 W Sunset Blvd, West Hollywood, CA 90069",
      "retailer": "Ralphs",
      "lat": 34.0905,
      "lon": -118.3891
    }
    // ... 320 more stores
  ]
}
```

---

### 3. Health Check

**GET** `/health`

Simple ping endpoint to verify the API is up.

**Example Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-02-22T12:34:56.789Z",
  "service": "store-distance-engine"
}
```

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Request succeeded |
| 400 | Bad request (check your parameters) |
| 401 | Unauthorized (missing or invalid API key) |
| 404 | Endpoint not found |
| 500 | Server error (check back later) |

---

## Rate Limits

**Current limits (free tier):**
- ZIP lookups: 10 per hour (external API limit)
- Store searches: Unlimited on Supabase free tier
- Database queries: 500k per month

For production use, we'd move to a self-hosted ZIP database to eliminate the external API dependency.

---

## Testing the API

**Valid test cases:**

```bash
# Burbank, CA (should find Walmart + Ralphs)
GET /stores?zip=91502&radius=5

# Beverly Hills, CA (should find 8+ stores)
GET /stores?zip=90210&radius=10

# Bentonville, AR (Walmart HQ - lots of stores)
GET /stores?zip=72712&radius=15

# New York, NY (no coverage yet)
GET /stores?zip=10001&radius=10
# Should return: "total_results": 0
```

**Edge cases:**

```bash
# Invalid ZIP
GET /stores?zip=123
# Returns: 400 Bad Request

# Large radius
GET /stores?zip=90210&radius=50
# Works, but may be slow with current dataset

# Retailer filter
GET /stores?zip=91502&radius=10&retailer=walmart
# Returns only Walmart stores
```

---

## Performance Notes

**Current performance (321 stores):**
- Average response time: ~1.5 seconds
- Breakdown:
  - ZIP geocoding: ~150ms (external API)
  - Bounding box filter: ~5ms
  - Distance calculation: ~10ms (after filtering)
  - Network/overhead: ~1.3s

**Optimization opportunities:**
1. Cache ZIP → lat/lon lookups (saves 150ms)
2. Add PostGIS spatial indexes (10x faster queries)
3. Redis layer for popular searches (60-70% cache hit rate)

With these optimizations, we'd hit <200ms response times even at 50,000+ stores.

---

## What's Next?

If something's not clear or you run into issues, reach out:  
**@sa0316151@gmail.com**
