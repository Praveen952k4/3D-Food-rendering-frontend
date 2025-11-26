# Start Backend Server

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Starting AR Food Backend Server" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = "c:\Users\Praveen\OneDrive\Desktop\3D food\ar-food-backend"
Set-Location $backendPath

Write-Host "Backend Path: $backendPath" -ForegroundColor Gray
Write-Host "Starting server on port 5000..." -ForegroundColor Yellow
Write-Host ""

npm run dev
