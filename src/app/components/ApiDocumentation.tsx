import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Code, Database, Zap, DollarSign } from 'lucide-react';

export function ApiDocumentation() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            API Endpoints
          </CardTitle>
          <CardDescription>
            RESTful API for store location queries without expensive third-party services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* GET /stores endpoint */}
          <div className="border-l-4 border-indigo-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-mono rounded">
                GET
              </span>
              <code className="text-sm font-mono">/stores</code>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Search for stores by ZIP code and radius
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold mb-2">Query Parameters:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">zip</code>
                    <span className="text-gray-600">
                      (required) ZIP code to search from
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">radius</code>
                    <span className="text-gray-600">
                      (optional) Search radius in miles (default: 50)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">retailer</code>
                    <span className="text-gray-600">
                      (optional) Filter by retailer name
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Example Request:</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`GET /stores?zip=90210&radius=10&retailer=Walmart`}
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Example Response:</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "zip_code": "90210",
  "center_location": {
    "lat": 34.0901,
    "lon": -118.4065
  },
  "radius_miles": 10,
  "total_results": 2,
  "stores": [
    {
      "store_name": "Walmart Neighborhood Market",
      "address": "1827 S Sepulveda Blvd, Los Angeles, CA",
      "lat": 34.0458,
      "lon": -118.4529,
      "retailer": "Walmart",
      "distance_miles": 3.47
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* POST /stores endpoint */}
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                POST
              </span>
              <code className="text-sm font-mono">/stores</code>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Add a new store location
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold mb-2">Request Body:</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "store_name": "Walmart Supercenter",
  "address": "123 Main St, City, ST 12345",
  "lat": 34.0522,
  "lon": -118.2437,
  "retailer": "Walmart"
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* GET /retailers endpoint */}
          <div className="border-l-4 border-purple-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-mono rounded">
                GET
              </span>
              <code className="text-sm font-mono">/retailers</code>
            </div>
            <p className="text-sm text-gray-600">
              Get list of all available retailers
            </p>
          </div>

          {/* GET /supported-zips endpoint */}
          <div className="border-l-4 border-orange-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-mono rounded">
                GET
              </span>
              <code className="text-sm font-mono">/supported-zips</code>
            </div>
            <p className="text-sm text-gray-600">
              Get list of supported ZIP codes with coordinates
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Store Schema</h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-xs">store_name</code>
                    <span className="text-gray-500">string</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-xs">address</code>
                    <span className="text-gray-500">string</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-xs">lat</code>
                    <span className="text-gray-500">number</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-xs">lon</code>
                    <span className="text-gray-500">number</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-xs">retailer</code>
                    <span className="text-gray-500">string</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Scaling to 20+ Retailers</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Use indexed <code className="bg-gray-100 px-1 rounded">retailer</code> field</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Partition data by geographic region</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Implement batch import endpoints</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Add metadata table for retailer info</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Distance Algorithm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Haversine Formula</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Calculates great-circle distance between two points on Earth
                </p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`function haversine(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth radius (miles)
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    sin(dLat/2) * sin(dLat/2) +
    cos(lat1) * cos(lat2) *
    sin(dLon/2) * sin(dLon/2);
  
  const c = 2 * atan2(√a, √(1-a));
  return R * c;
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Accuracy</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>±0.5% accuracy for distances under 100 miles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>No API costs or rate limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Sub-millisecond computation time</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Scale & Cost Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ingestion" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ingestion">Data Ingestion</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="scaling">Scaling</TabsTrigger>
            </TabsList>

            <TabsContent value="ingestion" className="space-y-4 mt-4">
              <h4 className="font-semibold">How to Ingest Store Locations Cheaply</h4>
              <div className="space-y-3 text-sm">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">1. Retailer Data Sources</h5>
                  <ul className="space-y-1 text-gray-700">
                    <li>• <strong>Public APIs:</strong> Many retailers offer store locator APIs (Walmart, Target)</li>
                    <li>• <strong>Store Locator Pages:</strong> Parse JSON from retailer websites</li>
                    <li>• <strong>Bulk Downloads:</strong> Some chains provide CSV/JSON exports</li>
                    <li>• <strong>Open Data:</strong> Government datasets (permits, licenses)</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">2. Geocoding Strategy</h5>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Use free tier of geocoding services (Nominatim, Photon)</li>
                    <li>• Batch geocode during off-hours to avoid rate limits</li>
                    <li>• Cache geocoded results permanently</li>
                    <li>• For new addresses: lazy geocode on-demand</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">3. Initial Load</h5>
                  <ul className="space-y-1 text-gray-700">
                    <li>• One-time bulk import via batch endpoint</li>
                    <li>• Validate coordinates before insertion</li>
                    <li>• Deduplicate by address + retailer</li>
                    <li>• Cost: ~$0 using free tiers + manual data collection</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="updates" className="space-y-4 mt-4">
              <h4 className="font-semibold">How to Update Without Constant Scraping</h4>
              <div className="space-y-3 text-sm">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Weekly/Monthly Updates</h5>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Most store locations change infrequently (monthly at most)</li>
                    <li>• Schedule automated checks weekly or monthly</li>
                    <li>• Compare checksums to detect changes</li>
                    <li>• Only re-fetch when changes detected</li>
                  </ul>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Change Detection</h5>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Track store count per retailer</li>
                    <li>• Monitor for new store openings via news/press releases</li>
                    <li>• User-submitted updates (with verification)</li>
                    <li>• Differential updates: only sync changes</li>
                  </ul>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Incremental Strategy</h5>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Store last_updated timestamp per location</li>
                    <li>• Mark stale records for re-verification</li>
                    <li>• Crowd-sourced corrections from users</li>
                    <li>• Cost: ~$0-5/month for scheduled jobs</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 mt-4">
              <h4 className="font-semibold">How to Compute Distances at Scale</h4>
              <div className="space-y-3 text-sm">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">1. Bounding Box Filtering</h5>
                  <p className="text-gray-700 mb-2">
                    Pre-filter stores using rectangular bounds before Haversine calculation:
                  </p>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Calculate min/max lat/lon for radius</li>
                    <li>• Filter: ~90% reduction in candidates</li>
                    <li>• Then apply exact Haversine on remaining stores</li>
                    <li>• Performance: O(n) → O(n/10) typically</li>
                  </ul>
                </div>

                <div className="bg-teal-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">2. Spatial Indexing (Production)</h5>
                  <p className="text-gray-700 mb-2">
                    For production scale with PostGIS or similar:
                  </p>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Use R-tree or Quad-tree spatial indexes</li>
                    <li>• ST_DWithin() for radius queries</li>
                    <li>• Grid-based partitioning for large datasets</li>
                    <li>• Performance: O(log n) lookups</li>
                  </ul>
                </div>

                <div className="bg-cyan-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">3. Caching Strategy</h5>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Cache results by (ZIP, radius, retailer) key</li>
                    <li>• TTL: 1 hour (store data rarely changes)</li>
                    <li>• Popular ZIPs cached in Redis/memory</li>
                    <li>• ~95% cache hit rate for common searches</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scaling" className="space-y-4 mt-4">
              <h4 className="font-semibold">Handling 5,000 Users Efficiently</h4>
              <div className="space-y-3 text-sm">
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Performance Targets</h5>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Query latency: &lt;100ms (p95)</li>
                    <li>• Throughput: 100+ queries/second</li>
                    <li>• Database: 10,000+ stores (all major retailers)</li>
                    <li>• Concurrent users: 5,000+</li>
                  </ul>
                </div>

                <div className="bg-lime-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Architecture</h5>
                  <ul className="space-y-1 text-gray-700">
                    <li>• <strong>Database:</strong> PostgreSQL with PostGIS extension</li>
                    <li>• <strong>Cache Layer:</strong> Redis for hot ZIP codes</li>
                    <li>• <strong>API Server:</strong> Stateless, horizontally scalable</li>
                    <li>• <strong>CDN:</strong> Cache static ZIP → coordinate mappings</li>
                  </ul>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Cost Breakdown (AWS/GCP)</h5>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Database: $25/month (managed PostgreSQL)</li>
                    <li>• Cache: $15/month (Redis 1GB)</li>
                    <li>• Compute: $30/month (2x small instances)</li>
                    <li>• <strong>Total: ~$70/month vs $500+/month for Google Maps</strong></li>
                  </ul>
                </div>

                <div className="bg-rose-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Optimization Wins</h5>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Bounding box: 10x faster queries</li>
                    <li>• Spatial index: 50x faster than full scan</li>
                    <li>• Caching: 100x reduction in DB load</li>
                    <li>• Combined: Handle 5,000 users on $70/month infrastructure</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
