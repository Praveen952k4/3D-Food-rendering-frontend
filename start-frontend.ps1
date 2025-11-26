# Start Frontend Application

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Starting AR Food Frontend Application" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$frontendPath = "c:\Users\Praveen\OneDrive\Desktop\3D food\ar-food-app"
Set-Location $frontendPath

Write-Host "Frontend Path: $frontendPath" -ForegroundColor Gray
Write-Host "Starting React app on port 3000..." -ForegroundColor Yellow
Write-Host ""

npm start
