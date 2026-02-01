import api from "./axios";

/**
 * Request a new ride
 * @param {string} pickup - Pickup location
 * @param {string} drop - Drop location
 * @param {number} estimatedFare - Optional estimated fare (will be calculated if not provided)
 * @returns {Promise} Ride response
 */
export const requestRide = async (pickup, drop, estimatedFare = null) => {
  // Use createRide endpoint which actually creates a ride in the database
  // Backend should extract userId from X-USER-ID header
  // Pricing service will calculate fare via Kafka event
  const response = await api.post("/api/rides", {
    userId: 1, // Placeholder - backend should extract from X-USER-ID header
    pickupLocation: pickup,
    dropLocation: drop,
    fare: estimatedFare, // Will be calculated by pricing service if null
  });
  return response.data;
};

/**
 * Get ride status by ID
 * @param {string|number} rideId - Ride ID
 * @returns {Promise} Ride response
 */
export const getRideStatus = async (rideId) => {
  const response = await api.get(`/api/rides/${rideId}`);
  return response.data;
};

/**
 * Get all rides for current user
 * @returns {Promise} Array of rides
 */
export const getUserRides = async () => {
  // Backend should extract userId from X-USER-ID header
  const response = await api.get(`/api/rides/my-rides`);
  return response.data;
};

/**
 * Get ride by ID (alias for getRideStatus)
 */
export const getRideById = async (rideId) => {
  return getRideStatus(rideId);
};

/**
 * Book ride (legacy - uses requestRide internally)
 */
export const bookRide = async (rideData) => {
  return requestRide(rideData.pickupLocation || rideData.pickup, rideData.dropLocation || rideData.drop);
};

/**
 * Get active ride (gets latest ride for user)
 */
export const getActiveRide = async () => {
  const rides = await getUserRides();
  // Return the most recent non-completed ride
  const activeRide = rides
    .filter(ride => ride.status !== "COMPLETED" && ride.status !== "CANCELLED")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  return activeRide || null;
};

