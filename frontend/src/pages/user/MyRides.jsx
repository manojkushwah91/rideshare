import React, { useEffect, useState } from "react";
import { getUserRides } from "../../api/ride.api";
import { useKafkaEvents } from "../../utils/useKafkaEvents";
import Notification from "../../components/common/Notification";
import Loader from "../../components/common/Loader";

const MyRides = () => {
  const [rides, setRides] = useState([]);
  const rideEvents = useKafkaEvents("ride-completed");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRides() {
      try {
        const data = await getUserRides();
        setRides(data);
      } catch (err) {
        console.error("Failed to fetch rides:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRides();
  }, []);

  // PRODUCTION FIX: Filter events to ensure they belong to THIS user
  useEffect(() => {
    if (!rideEvents || rideEvents.length === 0) return;

    rideEvents.forEach((event) => {
      setRides((prevRides) => {
        // 1. Check if the event matches a ride currently in our list
        const rideExists = prevRides.some((r) => r.id === event.rideId);

        // If this event is for a ride we don't own, ignore it
        if (!rideExists) return prevRides;

        // 2. If it is our ride, show notification
        // (We do this check inside setRides to ensure we have the latest state)
        setNotifications((prevNotifs) => {
            // Avoid duplicate notifications for the same event status
            const alreadyNotified = prevNotifs.some(
                n => n.message.includes(`Ride ${event.rideId}`) && n.message.includes(event.status)
            );
            
            if (alreadyNotified) return prevNotifs;

            return [
                ...prevNotifs,
                {
                    id: Date.now() + Math.random(),
                    message: `Ride #${event.rideId} is now ${event.status}`,
                    type: "info",
                }
            ];
        });

        // 3. Update the ride status in the UI
        return prevRides.map((ride) =>
          ride.id === event.rideId
            ? { ...ride, status: event.status }
            : ride
        );
      });
    });
  }, [rideEvents]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ACCEPTED: "bg-blue-100 text-blue-800",
      STARTED: "bg-purple-100 text-purple-800",
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
      <h1 className="text-3xl font-bold mb-6">My Rides</h1>
      {rides.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No rides found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <div
              key={ride.id}
              className="border border-gray-200 p-4 my-2 rounded-lg shadow-sm hover:shadow-md transition-shadow"
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
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Distance:</span> {ride.distance ? `${ride.distance} km` : 'Calculating...'}
                    </p>
                    <p>
                      <span className="font-medium">Fare:</span> {ride.estimatedFare ? `₹${ride.estimatedFare}` : 'Calculating...'}
                    </p>
                    {ride.driver && (
                      <p>
                        <span className="font-medium">Driver:</span> {ride.driver.name} ({ride.driver.phone})
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(ride.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRides;