import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../auth/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold">
            RideShare
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {user.role === "USER" && (
                  <>
                    <Link
                      to="/book-ride"
                      className="hover:text-blue-200 transition-colors"
                    >
                      Book Ride
                    </Link>
                    <Link
                      to="/my-rides"
                      className="hover:text-blue-200 transition-colors"
                    >
                      My Rides
                    </Link>
                    <Link
                      to="/wallet"
                      className="hover:text-blue-200 transition-colors"
                    >
                      Wallet
                    </Link>
                  </>
                )}
                {user.role === "DRIVER" && (
                  <Link
                    to="/driver-dashboard"
                    className="hover:text-blue-200 transition-colors"
                  >
                    Driver Dashboard
                  </Link>
                )}
                {user.role === "ADMIN" && (
                  <Link
                    to="/admin-dashboard"
                    className="hover:text-blue-200 transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="hover:text-blue-200 transition-colors"
                >
                  Profile
                </Link>
                <span className="text-blue-200">({user.email})</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hover:text-blue-200 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

