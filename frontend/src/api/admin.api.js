import api from "./axios";

export const getAllRides = async () => {
  const response = await api.get("/api/admin/rides");
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get("/api/admin/users");
  return response.data;
};

export const getAllDrivers = async () => {
  const response = await api.get("/api/admin/drivers");
  return response.data;
};

export const getAdminStats = async () => {
  const response = await api.get("/api/admin/stats");
  return response.data;
};

export const updateUserStatus = async (userId, status) => {
  const response = await api.put(`/api/admin/users/${userId}/status`, { status });
  return response.data;
};

export const updateDriverStatus = async (driverId, status) => {
  const response = await api.put(`/api/admin/drivers/${driverId}/status`, { status });
  return response.data;
};

