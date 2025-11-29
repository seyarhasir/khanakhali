'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { MapPin, ExternalLink } from 'lucide-react';

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

  const latNum = parseFloat(lat) || 34.5553;
  const lngNum = parseFloat(lng) || 69.2075;

  const openFullMap = () => {
    const url = `https://www.openstreetmap.org/?mlat=${latNum}&mlon=${lngNum}&zoom=15`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 mb-1">
              {t('admin.mapInstructions') || 'How to find coordinates:'}
            </p>
            <p className="text-xs text-blue-800 leading-relaxed">
              {t('admin.mapInstructionsText') || 'Click "Open Full Map" below to find your location. Right-click on the map and select "Show address" or check the URL for coordinates. Then enter the Latitude and Longitude values in the fields below.'}
            </p>
          </div>
        </div>
      </div>

      {/* OpenStreetMap iframe - same as listing detail page */}
      <div className="bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300 shadow-sm">
        <div 
          className="relative w-full h-[400px] sm:h-[500px] rounded-lg overflow-hidden border border-gray-200" 
        >
          <iframe
            className="absolute inset-0 w-full h-full"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lngNum - 0.01},${latNum - 0.01},${lngNum + 0.01},${latNum + 0.01}&layer=mapnik&marker=${latNum},${lngNum}`}
            title="Location Map"
          />
          <div className="absolute bottom-2 right-2 bg-white px-3 py-2 rounded-lg text-xs shadow-lg z-10 border border-gray-200">
            <button
              type="button"
              onClick={openFullMap}
              className="text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t('admin.openFullMap') || 'Open Full Map'}
            </button>
          </div>
        </div>
      </div>

      {/* Coordinate Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.latitude')} *
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
          <p className="text-xs text-gray-500 mt-1">
            {t('admin.latitudeHint') || 'Enter latitude (e.g., 34.5553)'}
          </p>
        </div>
        <div>
          <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.longitude')} *
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
          <p className="text-xs text-gray-500 mt-1">
            {t('admin.longitudeHint') || 'Enter longitude (e.g., 69.2075)'}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center italic">
        {t('admin.mapNote') || 'Note: The map above shows your current coordinates. To change the location, find coordinates from the full map and enter them above.'}
      </p>
    </div>
  );
};
