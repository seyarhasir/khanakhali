'use client';

import React, { useRef } from 'react';
import { useTranslations } from 'next-intl';

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  coverImageIndex?: number;
  onCoverImageChange?: (index: number) => void;
  maxImages?: number;
  translations?: ReturnType<typeof useTranslations>;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  coverImageIndex = 0,
  onCoverImageChange,
  maxImages = 10,
  translations,
}) => {
  const t = translations || useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    
    const remainingSlots = maxImages - images.length;
    const filesToAdd = imageFiles.slice(0, remainingSlots);
    
    onImagesChange([...images, ...filesToAdd]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    // If removing cover image, set first image as cover
    if (coverImageIndex === index && newImages.length > 0 && onCoverImageChange) {
      onCoverImageChange(0);
    } else if (coverImageIndex > index && onCoverImageChange) {
      // Adjust cover index if image before it was removed
      onCoverImageChange(coverImageIndex - 1);
    }
  };

  const setAsCover = (index: number) => {
    if (onCoverImageChange) {
      onCoverImageChange(index);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-xs sm:text-sm font-medium text-brand-slate mb-2 sm:mb-3">
        {t('admin.photos')} ({images.length}/{maxImages})
      </label>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
        {images.map((file, index) => {
          const previewUrl = URL.createObjectURL(file);
          const isCover = coverImageIndex >= 0 && coverImageIndex === index;
          return (
            <div key={index} className="relative group">
              <div className={`aspect-square rounded-xl overflow-hidden border-2 relative ${
                isCover ? 'border-brand-primary border-4' : 'border-gray-200'
              }`}>
                <img
                  src={previewUrl}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                />
                {isCover && (
                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-brand-primary text-white px-2 py-1 rounded text-[10px] sm:text-xs font-bold">
                    {t('admin.cover')}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 sm:top-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-75 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {!isCover && (
                <button
                  type="button"
                  onClick={() => setAsCover(index)}
                  className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-blue-500 hover:bg-brand-secondary text-white px-2 py-1 rounded text-[10px] sm:text-xs font-semibold opacity-75 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  {t('admin.setAsCover')}
                </button>
              )}
            </div>
          );
        })}
        
        {images.length < maxImages && (
          <button
            type="button"
            onClick={openFilePicker}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-primary transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-brand-primary"
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">{t('admin.addPhoto')}</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length === 0 && (
        <p className="text-xs sm:text-sm text-brand-gray">{t('admin.addAtLeastOne')}</p>
      )}
    </div>
  );
};

