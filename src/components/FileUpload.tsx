
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileType, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onShapefileLoad: (geoJSON: any, filename: string) => void;
}

export const FileUpload = ({ onShapefileLoad }: FileUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.geojson') && !fileName.endsWith('.json')) {
      toast({
        title: "Unsupported File",
        description: "Please upload a GeoJSON file (.geojson or .json)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const text = await file.text();
      const geoJSON = JSON.parse(text);
      
      // Basic validation
      if (!geoJSON.type || (geoJSON.type !== 'FeatureCollection' && geoJSON.type !== 'Feature')) {
        throw new Error('Invalid GeoJSON format');
      }

      onShapefileLoad(geoJSON, file.name);
      
      toast({
        title: "File Loaded",
        description: `Successfully loaded ${file.name}`,
      });
    } catch (error) {
      console.error('Error loading file:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load the file. Please check the format.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileType className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-sm">Load Shapefile</span>
        </div>
        
        <div className="relative">
          <Input
            type="file"
            accept=".geojson,.json"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {isLoading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500">
          Supports GeoJSON files (.geojson, .json)
        </p>
      </div>
    </Card>
  );
};
