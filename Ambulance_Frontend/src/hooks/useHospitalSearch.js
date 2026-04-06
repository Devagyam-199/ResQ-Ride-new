// src/hooks/useHospitalSearch.js
// Hospital-only search — used exclusively for the DROP field.
// Filters by medical category (HOSP, MEDC) and hard-restricts to ~15 km.

import { useState, useCallback, useRef } from "react";
import axios from "axios";

const REST_KEY = import.meta.env.VITE_MAPPLS_REST_KEY;

// Mappls category codes for medical facilities
const MEDICAL_FILTER = "cop:HOSP,cop:MEDC,cop:CLINIC,cop:NRSG";

// Keywords used to client-side verify a result is actually medical
const MEDICAL_KEYWORDS = [
  "hospital", "clinic", "medical", "health", "care", "nursing",
  "pharmacy", "dispensary", "diagnostic", "nursing home", "maternity",
  "trauma", "icu", "emergency", "apollo", "fortis", "aiims", "lilavati",
  "hinduja", "kokilaben", "nanavati", "wockhardt", "breach candy",
];

const isMedical = (name = "") =>
  MEDICAL_KEYWORDS.some((kw) => name.toLowerCase().includes(kw));

const searchMapplsHospitals = async (query, userCoords) => {
  const { data } = await axios.get(
    "https://atlas.mappls.com/api/places/search/json",
    {
      params: {
        query,
        rest_key: REST_KEY,
        region:   "IND",
        pod:      "SLC",           // sub-locality — keeps results local
        bridge:   true,
        filter:   MEDICAL_FILTER,  // only medical category POIs
        location: `${userCoords.lat},${userCoords.lng}`,
        zoom:     14,              // ~10–15 km radius
      },
    }
  );

  const places = data?.suggestedLocations ?? [];
  if (!places.length) return [];

  return places
    .filter((r) => isMedical(r.placeName))   // double-check client side
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
    });
};

const searchNominatimHospitals = async (query, userCoords) => {
  const d = 0.135; // ~15 km bounding box
  const { data } = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q:              query,
        format:         "json",
        limit:          10,
        countrycodes:   "in",
        addressdetails: 1,
        dedupe:         1,
        viewbox:        `${userCoords.lng - d},${userCoords.lat + d},${userCoords.lng + d},${userCoords.lat - d}`,
        bounded:        1,
      },
      headers: { "User-Agent": "ResQRide/1.0 (contact@resqride.in)" },
    }
  );

  return data
    .filter((r) => {
      // Keep only OSM nodes tagged as medical/hospital amenities
      const amenity = (r.type || "").toLowerCase();
      const name    = (r.display_name || "").toLowerCase();
      return (
        amenity === "hospital"    ||
        amenity === "clinic"      ||
        amenity === "doctors"     ||
        amenity === "pharmacy"    ||
        amenity === "nursing_home"||
        isMedical(name)
      );
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
    });
};

/**
 * Hospital-only geocoding hook for the drop location field.
 * @param {Object|null} userCoords — { lat, lng }. Search is blocked until provided.
 * @returns {{ search, results, loading, clear, needsLocation }}
 *   needsLocation is true when the user hasn't shared GPS yet.
 */
const useHospitalSearch = (userCoords = null) => {
  const [results,       setResults]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);
  const timer = useRef(null);

  const search = useCallback(
    (query) => {
      clearTimeout(timer.current);
      if (!query || query.trim().length < 3) { setResults([]); return; }

      // Hard block — hospital search without location is useless
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
          // Fallback: Nominatim with medical filter
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