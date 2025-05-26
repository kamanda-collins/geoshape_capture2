
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: string[];
}

interface SearchBarProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
}

export const SearchBar = ({ onLocationSelect }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const searchLocation = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: SearchResult[] = await response.json();
      setResults(data);
      setShowResults(data.length > 0);
      
      if (data.length === 0) {
        toast({
          title: "No Results",
          description: "No locations found for your search.",
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
    onLocationSelect(lat, lng, result.display_name);
    setShowResults(false);
    setQuery('');
    
    toast({
      title: "Location Found",
      description: `Navigated to ${result.display_name}`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchLocation();
    }
  };

  return (
    <div className="relative">
      <Card className="p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for a location..."
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <Button 
            onClick={searchLocation}
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
      </Card>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto">
          <div className="p-2">
            {results.map((result, index) => (
              <div
                key={index}
                onClick={() => handleResultClick(result)}
                className="flex items-start gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded text-sm border-b last:border-b-0"
              >
                <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 leading-tight">
                  {result.display_name}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
