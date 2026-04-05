import { useState, useCallback, useRef } from "react";
import axios from "axios";

const nominatimHeaders = { "User-Agent": "ResQRide/1.0 (contact@resqride.in)" };

/**
 * Builds a human-friendly short label from a Nominatim result.
 * Prefers: road, suburb/neighbourhood, city — avoids the full 80-char string.
 */
const buildShortName = (r) => {
  const a = r.address || {};
  const parts = [
    a.road || a.pedestrian || a.footway || a.hospital,
    a.suburb || a.neighbourhood || a.quarter || a.village || a.town,
    a.city || a.county,
    a.state,
  ].filter(Boolean);

  // Fall back to slicing the display name if address object is sparse
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
              limit: 7,            // more candidates to filter from
              countrycodes: "in",
              addressdetails: 1,   // needed for buildShortName
              namedetails: 1,      // includes alt names (helps with landmarks)
              dedupe: 1,
              // No `featuretype` restriction — building names in OSM India
              // are often tagged as amenity/shop/office, not "building"
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