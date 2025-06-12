import React, { useRef, useEffect } from 'react';
import { MapControls } from './MapControls';
import { MapLayersManager } from './MapLayers';
import { SearchLocationHandler } from './SearchLocationHandler';
import { LocateMeButton } from './LocateMeButton'; // Add this import

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
    console.log('MapContainer: Starting initialization');
    console.log('MapContainer: mapRef.current:', mapRef.current);
    console.log('MapContainer: window.L:', window.L);

    if (!mapRef.current) {
      console.error('MapContainer: Map container ref not available');
      return;
    }

    if (!window.L) {
      console.error('MapContainer: Leaflet library not loaded');
      return;
    }

    // Clear any existing map
    if (mapInstanceRef.current) {
      console.log('MapContainer: Removing existing map');
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      console.log('MapContainer: Creating new map instance');
      
      // Initialize map with explicit options
      const map = window.L.map(mapRef.current, {
        center: [40.7128, -74.0060], // New York coordinates
        zoom: 10,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: false
      });

      console.log('MapContainer: Map instance created:', map);

      // Add tile layer immediately
      const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      });

      console.log('MapContainer: Adding tile layer');
      tileLayer.addTo(map);

      // Force map to invalidate size after a short delay
      setTimeout(() => {
        console.log('MapContainer: Invalidating map size');
        map.invalidateSize();
      }, 100);

      mapInstanceRef.current = map;
      console.log('MapContainer: Map initialized successfully');

    } catch (error) {
      console.error('MapContainer: Error initializing map:', error);
    }

    return () => {
      console.log('MapContainer: Cleanup');
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Display saved features on map
  useEffect(() => {
    if (!mapInstanceRef.current || !features.length) return;

    console.log('MapContainer: Adding features to map:', features.length);

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
        console.error('MapContainer: Error parsing GeoJSON:', e);
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
          background: #e5e7eb;
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
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200" 
          style={{ 
            minHeight: '500px',
            backgroundColor: '#e5e7eb'
          }}
        />
        <LocateMeButton
          onLocate={(lat, lng) => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([lat, lng], 15); // Zoom in on location
              const marker = window.L.marker([lat, lng]).addTo(mapInstanceRef.current);
              marker.bindPopup("📍 You are here").openPopup();
            }
          }} 
        />
      </div>
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