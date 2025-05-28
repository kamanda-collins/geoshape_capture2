
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
  React.useEffect(() => {
    if (!map) return;

    // Initialize drawn items layer
    const drawnItems = new window.L.FeatureGroup();
    map.addLayer(drawnItems);

    // Initialize draw control with enhanced polygon options
    const drawControl = new window.L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        remove: true
      },
      draw: {
        polygon: {
          allowIntersection: true,
          showLength: true,
          showArea: true,
          drawError: {
            color: '#e1e100',
            message: '<strong>Create any shape you want!</strong>'
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
          // Enable free-form drawing
          guideLayers: [],
          maxPoints: 0 // Allow unlimited points for free-form shapes
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

    // Add crosshair cursor when drawing polygons
    map.on('draw:drawstart', (event: any) => {
      if (event.layerType === 'polygon') {
        map.getContainer().style.cursor = 'crosshair';
        map.getContainer().classList.add('crosshair-cursor-active');
      }
    });

    map.on('draw:drawstop', () => {
      map.getContainer().style.cursor = '';
      map.getContainer().classList.remove('crosshair-cursor-active');
    });

    // Handle drawing events
    map.on(window.L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);
      const geoJSON = layer.toGeoJSON();
      onShapeCreated(geoJSON);
      
      // Reset cursor after creation
      map.getContainer().style.cursor = '';
      map.getContainer().classList.remove('crosshair-cursor-active');
    });

    // Add scale control
    window.L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: true
    }).addTo(map);

    return () => {
      if (map) {
        map.removeControl(drawControl);
        // Reset cursor on cleanup
        map.getContainer().style.cursor = '';
        map.getContainer().classList.remove('crosshair-cursor-active');
      }
    };
  }, [map, onShapeCreated]);

  return null;
};
