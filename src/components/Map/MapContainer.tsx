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
  const currentDrawnLayerRef = useRef<any>(null); // Keep reference to current drawn layer

  // Function to clear drawn items
  const clearDrawnItems = () => {
    if (mapInstance) {
      // Find the drawnItems layer that MapControls created
      mapInstance.eachLayer((layer: any) => {
        if (layer instanceof window.L.FeatureGroup && layer !== mapInstance._layers[Object.keys(mapInstance._layers)[0]]) {
          layer.clearLayers();
        }
      });
    }
    if (currentDrawnLayerRef.current) {
      currentDrawnLayerRef.current = null;
    }
    setAreaSqM(0);
    setRiskScore(0);
  };

  // Function to create a buffer on the map
  const createBufferOnMap = (center: [number, number], radius: number) => {
    if (!mapInstance) return;

    try {
      const token = getHuggingFaceToken();
      if (!token) {
        throw new Error('Hugging Face token not found');
      }

      // Clear previous drawn items first
      clearDrawnItems();

      const circle = window.L.circle(center, {
        radius: radius,
        color: '#3388ff',
        fillColor: '#3388ff',
        fillOpacity: 0.2
      });

      // Find and add to the MapControls drawnItems layer
      let drawnItemsLayer = null;
      mapInstance.eachLayer((layer: any) => {
        if (layer instanceof window.L.FeatureGroup && layer._leaflet_id !== mapInstance._layers[Object.keys(mapInstance._layers)[0]]._leaflet_id) {
          drawnItemsLayer = layer;
        }
      });

      if (drawnItemsLayer) {
        drawnItemsLayer.addLayer(circle);
      } else {
        circle.addTo(mapInstance);
      }
      
      currentDrawnLayerRef.current = circle;
      
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
      
      // Initialize map with explicit options
      const map = window.L.map(mapRef.current, {
        center: [40.7128, -74.0060], // New York coordinates
        zoom: 10,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: false
      });

      // Add tile layer immediately
      const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetMap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      });

      tileLayer.addTo(map);

      // Don't create our own drawn items - let MapControls handle this
      // We'll listen for the MapControls events instead

      // Listen for draw events from MapControls
      map.on(window.L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        currentDrawnLayerRef.current = layer;

        const geojson = layer.toGeoJSON();
        handleShapeAnalyzed(geojson);
      });

      // Listen for edit events
      map.on(window.L.Draw.Event.EDITED, (e: any) => {
        const layers = e.layers;
        layers.eachLayer((layer: any) => {
          currentDrawnLayerRef.current = layer;
          const geojson = layer.toGeoJSON();
          handleShapeAnalyzed(geojson);
        });
      });

      // Listen for delete events
      map.on(window.L.Draw.Event.DELETED, () => {
        currentDrawnLayerRef.current = null;
        setAreaSqM(0);
        setRiskScore(0);
      });

      // Set the map instance in state (this will trigger re-renders)
      setMapInstance(map);

      // Force map to invalidate size after a short delay
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

  // Display saved features on map (but don't interfere with drawn items)
  useEffect(() => {
    if (!mapInstance) return;

    console.log('MapContainer: Adding features to map:', features.length);

    // Clear existing feature layers (but preserve drawn items and base layers)
    try {
      const layersToRemove: any[] = [];
      
      mapInstance.eachLayer((layer: any) => {
        // Only remove layers that are saved features
        // Don't touch FeatureGroups (drawnItems), tile layers, or the current drawn layer
        if (layer.feature && 
            !(layer instanceof window.L.FeatureGroup) &&
            layer !== currentDrawnLayerRef.current) {
          layersToRemove.push(layer);
        }
      });

      // Remove the identified layers
      layersToRemove.forEach(layer => {
        mapInstance.removeLayer(layer);
      });

      // Only add features if there are any
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
            layer.addTo(mapInstance);
          } catch (e) {
            console.error('MapContainer: Error parsing GeoJSON:', e);
          }
        });
      }
    } catch (error) {
      console.error('Error updating features on map:', error);
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
        
        // Use turf.js for consistent area calculation
        const featureArea = turf.area(geoJSON);
        area += featureArea;

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

      layer.addTo(mapInstance);
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
          {/* Only keep the outer summary panel */}
          <SummaryPanel 
            totalFeatures={features.length}
            totalArea={totalArea}
            featureTypes={featureTypes}
            recentArea={areaSqM}
            riskScore={riskScore}
          />
          
          {/* Latest Drawn Shape - only show when there's a recent drawing */}
          {areaSqM !== 0 && riskScore !== 0 && (
            <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
              <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                🆕 Latest Drawn Shape
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Area:</span>
                  <span className="font-medium text-blue-700">
                    {areaSqM.toFixed(2)} m²
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Risk Score:</span>
                  <span className="font-medium text-blue-700">
                    {riskScore.toFixed(2)}/5.0
                  </span>
                </div>
                <button 
                  onClick={clearDrawnItems}
                  className="w-full mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Clear Drawing
                </button>
              </div>
            </div>
          )}

          <ExportButton 
            onExport={handleExport}
            disabled={!features.length}
          />
        </div>
      </div>
      {mapInstance && (
        <>
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
        </>
      )}
    </>
  );
});