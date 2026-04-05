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

const haverSinerCalculator = (lat1, lat2, long1, long2) => {
  const Radius = 6137;
  const delLat = ((lat2 - lat1) * Math.PI) / 180;
  const delLong = ((long2 - long1) * Math.PI) / 180;

  const a =
    Math.sin(delLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(delLong / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a) * Math.sqrt(a - 1));
};

const fareCalculator = (distancekm, bookingType = "Basic") => {
  const rate = Rates[bookingType] ?? Rates.basic;
  return Math.round(rate.rates + distancekm * perKM);
};

export { haverSinerCalculator, fareCalculator };
