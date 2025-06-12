import React from 'react';

declare global {
  interface Window {
    L: any;
  }
}

interface MapControlsProps {
  map: any;
  onShapeCreated: (geoJSON: any) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({ map, onShapeCreated }) => {
  const drawnItemsRef = React.useRef<any>(null);
  const scaleControlRef = React.useRef<any>(null);
  const drawControlRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!map) return;

    // Create ONLY the temporary drawing layer (not for saved features)
    drawnItemsRef.current = new window.L.FeatureGroup();
    map.addLayer(drawnItemsRef.current);

    // Configure Leaflet draw controls
    const drawControl = new window.L.Control.Draw({
      edit: {
        featureGroup: drawnItemsRef.current,
        remove: true,
        edit: true
      },
      draw: {
        polygon: {
          allowIntersection: true,
          showLength: true,
          showArea: true,
          drawError: {
            color: '#e1e100',
            message: '<strong>Draw any shape you want!</strong>'
          },
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#93c5fd',
            fillOpacity: 0.3,
            weight: 2
          },
          metric: true,
          feet: false,
          repeatMode: false,
          guideLayers: [],
          maxPoints: 0
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

    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    // Drawing cursor indicators
    map.on('draw:drawstart', () => {
      map.getContainer().style.cursor = 'crosshair';
      map.getContainer().classList.add('drawing-active');
    });

    map.on('draw:drawstop', () => {
      map.getContainer().style.cursor = '';
      map.getContainer().classList.remove('drawing-active');
    });

    // When a new shape is created
    map.on(window.L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      
      // Clear any existing temporary drawings first
      drawnItemsRef.current.clearLayers();
      
      // Add the new layer
      drawnItemsRef.current.addLayer(layer);
      
      const geoJSON = layer.toGeoJSON();
      onShapeCreated(geoJSON);

      map.getContainer().style.cursor = '';
      map.getContainer().classList.remove('drawing-active');
    });

    // On shape edit
    map.on(window.L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        const geoJSON = layer.toGeoJSON();
        onShapeCreated(geoJSON);
      });
    });

    // On shape delete - only clear temporary drawings
    map.on(window.L.Draw.Event.DELETED, () => {
      console.log('Temporary shapes deleted by user');
      drawnItemsRef.current.clearLayers();
      onShapeCreated(null);
    });

    // Add scale bar
    scaleControlRef.current = window.L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: true
    });
    scaleControlRef.current.addTo(map);

    // Cleanup
    return () => {
      if (map) {
        if (drawControlRef.current) {
          map.removeControl(drawControlRef.current);
        }
        if (scaleControlRef.current) {
          map.removeControl(scaleControlRef.current);
        }
        if (drawnItemsRef.current) {
          map.removeLayer(drawnItemsRef.current);
        }
        
        // Remove event listeners
        map.off('draw:drawstart');
        map.off('draw:drawstop');
        map.off(window.L.Draw.Event.CREATED);
        map.off(window.L.Draw.Event.EDITED);
        map.off(window.L.Draw.Event.DELETED);
        
        map.getContainer().style.cursor = '';
        map.getContainer().classList.remove('drawing-active');
      }
    };
  }, [map, onShapeCreated]);

  // Expose the drawnItems reference for MapContainer to use
  React.useEffect(() => {
    if (map && drawnItemsRef.current) {
      // Store reference on map instance for MapContainer to access
      map._drawnItems = drawnItemsRef.current;
    }
  }, [map]);

  return null;
};