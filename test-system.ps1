# Simple RideShare System Test Script
$ErrorActionPreference = "Continue"

$API = "http://localhost:8080"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "RideShare System Validation" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check Services
Write-Host "Step 1: Checking Docker Services..." -ForegroundColor Yellow
docker-compose ps
Write-Host ""

# Test 2: Register User
Write-Host "Step 2: Registering User..." -ForegroundColor Yellow
try {
    $userBody = @{
        email = "testuser@test.com"
        password = "Test123!"
        name = "Test User"
        phone = "1234567890"
        role = "USER"
    } | ConvertTo-Json
    
    $userResponse = Invoke-RestMethod -Uri "$API/api/auth/register" -Method Post -ContentType "application/json" -Body $userBody
    $userToken = $userResponse.token
    Write-Host "✓ User registered. Token: $($userToken.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "✗ User registration failed: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Register Driver
Write-Host "Step 3: Registering Driver..." -ForegroundColor Yellow
try {
    $driverBody = @{
        email = "driver@test.com"
        password = "Driver123!"
        name = "Test Driver"
        phone = "9876543210"
        role = "DRIVER"
    } | ConvertTo-Json
    
    $driverResponse = Invoke-RestMethod -Uri "$API/api/auth/register" -Method Post -ContentType "application/json" -Body $driverBody
    $driverToken = $driverResponse.token
    Write-Host "✓ Driver registered. Token: $($driverToken.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "✗ Driver registration failed: $_" -ForegroundColor Red
    exit 1
}

# Test 4: Create Ride
Write-Host "Step 4: Creating Ride..." -ForegroundColor Yellow
try {
    $rideBody = @{
        pickupLocation = "123 Main St"
        dropLocation = "456 Oak Ave"
        fare = $null
    } | ConvertTo-Json
    
    $rideResponse = Invoke-RestMethod -Uri "$API/api/rides" -Method Post -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $userToken" } -Body $rideBody
    $rideId = $rideResponse.rideId
    if (-not $rideId) { $rideId = $rideResponse.id }
    
    Write-Host "✓ Ride created. ID: $rideId, Status: $($rideResponse.status)" -ForegroundColor Green
    
    if ($rideResponse.status -ne "REQUESTED") {
        Write-Host "✗ Ride status should be REQUESTED, got: $($rideResponse.status)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Ride creation failed: $_" -ForegroundColor Red
    exit 1
}

# Test 5: Get Available Rides
Write-Host "Step 5: Getting Available Rides..." -ForegroundColor Yellow
try {
    $availableRides = Invoke-RestMethod -Uri "$API/drivers/rides/available" -Method Get -Headers @{ "Authorization" = "Bearer $driverToken" }
    Write-Host "✓ Available rides retrieved: $($availableRides.Count)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get available rides: $_" -ForegroundColor Red
}

# Test 6: Accept Ride
Write-Host "Step 6: Driver Accepting Ride..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    $acceptResponse = Invoke-RestMethod -Uri "$API/drivers/rides/$rideId/accept" -Method Put -Headers @{ "Authorization" = "Bearer $driverToken" }
    Write-Host "✓ Ride accepted. Status: $($acceptResponse.status)" -ForegroundColor Green
    
    if ($acceptResponse.status -ne "ACCEPTED") {
        Write-Host "✗ Ride status should be ACCEPTED, got: $($acceptResponse.status)" -ForegroundColor Red
    }
    if (-not $acceptResponse.driverId) {
        Write-Host "✗ Driver ID not saved" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Ride acceptance failed: $_" -ForegroundColor Red
}

# Test 7: Start Ride
Write-Host "Step 7: Driver Starting Ride..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    $startResponse = Invoke-RestMethod -Uri "$API/api/rides/$rideId/start" -Method Put -Headers @{ "Authorization" = "Bearer $driverToken" }
    Write-Host "✓ Ride started. Status: $($startResponse.status)" -ForegroundColor Green
    
    if ($startResponse.status -ne "IN_PROGRESS") {
        Write-Host "✗ Ride status should be IN_PROGRESS, got: $($startResponse.status)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Ride start failed: $_" -ForegroundColor Red
}

# Test 8: Complete Ride
Write-Host "Step 8: Driver Completing Ride..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    $completeResponse = Invoke-RestMethod -Uri "$API/api/rides/$rideId/complete" -Method Put -Headers @{ "Authorization" = "Bearer $driverToken" }
    Write-Host "✓ Ride completed. Status: $($completeResponse.status)" -ForegroundColor Green
    
    if ($completeResponse.status -ne "COMPLETED") {
        Write-Host "✗ Ride status should be COMPLETED, got: $($completeResponse.status)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Ride completion failed: $_" -ForegroundColor Red
}

# Test 9: Check Logs
Write-Host "Step 9: Checking Service Logs..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
$paymentLogs = docker logs payment-service 2>&1 | Select-Object -Last 10
$notificationLogs = docker logs notification-service 2>&1 | Select-Object -Last 10

if ($paymentLogs -match "ride.completed|Payment|payment") {
    Write-Host "✓ Payment service processed ride completion" -ForegroundColor Green
} else {
    Write-Host "✗ Payment service may not have processed ride" -ForegroundColor Yellow
}

if ($notificationLogs -match "ride|notification|Notification") {
    Write-Host "✓ Notification service received events" -ForegroundColor Green
} else {
    Write-Host "✗ Notification service may not have received events" -ForegroundColor Yellow
}

# Test 10: Database Check
Write-Host "Step 10: Checking Database..." -ForegroundColor Yellow
try {
    $userCount = docker exec mysql mysql -uroot -p'Manoj@8719895574' rideshare_db -e "SELECT COUNT(*) FROM user_auth;" 2>$null | Select-Object -Last 1
    $rideCount = docker exec mysql mysql -uroot -p'Manoj@8719895574' rideshare_db -e "SELECT COUNT(*) FROM ride WHERE status='COMPLETED';" 2>$null | Select-Object -Last 1
    $paymentCount = docker exec mysql mysql -uroot -p'Manoj@8719895574' rideshare_db -e "SELECT COUNT(*) FROM payment_transaction WHERE status='SUCCESS';" 2>$null | Select-Object -Last 1
    
    Write-Host "✓ Users in DB: $userCount" -ForegroundColor Green
    Write-Host "✓ Completed rides in DB: $rideCount" -ForegroundColor Green
    Write-Host "✓ Successful payments in DB: $paymentCount" -ForegroundColor Green
} catch {
    Write-Host "✗ Database check failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Validation Complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Eureka: http://localhost:8761" -ForegroundColor Yellow
Write-Host "API Gateway: http://localhost:8080" -ForegroundColor Yellow
Write-Host ""

