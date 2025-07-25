// utils/transportCalculator.js

/**
 * Calculates the estimated transport cost based on given rules.
 *
 * @param {string} transportType - The type of transport ('taxi', 'bus/train').
 * @param {number} distanceKm - The distance of the journey in kilometers.
 * @param {object} [options={}] - Optional parameters for calculation.
 * @param {Date|number} [options.time] - For 'taxi', a Date object or hour (0-23) to determine daily/nightly rates.
 * @param {boolean} [options.isAirport=false] - For 'taxi', true if it's an airport journey.
 * @returns {number} The estimated cost in SGD, or 0 for invalid inputs.
 */
const calculateTransportCost = (transportType, distanceKm, options = {}) => {
  if (typeof distanceKm !== "number" || distanceKm < 0) {
    console.warn("Invalid distanceKm provided:", distanceKm);
    return 0;
  }

  const roundedDistance = parseFloat(distanceKm.toFixed(2)); // Round distance to 2 decimal places for consistent calculation

  switch (transportType.toLowerCase()) {
    case "taxi":
      return calculateTaxiCost(
        roundedDistance,
        options.time,
        options.isAirport
      );
    case "bus/train":
      return calculateBusTrainCost(roundedDistance);
    default:
      console.warn(`Unknown transport type: ${transportType}`);
      return 0;
  }
};

/**
 * Calculates the estimated taxi/carpool cost.
 * @param {number} distanceKm - Distance in kilometers.
 * @param {Date|number} time - Current time (Date object or hour 0-23).
 * @param {boolean} isAirport - True if airport journey.
 * @returns {number} Estimated taxi cost.
 */
const calculateTaxiCost = (distanceKm, time, isAirport) => {
  let baseFee;
  let ratePerKmTier1; // 1 to 10 km
  let ratePerKmTier2; // > 10 km

  const hour =
    typeof time === "number"
      ? time
      : time instanceof Date
      ? time.getHours()
      : -1;
  const isNightRate = hour >= 0 && hour < 6; // From midnight till 6:00 in the morning.

  if (isNightRate) {
    baseFee = 2.88;
    ratePerKmTier1 = 0.81;
    ratePerKmTier2 = 0.84;
  } else {
    baseFee = 2.3;
    ratePerKmTier1 = 0.65;
    ratePerKmTier2 = 0.74;
  }

  let cost = baseFee;

  // Calculate distance-based charges
  if (distanceKm > 0) {
    const tier1Distance = Math.min(distanceKm, 10); // Up to 10 km
    cost += tier1Distance * ratePerKmTier1;

    if (distanceKm > 10) {
      const tier2Distance = distanceKm - 10; // Everything beyond 10 km
      cost += tier2Distance * ratePerKmTier2;
    }
  }

  // Add additional fees
  if (isAirport) {
    cost += 5.0; // Airport surcharge
  }

  // Stand-/Waiting (per hour) is S$0.00 as per rules, so no calculation needed for it.

  return parseFloat(cost.toFixed(2)); // Round to 2 decimal places for currency
};

/**
 * Calculates the estimated bus/train cost based on distance.
 * @param {number} distanceKm - Distance in kilometers.
 * @returns {number} Estimated bus/train cost.
 */
const calculateBusTrainCost = (distanceKm) => {
  const MIN_DISTANCE = 0;
  const MAX_DISTANCE = 50;
  const MIN_FARE = 1.19;
  const MAX_FARE = 2.5;

  // Cap distance within the defined range
  let effectiveDistance = Math.max(
    MIN_DISTANCE,
    Math.min(distanceKm, MAX_DISTANCE)
  );

  // If distance is 0, return min fare
  if (effectiveDistance === 0) {
    return MIN_FARE;
  }

  // Linear interpolation for fare
  const fareRange = MAX_FARE - MIN_FARE;
  const distanceRange = MAX_DISTANCE - MIN_DISTANCE;

  // Avoid division by zero if distanceRange is 0 (shouldn't happen with MIN_DISTANCE=0, MAX_DISTANCE=50)
  if (distanceRange === 0) {
    return MIN_FARE;
  }

  const cost = MIN_FARE + (effectiveDistance / distanceRange) * fareRange;

  // Ensure cost stays within the min/max fare bounds due to potential floating point inaccuracies
  return parseFloat(Math.max(MIN_FARE, Math.min(cost, MAX_FARE)).toFixed(2));
};

module.exports = {
  calculateTransportCost,
  // Exporting sub-functions for testing purposes if needed
  calculateTaxiCost,
  calculateBusTrainCost,
};
