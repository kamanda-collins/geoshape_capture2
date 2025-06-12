import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { MapControls } from './MapControls';
import { MapLayersManager } from './MapLayers';
import { SearchLocationHandler } from './SearchLocationHandler';
import { LocateMeButton } from './LocateMeButton';
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
  clearDrawnItems: () => void;
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
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [totalArea, setTotalArea] = useState(0);
  const [featureTypes, setFeatureTypes] = useState<{ [key: string]: number }>({});
  const [areaSqM, setAreaSqM] = useState(0);
  const [riskScore, setRiskScore] = useState(0);
  
  // Only track saved features - let MapControls handle temporary drawings
  const savedFeaturesLayerGroup = useRef<any>(null);

  // Function to clear only temporary drawn items (not saved features)
  const clearDrawnItems = () => {
    if (mapInstance && mapInstance._drawnItems) {
      mapInstance._drawnItems.clearLayers();
    }
    // Reset temporary drawing stats
    setAreaSqM(0);
    setRiskScore(0);
  };

  // Function to create a buffer on the map
  const createBufferOnMap = (center: [number, number], radius: number) => {
    if (!mapInstance) return;

    try {
      // Clear previous temporary drawings first
      clearDrawnItems();

      const circle = window.L.circle(center, {
        radius: radius,
        color: '#3388ff',
        fillColor: '#3388ff',
        fillOpacity: 0.2
      });

      // Add to MapControls' drawnItems layer
      if (mapInstance._drawnItems) {
        mapInstance._drawnItems.addLayer(circle);
      } else {
        circle.addTo(mapInstance);
      }
      
      // Convert circle to GeoJSON and trigger shape creation
      const geoJSON = circle.toGeoJSON();
      handleShapeAnalyzed(geoJSON);
      onShapeCreated(geoJSON);
    } catch (error) {
      console.error('Error creating buffer:', error);
    }
  };

  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    createBufferOnMap,
    clearDrawnItems,
  }));

  const handleShapeAnalyzed = (geojson: any) => {
    try {
      const area = turf.area(geojson);
      const risk = parseFloat((Math.random() * 5).toFixed(2)); // Dummy risk
      setAreaSqM(area);
      setRiskScore(risk);
    } catch (error) {
      console.error('Error analyzing shape:', error);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance) return;

    try {
      console.log('MapContainer: Creating new map instance');
      
      const map = window.L.map(mapRef.current, {
        center: [40.7128, -74.0060],
        zoom: 10,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: false
      });

      // Add tile layer
      const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      });
      tileLayer.addTo(map);

      // Create layer group ONLY for saved features (not temporary drawings)
      const savedFeatures = window.L.layerGroup();
      savedFeatures.addTo(map);
      savedFeaturesLayerGroup.current = savedFeatures;

      // Listen for draw events from MapControls
      map.on(window.L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        const geojson = layer.toGeoJSON();
        handleShapeAnalyzed(geojson);
      });

      map.on(window.L.Draw.Event.EDITED, (e: any) => {
        const layers = e.layers;
        layers.eachLayer((layer: any) => {
          const geojson = layer.toGeoJSON();
          handleShapeAnalyzed(geojson);
        });
      });

      map.on(window.L.Draw.Event.DELETED, () => {
        setAreaSqM(0);
        setRiskScore(0);
      });

      setMapInstance(map);

      setTimeout(() => {
        if (map && map.getContainer()) {
          map.invalidateSize();
        }
      }, 100);

    } catch (error) {
      console.error('MapContainer: Error initializing map:', error);
    }

    return () => {
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        setMapInstance(null);
      }
    };
  }, []);

  // Display ONLY saved features (not temporary drawings)
  useEffect(() => {
    if (!mapInstance || !savedFeaturesLayerGroup.current) return;

    console.log('MapContainer: Adding saved features to map:', features.length);

    try {
      // Clear only saved features layer
      savedFeaturesLayerGroup.current.clearLayers();

      if (features.length > 0) {
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
            
            // Add only to saved features layer
            savedFeaturesLayerGroup.current.addLayer(layer);
          } catch (e) {
            console.error('MapContainer: Error parsing saved feature GeoJSON:', e);
          }
        });
      }
    } catch (error) {
      console.error('Error updating saved features on map:', error);
    }
  }, [features, mapInstance]);

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
        const featureArea = turf.area(geoJSON);
        area += featureArea;

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
    if (!mapInstance) return;

    try {
      const layer = window.L.geoJSON(geoJSON, {
        style: {
          color: '#3388ff',
          fillColor: '#3388ff',
          fillOpacity: 0.2,
          weight: 2
        }
      });

      // Add to temporary drawing layer
      if (mapInstance._drawnItems) {
        mapInstance._drawnItems.addLayer(layer);
      } else {
        layer.addTo(mapInstance);
      }
      
      onShapeCreated(geoJSON);
    } catch (error) {
      console.error('Error loading shapefile:', error);
    }
  };

  const handleExport = () => {
    if (!features.length) return;

    try {
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
    } catch (error) {
      console.error('Error exporting data:', error);
    }
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
      <div 
        ref={mapRef} 
        id="map"
        className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200" 
        style={{ 
          minHeight: '500px',
          backgroundColor: '#e5e7eb'
        }}
      />
      <MapControls 
        map={mapInstance} 
        onShapeCreated={onShapeCreated} 
      />
      <MapLayersManager 
        map={mapInstance} 
        currentMapLayer={currentMapLayer} 
      />
      <SearchLocationHandler 
        map={mapInstance} 
        searchLocation={searchLocation} 
      />
      <LocateMeButton map={mapInstance} />
      <ExportButton onExport={handleExport} disabled={!features.length} />
    </>
  );
});