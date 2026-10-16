// Copies the web build into dist-app for the Android app, without the shelved
// 3D models (the app never loads them; they would only make the APK bigger).
import fs from 'node:fs';
fs.rmSync('dist-app', { recursive: true, force: true });
fs.cpSync('dist', 'dist-app', { recursive: true, filter: (src) => !src.includes('/assets/3d') && !src.endsWith('artifact-test.html') });
console.log('dist-app ready');
