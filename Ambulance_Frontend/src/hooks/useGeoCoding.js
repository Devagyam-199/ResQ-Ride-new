import { useState, useCallback, useRef } from "react";
import axios from "axios";

const nominatimHeaders = { "User-Agent": "ResQRide/1.0 (contact@resqride.in)" };

const buildShortName = (r) => {
  const a = r.address || {};
  const parts = [
    a.road || a.pedestrian || a.footway,
    a.suburb || a.neighbourhood || a.quarter || a.village || a.town,
    a.city || a.county,
    a.state,
  ].filter(Boolean);

  return parts.length >= 2
    ? parts.slice(0, 3).join(", ")
    : r.display_name.split(",").slice(0, 3).join(", ");
};

const useGeocoding = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const search = useCallback((query) => {
    clearTimeout(timer.current);
    if (!query || query.trim().length < 3) {
      setResults([]);
      return;
    }

    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          "https://nominatim.openstreetmap.org/search",
          {
            params: {
              q: query,
              format: "json",
              limit: 7,
              countrycodes: "in",
              addressdetails: 1,
              namedetails: 1,
              dedupe: 1,
            },
            headers: nominatimHeaders,
          },
        );

        setResults(
          data.map((r) => ({
            display_name: r.display_name,
            short_name: buildShortName(r),
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
          })),
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { search, results, loading, clear };
};

export default useGeocoding;