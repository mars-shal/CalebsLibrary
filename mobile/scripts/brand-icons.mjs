// One-off brand script: redraw the Bells Notes icon family around the bell.
// Monochrome identity: ink #171717 on paper #fafafa. Run: node scripts/brand-icons.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const bellInner = `
  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>`;

// Bell authored in a 24-unit viewBox; place it at (cx, cy) at the given scale.
const bellAt = (scale, cx = 512, cy = 512) =>
  `<g transform="translate(${cx - 12 * scale} ${cy - 12 * scale}) scale(${scale})" fill="none" stroke="#171717" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${bellInner}</g>`;

const outDir = fileURLToPath(new URL('../assets/images/', import.meta.url));

async function png(body, size, file) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${body}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(outDir + file);
  console.log('wrote', file);
}

// Launcher icon: paper field, faint ring, bell at ~66% (well inside the safe zone).
const iconArt = `<rect width="1024" height="1024" fill="#fafafa"/><circle cx="512" cy="512" r="336" fill="none" stroke="#171717" stroke-opacity="0.10" stroke-width="8"/>${bellAt(28)}`;
// Adaptive foreground: transparent, bell at 50% of the canvas (safe zone is the middle ~66%).
const foregroundArt = bellAt(21);
// Native splash: bell only, 17% — same shape the in-app logo uses.
const splashArt = `<rect width="1024" height="1024" fill="#fafafa"/>${bellAt(17)}`;

await png(iconArt, 1024, 'icon.png');
await png(iconArt, 48, 'favicon.png');
await png(foregroundArt, 1024, 'android-icon-foreground.png');
await png(`<rect width="1024" height="1024" fill="#fafafa"/>`, 1024, 'android-icon-background.png');
await png(splashArt, 1284, 'splash-icon.png');
console.log('bell icon family done');
