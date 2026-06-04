
# Kill existing Vite process
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
  $_.CommandLine -like "*vite*" -or $_.CommandLine -like "*5173*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear Vite cache
$cachePath = "C:\Users\sahit\OneDrive\Documents\Hiremind.ai\frontend\node_modules\.vite"
if (Test-Path $cachePath) {
  Remove-Item $cachePath -Recurse -Force
  Write-Host "Cache cleared" -ForegroundColor Green
}

# Restart Vite
Set-Location "C:\Users\sahit\OneDrive\Documents\Hiremind.ai\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev -- --host 127.0.0.1 --port 5173" -WindowStyle Normal
Write-Host "Vite restarted!" -ForegroundColor Green
