
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Loader2, Navigation, Building, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: string[];
  type: string;
  importance: number;
  place_id: string;
}

interface SearchBarProps {
  onLocationSelect: (lat: number, lng: number, name: string, boundingBox?: number[]) => void;
}

export const SearchBar = ({ onLocationSelect }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState('all');
  const { toast } = useToast();

  const getSearchIcon = (type: string) => {
    if (type.includes('building') || type.includes('house')) return Building;
    if (type.includes('administrative')) return Globe;
    return MapPin;
  };

  const searchLocation = async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    if (!queryToSearch.trim()) return;

    setIsLoading(true);
    try {
      // Enhanced search with multiple parameters
      const searchParams = new URLSearchParams({
        format: 'json',
        q: queryToSearch,
        limit: '10',
        addressdetails: '1',
        extratags: '1',
        namedetails: '1',
        dedupe: '1'
      });

      // Add type filter if specified
      if (searchType !== 'all') {
        searchParams.append('class', searchType);
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: SearchResult[] = await response.json();
      
      // Sort by importance/relevance
      const sortedResults = data.sort((a, b) => (b.importance || 0) - (a.importance || 0));
      
      setResults(sortedResults);
      setShowResults(sortedResults.length > 0);
      
      if (sortedResults.length === 0) {
        toast({
          title: "No Results",
          description: "No locations found. Try a different search term.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for locations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const boundingBox = result.boundingbox ? result.boundingbox.map(Number) : undefined;
    
    onLocationSelect(lat, lng, result.display_name, boundingBox);
    setShowResults(false);
    setQuery('');
    
    toast({
      title: "Location Found",
      description: `Navigating to ${result.display_name}`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchLocation();
    }
  };

  const quickSearches = [
    { label: 'Current Location', action: () => getCurrentLocation() },
    { label: 'Buildings', type: 'building' },
    { label: 'Cities', type: 'place' },
    { label: 'Roads', type: 'highway' },
  ];

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationSelect(latitude, longitude, "Your Location");
        setIsLoading(false);
        toast({
          title: "Location Found",
          description: "Showing your current location",
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLoading(false);
        toast({
          title: "Location Error",
          description: "Could not get your location. Please search manually.",
          variant: "destructive"
        });
      }
    );
  };

  return (
    <div className="relative">
      <Card className="p-3">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search places, addresses, coordinates..."
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={() => searchLocation()}
              disabled={isLoading || !query.trim()}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex gap-1 flex-wrap">
            {quickSearches.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-6"
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.type) {
                    setSearchType(item.type);
                    if (query) searchLocation();
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            {results.map((result, index) => {
              const IconComponent = getSearchIcon(result.type);
              return (
                <div
                  key={`${result.place_id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="flex items-start gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded text-sm border-b last:border-b-0"
                >
                  <IconComponent className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-gray-700 leading-tight block">
                      {result.display_name}
                    </span>
                    {result.type && (
                      <span className="text-xs text-gray-500 capitalize">
                        {result.type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
