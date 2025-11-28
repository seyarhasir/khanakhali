'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { InteractiveMap } from './InteractiveMap';

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

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs sm:text-sm font-medium text-brand-slate mb-2 sm:mb-3">
          {t('admin.locationCoordinates')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div>
            <label className="block text-xs text-brand-gray mb-1">{t('admin.latitude')}</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={handleLatChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-soft focus:outline-none transition-all text-sm sm:text-base"
              placeholder="34.5553"
            />
          </div>
          <div>
            <label className="block text-xs text-brand-gray mb-1">{t('admin.longitude')}</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={handleLngChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-soft focus:outline-none transition-all text-sm sm:text-base"
              placeholder="69.2075"
            />
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div>
        <InteractiveMap
          latitude={parseFloat(lat) || 34.5553}
          longitude={parseFloat(lng) || 69.2075}
          onLocationSelect={handleLocationSelect}
          translations={t}
        />
      </div>
    </div>
  );
};

