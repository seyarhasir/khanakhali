'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

interface InteractiveMapProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  translations?: ReturnType<typeof useTranslations>;
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const { useMapEvents } = require('react-leaflet');
  useMapEvents({
    click: (e: any) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  latitude = 34.5553,
  longitude = 69.2075,
  onLocationSelect,
  translations,
}) => {
  const t = translations || useTranslations();
  const [position, setPosition] = useState<[number, number]>([latitude, longitude]);
  const [isClient, setIsClient] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Fix Leaflet default icon issue - only on client side
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        delete (L.default.Icon.Default.prototype as any)._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        setIsMapReady(true);
      });
    }
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  if (!isClient || !isMapReady) {
    return (
      <div className="w-full h-[400px] sm:h-[500px] rounded-xl border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-sm text-brand-gray">{t('admin.loadingMap')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border-2 border-gray-200 overflow-hidden">
      <div className="relative w-full h-[400px] sm:h-[500px] z-0">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
          key={`${position[0]}-${position[1]}`}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            subdomains={['a', 'b', 'c']}
            maxZoom={19}
            minZoom={1}
          />
          <Marker
            position={position}
            draggable={true}
            eventHandlers={{
              dragend: (e: any) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                handleLocationSelect(pos.lat, pos.lng);
              },
            }}
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
        </MapContainer>
      </div>
      <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs sm:text-sm text-brand-gray text-center mb-2">
          {t('admin.mapInstructions')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
          <div className="text-center">
            <span className="font-medium text-brand-slate">{t('admin.latitude')}: </span>
            <span className="text-brand-gray">{position[0].toFixed(6)}</span>
          </div>
          <div className="text-center">
            <span className="font-medium text-brand-slate">{t('admin.longitude')}: </span>
            <span className="text-brand-gray">{position[1].toFixed(6)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
