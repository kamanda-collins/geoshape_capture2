
import React, { useRef, useEffect } from 'react';
import { MapControls } from './MapControls';
import { MapLayersManager } from './MapLayers';
import { SearchLocationHandler } from './SearchLocationHandler';

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
  searchLocation?: { lat: number; lng: number; name: string; boundingBox?: number[] };
}

export const MapContainer: React.FC<MapContainerProps> = ({
  onShapeCreated,
  features,
  currentMapLayer,
  onLayerChange,
  searchLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !window.L) {
      console.error('Map container or Leaflet not available');
      return;
    }

    // Clear any existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    try {
      // Initialize map with proper settings
      const map = window.L.map(mapRef.current, {
        center: [40.7128, -74.0060],
        zoom: 10,
        zoomControl: true,
        attributionControl: true
      });

      // Add default OpenStreetMap tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      console.log('Map initialized successfully');

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Display saved features on map
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
    <>
      <style>{`
        .leaflet-container {
          height: 100%;
          width: 100%;
          z-index: 1;
        }
        .leaflet-draw-toolbar {
          z-index: 900;
        }
        .leaflet-draw-toolbar a {
          cursor: pointer !important;
        }
        .leaflet-container.drawing-active {
          cursor: crosshair !important;
        }
        .leaflet-container.drawing-active * {
          cursor: crosshair !important;
        }
        .leaflet-control-container {
          z-index: 800;
        }
      `}</style>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200" 
        style={{ minHeight: '500px' }}
      />
      <MapControls 
        map={mapInstanceRef.current} 
        onShapeCreated={onShapeCreated} 
      />
      <MapLayersManager 
        map={mapInstanceRef.current} 
        currentMapLayer={currentMapLayer} 
      />
      <SearchLocationHandler 
        map={mapInstanceRef.current} 
        searchLocation={searchLocation} 
      />
    </>
  );
};
