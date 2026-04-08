import { useState, useCallback, useRef } from "react";
import axios from "axios";
import api from "@/lib/api";

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

const withinRadius = (userCoords) => (r) =>
  haversineKm(userCoords.lat, userCoords.lng, r.lat, r.lng) <= MAX_RADIUS_KM;

const searchMapplsHospitals = async (query, userCoords) => {
  const { data } = await api.get("/api/v1/places/hospitals", {
    params: { query, lat: userCoords.lat, lng: userCoords.lng },
  });

  return (data?.suggestedLocations ?? [])
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
    .filter(withinRadius(userCoords));
};

const searchNominatimHospitals = async (query, userCoords) => {
  const d = 0.09;
  const { data } = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: {
      q:              query,
      format:         "json",
      limit:          15,
      countrycodes:   "in",
      addressdetails: 1,
      dedupe:         1,
      viewbox: `${userCoords.lng - d},${userCoords.lat + d},${userCoords.lng + d},${userCoords.lat - d}`,
    },
  });

  const queryLower      = query.toLowerCase();
  const queryIsMedical  = MEDICAL_KEYWORDS.some((kw) => queryLower.includes(kw));

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
    .filter(withinRadius(userCoords));
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
          const res = await searchMapplsHospitals(query, userCoords);
          if (res.length) { setResults(res); return; }
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