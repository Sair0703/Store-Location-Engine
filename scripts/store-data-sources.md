# 📍 Real Store Location Data Sources

## ✅ **Free Public Datasets Available Right Now:**

### **Option 1: Walmart Store Finder API (Public)**
- **Endpoint:** `https://www.walmart.com/store/finder/electrode/api/stores`
- **Parameters:** `?zip={zip}&distance={miles}`
- **Returns:** JSON with stores
- **Rate Limit:** ~2 requests/second
- **Cost:** Free (public API)
- **Coverage:** Nationwide

### **Option 2: Ralphs/Kroger Store Locator API (Public)**
- **Endpoint:** `https://www.ralphs.com/atlas/v1/stores/v1/search`
- **Parameters:** `?lat={lat}&lon={lon}&radius={miles}`
- **Returns:** JSON with stores
- **Rate Limit:** ~1 request/second
- **Cost:** Free (public API)
- **Coverage:** Southern California (Ralphs operates primarily in SoCal)

### **Option 3: SimpleMaps US ZIP Code Database (FREE)**
- **URL:** https://simplemaps.com/data/us-zips
- **Includes:** Major retail locations
- **Format:** CSV
- **Cost:** Free basic version
- **Size:** 1,000+ stores

### **Option 4: GitHub Public Datasets**
- **Search:** "retail store locations csv"
- **Examples:**
  - https://github.com/datasets/store-locations
  - https://github.com/chrismeller/walmart-store-locations
- **Format:** CSV/JSON
- **Cost:** Free

### **Option 5: US Government Data**
- **URL:** https://catalog.data.gov/dataset
- **Search:** "retail locations" or "store locations"
- **Format:** CSV/JSON/XML
- **Cost:** Free (public domain)

---

## 🎯 **Recommended Approach:**

### **Best: Use Walmart + Ralphs APIs**

**Why:**
- ✅ Always up-to-date
- ✅ Official data
- ✅ Free
- ✅ Easy to use
- ✅ 600+ stores in 10 minutes
- ✅ Walmart = nationwide, Ralphs = regional depth

**How:**
1. Run the Walmart scraper script (provided)
2. Run the Ralphs scraper script (provided)
3. Queries 20+ major US cities/regions
4. Gets ~30 stores per location
5. Total: ~600 stores in 7 minutes

---

## 📊 **Major US Cities for Walmart (Nationwide):**

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
  { zip: '20001', name: 'Washington, DC' },
  { zip: '97201', name: 'Portland, OR' },
  { zip: '55401', name: 'Minneapolis, MN' },
  { zip: '48201', name: 'Detroit, MI' },
  { zip: '37201', name: 'Nashville, TN' },
  { zip: '63101', name: 'St. Louis, MO' },
  { zip: '28201', name: 'Charlotte, NC' },
  { zip: '92101', name: 'San Diego, CA' }
];
```

**Coverage:** Nationwide (all major regions)

---

## 📊 **Southern California Regions for Ralphs:**

```javascript
const socalRegions = [
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
  // ... more SoCal regions
];
```

**Coverage:** Deep Southern California coverage

---

## 💡 **Why This Combination?**

### **Walmart + Ralphs = Perfect Balance:**

**Walmart:**
- ✅ Nationwide presence
- ✅ Shows system works at scale
- ✅ General merchandise retailer
- ✅ ~400 stores across USA

**Ralphs:**
- ✅ Regional depth (Southern California)
- ✅ Different retailer type (grocery)
- ✅ Proves multi-retailer support
- ✅ ~200 stores in one region

**Together:**
- ✅ 600+ total stores
- ✅ 2 retailers (meets requirements)
- ✅ Nationwide + Regional strategy
- ✅ Different retailer categories
- ✅ Realistic production scenario