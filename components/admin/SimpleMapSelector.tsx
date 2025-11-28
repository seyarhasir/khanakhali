'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { MapPin } from 'lucide-react';

interface SimpleMapSelectorProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  translations?: ReturnType<typeof useTranslations>;
}

export const SimpleMapSelector: React.FC<SimpleMapSelectorProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  translations,
}) => {
  const t = translations || useTranslations();
  const [lat, setLat] = useState(latitude?.toString() || '34.5553');
  const [lng, setLng] = useState(longitude?.toString() || '69.2075');

  useEffect(() => {
    if (latitude && longitude) {
      setLat(latitude.toString());
      setLng(longitude.toString());
    }
  }, [latitude, longitude]);

  const handleLocationSelect = (newLat: number, newLng: number) => {
    setLat(newLat.toString());
    setLng(newLng.toString());
    onLocationSelect(newLat, newLng);
  };

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLat(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onLocationSelect(numValue, parseFloat(lng) || 69.2075);
    }
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLng(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onLocationSelect(parseFloat(lat) || 34.5553, numValue);
    }
  };

  const openGoogleMaps = () => {
    const latNum = parseFloat(lat) || 34.5553;
    const lngNum = parseFloat(lng) || 69.2075;
    const url = `https://www.google.com/maps/@${latNum},${lngNum},15z`;
    window.open(url, '_blank');
  };

  const latNum = parseFloat(lat) || 34.5553;
  const lngNum = parseFloat(lng) || 69.2075;

  return (
    <div className="space-y-4">
      {/* OpenStreetMap iframe - same as listing detail pages */}
      <div className="bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300 shadow-sm">
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lngNum - 0.01},${latNum - 0.01},${lngNum + 0.01},${latNum + 0.01}&layer=mapnik&marker=${latNum},${lngNum}`}
          style={{ width: '100%', height: '350px', border: 'none' }}
          title="Property Location Map"
        />
      </div>

      {/* Coordinate Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.latitude')}
          </label>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={lat}
            onChange={handleLatChange}
            placeholder="34.5553"
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.longitude')}
          </label>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={lng}
            onChange={handleLngChange}
            placeholder="69.2075"
            className="w-full"
          />
        </div>
      </div>

      {/* Google Maps Link */}
      <button
        type="button"
        onClick={openGoogleMaps}
        className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 flex items-center justify-center gap-2 text-blue-700 transition-colors"
      >
        <MapPin className="w-5 h-5" />
        <span className="font-medium">{t('admin.openFullMap')}</span>
      </button>

      <p className="text-xs text-gray-500 text-center">
        {t('admin.mapTip')}
      </p>
    </div>
  );
};
