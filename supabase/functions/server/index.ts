import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store_clean.ts";

// Types for our store data
interface Store {
  store_name: string;
  address: string;
  lat: number;
  lon: number;
  retailer: string;
}

interface StoreWithDistance extends Store {
  distance_miles: number;
}

// Cache for ZIP code coordinates (to avoid repeated API calls)
const zipCache: Record<string, { lat: number; lon: number; city?: string; state?: string }> = {};

// Fetch ZIP code coordinates from free Zippopotam.us API
async function getZipCoordinates(zip: string): Promise<{ lat: number; lon: number; city?: string; state?: string } | null> {
  // Check cache first
  if (zipCache[zip]) {
    console.log(`ZIP ${zip} found in cache`);
    return zipCache[zip];
  }

  try {
    // Use free Zippopotam.us API (no API key required)
    const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
    
    if (!response.ok) {
      console.error(`ZIP code ${zip} not found in Zippopotam API`);
      return null;
    }

    const data = await response.json();
    
    if (!data.places || data.places.length === 0) {
      console.error(`No location data for ZIP ${zip}`);
      return null;
    }

    const place = data.places[0];
    const coords = {
      lat: parseFloat(place.latitude),
      lon: parseFloat(place.longitude),
      city: place['place name'],
      state: place['state abbreviation']
    };

    // Cache the result
    zipCache[zip] = coords;
    
    // Also save to KV store for persistence
    await kv.set(`zip:${zip}`, coords);
    
    console.log(`ZIP ${zip} geocoded: ${coords.city}, ${coords.state} (${coords.lat}, ${coords.lon})`);
    return coords;
  } catch (error) {
    console.error(`Error fetching ZIP ${zip}:`, error);
    
    // Try to load from KV store as fallback
    try {
      const cached = await kv.get(`zip:${zip}`);
      if (cached) {
        console.log(`ZIP ${zip} loaded from KV store`);
        zipCache[zip] = cached as { lat: number; lon: number; city?: string; state?: string };
        return cached as { lat: number; lon: number; city?: string; state?: string };
      }
    } catch (kvError) {
      console.error(`KV store lookup failed for ZIP ${zip}:`, kvError);
    }
    
    return null;
  }
}

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Bounding box optimization: filter stores within a rectangular area before calculating exact distance
function getBoundingBox(lat: number, lon: number, radiusMiles: number) {
  const latDegreePerMile = 1 / 69; // Approximately 69 miles per degree of latitude
  const lonDegreePerMile = 1 / (69 * Math.cos(toRadians(lat))); // Varies by latitude
  
  return {
    minLat: lat - (radiusMiles * latDegreePerMile),
    maxLat: lat + (radiusMiles * latDegreePerMile),
    minLon: lon - (radiusMiles * lonDegreePerMile),
    maxLon: lon + (radiusMiles * lonDegreePerMile),
  };
}

// Health check endpoint
app.get("/make-server-26050ec2/health", (c) => {
  return c.json({ status: "ok" });
});

// Initialize sample store data
app.post("/make-server-26050ec2/init-stores", async (c) => {
  try {
    // Sample stores for Walmart and Ralphs in various locations
    const sampleStores: Store[] = [
      // Beverly Hills area (90210)
      { store_name: "Walmart Supercenter", address: "5500 Canoga Ave, Woodland Hills, CA 91367", lat: 34.1783, lon: -118.6014, retailer: "Walmart" },
      { store_name: "Ralphs", address: "9610 Santa Monica Blvd, Beverly Hills, CA 90210", lat: 34.0695, lon: -118.4019, retailer: "Ralphs" },
      { store_name: "Walmart Neighborhood Market", address: "1827 S Sepulveda Blvd, Los Angeles, CA 90025", lat: 34.0458, lon: -118.4529, retailer: "Walmart" },
      { store_name: "Ralphs", address: "10861 Weyburn Ave, Los Angeles, CA 90024", lat: 34.0611, lon: -118.4456, retailer: "Ralphs" },
      
      // NYC area (10001)
      { store_name: "Walmart", address: "517 E 117th St, New York, NY 10035", lat: 40.7980, lon: -73.9379, retailer: "Walmart" },
      { store_name: "Walmart", address: "2307 Bartow Ave, Bronx, NY 10475", lat: 40.8666, lon: -73.8288, retailer: "Walmart" },
      
      // Chicago area (60601)
      { store_name: "Walmart Supercenter", address: "7535 S Ashland Ave, Chicago, IL 60620", lat: 41.7569, lon: -87.6648, retailer: "Walmart" },
      { store_name: "Walmart", address: "2844 N Broadway, Chicago, IL 60657", lat: 41.9344, lon: -87.6457, retailer: "Walmart" },
      
      // San Francisco area (94102)
      { store_name: "Walmart", address: "1150 El Camino Real, San Bruno, CA 94066", lat: 37.6358, lon: -122.4213, retailer: "Walmart" },
      { store_name: "Ralphs", address: "7905 Van Nuys Blvd, Los Angeles, CA 91402", lat: 34.2186, lon: -118.4490, retailer: "Ralphs" },
      
      // Dallas area (75201)
      { store_name: "Walmart Supercenter", address: "2401 W Wheatland Rd, Dallas, TX 75237", lat: 32.6413, lon: -96.8729, retailer: "Walmart" },
      { store_name: "Walmart Supercenter", address: "8801 S Hampton Rd, Dallas, TX 75232", lat: 32.6752, lon: -96.8643, retailer: "Walmart" },
      
      // Miami area (33101)
      { store_name: "Walmart Supercenter", address: "7450 NW 87th Ave, Miami, FL 33178", lat: 25.8446, lon: -80.3369, retailer: "Walmart" },
      { store_name: "Walmart", address: "10675 Caribbean Blvd, Cutler Bay, FL 33189", lat: 25.5811, lon: -80.3442, retailer: "Walmart" },
      
      // Seattle area (98101)
      { store_name: "Walmart", address: "18305 Alderwood Mall Pkwy, Lynnwood, WA 98037", lat: 47.8304, lon: -122.2713, retailer: "Walmart" },
      { store_name: "Walmart Supercenter", address: "17432 Hwy 99, Lynnwood, WA 98037", lat: 47.8190, lon: -122.2889, retailer: "Walmart" },
      
      // Atlanta area (30303)
      { store_name: "Walmart Supercenter", address: "835 Martin Luther King Jr Dr SW, Atlanta, GA 30310", lat: 33.7465, lon: -84.4122, retailer: "Walmart" },
      { store_name: "Walmart", address: "3580 Marketplace Blvd, East Point, GA 30344", lat: 33.6768, lon: -84.4505, retailer: "Walmart" },
    ];

    // Store each location in KV store with key pattern: store:{index}
    for (let i = 0; i < sampleStores.length; i++) {
      await kv.set(`store:${i}`, sampleStores[i]);
    }
    
    // Store metadata about total count
    await kv.set("store:count", { count: sampleStores.length });
    
    return c.json({ 
      success: true, 
      message: `Initialized ${sampleStores.length} stores`,
      count: sampleStores.length 
    });
  } catch (error) {
    console.error("Error initializing stores:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get stores by ZIP code and radius
app.get("/make-server-26050ec2/stores", async (c) => {
  try {
    const zipCode = c.req.query("zip");
    const radiusStr = c.req.query("radius");
    const retailerFilter = c.req.query("retailer");
    
    if (!zipCode) {
      return c.json({ error: "ZIP code is required" }, 400);
    }
    
    // Get coordinates for ZIP code
    const zipCoords = await getZipCoordinates(zipCode);
    if (!zipCoords) {
      return c.json({ 
        error: `ZIP code ${zipCode} not found. Please enter a valid US ZIP code.` 
      }, 400);
    }
    
    const radius = radiusStr ? parseFloat(radiusStr) : 50; // Default 50 miles
    
    // Get bounding box for optimization
    const bbox = getBoundingBox(zipCoords.lat, zipCoords.lon, radius);
    
    // Retrieve all stores from KV store using BATCH READ for performance
    const storeCountData = await kv.get("store:count") as { count: number } | null;
    if (!storeCountData) {
      return c.json({ error: "Store database not initialized. Call POST /init-stores first." }, 400);
    }
    
    // Build array of keys to fetch in one batch
    const storeKeys = Array.from({ length: storeCountData.count }, (_, i) => `store:${i}`);
    
    // PERFORMANCE FIX: Use mget to fetch all stores in ONE database call instead of 132 sequential calls
    const allStoresRaw = await kv.mget(storeKeys) as (Store | null)[];
    const allStores: Store[] = allStoresRaw.filter((store): store is Store => store !== null);
    
    // Filter by bounding box first (optimization)
    let filteredStores = allStores.filter(store => 
      store.lat >= bbox.minLat &&
      store.lat <= bbox.maxLat &&
      store.lon >= bbox.minLon &&
      store.lon <= bbox.maxLon
    );
    
    // Apply retailer filter if provided
    if (retailerFilter) {
      filteredStores = filteredStores.filter(store => 
        store.retailer.toLowerCase() === retailerFilter.toLowerCase()
      );
    }
    
    // Calculate exact distances using Haversine formula
    const storesWithDistance: StoreWithDistance[] = filteredStores
      .map(store => ({
        ...store,
        distance_miles: calculateDistance(zipCoords.lat, zipCoords.lon, store.lat, store.lon)
      }))
      .filter(store => store.distance_miles <= radius)
      .sort((a, b) => a.distance_miles - b.distance_miles);
    
    // Deduplicate stores by address (safeguard against database duplicates)
    const uniqueStores = new Map<string, StoreWithDistance>();
    for (const store of storesWithDistance) {
      const key = store.address.trim().toLowerCase();
      // Keep the first occurrence (already sorted by distance)
      if (!uniqueStores.has(key)) {
        uniqueStores.set(key, store);
      }
    }
    const deduplicatedStores = Array.from(uniqueStores.values());
    
    return c.json({
      zip_code: zipCode,
      center_location: zipCoords,
      radius_miles: radius,
      total_results: deduplicatedStores.length,
      stores: deduplicatedStores
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add a new store
app.post("/make-server-26050ec2/stores", async (c) => {
  try {
    const body = await c.req.json();
    const { store_name, address, lat, lon, retailer } = body;
    
    if (!store_name || !address || lat === undefined || lon === undefined || !retailer) {
      return c.json({ error: "Missing required fields: store_name, address, lat, lon, retailer" }, 400);
    }
    
    // Get current count
    const storeCountData = await kv.get("store:count") as { count: number } | null;
    const currentCount = storeCountData?.count || 0;
    
    // Add new store
    const newStore: Store = { store_name, address, lat, lon, retailer };
    await kv.set(`store:${currentCount}`, newStore);
    
    // Update count
    await kv.set("store:count", { count: currentCount + 1 });
    
    return c.json({ 
      success: true, 
      message: "Store added successfully",
      store: newStore,
      id: currentCount
    });
  } catch (error) {
    console.error("Error adding store:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Bulk upload stores (much faster!)
app.post("/make-server-26050ec2/stores/bulk", async (c) => {
  try {
    const body = await c.req.json();
    const { stores } = body;
    
    if (!Array.isArray(stores) || stores.length === 0) {
      return c.json({ error: "stores must be a non-empty array" }, 400);
    }
    
    // Validate all stores have required fields
    for (const store of stores) {
      if (!store.store_name || !store.address || store.lat === undefined || store.lon === undefined || !store.retailer) {
        return c.json({ error: "All stores must have: store_name, address, lat, lon, retailer" }, 400);
      }
    }
    
    // Get current count
    const storeCountData = await kv.get("store:count") as { count: number } | null;
    let currentCount = storeCountData?.count || 0;
    
    // Add all stores
    const addedStores: (Store & { id: number })[] = [];
    for (const store of stores) {
      const newStore: Store = {
        store_name: store.store_name,
        address: store.address,
        lat: store.lat,
        lon: store.lon,
        retailer: store.retailer
      };
      await kv.set(`store:${currentCount}`, newStore);
      addedStores.push({ ...newStore, id: currentCount });
      currentCount++;
    }
    
    // Update count
    await kv.set("store:count", { count: currentCount });
    
    return c.json({ 
      success: true, 
      message: `Bulk uploaded ${stores.length} stores successfully`,
      count: stores.length,
      stores: addedStores
    });
  } catch (error) {
    console.error("Error bulk uploading stores:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all retailers
app.get("/make-server-26050ec2/retailers", async (c) => {
  try {
    const storeCountData = await kv.get("store:count") as { count: number } | null;
    if (!storeCountData) {
      return c.json({ retailers: [] });
    }
    
    // PERFORMANCE FIX: Use mget to fetch all stores in one batch
    const storeKeys = Array.from({ length: storeCountData.count }, (_, i) => `store:${i}`);
    const allStoresRaw = await kv.mget(storeKeys) as (Store | null)[];
    
    const retailers = new Set<string>();
    for (const store of allStoresRaw) {
      if (store) {
        retailers.add(store.retailer);
      }
    }
    
    return c.json({ retailers: Array.from(retailers).sort() });
  } catch (error) {
    console.error("Error fetching retailers:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get supported ZIP codes (now supports ALL US ZIP codes via API)
app.get("/make-server-26050ec2/supported-zips", (c) => {
  return c.json({
    message: "All US ZIP codes are now supported via Zippopotam.us API",
    coverage: "42,000+ US ZIP codes",
    api: "https://api.zippopotam.us/us/{zip}",
    caching: "ZIP coordinates cached after first lookup for faster subsequent queries",
    note: "Simply enter any valid 5-digit US ZIP code in the search"
  });
});

// Get all stores (for management/cleanup scripts)
app.get("/make-server-26050ec2/stores/all", async (c) => {
  try {
    const storeCountData = await kv.get("store:count") as { count: number } | null;
    if (!storeCountData || storeCountData.count === 0) {
      return c.json({ total: 0, stores: [] });
    }

    // PERFORMANCE FIX: Use mget to fetch all stores in one batch
    const storeKeys = Array.from({ length: storeCountData.count }, (_, i) => `store:${i}`);
    const allStoresRaw = await kv.mget(storeKeys) as (Store | null)[];
    
    const allStores: (Store & { id: number })[] = [];
    allStoresRaw.forEach((store, index) => {
      if (store) {
        allStores.push({ ...store, id: index });
      }
    });

    return c.json({ total: allStores.length, stores: allStores });
  } catch (error) {
    console.error("Error fetching all stores:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete a specific store by ID
app.delete("/make-server-26050ec2/stores/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    
    if (isNaN(id)) {
      return c.json({ error: "Invalid store ID" }, 400);
    }

    // Delete the store
    await kv.del(`store:${id}`);

    return c.json({
      success: true,
      message: `Store ${id} deleted successfully`
    });
  } catch (error) {
    console.error("Error deleting store:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Clear all stores (reset database)
app.delete("/make-server-26050ec2/stores", async (c) => {
  try {
    const storeCountData = await kv.get("store:count") as { count: number } | null;
    if (!storeCountData || storeCountData.count === 0) {
      return c.json({
        success: true,
        message: "Database is already empty",
        deleted: 0
      });
    }

    const count = storeCountData.count;
    
    // Delete all stores
    for (let i = 0; i < count; i++) {
      await kv.del(`store:${i}`);
    }
    
    // Reset count
    await kv.set("store:count", { count: 0 });

    return c.json({
      success: true,
      message: `Cleared all stores from database`,
      deleted: count
    });
  } catch (error) {
    console.error("Error clearing stores:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
