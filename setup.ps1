# AR Food Ordering System - Quick Start Script

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  AR Food Ordering System - Quick Start" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "Checking MongoDB service..." -ForegroundColor Yellow
$mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue

if ($null -eq $mongoService) {
    Write-Host "❌ MongoDB service not found!" -ForegroundColor Red
    Write-Host "Please install MongoDB first:" -ForegroundColor Yellow
    Write-Host "  Download from: https://www.mongodb.com/try/download/community" -ForegroundColor White
    exit 1
}

if ($mongoService.Status -ne "Running") {
    Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
    Start-Service MongoDB
    Start-Sleep -Seconds 2
}

Write-Host "✅ MongoDB is running" -ForegroundColor Green
Write-Host ""

# Setup Backend
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setting up Backend" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$backendPath = "c:\Users\Praveen\OneDrive\Desktop\3D food\ar-food-backend"
Set-Location $backendPath

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}

# Seed database
Write-Host "Seeding database with sample food items..." -ForegroundColor Yellow
node seed.js

Write-Host "✅ Backend setup complete" -ForegroundColor Green
Write-Host ""

# Setup Frontend
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setting up Frontend" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$frontendPath = "c:\Users\Praveen\OneDrive\Desktop\3D food\ar-food-app"
Set-Location $frontendPath

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "✅ Frontend setup complete" -ForegroundColor Green
Write-Host ""

# Display instructions
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! 🎉" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start Backend (Terminal 1):" -ForegroundColor White
Write-Host "   cd `"$backendPath`"" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start Frontend (Terminal 2):" -ForegroundColor White
Write-Host "   cd `"$frontendPath`"" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Login Credentials:" -ForegroundColor White
Write-Host "   Admin Phone: 8148545814" -ForegroundColor Cyan
Write-Host "   OTP: Check browser console (dev mode)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Access URLs:" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Gray
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
