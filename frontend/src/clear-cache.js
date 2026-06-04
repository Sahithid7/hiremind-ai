
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Delete Vite cache
const cachePath = path.join(__dirname, 'node_modules', '.vite');
try {
  fs.rmSync(cachePath, { recursive: true, force: true });
  console.log('Deleted .vite cache');
} catch(e) {
  console.log('Cache delete error:', e.message);
}
console.log('Cache cleared - restart Vite now');
