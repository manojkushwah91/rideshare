import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ✅ PROFESSIONAL: Lazy initialization with Error Handling
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      // Check if string is valid and not "undefined"
      if (storedUser && storedUser !== "undefined") {
        return JSON.parse(storedUser);
      }
      return null;
    } catch (error) {
      console.warn("Corrupt user data in local storage, resetting...", error);
      localStorage.removeItem("user"); // Auto-clean bad data
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // ✅ PROFESSIONAL: Centralized Login Method
  const login = (userData, token) => {
    if (!userData) return;
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};