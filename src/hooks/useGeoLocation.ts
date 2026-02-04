import { useState, useEffect } from "react";
import { REGION_NAMES } from "@/lib/regionConstants";

// Map country codes to Giftbit region codes
const COUNTRY_TO_REGION: Record<string, string> = {
  AU: 'AU',
  US: 'US',
  CA: 'CA',
  GB: 'GB',
  NZ: 'NZ',
  // Add more mappings as needed
};

// Get the supported Giftbit region for a country code
const mapCountryToRegion = (countryCode: string | null): string => {
  if (!countryCode) return 'GLOBAL';
  const upperCode = countryCode.toUpperCase();
  return COUNTRY_TO_REGION[upperCode] || 'GLOBAL';
};

// Check if a region is directly supported
const isDirectlySupported = (countryCode: string | null): boolean => {
  if (!countryCode) return false;
  return countryCode.toUpperCase() in COUNTRY_TO_REGION;
};

interface GeoLocationResult {
  country: string | null;
  region: string;
  isLoading: boolean;
  error: string | null;
  isDirectlySupported: boolean;
}

export const useGeoLocation = (): GeoLocationResult => {
  const [country, setCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Using country.is API - free, no API key required
        const response = await fetch('https://api.country.is', {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!response.ok) {
          throw new Error('Failed to detect location');
        }
        
        const data = await response.json();
        setCountry(data.country || null);
      } catch (err) {
        console.warn('Geolocation detection failed:', err);
        setError('Could not detect location');
        setCountry(null);
      } finally {
        setIsLoading(false);
      }
    };

    detectCountry();
  }, []);

  const region = mapCountryToRegion(country);
  const directlySupported = isDirectlySupported(country);

  return { 
    country, 
    region, 
    isLoading, 
    error,
    isDirectlySupported: directlySupported
  };
};

// Export utility functions for use elsewhere
export { mapCountryToRegion, isDirectlySupported, COUNTRY_TO_REGION };
