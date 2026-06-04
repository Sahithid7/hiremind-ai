@echo off
cd /d "C:\Users\sahit\OneDrive\Documents\Hiremind.ai\frontend"
taskkill /F /IM node.exe /T 2>nul
rmdir /s /q "node_modules\.vite" 2>nul
start cmd /k "npm run dev -- --host 127.0.0.1 --port 5173"
