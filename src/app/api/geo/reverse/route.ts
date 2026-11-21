import { NextResponse } from 'next/server';
import { haversineDistanceKm } from '@/lib/geo';
import { MAJOR_REGIONAL_CITIES } from '@/lib/cities';
import { PUNJAB_DISTRICTS } from '@/lib/marketDict';

export const dynamic = 'force-dynamic';

interface NominatimAddress {
  village?: string;
  hamlet?: string;
  suburb?: string;
  neighbourhood?: string;
  residential?: string;
  isolated_dwelling?: string;
  road?: string;
  town?: string;
  municipality?: string;
  subdistrict?: string;
  tehsil?: string;
  county?: string;
  state_district?: string;
  district?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng') || searchParams.get('lon');

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: 'Missing required query parameters: lat and lng (or lon)' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinate range. Latitude must be in [-90, 90] and longitude in [-180, 180]' },
        { status: 400 }
      );
    }

    // Try OpenStreetMap Nominatim reverse geocode
    let nominatimData: { address?: NominatimAddress; display_name?: string } | null = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'KrishiVayu-CivicTech/1.0 (agricultural residue research platform)',
            Accept: 'application/json',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        nominatimData = await res.json();
      }
    } catch {
      // Nominatim timed out or failed (e.g. offline sandbox); fallback to regional centroid matching
      nominatimData = null;
    }

    const addr = nominatimData?.address;

    // 1. Resolve Village
    const detectedVillage =
      addr?.village ||
      addr?.hamlet ||
      addr?.neighbourhood ||
      addr?.suburb ||
      addr?.residential ||
      addr?.isolated_dwelling ||
      addr?.road ||
      '';

    // 2. Resolve Tehsil / Sub-district
    const detectedTehsil =
      addr?.subdistrict ||
      addr?.tehsil ||
      addr?.town ||
      addr?.municipality ||
      addr?.county ||
      '';

    // 3. Resolve District
    const rawDistrict =
      addr?.state_district ||
      addr?.district ||
      addr?.county ||
      addr?.city ||
      '';

    // Match rawDistrict against known Punjab districts
    let matchedDistrict = PUNJAB_DISTRICTS.find(
      (d) =>
        d.toLowerCase() === rawDistrict.toLowerCase() ||
        rawDistrict.toLowerCase().includes(d.toLowerCase()) ||
        d.toLowerCase().includes(rawDistrict.toLowerCase())
    );

    // 4. Resolve State
    let detectedState = addr?.state || 'Punjab';

    // Fallback if district not identified from Nominatim: Find closest regional city
    if (!matchedDistrict) {
      let closestCity = MAJOR_REGIONAL_CITIES[0];
      let minDistance = Infinity;

      for (const city of MAJOR_REGIONAL_CITIES) {
        const dist = haversineDistanceKm(lat, lng, city.lat, city.lon);
        if (dist < minDistance) {
          minDistance = dist;
          closestCity = city;
        }
      }

      // If closest city matches a Punjab district, use it
      const candidatePunjabDistrict = PUNJAB_DISTRICTS.find(
        (d) => d.toLowerCase() === closestCity.name.toLowerCase()
      );

      if (candidatePunjabDistrict) {
        matchedDistrict = candidatePunjabDistrict;
        detectedState = 'Punjab';
      } else {
        matchedDistrict = closestCity.name;
        detectedState = closestCity.state;
      }
    }

    const formattedAddress =
      nominatimData?.display_name ||
      [detectedVillage, detectedTehsil, matchedDistrict, detectedState]
        .filter(Boolean)
        .join(', ');

    return NextResponse.json({
      success: true,
      village: detectedVillage || (detectedTehsil ? `${detectedTehsil} Rural` : `${matchedDistrict} Farm`),
      tehsil: detectedTehsil || matchedDistrict,
      district: matchedDistrict,
      state: detectedState,
      coordinates: {
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000,
      },
      formatted: formattedAddress,
      source: nominatimData ? 'nominatim' : 'regional_nearest_fallback',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reverse geocode location';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
