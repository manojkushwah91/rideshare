import { useState, useEffect, useContext } from "react";
import { requestRide, getRideStatus, getActiveRide } from "../../api/ride.api";
import { calculateFare } from "../../api/pricing.api";
import { AuthContext } from "../../auth/AuthContext";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Notification from "../../components/common/Notification";

const BookRide = () => {
  const [formData, setFormData] = useState({
    pickup: "",
    drop: "",
  });
  const [loading, setLoading] = useState(false);
  const [calculatingFare, setCalculatingFare] = useState(false);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [polling, setPolling] = useState(false);
  const { user } = useContext(AuthContext);

  // Fetch active ride on mount
  useEffect(() => {
    const fetchActiveRide = async () => {
      try {
        const ride = await getActiveRide();
        if (ride) {
          setActiveRide(ride);
          setPolling(true);
        }
      } catch (err) {
        setActiveRide(null);
        setPolling(false);
      }
    };
    fetchActiveRide();
  }, []);

  // Poll ride status every 5 seconds if there's an active ride
  useEffect(() => {
    if (!polling || !activeRide) return;

    const rideId = activeRide.rideId || activeRide.id;
    if (!rideId) return;

    const interval = setInterval(async () => {
      try {
        const updatedRide = await getRideStatus(rideId);
        const previousStatus = activeRide?.status;
        setActiveRide(updatedRide);
        
        // Show notification when driver accepts
        if (previousStatus === "REQUESTED" && updatedRide.status === "ACCEPTED") {
          setNotifications((prev) => [
            ...prev,
            {
              id: Date.now(),
              message: "🎉 Driver found! Your ride has been accepted.",
              type: "success",
            },
          ]);
        }
        
        // Show notification when ride starts
        if (previousStatus === "ACCEPTED" && updatedRide.status === "IN_PROGRESS") {
          setNotifications((prev) => [
            ...prev,
            {
              id: Date.now(),
              message: "🚗 Ride started! Enjoy your trip.",
              type: "success",
            },
          ]);
        }
        
        // Stop polling if ride is completed or cancelled
        if (updatedRide.status === "COMPLETED" || updatedRide.status === "CANCELLED") {
          setPolling(false);
          setNotifications((prev) => [
            ...prev,
            {
              id: Date.now(),
              message: `Ride ${updatedRide.status.toLowerCase()}. ${updatedRide.status === "COMPLETED" ? "Payment processed." : ""}`,
              type: updatedRide.status === "COMPLETED" ? "success" : "info",
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to poll ride status:", err);
        // Stop polling on error
        setPolling(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [polling, activeRide]);

  // Calculate fare when both locations are filled
  useEffect(() => {
    if (formData.pickup && formData.drop && !activeRide) {
      const timer = setTimeout(async () => {
        try {
          setCalculatingFare(true);
          const fareResponse = await calculateFare({
            pickupLocation: formData.pickup,
            dropoffLocation: formData.drop,
          });
          setEstimatedFare(fareResponse.totalFare);
        } catch (err) {
          console.error("Failed to calculate fare:", err);
          // Don't show error, just don't set fare
        } finally {
          setCalculatingFare(false);
        }
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timer);
    }
  }, [formData.pickup, formData.drop, activeRide]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Reset estimated fare when locations change
    if (estimatedFare) {
      setEstimatedFare(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pickup || !formData.drop) {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: "Please enter both pickup and drop locations",
          type: "error",
        },
      ]);
      return;
    }

    setLoading(true);

    try {
      // Use estimated fare if available
      const ride = await requestRide(formData.pickup, formData.drop, estimatedFare);
      // Backend returns the created ride
      setActiveRide(ride);
      setPolling(true);
      setEstimatedFare(null); // Reset fare after booking
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: "Ride requested successfully! Waiting for driver...",
          type: "success",
        },
      ]);
      setFormData({ pickup: "", drop: "" });
    } catch (err) {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: err.response?.data?.message || err.message || "Failed to request ride",
          type: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {notifications.map((notif) => (
        <Notification
          key={notif.id}
          message={notif.message}
          type={notif.type}
          onClose={() => removeNotification(notif.id)}
        />
      ))}

      <h1 className="text-3xl font-bold mb-6">Book a Ride</h1>

      {activeRide ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Ride Status</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Ride ID:</span> {activeRide.rideId || activeRide.id}
            </p>
            <p>
              <span className="font-medium">From:</span> {activeRide.pickupLocation}
            </p>
            <p>
              <span className="font-medium">To:</span> {activeRide.dropLocation}
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                activeRide.status === "REQUESTED" ? "bg-yellow-100 text-yellow-800" :
                activeRide.status === "ACCEPTED" ? "bg-blue-100 text-blue-800" :
                activeRide.status === "IN_PROGRESS" ? "bg-purple-100 text-purple-800" :
                activeRide.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {activeRide.status}
              </span>
            </p>
            {activeRide.status === "REQUESTED" && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  🔍 Searching for available drivers...
                </p>
              </div>
            )}
            {activeRide.status === "ACCEPTED" && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800 font-semibold">
                  ✅ Driver Found! Your driver is on the way.
                </p>
              </div>
            )}
            {activeRide.driverId && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Driver ID:</span> {activeRide.driverId}
              </p>
            )}
            {activeRide.fare && (
              <p>
                <span className="font-medium">Fare:</span> ${activeRide.fare}
              </p>
            )}
            {polling && (
              <p className="text-sm text-gray-500 italic">
                Auto-updating status every 5 seconds...
              </p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Location
            </label>
            <input
              type="text"
              name="pickup"
              value={formData.pickup}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter pickup location"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drop Location
            </label>
            <input
              type="text"
              name="drop"
              value={formData.drop}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter drop location"
            />
          </div>
          
          {/* Estimated Fare Display */}
          {calculatingFare && (
            <div className="text-sm text-gray-500">
              Calculating fare...
            </div>
          )}
          {estimatedFare && !calculatingFare && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800">
                Estimated Fare: <span className="text-lg font-bold">${estimatedFare.toFixed(2)}</span>
              </p>
            </div>
          )}
          
          <Button type="submit" disabled={loading || calculatingFare} className="w-full">
            {loading ? <Loader size="sm" /> : "Book Ride"}
          </Button>
        </form>
      )}
    </div>
  );
};

export default BookRide;

