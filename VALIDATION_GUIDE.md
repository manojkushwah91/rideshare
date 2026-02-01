# RideShare System Validation Guide

## Prerequisites

1. **Docker Desktop must be running**
2. **Port conflicts resolved**:
   - Port 3306 (MySQL) - Stop any local MySQL instance
   - Port 8080 (API Gateway)
   - Port 3000 (Frontend)
   - Port 8761 (Eureka)
   - Ports 8082-8088 (Microservices)

## Step 1: Start All Services

```bash
cd ride-sharing-platform
docker-compose up -d --build
```

Wait for all services to be healthy (2-3 minutes):
```bash
docker-compose ps
```

All services should show "Up" status.

## Step 2: Verify Service Health

### Check API Gateway
```bash
curl http://localhost:8080/actuator/health
```

### Check Eureka Dashboard
Open browser: http://localhost:8761
- Verify all services are registered:
  - api-gateway
  - auth-service
  - ride-service
  - driver-service
  - payment-service
  - notification-service
  - user-service
  - pricing-service

### Check Frontend
Open browser: http://localhost:3000
- Frontend should load without errors

## Step 3: Run Automated Validation

### For Linux/Mac:
```bash
chmod +x validate-system.sh
./validate-system.sh
```

### For Windows (PowerShell):
```powershell
.\validate-system.ps1
```

## Step 4: Manual Testing

### 3.1 Authentication Test

**Register User:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@rideshare.com",
    "password": "Test123!",
    "name": "Test User",
    "phone": "1234567890",
    "role": "USER"
  }'
```

**Expected Response:**
```json
{
  "email": "testuser@rideshare.com",
  "role": "USER",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Register Driver:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@rideshare.com",
    "password": "Driver123!",
    "name": "Test Driver",
    "phone": "9876543210",
    "role": "DRIVER"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@rideshare.com",
    "password": "Test123!"
  }'
```

Save the token from response as `USER_TOKEN`.

### 3.2 Ride Request Flow

**Create Ride:**
```bash
curl -X POST http://localhost:8080/api/rides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "pickupLocation": "123 Main St",
    "dropLocation": "456 Oak Ave",
    "fare": null
  }'
```

**Expected:**
- Status: `REQUESTED`
- `rideId` or `id` in response
- Check notification-service logs: `docker logs notification-service | grep "ride.requested"`

### 3.3 Driver Flow

**Get Available Rides:**
```bash
curl -X GET http://localhost:8080/drivers/rides/available \
  -H "Authorization: Bearer $DRIVER_TOKEN"
```

**Accept Ride:**
```bash
curl -X PUT http://localhost:8080/drivers/rides/{RIDE_ID}/accept \
  -H "Authorization: Bearer $DRIVER_TOKEN"
```

**Expected:**
- Status changes to `ACCEPTED`
- `driverId` is saved
- Check logs: `docker logs notification-service | grep "ride.accepted"`

**Start Ride:**
```bash
curl -X PUT http://localhost:8080/api/rides/{RIDE_ID}/start \
  -H "Authorization: Bearer $DRIVER_TOKEN"
```

**Expected:** Status changes to `IN_PROGRESS`

**Complete Ride:**
```bash
curl -X PUT http://localhost:8080/api/rides/{RIDE_ID}/complete \
  -H "Authorization: Bearer $DRIVER_TOKEN"
```

**Expected:**
- Status changes to `COMPLETED`
- Payment service processes payment
- Notification sent

### 3.4 Payment & Event Flow Verification

**Check Payment Service Logs:**
```bash
docker logs payment-service | grep -i "ride.completed\|payment"
```

**Expected:**
- Payment processed for ride
- `payment.completed` event published

**Check Notification Service Logs:**
```bash
docker logs notification-service | tail -50
```

**Expected Events:**
- `ride.requested` - When ride is created
- `ride.accepted` - When driver accepts
- `ride.completed` - When ride is completed
- `payment.completed` - When payment is processed

### 3.5 Database Verification

**Check Users:**
```bash
docker exec mysql mysql -uroot -p'Manoj@8719895574' rideshare_db -e "SELECT * FROM user_auth WHERE email IN ('testuser@rideshare.com', 'driver@rideshare.com');"
```

**Check Rides:**
```bash
docker exec mysql mysql -uroot -p'Manoj@8719895574' rideshare_db -e "SELECT id, user_id, driver_id, status, pickup_location, drop_location, fare FROM ride ORDER BY created_at DESC LIMIT 5;"
```

**Expected:**
- Rides with status: REQUESTED → ACCEPTED → IN_PROGRESS → COMPLETED
- `driver_id` populated when accepted

**Check Payments:**
```bash
docker exec mysql mysql -uroot -p'Manoj@8719895574' rideshare_db -e "SELECT * FROM payment_transaction ORDER BY created_at DESC LIMIT 5;"
```

**Expected:**
- Payment records with status `SUCCESS`
- `ride_id` matches completed ride

### 3.6 Frontend Testing

1. Open http://localhost:3000
2. Register a new user
3. Login with credentials
4. Request a ride (pickup & drop locations)
5. Verify ride status shows as "REQUESTED"
6. Login as driver (different browser/incognito)
7. See available rides
8. Accept the ride
9. Start the ride
10. Complete the ride
11. Verify payment processed
12. Check notifications appear

## Step 5: Service Logs Review

### Check All Service Logs:
```bash
# API Gateway
docker logs api-gateway --tail 50

# Auth Service
docker logs auth-service --tail 50

# Ride Service
docker logs ride-service --tail 50

# Driver Service
docker logs driver-service --tail 50

# Payment Service
docker logs payment-service --tail 50

# Notification Service
docker logs notification-service --tail 50
```

## Expected Log Patterns

### Notification Service:
```
📢 Notification: Ride requested by user {userId}
📢 Notification: Ride {rideId} accepted for user {userId}
📢 Notification: Ride completed for user {userId}
📢 Notification sent for Ride {rideId} Payment Status: SUCCESS
```

### Payment Service:
```
💰 Processing payment for ride {rideId}, user {userId}, amount {fare}
💰 Payment already processed for ride {rideId}  (if duplicate)
```

### Ride Service:
```
Ride {rideId} created with status REQUESTED
Ride {rideId} accepted by driver {driverId}
Ride {rideId} started
Ride {rideId} completed
```

## Troubleshooting

### Port Conflicts:
- Stop local MySQL: `net stop MySQL80` (Windows) or `sudo service mysql stop` (Linux)
- Change ports in `docker-compose.yml` if needed

### Services Not Starting:
```bash
docker-compose logs [service-name]
```

### Database Connection Issues:
- Verify MySQL container is running: `docker ps | grep mysql`
- Check MySQL logs: `docker logs mysql`

### Kafka Issues:
- Verify Zookeeper and Kafka are running
- Check Kafka logs: `docker logs kafka`

## Success Criteria

✅ All containers running and healthy
✅ User and driver can register/login
✅ JWT tokens work for protected endpoints
✅ Ride can be created with REQUESTED status
✅ Driver can see available rides
✅ Driver can accept ride (status → ACCEPTED, driverId saved)
✅ Driver can start ride (status → IN_PROGRESS)
✅ Driver can complete ride (status → COMPLETED)
✅ Payment service processes payment on completion
✅ Notification service receives all events
✅ Database contains correct data
✅ Frontend loads and communicates with backend
✅ No duplicate payments
✅ All Kafka events flow correctly

## Final Verdict

If all criteria pass:
**✅ FULL RIDE SHARE SYSTEM WORKS**

If any criteria fail:
- Document the failure
- Check service logs
- Verify network connectivity
- Check database state
- Verify Kafka topics

