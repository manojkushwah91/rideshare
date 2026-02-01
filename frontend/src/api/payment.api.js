import api from "./axios";

export const processPayment = async (rideId, paymentData) => {
  const response = await api.post(`/api/payments/rides/${rideId}`, paymentData);
  return response.data;
};

export const getPaymentHistory = async () => {
  const response = await api.get("/api/payments/me/history");
  return response.data;
};

export const getPaymentByRideId = async (rideId) => {
  const response = await api.get(`/api/payments/rides/${rideId}`);
  return response.data;
};

/**
 * Add money to wallet
 * @param {Object} data - { amount: number }
 * @returns {Promise} Transaction response
 */
export const addMoneyToWallet = async (data) => {
  const response = await api.post("/api/payments/add-money", data);
  return response.data;
};

