import api from "./axios";

/**
 * Get available rides for drivers
 * @returns {Promise} Array of available rides
 */
export const getAvailableRides = async () => {
  const response = await api.get("/api/rides/available");
  return response.data;
};

/**
 * Accept a ride
 * @param {string|number} rideId - Ride ID to accept
 * @returns {Promise} Updated ride response
 */
export const acceptRide = async (rideId) => {
  const response = await api.put(`/api/drivers/rides/${rideId}/accept`);
  return response.data;
};

/**
 * Start a ride
 * @param {string|number} rideId - Ride ID to start
 * @returns {Promise} Updated ride response
 */
export const startRide = async (rideId) => {
  const response = await api.put(`/api/rides/${rideId}/start`);
  return response.data;
};

/**
 * Complete a ride
 * @param {string|number} rideId - Ride ID to complete
 * @returns {Promise} Updated ride response
 */
export const completeRide = async (rideId) => {
  const response = await api.put(`/api/rides/${rideId}/complete`);
  return response.data;
};

/**
 * Get driver's rides (legacy support)
 */
export const getDriverRides = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const driverId = user?.email || user?.id;
  const response = await api.get(`/api/rides/driver/${driverId}`);
  return response.data;
};

/**
 * Update driver status
 * @param {string} status - Driver status (ONLINE, OFFLINE, ON_RIDE)
 * @returns {Promise} Updated driver profile
 */
export const updateDriverStatus = async (status) => {
  const response = await api.put("/api/drivers/me/status", { status });
  return response.data;
};

