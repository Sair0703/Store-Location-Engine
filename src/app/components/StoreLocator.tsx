import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MapPin, Navigation, Store, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Store {
  store_name: string;
  address: string;
  lat: number;
  lon: number;
  retailer: string;
  distance_miles: number;
}

interface SearchResult {
  zip_code: string;
  center_location: { lat: number; lon: number };
  radius_miles: number;
  total_results: number;
  stores: Store[];
}

export function StoreLocator() {
  const [zipCode, setZipCode] = useState('90210');
  const [radius, setRadius] = useState('10');
  const [retailer, setRetailer] = useState('all');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [retailers, setRetailers] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  useEffect(() => {
    loadRetailers();
  }, []);

  const loadRetailers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-26050ec2/retailers`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setRetailers(data.retailers);
      }
    } catch (error) {
      console.error('Error loading retailers:', error);
    }
  };

  const searchStores = async () => {
    setIsSearching(true);
    const startTime = performance.now();
    
    try {
      const params = new URLSearchParams({
        zip: zipCode,
        radius: radius,
      });

      if (retailer !== 'all') {
        params.append('retailer', retailer);
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-26050ec2/stores?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const endTime = performance.now();
      setSearchTime(endTime - startTime);

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Search failed');
        console.error('Search error:', error);
        setResults(null);
        return;
      }

      const data = await response.json();
      setResults(data);
      
      if (data.total_results === 0) {
        toast.info('No stores found in this area. Try increasing the radius.');
      } else {
        toast.success(`Found ${data.total_results} stores in ${Math.round(endTime - startTime)}ms`);
      }
    } catch (error) {
      console.error('Error searching stores:', error);
      toast.error('Failed to search stores');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Find Stores Near You</CardTitle>
          <CardDescription>
            Enter any US ZIP code to search for nearby stores using the Haversine distance formula
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>
              <Input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="90210"
                maxLength={5}
              />
              <p className="text-xs text-gray-500 mt-1">
                Any US ZIP code supported
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Radius (miles)
              </label>
              <Input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                min="1"
                max="100"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retailer
              </label>
              <Select value={retailer} onValueChange={setRetailer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Retailers</SelectItem>
                  {retailers.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={searchStores}
                disabled={isSearching}
                className="w-full"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          {searchTime !== null && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
              <Clock className="w-4 h-4" />
              Search completed in {Math.round(searchTime)}ms
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>
              {results.total_results} {results.total_results === 1 ? 'Store' : 'Stores'} Found
            </CardTitle>
            <CardDescription>
              Within {results.radius_miles} miles of ZIP {results.zip_code}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.stores.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No stores found in this area</p>
                <p className="text-sm mt-2">Try increasing the search radius</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.stores.map((store, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Store className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {store.store_name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {store.address}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {store.retailer}
                            </span>
                            <span className="text-xs text-gray-500">
                              {store.lat.toFixed(4)}, {store.lon.toFixed(4)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-2xl font-bold text-indigo-600">
                            {store.distance_miles}
                          </div>
                          <div className="text-xs text-gray-500">miles</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}