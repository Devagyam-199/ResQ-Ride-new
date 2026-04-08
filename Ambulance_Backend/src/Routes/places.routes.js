// Ambulance_Backend/src/routes/places.routes.js
//
// Proxies Mappls REST API calls so the secret REST key never reaches the browser
// and CORS is bypassed (the request comes from your server, not the user's browser).
//
// Register in your main router file with:
//   import placesRouter from "./routes/places.routes.js";
//   app.use("/api/v1/places", placesRouter);

import { Router } from "express";
import axios from "axios";

const router = Router();

const MAPPLS_REST_KEY = process.env.MAPPLS_REST_KEY; // add this to your .env
const MEDICAL_FILTER  = "cop:HOSP,cop:MEDC,cop:CLINIC,cop:NRSG";

// GET /api/v1/places/search?query=...&lat=...&lng=...
// General address search (used by pickup field)
router.get("/search", async (req, res) => {
  const { query, lat, lng } = req.query;

  if (!query || !lat || !lng) {
    return res.status(400).json({ error: "query, lat and lng are required" });
  }

  try {
    const { data } = await axios.get(
      "https://atlas.mappls.com/api/places/search/json",
      {
        params: {
          query,
          rest_key: MAPPLS_REST_KEY,
          region:   "IND",
          pod:      "SLC",
          bridge:   true,
          location: `${lat},${lng}`,
          zoom:     14,
        },
      },
    );
    return res.json(data);
  } catch (err) {
    console.error("[places/search] Mappls error:", err.message);
    return res.status(502).json({ error: "Upstream search failed" });
  }
});

// GET /api/v1/places/hospitals?query=...&lat=...&lng=...
// Medical-only search with Mappls category filter (used by drop/hospital field)
router.get("/hospitals", async (req, res) => {
  const { query, lat, lng } = req.query;

  if (!query || !lat || !lng) {
    return res.status(400).json({ error: "query, lat and lng are required" });
  }

  try {
    const { data } = await axios.get(
      "https://atlas.mappls.com/api/places/search/json",
      {
        params: {
          query,
          rest_key: MAPPLS_REST_KEY,
          region:   "IND",
          pod:      "SLC",
          bridge:   true,
          filter:   MEDICAL_FILTER,
          location: `${lat},${lng}`,
          zoom:     14,
        },
      },
    );
    return res.json(data);
  } catch (err) {
    console.error("[places/hospitals] Mappls error:", err.message);
    return res.status(502).json({ error: "Upstream hospital search failed" });
  }
});

export default router;