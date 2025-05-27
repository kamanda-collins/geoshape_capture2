
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, MapPin, FileText, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MapCreatorProps {
  currentShape?: any;
  searchLocation?: { lat: number; lng: number; name: string };
  onClearShape?: () => void;
}

export const MapCreator: React.FC<MapCreatorProps> = ({ 
  currentShape, 
  searchLocation,
  onClearShape 
}) => {
  const [mapTitle, setMapTitle] = useState('');
  const [mapDescription, setMapDescription] = useState('');
  const { toast } = useToast();

  const handleExportMap = (format: 'pdf' | 'png' | 'geojson') => {
    if (!currentShape) {
      toast({
        title: "No shape drawn",
        description: "Please draw a shape on the map first.",
        variant: "destructive"
      });
      return;
    }

    // This would trigger the actual export functionality
    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: `Your map "${mapTitle || 'Untitled Map'}" is being prepared for download.`,
    });

    // Simulate download
    setTimeout(() => {
      const blob = new Blob([JSON.stringify(currentShape, null, 2)], { 
        type: format === 'geojson' ? 'application/json' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mapTitle || 'map'}.${format === 'geojson' ? 'geojson' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const getAreaInfo = () => {
    if (!currentShape) return null;
    
    // Calculate approximate area (this is simplified)
    if (currentShape.geometry.type === 'Polygon') {
      return "Area drawn - ready for export";
    }
    return "Shape drawn - ready for export";
  };

  return (
    <div className="space-y-4">
      {/* Map Information */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-blue-500" />
          <h3 className="font-medium text-sm">Map Details</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Map Title</Label>
            <Input
              value={mapTitle}
              onChange={(e) => setMapTitle(e.target.value)}
              placeholder="Enter map title"
              className="h-8"
            />
          </div>
          
          <div>
            <Label className="text-xs">Description (Optional)</Label>
            <Textarea
              value={mapDescription}
              onChange={(e) => setMapDescription(e.target.value)}
              placeholder="Describe your map area"
              className="h-16 text-xs"
            />
          </div>

          {searchLocation && (
            <div className="text-xs text-gray-600 p-2 bg-blue-50 rounded">
              <strong>Location:</strong> {searchLocation.name}
            </div>
          )}

          {currentShape && (
            <div className="text-xs text-green-600 p-2 bg-green-50 rounded">
              <strong>Status:</strong> {getAreaInfo()}
            </div>
          )}
        </div>
      </Card>

      {/* Export Options */}
      <Card className="p-4">
        <h3 className="font-medium text-sm mb-3">Export Your Map</h3>
        
        <div className="space-y-2">
          <Button
            onClick={() => handleExportMap('pdf')}
            disabled={!currentShape}
            className="w-full h-8 text-xs"
            variant="outline"
          >
            <FileText className="h-3 w-3 mr-2" />
            Export as PDF Map
          </Button>
          
          <Button
            onClick={() => handleExportMap('png')}
            disabled={!currentShape}
            className="w-full h-8 text-xs"
            variant="outline"
          >
            <Download className="h-3 w-3 mr-2" />
            Export as Image
          </Button>
          
          <Button
            onClick={() => handleExportMap('geojson')}
            disabled={!currentShape}
            className="w-full h-8 text-xs"
            variant="outline"
          >
            <Share2 className="h-3 w-3 mr-2" />
            Export as GeoJSON
          </Button>
        </div>

        {!currentShape && (
          <p className="text-xs text-gray-500 mt-2">
            Draw a shape on the map to enable export options
          </p>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-4">
        <h3 className="font-medium text-sm mb-2">How to Create Your Map</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p>1. Search for a location to center your map</p>
          <p>2. Use the drawing tools to outline your area</p>
          <p>3. Add a title and description</p>
          <p>4. Export as PDF, image, or GeoJSON file</p>
        </div>
      </Card>

      {currentShape && onClearShape && (
        <Button
          onClick={onClearShape}
          variant="destructive"
          size="sm"
          className="w-full"
        >
          Clear Shape & Start Over
        </Button>
      )}
    </div>
  );
};
