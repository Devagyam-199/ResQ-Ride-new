import { useState, useCallback, useRef } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const searchMappls = async (query, userCoords) => {
  const { data } = await axios.get(`${API_URL}/api/v1/places/search`, {
    params: {
      query,
      lat: userCoords.lat,
      lng: userCoords.lng,
    },
  });

  return (data?.suggestedLocations ?? []).map((r) => {
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

const searchNominatim = async (query, userCoords) => {
  const d = 0.135;
  const { data } = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q:              query,
        format:         "json",
        limit:          7,
        countrycodes:   "in",
        addressdetails: 1,
        dedupe:         1,
        viewbox:        `${userCoords.lng - d},${userCoords.lat + d},${userCoords.lng + d},${userCoords.lat - d}`,
        bounded:        1,
      },
      // NOTE: Do NOT set User-Agent — browsers block it as an unsafe header
    }
  );

  return data.map((r) => {
    const a     = r.address ?? {};
    const parts = [
      a.road || a.pedestrian || a.neighbourhood,
      a.suburb || a.village || a.town,
      a.city || a.county,
    ].filter(Boolean);
    return {
      display_name: r.display_name,
      short_name:
        parts.length >= 2
          ? parts.slice(0, 3).join(", ")
          : r.display_name.split(",").slice(0, 3).join(", "),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    };
  });
};

const useGeocoding = (userCoords = null) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const search = useCallback(
    (query) => {
      clearTimeout(timer.current);
      if (!query || query.trim().length < 3) { setResults([]); return; }
      if (!userCoords) { setResults([]); return; }

      timer.current = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await searchMappls(query, userCoords);
          if (results.length) { setResults(results); return; }
          setResults(await searchNominatim(query, userCoords));
        } catch {
          try   { setResults(await searchNominatim(query, userCoords)); }
          catch { setResults([]); }
        } finally {
          setLoading(false);
        }
      }, 400);
    },
    [userCoords]
  );

  const clear = useCallback(() => setResults([]), []);
  return { search, results, loading, clear };
};

export default useGeocoding;