-- =====================================================
-- Store Location Engine - Database Schema
-- =====================================================
-- This schema defines the database structure for the
-- Store Location & Distance Engine internship project
-- =====================================================

-- =====================================================
-- 1. KEY-VALUE STORE TABLE (Current Implementation)
-- =====================================================

-- Main KV store table for storing stores and cache data
CREATE TABLE IF NOT EXISTS kv_store_26050ec2 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups by key prefix (e.g., "store:", "zip:")
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix 
ON kv_store_26050ec2 (key text_pattern_ops);

-- Index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_kv_store_created_at 
ON kv_store_26050ec2 (created_at);

-- =====================================================
-- 2. SAMPLE DATA STRUCTURE (JSON in KV Store)
-- =====================================================

-- Store entry example:
-- Key: "store:0"
-- Value:
-- {
--   "store_name": "Walmart Supercenter",
--   "address": "5500 Canoga Ave, Woodland Hills, CA 91367",
--   "lat": 34.1783,
--   "lon": -118.6014,
--   "retailer": "Walmart"
-- }

-- ZIP code cache example:
-- Key: "zip:90210"
-- Value:
-- {
--   "lat": 34.0901,
--   "lon": -118.4065,
--   "city": "Beverly Hills",
--   "state": "CA"
-- }

-- Store count metadata:
-- Key: "store:count"
-- Value:
-- {
--   "count": 18
-- }

-- =====================================================
-- 3. FUTURE ENHANCEMENT: PostGIS-Enabled Schema
-- =====================================================
-- This schema would be used when scaling to 10,000+ stores
-- for better performance with spatial queries

-- Enable PostGIS extension (requires superuser privileges)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Stores table with spatial indexing
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  store_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326), -- Spatial column (lat/lon)
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  retailer VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  hours JSONB, -- Store hours in JSON format
  amenities TEXT[], -- Array of amenities (e.g., pharmacy, grocery)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Spatial index for fast geographic queries
CREATE INDEX IF NOT EXISTS idx_stores_location 
ON stores USING GIST(location);

-- Index for retailer filtering
CREATE INDEX IF NOT EXISTS idx_stores_retailer 
ON stores(retailer);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_stores_retailer_location 
ON stores(retailer, location);

-- =====================================================
-- 4. ZIP CODE CACHE TABLE (Future Enhancement)
-- =====================================================

-- Persistent cache for ZIP code geocoding
CREATE TABLE IF NOT EXISTS zip_codes (
  zip_code VARCHAR(5) PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  city VARCHAR(255),
  state VARCHAR(2),
  county VARCHAR(255),
  location GEOGRAPHY(POINT, 4326),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Spatial index for ZIP code locations
CREATE INDEX IF NOT EXISTS idx_zip_codes_location 
ON zip_codes USING GIST(location);

-- Index for state-based queries
CREATE INDEX IF NOT EXISTS idx_zip_codes_state 
ON zip_codes(state);

-- =====================================================
-- 5. RETAILERS TABLE (Future Enhancement)
-- =====================================================

CREATE TABLE IF NOT EXISTS retailers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 6. SEARCH ANALYTICS TABLE (Future Enhancement)
-- =====================================================

-- Track search queries for optimization
CREATE TABLE IF NOT EXISTS search_analytics (
  id SERIAL PRIMARY KEY,
  zip_code VARCHAR(5),
  radius_miles INTEGER,
  retailer VARCHAR(100),
  results_count INTEGER,
  search_time_ms INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_zip 
ON search_analytics(zip_code);

CREATE INDEX IF NOT EXISTS idx_analytics_timestamp 
ON search_analytics(timestamp);

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate distance using PostGIS
-- (Alternative to Haversine implementation in application code)
CREATE OR REPLACE FUNCTION get_stores_within_radius(
  p_lat DOUBLE PRECISION,
  p_lon DOUBLE PRECISION,
  p_radius_miles DOUBLE PRECISION,
  p_retailer VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  store_name VARCHAR,
  address TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  retailer VARCHAR,
  distance_miles DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.store_name,
    s.address,
    s.lat,
    s.lon,
    s.retailer,
    ST_Distance(
      s.location,
      ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography
    ) / 1609.34 AS distance_miles -- Convert meters to miles
  FROM stores s
  WHERE 
    ST_DWithin(
      s.location,
      ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography,
      p_radius_miles * 1609.34 -- Convert miles to meters
    )
    AND (p_retailer IS NULL OR s.retailer = p_retailer)
  ORDER BY distance_miles;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for KV store
CREATE TRIGGER update_kv_store_updated_at
  BEFORE UPDATE ON kv_store_26050ec2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for stores table (when implemented)
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample retailers
INSERT INTO retailers (name, description) VALUES
  ('Walmart', 'Major retail chain with groceries and general merchandise'),
  ('Ralphs', 'Southern California grocery store chain')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 10. PERFORMANCE NOTES
-- =====================================================

-- Current KV Store Approach:
-- ✓ Simple to implement
-- ✓ Works well for < 1,000 stores
-- ✓ No PostGIS dependency
-- ✗ Requires full table scan for searches
-- ✗ Haversine calculated in application code

-- Future PostGIS Approach:
-- ✓ Optimized spatial queries (GIST index)
-- ✓ Database-level distance calculations
-- ✓ Scales to 100,000+ stores
-- ✓ Supports advanced geospatial operations
-- ✗ Requires PostGIS extension
-- ✗ More complex schema

-- Migration Strategy:
-- 1. Deploy PostGIS schema alongside KV store
-- 2. Dual-write to both systems
-- 3. Test performance benchmarks
-- 4. Gradually migrate reads to PostGIS
-- 5. Deprecate KV store approach

-- =====================================================
-- 11. SECURITY & ROW-LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on tables (if using Supabase)
ALTER TABLE kv_store_26050ec2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (stores are public data)
CREATE POLICY "Allow public read access on kv_store" 
ON kv_store_26050ec2
FOR SELECT
TO public
USING (true);

-- Policy: Restrict write access to authenticated service role only
CREATE POLICY "Allow service role write access on kv_store" 
ON kv_store_26050ec2
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Similar policies for stores table
CREATE POLICY "Allow public read access on stores" 
ON stores
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow service role write access on stores" 
ON stores
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 12. MAINTENANCE & OPTIMIZATION
-- =====================================================

-- Analyze tables for query optimization
ANALYZE kv_store_26050ec2;
ANALYZE stores;
ANALYZE zip_codes;

-- Vacuum to reclaim storage
VACUUM ANALYZE kv_store_26050ec2;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
