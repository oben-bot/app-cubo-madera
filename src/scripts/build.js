const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building for all platforms...');

// 1. Build web version
execSync('npm run build', { stdio: 'inherit' });

// 2. Copy web assets to native projects
execSync('npx cap copy', { stdio: 'inherit' });

// 3. Build for Android
if (fs.existsSync(path.join(__dirname, '../android'))) {
  execSync('npx cap open android', { stdio: 'inherit' });
} else {
  console.log('Android project not found. Run "npx cap add android" first.');
}

// 4. Build for iOS
if (fs.existsSync(path.join(__dirname, '../ios'))) {
  execSync('npx cap open ios', { stdio: 'inherit' });
} else {
  console.log('iOS project not found. Run "npx cap add ios" first.');
}

// 5. Build for Windows
execSync('npx electron-builder build --windows', { stdio: 'inherit' });

console.log('Build process completed!');