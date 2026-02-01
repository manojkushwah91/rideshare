import { useState, useEffect } from "react";
import {
  getAllRides,
  getAllUsers,
  getAllDrivers,
  getAdminStats,
  updateUserStatus,
  updateDriverStatus as updateDriverStatusAPI,
} from "../../api/admin.api";
import { useKafkaEvents } from "../../utils/useKafkaEvents";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Notification from "../../components/common/Notification";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [rides, setRides] = useState([]);
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const adminEvents = useKafkaEvents("admin-events");
  const rideEvents = useKafkaEvents("ride-updates");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    adminEvents.forEach((event) => {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: event.message || "Admin event received",
          type: "info",
        },
      ]);
    });
  }, [adminEvents]);

  useEffect(() => {
    rideEvents.forEach((event) => {
      if (activeTab === "rides") {
        setRides((prev) =>
          prev.map((ride) =>
            ride.id === event.rideId
              ? { ...ride, status: event.status }
              : ride
          )
        );
      }
    });
  }, [rideEvents, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        const statsData = await getAdminStats();
        setStats(statsData);
      } else if (activeTab === "rides") {
        const ridesData = await getAllRides();
        setRides(ridesData);
      } else if (activeTab === "users") {
        const usersData = await getAllUsers();
        setUsers(usersData);
      } else if (activeTab === "drivers") {
        const driversData = await getAllDrivers();
        setDrivers(driversData);
      }
    } catch (err) {
      console.error(err);
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: "Failed to fetch data",
          type: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatusChange = async (userId, status) => {
    try {
      await updateUserStatus(userId, status);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status } : user
        )
      );
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: `User ${userId} status updated to ${status}`,
          type: "success",
        },
      ]);
    } catch (err) {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: err.response?.data?.message || "Failed to update user status",
          type: "error",
        },
      ]);
    }
  };

  const handleDriverStatusChange = async (driverId, status) => {
    try {
      await updateDriverStatusAPI(driverId, status);
      setDrivers((prev) =>
        prev.map((driver) =>
          driver.id === driverId ? { ...driver, status } : driver
        )
      );
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: `Driver ${driverId} status updated to ${status}`,
          type: "success",
        },
      ]);
    } catch (err) {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: err.response?.data?.message || "Failed to update driver status",
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
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      SUSPENDED: "bg-red-100 text-red-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      ACCEPTED: "bg-blue-100 text-blue-800",
      STARTED: "bg-purple-100 text-purple-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

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

      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-medium ${
            activeTab === "overview"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("rides")}
          className={`px-4 py-2 font-medium ${
            activeTab === "rides"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Rides
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-medium ${
            activeTab === "users"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("drivers")}
          className={`px-4 py-2 font-medium ${
            activeTab === "drivers"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Drivers
        </button>
      </div>

      {loading ? (
        <Loader className="min-h-screen" />
      ) : (
        <>
          {activeTab === "overview" && stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalUsers || 0}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Total Drivers</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalDrivers || 0}</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Total Rides</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalRides || 0}</p>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-yellow-600">₹{stats.totalRevenue || 0}</p>
              </div>
            </div>
          )}

          {activeTab === "rides" && (
            <div className="space-y-4">
              {rides.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-lg">No rides found</p>
                </div>
              ) : (
                rides.map((ride) => (
                  <div
                    key={ride.id}
                    className="border border-gray-200 p-4 rounded-lg shadow-sm"
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
                            <span className="font-medium">Distance:</span> {ride.distance} km
                          </p>
                          <p>
                            <span className="font-medium">Fare:</span> ₹{ride.estimatedFare}
                          </p>
                          {ride.user && (
                            <p>
                              <span className="font-medium">User:</span> {ride.user.name}
                            </p>
                          )}
                          {ride.driver && (
                            <p>
                              <span className="font-medium">Driver:</span> {ride.driver.name}
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
                ))
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Phone</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="px-4 py-2 text-sm">{user.id}</td>
                      <td className="px-4 py-2 text-sm">{user.name}</td>
                      <td className="px-4 py-2 text-sm">{user.email}</td>
                      <td className="px-4 py-2 text-sm">{user.phone}</td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            user.status
                          )}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <select
                          value={user.status}
                          onChange={(e) => handleUserStatusChange(user.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "drivers" && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Phone</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver.id} className="border-t">
                      <td className="px-4 py-2 text-sm">{driver.id}</td>
                      <td className="px-4 py-2 text-sm">{driver.name}</td>
                      <td className="px-4 py-2 text-sm">{driver.email}</td>
                      <td className="px-4 py-2 text-sm">{driver.phone}</td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            driver.status
                          )}`}
                        >
                          {driver.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <select
                          value={driver.status}
                          onChange={(e) => handleDriverStatusChange(driver.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

