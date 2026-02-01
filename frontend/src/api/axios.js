import axios from "axios";

// API Base URL: Browser makes requests to exposed API Gateway port
// In Docker: API Gateway is exposed on host port 8080
// In development: Also uses localhost:8080
// Can be overridden with VITE_API_BASE_URL build-time environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== "/login") {
         localStorage.removeItem("token");
         localStorage.removeItem("user");
         window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

