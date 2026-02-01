# RideShare Frontend

A complete React frontend for the RideShare microservices backend, featuring JWT authentication, real-time Kafka events, notifications, and comprehensive user, driver, and admin interfaces.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router v6** - Routing
- **React Context API** - State management
- **Axios** - HTTP client
- **WebSocket** - Real-time Kafka events

## Features

- ✅ JWT Authentication with protected routes
- ✅ Real-time Kafka event handling via WebSocket
- ✅ User pages: Book Ride, My Rides, Profile
- ✅ Driver Dashboard: Accept/Reject rides, Start/Complete rides, Status management
- ✅ Admin Dashboard: User/Driver management, Ride monitoring, Statistics
- ✅ Loading states on all API calls
- ✅ Real-time notifications
- ✅ Responsive UI with Tailwind CSS

## Project Structure

```
rideshare-frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/              # API service layer
│   ├── auth/             # Authentication context & protected routes
│   ├── components/       # Reusable components
│   │   ├── layout/       # Navbar, Footer
│   │   └── common/       # Button, Loader, Notification
│   ├── pages/            # Page components
│   │   ├── auth/         # Login, Register
│   │   ├── user/         # BookRide, MyRides, Profile
│   │   ├── driver/       # DriverDashboard
│   │   └── admin/        # AdminDashboard
│   ├── routes/           # App routing
│   ├── utils/            # Utility functions
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Configuration

The frontend is configured to connect to the backend API Gateway at `http://localhost:8080`. Update the base URL in `src/api/axios.js` if your backend runs on a different port.

WebSocket connections for Kafka events are configured to connect to `ws://localhost:8080/kafka/{topic}`. Update the WebSocket URL in `src/utils/useKafkaEvents.js` if needed.

## API Endpoints

The frontend expects the following backend endpoints:

### Auth Service
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `PUT /api/auth/profile`

### Ride Service
- `POST /api/rides`
- `GET /api/rides/my-rides`
- `GET /api/rides/{id}`
- `GET /api/rides/active`
- `PUT /api/rides/{id}/cancel`

### Driver Service
- `GET /api/drivers/rides`
- `PUT /api/drivers/rides/{id}/accept`
- `PUT /api/drivers/rides/{id}/reject`
- `PUT /api/drivers/rides/{id}/start`
- `PUT /api/drivers/rides/{id}/complete`
- `PUT /api/drivers/status`
- `GET /api/drivers/stats`

### Admin Service
- `GET /api/admin/rides`
- `GET /api/admin/users`
- `GET /api/admin/drivers`
- `GET /api/admin/stats`
- `PUT /api/admin/users/{id}/status`
- `PUT /api/admin/drivers/{id}/status`

### Payment Service
- `POST /api/payments/rides/{id}`
- `GET /api/payments/history`
- `GET /api/payments/rides/{id}`

## Kafka Topics

The frontend listens to the following Kafka topics via WebSocket:

- `ride-requests` - New ride requests for drivers
- `ride-updates` - Ride status updates
- `ride-completed` - Completed ride notifications
- `admin-events` - Admin-related events

## Usage

### User Flow
1. Register/Login
2. Book a ride with pickup and drop locations
3. View active ride status in real-time
4. View ride history in "My Rides"

### Driver Flow
1. Login as a driver
2. Go to Driver Dashboard
3. Set status to "ONLINE" to receive ride requests
4. Accept/Reject incoming ride requests
5. Start and complete rides
6. View statistics and earnings

### Admin Flow
1. Login as admin
2. Access Admin Dashboard
3. View overview statistics
4. Monitor all rides
5. Manage users and drivers
6. Update user/driver statuses

## Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## Development

The app uses:
- **Hot Module Replacement (HMR)** for fast development
- **ESLint** for code quality (if configured)
- **Tailwind JIT** for optimized CSS

## Notes

- JWT tokens are stored in localStorage
- Protected routes automatically redirect to login if not authenticated
- Role-based access control for driver and admin pages
- WebSocket connections automatically reconnect on disconnect
- All API calls include JWT tokens in the Authorization header

