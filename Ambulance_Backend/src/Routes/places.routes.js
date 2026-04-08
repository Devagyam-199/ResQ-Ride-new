import { Router } from "express";
import axios from "axios";
import jwtVerify from "../Middlewares/jwtVerifier.middlewares.js";

const router = Router();

router.use(jwtVerify);

const MAPPLS_REST_KEY = process.env.MAPPLS_REST_KEY;
const MEDICAL_FILTER  = "cop:HOSP,cop:MEDC,cop:CLINIC,cop:NRSG";

const mapplsSearch = async (params) => {
  if (!MAPPLS_REST_KEY) return { suggestedLocations: [] };

  const { data } = await axios.get(
    "https://atlas.mappls.com/api/places/search/json",
    {
      params:  { ...params, rest_key: MAPPLS_REST_KEY },
      timeout: 5000,
    },
  );
  return data;
};

router.get("/search", async (req, res) => {
  const { query, lat, lng } = req.query;
  if (!query || !lat || !lng) {
    return res.status(400).json({ error: "query, lat and lng are required" });
  }

  try {
    const data = await mapplsSearch({
      query,
      region:   "IND",
      pod:      "SLC",
      bridge:   true,
      location: `${lat},${lng}`,
      zoom:     14,
    });
    return res.json(data);
  } catch (err) {
    console.error("[places/search] Mappls error:", err.message);
    return res.json({ suggestedLocations: [] });
  }
});

router.get("/hospitals", async (req, res) => {
  const { query, lat, lng } = req.query;
  if (!query || !lat || !lng) {
    return res.status(400).json({ error: "query, lat and lng are required" });
  }

  try {
    const data = await mapplsSearch({
      query,
      region:   "IND",
      pod:      "SLC",
      bridge:   true,
      filter:   MEDICAL_FILTER,
      location: `${lat},${lng}`,
      zoom:     14,
    });
    return res.json(data);
  } catch (err) {
    console.error("[places/hospitals] Mappls error:", err.message);
    return res.json({ suggestedLocations: [] });
  }
});

export default router;