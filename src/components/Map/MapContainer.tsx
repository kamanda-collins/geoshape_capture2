
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
    if (!mapRef.current) return;

    // Initialize map
    const map = window.L.map(mapRef.current).setView([40.7128, -74.0060], 10);
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
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
        .search-location-marker {
          background: transparent;
        }
        .marker-pin {
          background: #ff6b35;
          border-radius: 50%;
          height: 20px;
          width: 20px;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .marker-label {
          background: white;
          border: 2px solid #ff6b35;
          border-radius: 4px;
          color: #333;
          font-size: 12px;
          font-weight: bold;
          padding: 2px 6px;
          position: absolute;
          top: -35px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .marker-label:after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border: 5px solid transparent;
          border-top-color: #ff6b35;
        }
        .crosshair-cursor {
          cursor: crosshair !important;
        }
        .leaflet-draw-toolbar a {
          cursor: pointer !important;
        }
        .leaflet-draw-draw-polygon {
          cursor: crosshair !important;
        }
      `}</style>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200" 
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
