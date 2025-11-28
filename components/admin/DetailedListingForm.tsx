'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreateListingInput } from '@/lib/types/listing.types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface DetailedListingFormProps {
  formData: CreateListingInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateListingInput>>;
  errors: Record<string, string>;
  translations?: ReturnType<typeof useTranslations>;
}

export const DetailedListingForm: React.FC<DetailedListingFormProps> = ({
  formData,
  setFormData,
  errors,
  translations,
}) => {
  const t = translations || useTranslations();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    mainFeatures: true,
    rooms: false,
    business: false,
    community: false,
    healthcare: false,
    nearby: false,
    other: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ title, section }: { title: string; section: string }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between text-lg sm:text-xl font-bold text-brand-slate border-b border-gray-200 pb-2 sm:pb-3 mb-3 sm:mb-4 hover:text-brand-primary transition-colors"
    >
      <span>{title}</span>
      <svg
        className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${expandedSections[section] ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  const CheckboxField = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <label className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-brand-primary transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary flex-shrink-0"
      />
      <span className="text-xs sm:text-sm font-medium text-brand-slate">{label}</span>
    </label>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Main Features */}
      <div>
        <SectionHeader title={t('admin.detailedFeatures.mainFeatures')} section="mainFeatures" />
        {expandedSections.mainFeatures && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <Input
              label={t('admin.detailedFeatures.builtInYear')}
              type="number"
              value={formData.mainFeatures?.builtInYear || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mainFeatures: {
                    ...formData.mainFeatures,
                    builtInYear: parseInt(e.target.value) || undefined,
                  },
                })
              }
              placeholder="2024"
            />
            <Input
              label={t('admin.detailedFeatures.parkingSpaces')}
              type="number"
              value={formData.mainFeatures?.parkingSpaces || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mainFeatures: {
                    ...formData.mainFeatures,
                    parkingSpaces: parseInt(e.target.value) || undefined,
                  },
                })
              }
              placeholder="1"
            />
            <Input
              label={t('admin.detailedFeatures.floors')}
              type="number"
              value={formData.mainFeatures?.floors || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mainFeatures: {
                    ...formData.mainFeatures,
                    floors: parseInt(e.target.value) || undefined,
                  },
                })
              }
              placeholder="2"
            />
            <Input
              label={t('admin.detailedFeatures.flooringType')}
              value={formData.mainFeatures?.flooring || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mainFeatures: {
                    ...formData.mainFeatures,
                    flooring: e.target.value || undefined,
                  },
                })
              }
              placeholder={t('admin.detailedFeatures.flooringPlaceholder')}
            />
            <CheckboxField
              label={t('admin.detailedFeatures.doubleGlazedWindows')}
              checked={formData.mainFeatures?.doubleGlazedWindows || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  mainFeatures: { ...formData.mainFeatures, doubleGlazedWindows: checked },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.centralAirConditioning')}
              checked={formData.mainFeatures?.centralAirConditioning || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  mainFeatures: { ...formData.mainFeatures, centralAirConditioning: checked },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.centralHeating')}
              checked={formData.mainFeatures?.centralHeating || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  mainFeatures: { ...formData.mainFeatures, centralHeating: checked },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.electricityBackup')}
              checked={formData.mainFeatures?.electricityBackup || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  mainFeatures: { ...formData.mainFeatures, electricityBackup: checked },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.wasteDisposal')}
              checked={formData.mainFeatures?.wasteDisposal || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  mainFeatures: { ...formData.mainFeatures, wasteDisposal: checked },
                })
              }
            />
          </div>
        )}
      </div>

      {/* Rooms */}
      <div>
        <SectionHeader title={t('admin.detailedFeatures.rooms')} section="rooms" />
        {expandedSections.rooms && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <Input
              label={t('admin.bedrooms')}
              type="number"
              value={formData.rooms?.bedrooms || formData.bedrooms || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setFormData({
                  ...formData,
                  bedrooms: value,
                  rooms: { ...formData.rooms, bedrooms: value },
                });
              }}
              placeholder="3"
            />
            <Input
              label={t('admin.bathrooms')}
              type="number"
              value={formData.rooms?.bathrooms || formData.bathrooms || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setFormData({
                  ...formData,
                  bathrooms: value,
                  rooms: { ...formData.rooms, bathrooms: value },
                });
              }}
              placeholder="3"
            />
            <Input
              label={t('admin.detailedFeatures.servantQuarters')}
              type="number"
              value={formData.rooms?.servantQuarters || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rooms: {
                    ...formData.rooms,
                    servantQuarters: parseInt(e.target.value) || undefined,
                  },
                })
              }
              placeholder="1"
            />
            <Input
              label={t('admin.detailedFeatures.kitchens')}
              type="number"
              value={formData.rooms?.kitchens || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rooms: {
                    ...formData.rooms,
                    kitchens: parseInt(e.target.value) || undefined,
                  },
                })
              }
              placeholder="1"
            />
            <Input
              label={t('admin.detailedFeatures.storeRooms')}
              type="number"
              value={formData.rooms?.storeRooms || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rooms: {
                    ...formData.rooms,
                    storeRooms: parseInt(e.target.value) || undefined,
                  },
                })
              }
              placeholder="1"
            />
            <CheckboxField
              label={t('admin.detailedFeatures.drawingRoom')}
              checked={formData.rooms?.drawingRoom || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  rooms: { ...formData.rooms, drawingRoom: checked },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.diningRoom')}
              checked={formData.rooms?.diningRoom || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  rooms: { ...formData.rooms, diningRoom: checked },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.studyRoom')}
              checked={formData.rooms?.studyRoom || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  rooms: { ...formData.rooms, studyRoom: checked },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.prayerRoom')}
              checked={formData.rooms?.prayerRoom || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  rooms: { ...formData.rooms, prayerRoom: checked },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.powderRoom')}
              checked={formData.rooms?.powderRoom || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  rooms: { ...formData.rooms, powderRoom: checked },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.gym')}
              checked={formData.rooms?.gym || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  rooms: { ...formData.rooms, gym: checked },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.steamRoom')}
              checked={formData.rooms?.steamRoom || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  rooms: { ...formData.rooms, steamRoom: checked },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.lounge')}
              checked={formData.rooms?.lounge || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  rooms: { ...formData.rooms, lounge: checked },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.laundryRoom')}
              checked={formData.rooms?.laundryRoom || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  rooms: { ...formData.rooms, laundryRoom: checked },
                })
              }
            />
          </div>
        )}
      </div>

      {/* Business and Communication */}
      <div>
        <SectionHeader title={t('admin.detailedFeatures.businessCommunication')} section="business" />
        {expandedSections.business && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <CheckboxField
              label={t('admin.detailedFeatures.broadbandInternet')}
              checked={formData.businessCommunication?.broadbandInternet || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  businessCommunication: {
                    ...formData.businessCommunication,
                    broadbandInternet: checked,
                  },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.satelliteCableTV')}
              checked={formData.businessCommunication?.satelliteCableTV || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  businessCommunication: {
                    ...formData.businessCommunication,
                    satelliteCableTV: checked,
                  },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.intercom')}
              checked={formData.businessCommunication?.intercom || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  businessCommunication: {
                    ...formData.businessCommunication,
                    intercom: checked,
                  },
                })
              }
            />
          </div>
        )}
      </div>

      {/* Community Features */}
      <div>
        <SectionHeader title={t('admin.detailedFeatures.communityFeatures')} section="community" />
        {expandedSections.community && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <CheckboxField
              label={t('admin.detailedFeatures.communityLawn')}
              checked={formData.communityFeatures?.communityLawn || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  communityFeatures: {
                    ...formData.communityFeatures,
                    communityLawn: checked,
                  },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.communitySwimmingPool')}
              checked={formData.communityFeatures?.communitySwimmingPool || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  communityFeatures: {
                    ...formData.communityFeatures,
                    communitySwimmingPool: checked,
                  },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.communityGym')}
              checked={formData.communityFeatures?.communityGym || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  communityFeatures: {
                    ...formData.communityFeatures,
                    communityGym: checked,
                  },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.medicalCentre')}
              checked={formData.communityFeatures?.medicalCentre || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  communityFeatures: {
                    ...formData.communityFeatures,
                    medicalCentre: checked,
                  },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.dayCareCentre')}
              checked={formData.communityFeatures?.dayCareCentre || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  communityFeatures: {
                    ...formData.communityFeatures,
                    dayCareCentre: checked,
                  },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.kidsPlayArea')}
              checked={formData.communityFeatures?.kidsPlayArea || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  communityFeatures: {
                    ...formData.communityFeatures,
                    kidsPlayArea: checked,
                  },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.barbequeArea')}
              checked={formData.communityFeatures?.barbequeArea || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  communityFeatures: {
                    ...formData.communityFeatures,
                    barbequeArea: checked,
                  },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.mosque')}
              checked={formData.communityFeatures?.mosque || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  communityFeatures: {
                    ...formData.communityFeatures,
                    mosque: checked,
                  },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.communityCentre')}
              checked={formData.communityFeatures?.communityCentre || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  communityFeatures: {
                    ...formData.communityFeatures,
                    communityCentre: checked,
                  },
                })
              }
            />
          </div>
        )}
      </div>

      {/* Healthcare and Recreation */}
      <div>
        <SectionHeader title={t('admin.detailedFeatures.healthcareRecreation')} section="healthcare" />
        {expandedSections.healthcare && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <CheckboxField
              label={t('admin.detailedFeatures.lawn')}
              checked={formData.healthcareRecreation?.lawn || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  healthcareRecreation: {
                    ...formData.healthcareRecreation,
                    lawn: checked,
                  },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.swimmingPool')}
              checked={formData.healthcareRecreation?.swimmingPool || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  healthcareRecreation: {
                    ...formData.healthcareRecreation,
                    swimmingPool: checked,
                  },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.sauna')}
              checked={formData.healthcareRecreation?.sauna || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  healthcareRecreation: {
                    ...formData.healthcareRecreation,
                    sauna: checked,
                  },
                })
              }
            />
            <CheckboxField
              label={t('admin.detailedFeatures.jacuzzi')}
              checked={formData.healthcareRecreation?.jacuzzi || false}
              onChange={(checked) =>
                setFormData({
                  ...formData,
                  healthcareRecreation: {
                    ...formData.healthcareRecreation,
                    jacuzzi: checked,
                  },
                })
              }
            />
          </div>
        )}
      </div>

      {/* Nearby Locations */}
      <div>
        <SectionHeader title={t('admin.detailedFeatures.nearbyLocations')} section="nearby" />
        {expandedSections.nearby && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label={t('admin.detailedFeatures.nearbySchools')}
              value={formData.nearbyLocations?.nearbySchools || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nearbyLocations: {
                    ...formData.nearbyLocations,
                    nearbySchools: e.target.value || undefined,
                  },
                })
              }
              placeholder={t('admin.detailedFeatures.nearbySchoolsPlaceholder')}
            />
            <Input
              label={t('admin.detailedFeatures.nearbyHospitals')}
              value={formData.nearbyLocations?.nearbyHospitals || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nearbyLocations: {
                    ...formData.nearbyLocations,
                    nearbyHospitals: e.target.value || undefined,
                  },
                })
              }
              placeholder={t('admin.detailedFeatures.nearbyHospitalsPlaceholder')}
            />
            <Input
              label={t('admin.detailedFeatures.nearbyShoppingMalls')}
              value={formData.nearbyLocations?.nearbyShoppingMalls || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nearbyLocations: {
                    ...formData.nearbyLocations,
                    nearbyShoppingMalls: e.target.value || undefined,
                  },
                })
              }
              placeholder={t('admin.detailedFeatures.nearbyShoppingMallsPlaceholder')}
            />
            <Input
              label={t('admin.detailedFeatures.nearbyRestaurants')}
              value={formData.nearbyLocations?.nearbyRestaurants || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nearbyLocations: {
                    ...formData.nearbyLocations,
                    nearbyRestaurants: e.target.value || undefined,
                  },
                })
              }
              placeholder={t('admin.detailedFeatures.nearbyRestaurantsPlaceholder')}
            />
            <Input
              label={t('admin.detailedFeatures.distanceFromAirport')}
              type="number"
              value={formData.nearbyLocations?.distanceFromAirport || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nearbyLocations: {
                    ...formData.nearbyLocations,
                    distanceFromAirport: parseFloat(e.target.value) || undefined,
                  },
                })
              }
              placeholder="15"
            />
            <Input
              label={t('admin.detailedFeatures.nearbyPublicTransport')}
              value={formData.nearbyLocations?.nearbyPublicTransport || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nearbyLocations: {
                    ...formData.nearbyLocations,
                    nearbyPublicTransport: e.target.value || undefined,
                  },
                })
              }
              placeholder={t('admin.detailedFeatures.nearbyPublicTransportPlaceholder')}
            />
            <div className="md:col-span-2">
              <Input
                label={t('admin.detailedFeatures.otherNearbyPlaces')}
                value={formData.nearbyLocations?.otherNearbyPlaces || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nearbyLocations: {
                      ...formData.nearbyLocations,
                      otherNearbyPlaces: e.target.value || undefined,
                    },
                  })
                }
                placeholder={t('admin.detailedFeatures.otherNearbyPlacesPlaceholder')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Other Facilities */}
      <div>
        <SectionHeader title={t('admin.detailedFeatures.otherFacilities')} section="other" />
        {expandedSections.other && (
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <CheckboxField
                label={t('admin.detailedFeatures.maintenanceStaff')}
                checked={formData.otherFacilities?.maintenanceStaff || false}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    otherFacilities: {
                      ...formData.otherFacilities,
                      maintenanceStaff: checked,
                    },
                  })
                }
              />
              <CheckboxField
                label={t('admin.detailedFeatures.securityStaff')}
                checked={formData.otherFacilities?.securityStaff || false}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    otherFacilities: {
                      ...formData.otherFacilities,
                      securityStaff: checked,
                    },
                  })
                }
              />
              <CheckboxField
                label={t('admin.detailedFeatures.facilitiesForDisabled')}
                checked={formData.otherFacilities?.facilitiesForDisabled || false}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    otherFacilities: {
                      ...formData.otherFacilities,
                      facilitiesForDisabled: checked,
                    },
                  })
                }
              />
            </div>
            <Input
              label={t('admin.detailedFeatures.otherFacilitiesInput')}
              value={formData.otherFacilities?.otherFacilities || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  otherFacilities: {
                    ...formData.otherFacilities,
                    otherFacilities: e.target.value || undefined,
                  },
                })
              }
              placeholder={t('admin.detailedFeatures.otherFacilitiesPlaceholder')}
            />
          </div>
        )}
      </div>
    </div>
  );
};


