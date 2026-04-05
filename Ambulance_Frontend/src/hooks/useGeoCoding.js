import { useState, useCallback, useRef } from "react";
import axios from "axios";

const useGeocoding = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const search = useCallback((query) => {
    clearTimeout(timer.current);
    if (!query || query.length < 3) { setResults([]); return; }

    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get("https://nominatim.openstreetmap.org/search", {
          params: {
            q:            query,
            format:       "json",
            limit:        5,
            countrycodes: "in",
            addressdetails: 1,
          },
          headers: { "User-Agent": "ResQRide/1.0" },
        });
        setResults(
          data.map((r) => ({
            display_name: r.display_name,
            short_name:   r.display_name.split(",").slice(0, 3).join(", "),
            lat:          parseFloat(r.lat),
            lng:          parseFloat(r.lon),
          }))
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