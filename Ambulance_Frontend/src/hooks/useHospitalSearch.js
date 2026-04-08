// src/hooks/useHospitalSearch.js
// Hospital-only search for the DROP field.
// FIXES:
//  1. Removed User-Agent header — browsers block it (causes console error)
//  2. Removed bounded=1 — allows partial name matching ("bhakti" → "Bhaktivedanta Hospital")
//     viewbox is now a ranking bias only, not a hard filter
//  3. Added haversine post-filter to cap results at MAX_RADIUS_KM (~12 km)
//  4. Reduced viewbox to d=0.09 (~10 km) to keep bias tight

import { useState, useCallback, useRef } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const MAX_RADIUS_KM = 12;

const MEDICAL_KEYWORDS = [
  "hospital", "clinic", "medical", "health", "nursing",
  "pharmacy", "dispensary", "diagnostic", "nursing home", "maternity",
  "trauma", "icu", "emergency", "apollo", "fortis", "aiims", "lilavati",
  "hinduja", "kokilaben", "nanavati", "wockhardt", "breach candy",
  "care", "centre", "center", "trust", "charity",
];

const isMedical = (name = "") =>
  MEDICAL_KEYWORDS.some((kw) => name.toLowerCase().includes(kw));

// Haversine distance in km
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const searchMapplsHospitals = async (query, userCoords) => {
  const { data } = await axios.get(`${API_URL}/api/v1/places/hospitals`, {
    params: { query, lat: userCoords.lat, lng: userCoords.lng },
  });

  const places = data?.suggestedLocations ?? [];
  if (!places.length) return [];

  return places
    .filter((r) => isMedical(r.placeName))
    .map((r) => {
      const t = r.addressTokens ?? {};
      const parts = [
        r.placeName,
        t.locality || t.subLocality || t.village,
        t.city || t.district,
      ].filter(Boolean);
      return {
        display_name: r.placeName + (r.placeAddress ? `, ${r.placeAddress}` : ""),
        short_name:   parts.slice(0, 3).join(", "),
        lat:          parseFloat(r.latitude),
        lng:          parseFloat(r.longitude),
      };
    })
    .filter(
      (r) => haversineKm(userCoords.lat, userCoords.lng, r.lat, r.lng) <= MAX_RADIUS_KM
    );
};

// FIX: removed bounded=1 so partial names like "bhakti" can match
// "Bhaktivedanta Hospital". viewbox is now a ranking bias only.
// FIX: removed User-Agent header — browsers block it as an unsafe header.
// FIX: added haversine post-filter to enforce MAX_RADIUS_KM hard cap.
const searchNominatimHospitals = async (query, userCoords) => {
  const d = 0.09; // ~10 km as ranking bias
  const { data } = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q:              query,
        format:         "json",
        limit:          15,
        countrycodes:   "in",
        addressdetails: 1,
        dedupe:         1,
        // No bounded=1 — viewbox is a bias only so partial names still match
        viewbox: `${userCoords.lng - d},${userCoords.lat + d},${userCoords.lng + d},${userCoords.lat - d}`,
      },
      // NOTE: Do NOT set User-Agent here — browsers reject it as an unsafe header
    }
  );

  const queryLower = query.toLowerCase();
  const queryIsMedical = MEDICAL_KEYWORDS.some((kw) => queryLower.includes(kw));

  return data
    .filter((r) => {
      const amenity = (r.type || r.class || "").toLowerCase();
      const name    = (r.display_name || "").toLowerCase();
      const isMedAmenity =
        amenity === "hospital"     ||
        amenity === "clinic"       ||
        amenity === "doctors"      ||
        amenity === "pharmacy"     ||
        amenity === "nursing_home" ||
        amenity === "healthcare";
      return isMedAmenity || isMedical(name) || queryIsMedical;
    })
    .map((r) => {
      const a     = r.address ?? {};
      const parts = [
        r.display_name.split(",")[0],
        a.suburb || a.village || a.town,
        a.city || a.county,
      ].filter(Boolean);
      return {
        display_name: r.display_name,
        short_name:   parts.slice(0, 3).join(", "),
        lat:          parseFloat(r.lat),
        lng:          parseFloat(r.lon),
      };
    })
    // Hard cap: only show results within MAX_RADIUS_KM of the user
    .filter(
      (r) => haversineKm(userCoords.lat, userCoords.lng, r.lat, r.lng) <= MAX_RADIUS_KM
    );
};

const useHospitalSearch = (userCoords = null) => {
  const [results,       setResults]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);
  const timer = useRef(null);

  const search = useCallback(
    (query) => {
      clearTimeout(timer.current);
      if (!query || query.trim().length < 2) { setResults([]); return; }

      if (!userCoords) {
        setNeedsLocation(true);
        setResults([]);
        return;
      }

      setNeedsLocation(false);

      timer.current = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await searchMapplsHospitals(query, userCoords);
          if (results.length) { setResults(results); return; }
          setResults(await searchNominatimHospitals(query, userCoords));
        } catch {
          try   { setResults(await searchNominatimHospitals(query, userCoords)); }
          catch { setResults([]); }
        } finally {
          setLoading(false);
        }
      }, 400);
    },
    [userCoords]
  );

  const clear = useCallback(() => {
    setResults([]);
    setNeedsLocation(false);
  }, []);

  return { search, results, loading, needsLocation, clear };
};

export default useHospitalSearch;