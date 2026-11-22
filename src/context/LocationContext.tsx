'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UserLocation {
  village?: string;
  tehsil?: string;
  district: string;
  state: string;
  coordinates?: { lat: number; lng: number };
  formatted?: string;
}

interface LocationContextType {
  userLocation: UserLocation | null;
  isGpsLoading: boolean;
  gpsError: string | null;
  gpsSuccess: string | null;
  requestGpsLocation: (silent?: boolean) => Promise<UserLocation | null>;
  clearGpsLocation: () => void;
  setUserLocation: (loc: UserLocation | null) => void;
}

const LocationContext = createContext<LocationContextType>({
  userLocation: null,
  isGpsLoading: false,
  gpsError: null,
  gpsSuccess: null,
  requestGpsLocation: async () => null,
  clearGpsLocation: () => {},
  setUserLocation: () => {},
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocationState] = useState<UserLocation | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState<string | null>(null);

  // Restore saved location from localStorage on initial load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('krishivayu_user_location');
      if (saved) {
        const parsed = JSON.parse(saved) as UserLocation;
        if (parsed && parsed.district) {
          setUserLocationState(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const setUserLocation = useCallback((loc: UserLocation | null) => {
    setUserLocationState(loc);
    try {
      if (loc) {
        localStorage.setItem('krishivayu_user_location', JSON.stringify(loc));
        window.dispatchEvent(new CustomEvent('krishivayu-location-changed', { detail: loc }));
      } else {
        localStorage.removeItem('krishivayu_user_location');
      }
    } catch {
      // ignore
    }
  }, []);

  const clearGpsLocation = useCallback(() => {
    setUserLocation(null);
    setGpsSuccess(null);
    setGpsError(null);
  }, [setUserLocation]);

  const requestGpsLocation = useCallback(async (silent = false): Promise<UserLocation | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (!silent) setGpsError('Geolocation is not supported by your browser.');
      return null;
    }

    setIsGpsLoading(true);
    setGpsError(null);
    setGpsSuccess(null);

    return new Promise<UserLocation | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            const res = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
            const data = await res.json();

            if (res.ok && data.success) {
              const loc: UserLocation = {
                village: data.village || undefined,
                tehsil: data.tehsil || undefined,
                district: data.district || 'Sangrur',
                state: data.state || 'Punjab',
                coordinates: data.coordinates,
                formatted: data.formatted,
              };

              setUserLocation(loc);
              const label = [loc.village, loc.tehsil, loc.district].filter(Boolean).join(', ');
              setGpsSuccess(label);
              resolve(loc);
            } else {
              const msg = data.error || 'Failed to detect address from coordinates';
              if (!silent) setGpsError(msg);
              resolve(null);
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Network error resolving location';
            if (!silent) setGpsError(msg);
            resolve(null);
          } finally {
            setIsGpsLoading(false);
          }
        },
        (err) => {
          console.warn('Geolocation permission denied or failed:', err);
          let errorMsg = 'Location permission denied. Please allow location access.';
          if (err.code === err.TIMEOUT) errorMsg = 'Location request timed out.';
          if (err.code === err.POSITION_UNAVAILABLE) errorMsg = 'Location information unavailable.';
          if (!silent) setGpsError(errorMsg);
          setIsGpsLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [setUserLocation]);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        isGpsLoading,
        gpsError,
        gpsSuccess,
        requestGpsLocation,
        clearGpsLocation,
        setUserLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
