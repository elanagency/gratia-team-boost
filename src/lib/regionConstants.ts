// Region constants for gift card display

export const REGION_FLAGS: Record<string, string> = {
  AU: '🇦🇺',
  US: '🇺🇸',
  CA: '🇨🇦',
  GB: '🇬🇧',
  NZ: '🇳🇿',
  GLOBAL: '🌐'
};

export const REGION_NAMES: Record<string, string> = {
  AU: 'Australia',
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  NZ: 'New Zealand',
  GLOBAL: 'Global'
};

export const REGION_CURRENCIES: Record<string, string> = {
  AU: 'AUD',
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  NZ: 'NZD',
  GLOBAL: 'USD'
};

export const getRegionFlag = (regionCode: string): string => {
  return REGION_FLAGS[regionCode?.toUpperCase()] || '🌐';
};

// Get region image URL or fallback to emoji flag
export const getRegionImageOrFlag = (regionCode: string, imageUrl?: string | null): { type: 'image' | 'emoji'; value: string } => {
  if (imageUrl) {
    return { type: 'image', value: imageUrl };
  }
  return { type: 'emoji', value: getRegionFlag(regionCode) };
};

export const getRegionName = (regionCode: string): string => {
  return REGION_NAMES[regionCode?.toUpperCase()] || regionCode;
};

export const getRegionCurrency = (regionCode: string): string => {
  return REGION_CURRENCIES[regionCode?.toUpperCase()] || 'USD';
};
