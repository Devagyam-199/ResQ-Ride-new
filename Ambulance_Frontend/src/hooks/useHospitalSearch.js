// src/hooks/useHospitalSearch.js
// Hospital-only search for the DROP field.
// FIX: loosened Nominatim fallback filter so it returns results even when
//      OSM doesn't tag the amenity type precisely. The old strict filter
//      caused zero results after Mappls proxy failed in production.

import { useState, useCallback, useRef } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const MEDICAL_KEYWORDS = [
  "hospital", "clinic", "medical", "health", "nursing",
  "pharmacy", "dispensary", "diagnostic", "nursing home", "maternity",
  "trauma", "icu", "emergency", "apollo", "fortis", "aiims", "lilavati",
  "hinduja", "kokilaben", "nanavati", "wockhardt", "breach candy",
  "care", "centre", "center", "trust", "charity",
];

const isMedical = (name = "") =>
  MEDICAL_KEYWORDS.some((kw) => name.toLowerCase().includes(kw));

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
    });
};

// FIX: relaxed filter — previously required exact OSM amenity type match.
// Now accepts any result whose display_name contains a medical keyword,
// which handles hospitals tagged as "building", "place", etc. in OSM.
const searchNominatimHospitals = async (query, userCoords) => {
  const d = 0.135;
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

  // FIX: if the user typed a name, trust their intent. Filter loosely:
  // accept if OSM amenity suggests medical OR the name matches a keyword
  // OR the query itself is a known medical keyword (user typed "hospital").
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
      // If query was "hospital" / "clinic" etc., include all results
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
    });
};

const useHospitalSearch = (userCoords = null) => {
  const [results,       setResults]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);
  const timer = useRef(null);

  const search = useCallback(
    (query) => {
      clearTimeout(timer.current);
      if (!query || query.trim().length < 3) { setResults([]); return; }

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