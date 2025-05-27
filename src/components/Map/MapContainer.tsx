
import React, { useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    L: any;
  }
}

interface MapContainerProps {
  onShapeCreated: (geoJSON: any) => void;
  features: any[];
  currentMapLayer: string;
  onLayerChange: (layerUrl: string, layerName: string) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  onShapeCreated,
  features,
  currentMapLayer,
  onLayerChange
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawnItemsRef = useRef<any>(null);
  const currentTileLayerRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = window.L.map(mapRef.current).setView([40.7128, -74.0060], 10);
    mapInstanceRef.current = map;

    // Add initial tile layer
    const tileLayer = window.L.tileLayer(currentMapLayer, {
      attribution: '© OpenStreetMap contributors'
    });
    currentTileLayerRef.current = tileLayer;
    tileLayer.addTo(map);

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
    map.addControl(drawControl);

    // Handle drawing events
    map.on(window.L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);
      const geoJSON = layer.toGeoJSON();
      onShapeCreated(geoJSON);
      
      toast({
        title: "Shape Created",
        description: "Your shape has been drawn. Give it a name and save it!",
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // Handle layer changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    if (currentTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
    }
    
    const newLayer = window.L.tileLayer(currentMapLayer, {
      attribution: '© OpenStreetMap contributors'
    });
    
    currentTileLayerRef.current = newLayer;
    newLayer.addTo(mapInstanceRef.current);
  }, [currentMapLayer]);

  // Display features on map
  useEffect(() => {
    if (!mapInstanceRef.current || !features.length) return;

    features.forEach((feature, index) => {
      try {
        const geoJSON = JSON.parse(feature.geo);
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
        
        layer.bindPopup(`
          <div>
            <strong>${feature.name}</strong><br>
            ${feature.description || ''}<br>
            <small>Created: ${new Date(feature.created_at).toLocaleDateString()}</small>
          </div>
        `);
        layer.addTo(mapInstanceRef.current);
      } catch (e) {
        console.error('Error parsing GeoJSON:', e);
      }
    });
  }, [features]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200" 
    />
  );
};
