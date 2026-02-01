import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../auth/AuthContext";
import { login as loginApi } from "../../api/auth.api";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Notification from "../../components/common/Notification";

// ✅ CONFIGURATION: Define routes here (easy to maintain)
const DASHBOARD_ROUTES = {
  DRIVER: "/driver-dashboard",
  ADMIN: "/admin-dashboard",
  USER: "/book-ride",
  // Easy to add new roles later:
  // SUPPORT: "/support-dashboard"
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState(null);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginApi(email, password);

      // Backend returns: { email, role, token }
      const user = {
        email: response.email,
        role: response.role,
      };
      const token = response.token;

      if (!user || !user.role || !token) {
        throw new Error("Invalid server response: Missing user data or token.");
      }

      // Update Context
      login(user, token);
      setNotification({ message: "Login successful!", type: "success" });

      // ✅ LOGIC: Determine route based on config, default to USER route
      const targetRoute = DASHBOARD_ROUTES[user.role] || DASHBOARD_ROUTES.USER;

      // Small delay for UX (optional), then redirect
      setTimeout(() => {
        navigate(targetRoute);
      }, 800);

    } catch (err) {
      console.error("Login Error:", err);
      const errorMessage =
        err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
      setNotification({ message: errorMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader size="sm" /> : "Login"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;