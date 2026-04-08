import axios from "axios";

const nominatimHeaders = {
  "User-Agent": "ResQRide/1.0 (contact@resqride.in)",
};

const reverseGeocode = async (lat, long) => {
  try {
    const { data } = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params:  { lat, lon: long, format: "json" },
      headers: nominatimHeaders,
      timeout: 3000,
    });
    return data.display_name ?? `${lat}, ${long}`;
  } catch {
    return `${lat}, ${long}`;
  }
};

export { reverseGeocode };