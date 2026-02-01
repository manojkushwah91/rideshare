import { useState, useEffect } from "react";
import {
  getAvailableRides,
  acceptRide,
  startRide,
  completeRide,
  updateDriverStatus,
} from "../../api/driver.api";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Notification from "../../components/common/Notification";

const DriverDashboard = () => {
  const [availableRides, setAvailableRides] = useState([]);
  const [myRides, setMyRides] = useState([]);
  const [driverStatus, setDriverStatus] = useState("OFFLINE");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Only fetch rides when driver is ONLINE
    if (driverStatus === "ONLINE") {
      fetchAvailableRides();
      // Poll for new rides every 5 seconds when online
      const interval = setInterval(() => {
        fetchAvailableRides();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [driverStatus]);

  const fetchAvailableRides = async () => {
    try {
      const rides = await getAvailableRides();
      setAvailableRides(rides);
    } catch (err) {
      console.error("Failed to fetch available rides:", err);
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: "Failed to fetch available rides",
          type: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (rideId) => {
    try {
      const acceptedRide = await acceptRide(rideId);
      setMyRides((prev) => [...prev, acceptedRide]);
      setAvailableRides((prev) => prev.filter((ride) => ride.rideId !== rideId && ride.id !== rideId));
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: `Ride ${rideId} accepted successfully`,
          type: "success",
        },
      ]);
      // Refresh available rides
      setTimeout(() => fetchAvailableRides(), 1000);
    } catch (err) {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: err.response?.data?.message || err.message || "Failed to accept ride",
          type: "error",
        },
      ]);
    }
  };

  const handleStart = async (rideId) => {
    try {
      const updatedRide = await startRide(rideId);
      setMyRides((prev) =>
        prev.map((ride) =>
          (ride.rideId === rideId || ride.id === rideId) ? { ...ride, ...updatedRide, status: "IN_PROGRESS" } : ride
        )
      );
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: `Ride ${rideId} started`,
          type: "success",
        },
      ]);
    } catch (err) {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: err.response?.data?.message || err.message || "Failed to start ride",
          type: "error",
        },
      ]);
    }
  };

  const handleComplete = async (rideId) => {
    try {
      const completedRide = await completeRide(rideId);
      setMyRides((prev) =>
        prev.map((ride) =>
          (ride.rideId === rideId || ride.id === rideId) ? { ...ride, ...completedRide, status: "COMPLETED" } : ride
        )
      );
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: `Ride ${rideId} completed successfully`,
          type: "success",
        },
      ]);
      // Remove from my rides after a delay
      setTimeout(() => {
        setMyRides((prev) => prev.filter((ride) => ride.rideId !== rideId && ride.id !== rideId));
      }, 3000);
    } catch (err) {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: err.response?.data?.message || err.message || "Failed to complete ride",
          type: "error",
        },
      ]);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateDriverStatus(newStatus);
      setDriverStatus(newStatus);
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: `Status updated to ${newStatus}`,
          type: "success",
        },
      ]);
      // Refresh available rides when going online
      if (newStatus === "ONLINE") {
        fetchAvailableRides();
      }
    } catch (err) {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: err.response?.data?.message || err.message || "Failed to update status",
          type: "error",
        },
      ]);
    }
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getStatusColor = (status) => {
    const colors = {
      REQUESTED: "bg-yellow-100 text-yellow-800",
      ACCEPTED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) return <Loader className="min-h-screen" />;

  return (
    <div className="container mx-auto px-4 py-8">
      {notifications.map((notif) => (
        <Notification
          key={notif.id}
          message={notif.message}
          type={notif.type}
          onClose={() => removeNotification(notif.id)}
        />
      ))}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Driver Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Status:</span>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              driverStatus === "ONLINE" ? "bg-green-100 text-green-800" :
              driverStatus === "ON_RIDE" ? "bg-blue-100 text-blue-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {driverStatus}
            </span>
            <Button
              onClick={() => handleStatusChange(driverStatus === "ONLINE" ? "OFFLINE" : "ONLINE")}
              variant={driverStatus === "ONLINE" ? "danger" : "success"}
              className="whitespace-nowrap"
            >
              {driverStatus === "ONLINE" ? "Go Offline" : "Go Online"}
            </Button>
          </div>
        </div>
      </div>
      
      {driverStatus !== "ONLINE" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            <strong>⚠️ You are offline.</strong> Go online to see available ride requests.
          </p>
        </div>
      )}

      {myRides.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">My Active Rides</h2>
          <div className="space-y-4">
            {myRides.map((ride) => (
              <div
                key={ride.rideId || ride.id}
                className="border border-gray-200 p-4 rounded-lg shadow-sm bg-blue-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-semibold">
                        {ride.pickupLocation} → {ride.dropLocation}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          ride.status
                        )}`}
                      >
                        {ride.status}
                      </span>
                    </div>
                    {ride.fare && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Fare:</span> ${ride.fare}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {ride.status === "ACCEPTED" && (
                      <Button
                        onClick={() => handleStart(ride.rideId || ride.id)}
                        variant="primary"
                        className="whitespace-nowrap"
                      >
                        Start Ride
                      </Button>
                    )}
                    {ride.status === "IN_PROGRESS" && (
                      <Button
                        onClick={() => handleComplete(ride.rideId || ride.id)}
                        variant="success"
                        className="whitespace-nowrap"
                      >
                        Complete Ride
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {driverStatus === "ONLINE" && (
        <>
          <h2 className="text-2xl font-semibold mb-4">Available Rides</h2>
          {availableRides.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">No available ride requests</p>
            </div>
          ) : (
        <div className="space-y-4">
          {availableRides.map((ride) => (
            <div
              key={ride.rideId || ride.id}
              className="border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-semibold">
                      {ride.pickupLocation} → {ride.dropLocation}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        ride.status
                      )}`}
                    >
                      {ride.status || "REQUESTED"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {ride.fare && (
                      <p>
                        <span className="font-medium">Fare:</span> ${ride.fare}
                      </p>
                    )}
                    {ride.createdAt && (
                      <p>
                        <span className="font-medium">Requested:</span>{" "}
                        {new Date(ride.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {(ride.status === "REQUESTED" || !ride.status) && (
                    <Button
                      onClick={() => handleAccept(ride.rideId || ride.id)}
                      variant="success"
                      className="whitespace-nowrap"
                    >
                      Accept
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
          )}
        </>
      )}
    </div>
  );
};

export default DriverDashboard;

