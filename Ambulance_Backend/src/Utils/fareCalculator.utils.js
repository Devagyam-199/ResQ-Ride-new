const Rates = {
  basic: {
    rates: 800,
    perKM: 25,
  },
  advanced: {
    rates: 1000,
    perKM: 40,
  },
  mortuary: {
    rates: 500,
    perKM: 20,
  },
};

const haverSineCalculator = (lat1, lng1, lat2, lng2) => {
  const R = 6371;

  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fareCalculator = (distanceKm, bookingType = "Basic") => {
  const key = bookingType.toLowerCase();
  if (!Rates[key]) throw new Error(`Unknown bookingType: ${bookingType}`);
  const rate = Rates[key];
  return Math.round(rate.rates + distanceKm * rate.perKM);
};

export { haverSineCalculator, fareCalculator };
