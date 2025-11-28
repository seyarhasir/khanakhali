'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export function MapSizeFixer() {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    let mounted = true;
    
    const handleMapUpdate = () => {
      if (!mounted || !map) return;
      try {
        // Invalidate size to recalculate map dimensions
        if (typeof map.invalidateSize === 'function') {
          map.invalidateSize();
        }
        
        // Force tile layer to reload
        try {
          map.eachLayer((layer: any) => {
            if (layer && typeof layer.redraw === 'function') {
              try {
                layer.redraw();
              } catch (e) {
                // Ignore layer errors
              }
            }
          });
        } catch (e) {
          // Ignore layer iteration errors
        }
        
        // Force a view reset to trigger tile loading
        try {
          const center = map.getCenter();
          const zoom = map.getZoom();
          if (center && zoom && typeof map.setView === 'function') {
            // Small pan to force tile reload
            map.setView([center.lat + 0.0001, center.lng], zoom, { animate: false });
            setTimeout(() => {
              if (mounted && map) {
                map.setView(center, zoom, { animate: false });
              }
            }, 100);
          }
        } catch (e) {
          // Ignore view update errors
        }
      } catch (e) {
        // Silently ignore errors
      }
    };

    try {
      // Use whenReady to ensure map is fully initialized
      if (map && typeof map.whenReady === 'function') {
        map.whenReady(() => {
          if (!mounted) return;
          handleMapUpdate();
        });
      }

      // Also listen for viewreset and load events
      if (map && typeof map.on === 'function') {
        map.on('viewreset', handleMapUpdate);
        map.on('load', handleMapUpdate);
        map.on('tileload', () => {
          // Tiles are loading, good sign
        });
        map.on('tileerror', (error: any) => {
          console.warn('Tile loading error:', error);
        });
      }
    } catch (e) {
      // Ignore event listener errors
    }
    
    // Invalidate size at multiple intervals to catch any timing issues
    const timers = [
      setTimeout(handleMapUpdate, 150),
      setTimeout(handleMapUpdate, 400),
      setTimeout(handleMapUpdate, 800),
      setTimeout(handleMapUpdate, 1500),
      setTimeout(handleMapUpdate, 2500)
    ];
    
    return () => {
      mounted = false;
      timers.forEach(timer => clearTimeout(timer));
      try {
        if (map && typeof map.off === 'function') {
          map.off('viewreset', handleMapUpdate);
          map.off('load', handleMapUpdate);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [map]);
  
  return null;
}

