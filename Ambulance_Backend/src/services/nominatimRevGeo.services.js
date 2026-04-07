import axios from "axios";

const nominatimHeaders = {
  "User-Agent": "ResQRide/1.0 (contact@resqride.in)",
};

const reverseGeocode = async (lat, long) => {
  try {
    const { data } = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: { lat, lon: long, format: "json" },
        headers: nominatimHeaders,
      },
    );
    return data.display_name ?? `${lat} , ${long}`;
  } catch {
    return `${lat}, ${long}`;
  }
};

const forwardGeocode = async (address) => {
  try {
    const { data } = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: address,
          format: "json",
          limit: 5,
          countrycodes: "in",
          addressdetails: 1,
        },
        headers: nominatimHeaders,
      },
    );
    return data.map((r) => ({
      display_name: r.display_name,
      short_name: r.display_name.split(",").slice(0, 3).join(","),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch (err) {
    console.error("forwardGeocode error:", err.message);
    return [];
  }
};

export { reverseGeocode, forwardGeocode };