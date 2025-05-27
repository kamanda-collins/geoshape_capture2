
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
  const drawnItemsRef = useRef<any>(null);
  const currentTileLayerRef = useRef<any>(null);
  const highlightLayerRef = useRef<any>(null);
  const searchMarkersRef = useRef<any>(null);
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

    // Initialize highlight layer for search results
    const highlightLayer = new window.L.FeatureGroup();
    highlightLayerRef.current = highlightLayer;
    map.addLayer(highlightLayer);

    // Initialize search markers layer (separate from highlights)
    const searchMarkers = new window.L.FeatureGroup();
    searchMarkersRef.current = searchMarkers;
    map.addLayer(searchMarkers);

    // Initialize draw control with more flexible polygon settings
    const drawControl = new window.L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        remove: true
      },
      draw: {
        polygon: {
          allowIntersection: true, // Allow self-intersecting polygons
          drawError: {
            color: '#e1e100',
            message: '<strong>Note:</strong> You can draw any shape you want!'
          },
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#93c5fd',
            fillOpacity: 0.3,
            weight: 2
          },
          showArea: true, // Show area measurements
          metric: true, // Use metric units
          feet: false, // Disable imperial units
          repeatMode: false // Don't automatically start a new polygon
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
        polyline: {
          shapeOptions: {
            color: '#3b82f6',
            weight: 3
          }
        },
        circlemarker: false
      }
    });
    map.addControl(drawControl);

    // Add map controls (scale, compass, etc.)
    // Scale control
    window.L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: true
    }).addTo(map);

    // Handle drawing events
    map.on(window.L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);
      const geoJSON = layer.toGeoJSON();
      onShapeCreated(geoJSON);
      
      toast({
        title: "Shape Created",
        description: "Your area has been drawn. You can now export it as a map!",
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // Handle search location highlighting
  useEffect(() => {
    if (!searchLocation || !mapInstanceRef.current || !highlightLayerRef.current || !searchMarkersRef.current) return;

    const { lat, lng, name, boundingBox } = searchLocation;
    
    // Clear previous highlights and markers
    highlightLayerRef.current.clearLayers();
    searchMarkersRef.current.clearLayers();

    if (boundingBox && boundingBox.length === 4) {
      // Create bounding box highlight that disappears after 4 seconds
      const [south, north, west, east] = boundingBox;
      const bounds = [[south, west], [north, east]];
      
      // Create temporary highlight rectangle
      const highlight = window.L.rectangle(bounds, {
        color: '#ff6b35',
        weight: 3,
        fillColor: '#ff6b35',
        fillOpacity: 0.2,
        dashArray: '10, 10'
      });
      
      highlightLayerRef.current.addLayer(highlight);
      
      // Add a permanent marker for the location
      const permanentMarker = window.L.marker([lat, lng], {
        icon: window.L.divIcon({
          className: 'search-location-marker',
          html: `<div class="marker-pin"></div><div class="marker-label">${name}</div>`,
          iconSize: [120, 40],
          iconAnchor: [60, 40]
        })
      });
      
      searchMarkersRef.current.addLayer(permanentMarker);
      
      // Fit map to bounds with padding
      mapInstanceRef.current.fitBounds(bounds, { 
        padding: [20, 20],
        maxZoom: 16 
      });
      
      // Remove highlight after 4 seconds
      setTimeout(() => {
        if (highlightLayerRef.current) {
          highlightLayerRef.current.clearLayers();
        }
      }, 4000);
    } else {
      // Create point highlight with pulsing circle
      const highlight = window.L.circle([lat, lng], {
        color: '#ff6b35',
        fillColor: '#ff6b35',
        fillOpacity: 0.3,
        radius: 1000,
        weight: 3
      });
      
      highlightLayerRef.current.addLayer(highlight);
      
      // Add permanent marker
      const permanentMarker = window.L.marker([lat, lng], {
        icon: window.L.divIcon({
          className: 'search-location-marker',
          html: `<div class="marker-pin"></div><div class="marker-label">${name}</div>`,
          iconSize: [120, 40],
          iconAnchor: [60, 40]
        })
      });
      
      searchMarkersRef.current.addLayer(permanentMarker);
      
      // Center map on location
      mapInstanceRef.current.setView([lat, lng], 14, {
        animate: true,
        duration: 1
      });
      
      // Remove highlight after 4 seconds
      setTimeout(() => {
        if (highlightLayerRef.current) {
          highlightLayerRef.current.clearLayers();
        }
      }, 4000);
    }

  }, [searchLocation]);

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

  // Display saved features on map (this is the old system - we can simplify this)
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
      `}</style>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200" 
      />
    </>
  );
};
