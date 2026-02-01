import api from "./axios";

export const login = async (email, password) => {
  const response = await api.post("/api/auth/login", { email, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post("/api/auth/register", userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/api/auth/me");
  return response.data;
};

export const updateProfile = async (userData) => {
  const response = await api.put("/api/auth/profile", userData);
  return response.data;
};

