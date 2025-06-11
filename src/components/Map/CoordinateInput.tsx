import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CoordinateInputProps {
  onBufferCreate: (center: [number, number], radius: number) => void;
}

export const CoordinateInput: React.FC<CoordinateInputProps> = ({ onBufferCreate }) => {
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [bufferRadius, setBufferRadius] = useState<string>('1000'); // Default 1km
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = parseFloat(bufferRadius);

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid coordinates and radius values.",
        variant: "destructive"
      });
      return;
    }

    if (lat < -90 || lat > 90) {
      toast({
        title: "Invalid Latitude",
        description: "Latitude must be between -90 and 90 degrees.",
        variant: "destructive"
      });
      return;
    }

    if (lng < -180 || lng > 180) {
      toast({
        title: "Invalid Longitude",
        description: "Longitude must be between -180 and 180 degrees.",
        variant: "destructive"
      });
      return;
    }

    onBufferCreate([lat, lng], radius);
    toast({
      title: "Buffer Created",
      description: `Buffer created at coordinates (${lat}, ${lng}) with radius ${radius}m`,
    });
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-sm">Coordinate Input</span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Enter latitude"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Enter longitude"
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bufferRadius">Buffer Radius (meters)</Label>
            <Input
              id="bufferRadius"
              type="number"
              value={bufferRadius}
              onChange={(e) => setBufferRadius(e.target.value)}
              placeholder="Enter buffer radius"
              className="w-full"
            />
          </div>
          
          <Button type="submit" className="w-full">
            <Navigation className="h-4 w-4 mr-2" />
            Create Buffer
          </Button>
        </form>
      </div>
    </Card>
  );
}; 