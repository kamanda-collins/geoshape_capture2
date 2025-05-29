import React from 'react';
import { supabase } from '@/integrations/supabase/client'; // Supabase client

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

    // Initialize drawn items layer group
    drawnItems = new window.L.FeatureGroup();
    map.addLayer(drawnItems);

    // Fetch and render saved shapes from Supabase
    const fetchAndRenderShapes = async () => {
      const { data, error } = await supabase.from('features').select('*');

      if (error) {
        console.error('❌ Error fetching features:', error.message);
        return;
      }

      console.log('✅ Fetched features:', data);

      data.forEach((feature) => {
        try {
          const geoLayer = window.L.geoJSON(feature.geojson);
          geoLayer.addTo(drawnItems); // Add to group, not directly to map
        } catch (err) {
          console.error('❌ Error rendering shape:', err);
        }
      });
    };

    fetchAndRenderShapes();

    // Configure Leaflet draw controls
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
      drawnItems.addLayer(layer);
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

    // On shape delete
    map.on(window.L.Draw.Event.DELETED, () => {
      console.log('Shapes deleted by user');
      drawnItems.clearLayers(); // clear from map
      onShapeCreated(null);     // reset shape state
    });

    // Add scale bar
    scaleControl = window.L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: true
    });
    scaleControl.addTo(map);

    // Cleanup
    return () => {
      if (map) {
        map.removeControl(drawControl);
        if (scaleControl) map.removeControl(scaleControl);
        if (drawnItems) map.removeLayer(drawnItems);
        map.getContainer().style.cursor = '';
        map.getContainer().classList.remove('drawing-active');
      }
    };
  }, [map, onShapeCreated]);

  return null;
};
