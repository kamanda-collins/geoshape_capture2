import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapControls } from '@/components/MapControls';
import { ShapesList } from '@/components/ShapesList';
import { SearchBar } from '@/components/SearchBar';

declare global {
  interface Window {
    L: any;
    jsPDF: any;
    saveAs: any;
    supabase: any;
  }
}

const Index = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawnItemsRef = useRef<any>(null);
  const drawControlRef = useRef<any>(null);
  const [shapeName, setShapeName] = useState('');
  const [savedShapes, setSavedShapes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Supabase configuration (you'll need to connect to Supabase)
  const SUPABASE_URL = 'your-supabase-url';
  const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = window.L.map(mapRef.current).setView([40.7128, -74.0060], 10);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize drawn items layer
    const drawnItems = new window.L.FeatureGroup();
    drawnItemsRef.current = drawnItems;
    map.addLayer(drawnItems);

    // Initialize draw control
    const drawControl = new window.L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        remove: true
      },
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Shape edges cannot cross!'
          },
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#93c5fd',
            fillOpacity: 0.3
          }
        },
        rectangle: {
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#93c5fd',
            fillOpacity: 0.3
          }
        },
        circle: {
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#93c5fd',
            fillOpacity: 0.3
          }
        },
        marker: true,
        polyline: false,
        circlemarker: false
      }
    });
    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    // Handle drawing events
    map.on(window.L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);
      
      toast({
        title: "Shape Created",
        description: "Your shape has been drawn successfully. Give it a name and save it!",
      });
    });

    map.on(window.L.Draw.Event.EDITED, () => {
      toast({
        title: "Shape Edited",
        description: "Your changes have been applied.",
      });
    });

    map.on(window.L.Draw.Event.DELETED, () => {
      toast({
        title: "Shape Deleted",
        description: "Selected shapes have been removed.",
      });
    });

    // Load saved shapes on component mount
    loadSavedShapes();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const initializeSupabase = () => {
    if (!window.supabase) {
      console.warn('Supabase not initialized. Please connect to Supabase first.');
      return null;
    }
    
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  };

  const saveShape = async () => {
    if (!shapeName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your shape.",
        variant: "destructive"
      });
      return;
    }

    const layers = drawnItemsRef.current.getLayers();
    if (layers.length === 0) {
      toast({
        title: "No Shape to Save",
        description: "Please draw a shape before saving.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const supabase = initializeSupabase();
      if (!supabase) {
        toast({
          title: "Supabase Not Connected",
          description: "Please connect to Supabase to save shapes.",
          variant: "destructive"
        });
        return;
      }

      // Get the last drawn layer
      const layer = layers[layers.length - 1];
      const geoJSON = layer.toGeoJSON();

      const { error } = await supabase
        .from('features')
        .insert({
          name: shapeName,
          geo: JSON.stringify(geoJSON),
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Shape Saved",
        description: `"${shapeName}" has been saved successfully!`,
      });

      setShapeName('');
      loadSavedShapes();
    } catch (error) {
      console.error('Error saving shape:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the shape. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedShapes = async () => {
    try {
      const supabase = initializeSupabase();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      setSavedShapes(data || []);

      // Add shapes to map
      if (mapInstanceRef.current && data) {
        data.forEach((shape: any, index: number) => {
          try {
            const geoJSON = JSON.parse(shape.geo);
            const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
            const color = colors[index % colors.length];
            
            const layer = window.L.geoJSON(geoJSON, {
              style: {
                color: color,
                fillColor: color,
                fillOpacity: 0.3,
                weight: 2
              }
            });
            
            layer.bindPopup(`<strong>${shape.name}</strong><br>Saved: ${new Date(shape.timestamp).toLocaleDateString()}`);
            layer.addTo(mapInstanceRef.current);
          } catch (e) {
            console.error('Error parsing GeoJSON:', e);
          }
        });
      }
    } catch (error) {
      console.error('Error loading shapes:', error);
    }
  };

  const downloadGeoJSON = () => {
    const layers = drawnItemsRef.current.getLayers();
    if (layers.length === 0) {
      toast({
        title: "No Shape to Download",
        description: "Please draw a shape before downloading.",
        variant: "destructive"
      });
      return;
    }

    const geoJSON = {
      type: "FeatureCollection",
      features: layers.map((layer: any) => layer.toGeoJSON())
    };

    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    window.saveAs(blob, `shapes-${Date.now()}.geojson`);

    toast({
      title: "Download Started",
      description: "Your GeoJSON file is being downloaded.",
    });
  };

  const downloadPDF = () => {
    const layers = drawnItemsRef.current.getLayers();
    if (layers.length === 0) {
      toast({
        title: "No Shape to Download",
        description: "Please draw a shape before downloading.",
        variant: "destructive"
      });
      return;
    }

    const { jsPDF } = window.jsPDF;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Shape Report', 20, 30);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);

    let yPosition = 60;

    layers.forEach((layer: any, index: number) => {
      const geoJSON = layer.toGeoJSON();
      
      doc.setFontSize(14);
      doc.text(`Shape ${index + 1}`, 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.text(`Type: ${geoJSON.geometry.type}`, 20, yPosition);
      yPosition += 8;
      
      if (geoJSON.geometry.type === 'Polygon') {
        const coordinates = geoJSON.geometry.coordinates[0];
        doc.text(`Vertices: ${coordinates.length}`, 20, yPosition);
        yPosition += 8;
        
        // Calculate approximate area (simplified)
        doc.text('Coordinates:', 20, yPosition);
        yPosition += 6;
        
        coordinates.slice(0, 5).forEach((coord: number[]) => {
          doc.text(`  [${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}]`, 25, yPosition);
          yPosition += 5;
        });
        
        if (coordinates.length > 5) {
          doc.text(`  ... and ${coordinates.length - 5} more vertices`, 25, yPosition);
          yPosition += 5;
        }
      }
      
      yPosition += 10;
    });

    doc.save(`shape-report-${Date.now()}.pdf`);

    toast({
      title: "Download Started",
      description: "Your PDF report is being downloaded.",
    });
  };

  const clearMap = () => {
    drawnItemsRef.current.clearLayers();
    toast({
      title: "Map Cleared",
      description: "All drawn shapes have been cleared.",
    });
  };

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 13);
      
      // Add a temporary marker to show the searched location
      const marker = window.L.marker([lat, lng])
        .addTo(mapInstanceRef.current)
        .bindPopup(`<strong>Search Result</strong><br>${name}`)
        .openPopup();

      // Remove the marker after 5 seconds
      setTimeout(() => {
        marker.remove();
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">GeoShape Capture Portal</h1>
          <p className="text-lg text-gray-600">Draw, save, and manage geographic shapes with ease</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              <SearchBar onLocationSelect={handleLocationSelect} />
              <Card className="p-4 h-[600px]">
                <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200" />
              </Card>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <MapControls
              shapeName={shapeName}
              setShapeName={setShapeName}
              onSaveShape={saveShape}
              onDownloadGeoJSON={downloadGeoJSON}
              onDownloadPDF={downloadPDF}
              onClearMap={clearMap}
              isLoading={isLoading}
            />
            
            <ShapesList shapes={savedShapes} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
