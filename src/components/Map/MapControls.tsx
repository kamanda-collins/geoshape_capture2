import { supabase } from '@/integrations/supabase/client';
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
  let scaleControl: any;
  let drawnItems: any;
  
  React.useEffect(() => {
    if (!map) return;

    // Initialize drawn items layer
    drawnItems = new window.L.FeatureGroup();
    map.addLayer(drawnItems);

    // Initialize draw control with enhanced options
    const drawControl = new window.L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
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
    
    map.addControl(drawControl);

    // Enhanced cursor management for all drawing tools
    map.on('draw:drawstart', (event: any) => {
      map.getContainer().style.cursor = 'crosshair';
      map.getContainer().classList.add('drawing-active');
    });

    map.on('draw:drawstop', () => {
      map.getContainer().style.cursor = '';
      map.getContainer().classList.remove('drawing-active');
    });

    // Handle shape creation
    map.on(window.L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);
      const geoJSON = layer.toGeoJSON();
      onShapeCreated(geoJSON);
      
      // Reset cursor after creation
      map.getContainer().style.cursor = '';
      map.getContainer().classList.remove('drawing-active');
    });

    // Handle shape editing
    map.on(window.L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        const geoJSON = layer.toGeoJSON();
        onShapeCreated(geoJSON);
      });
    });

    // Handle shape deletion
    map.on(window.L.Draw.Event.DELETED, (event: any) => {
      console.log('Shapes deleted');
      // Clear all shapes from the drawn items layer
      drawnItems.clearLayers();
      // Clear the current shape state
      onShapeCreated(null);
    });

    // Add scale control
    scaleControl = window.L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: true
    });
    scaleControl.addTo(map);

    return () => {
      if (map) {
        map.removeControl(drawControl);
        if (scaleControl) {
          map.removeControl(scaleControl);
        }
        if (drawnItems) {
          map.removeLayer(drawnItems);
        }
        map.getContainer().style.cursor = '';
        map.getContainer().classList.remove('drawing-active');
      }
    };
  }, [map, onShapeCreated]);
    
  React.useEffect(() => {
  
  
  
  
  
  
  
  
  
    if (!map) return;

    const fetchAndRenderShapes = async () => {
      const { data, error } = await supabase.from('features').select('*');

      if (error) {
        console.error('Error fetching features:', error.message);
        return;
      }

      data.forEach((feature) => {
        try {
          const geoLayer = window.L.geoJSON(feature.geojson);
          geoLayer.addTo(map);
        } catch (err) {
          console.error('Error rendering shape:', err);
        }
      });
    };

    fetchAndRenderShapes();
  }, [map]);

  return null;
};
