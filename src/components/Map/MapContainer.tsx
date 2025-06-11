import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { MapControls } from './MapControls';
import { MapLayersManager } from './MapLayers';
import { SearchLocationHandler } from './SearchLocationHandler';
import { ImportTabs } from '../Features/ImportTabs';
import { SummaryPanel } from './SummaryPanel';
import { ExportButton } from './ExportButton';
import * as turf from '@turf/turf';
import { getHuggingFaceToken, getEarthEngineToken } from '@/utils/env';

declare global {
  interface Window {
    L: any;
  }
}

export interface MapContainerRef {
  createBufferOnMap: (center: [number, number], radius: number) => void;
}

interface MapContainerProps {
  onShapeCreated: (geoJSON: any) => void;
  features: any[];
  currentMapLayer: string;
  onLayerChange: (layerUrl: string, layerName: string) => void;
  searchLocation?: { lat: number; lng: number; name: string; boundingBox?: number[] };
}

export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(({
  onShapeCreated,
  features,
  currentMapLayer,
  onLayerChange,
  searchLocation,
}, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [totalArea, setTotalArea] = useState(0);
  const [featureTypes, setFeatureTypes] = useState<{ [key: string]: number }>({});
  const [areaSqM, setAreaSqM] = useState(0);
  const [riskScore, setRiskScore] = useState(0);
  const drawnItemsRef = useRef<any>(null);

  // Expose createBufferOnMap via ref
  useImperativeHandle(ref, () => ({
    createBufferOnMap,
  }));

  const handleShapeAnalyzed = (geojson: any) => {
    const area = turf.area(geojson);
    const risk = parseFloat((Math.random() * 5).toFixed(2)); // Dummy risk
    setAreaSqM(area);
    setRiskScore(risk);
  };

  // Function to create a buffer on the map
  const createBufferOnMap = (center: [number, number], radius: number) => {
    if (!mapInstanceRef.current) return;

    try {
      const token = getHuggingFaceToken();
      if (!token) {
        throw new Error('Hugging Face token not found');
      }

      const circle = window.L.circle(center, {
        radius: radius,
        color: '#3388ff',
        fillColor: '#3388ff',
        fillOpacity: 0.2
      });

      circle.addTo(mapInstanceRef.current);
      
      // Convert circle to GeoJSON and trigger shape creation
      const geoJSON = circle.toGeoJSON();
      onShapeCreated(geoJSON);
    } catch (error) {
      console.error('Error creating buffer:', error);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

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

      // Add tile layer immediately
      const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      });

      tileLayer.addTo(map);

      // Initialize drawn items
      const drawnItems = new window.L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      // Set up draw controls
      map.on('draw:created', (e: any) => {
        const layer = e.layer;
        drawnItems.clearLayers();
        drawnItems.addLayer(layer);

        const geojson = layer.toGeoJSON();
        handleShapeAnalyzed(geojson);
      });

      mapInstanceRef.current = map;

      // Force map to invalidate size after a short delay
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

    } catch (error) {
      console.error('MapContainer: Error initializing map:', error);
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

  // Calculate summary statistics when features change
  useEffect(() => {
    if (!features.length) {
      setTotalArea(0);
      setFeatureTypes({});
      return;
    }

    let area = 0;
    const types: { [key: string]: number } = {};

    features.forEach(feature => {
      try {
        const geoJSON = JSON.parse(feature.geo);
        // Calculate area using Leaflet's area calculation
        if (mapInstanceRef.current && geoJSON.geometry) {
          const layer = window.L.geoJSON(geoJSON);
          if (typeof layer.getLayers()[0].getArea === 'function') {
             const layerArea = layer.getLayers()[0].getArea();
             area += layerArea;
          } else {
            console.warn('MapContainer: getArea() not available for this geometry type');
          }
        }

        // Count feature types
        const type = geoJSON.geometry?.type || 'unknown';
        types[type] = (types[type] || 0) + 1;
      } catch (e) {
        console.error('Error calculating feature statistics:', e);
      }
    });

    setTotalArea(area);
    setFeatureTypes(types);
  }, [features]);

  const handleShapefileLoad = (geoJSON: any, filename: string) => {
    if (!mapInstanceRef.current) return;

    try {
      const layer = window.L.geoJSON(geoJSON, {
        style: {
          color: '#3388ff',
          fillColor: '#3388ff',
          fillOpacity: 0.2,
          weight: 2
        }
      });

      layer.addTo(mapInstanceRef.current);
      onShapeCreated(geoJSON);
    } catch (error) {
      console.error('Error loading shapefile:', error);
    }
  };

  const handleExport = () => {
    if (!features.length) return;

    const exportData = features.map(feature => ({
      ...feature,
      geo: JSON.parse(feature.geo)
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
        <div className="md:col-span-3">
          <div 
            ref={mapRef} 
            className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200" 
            style={{ 
              minHeight: '500px',
              backgroundColor: '#e5e7eb'
            }}
          />
        </div>
        <div className="space-y-4">
          <SummaryPanel 
            totalFeatures={features.length}
            totalArea={totalArea}
            featureTypes={featureTypes}
            recentArea={areaSqM}
            riskScore={riskScore}
          />
          <ExportButton 
            onExport={handleExport}
            disabled={!features.length}
          />
        </div>
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
    {areaSqM !== 0 && riskScore !== 0 && (
      <div className="mt-4 border-t pt-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">🆕 Latest Drawn Shape</h4>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Area:</span>
          <span className="font-medium">{areaSqM.toFixed(2)} m²</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Risk Score:</span>
          <span className="font-medium">{riskScore.toFixed(2)}</span>
        </div>
      </div>
    )}    
  );
});
