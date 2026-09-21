const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Standard App Icon SVG (Sleek Dark Theme with Glowing Red/Amber Play Emblem)
const createIconSvg = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.15 : size * 0.08;
  const contentSize = size - padding * 2;
  const cornerRadius = isMaskable ? 0 : size * 0.22;

  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Background Gradient -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f111a"/>
        <stop offset="50%" stop-color="#08090e"/>
        <stop offset="100%" stop-color="#040508"/>
      </linearGradient>

      <!-- Emblem Gradient -->
      <linearGradient id="emblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff1e27"/>
        <stop offset="50%" stop-color="#e50914"/>
        <stop offset="100%" stop-color="#f59e0b"/>
      </linearGradient>

      <!-- Glow Effect -->
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="${size * 0.02}" stdDeviation="${size * 0.04}" flood-color="#e50914" flood-opacity="0.5"/>
      </filter>

      <!-- Border Gradient -->
      <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255, 255, 255, 0.25)"/>
        <stop offset="100%" stop-color="rgba(229, 9, 20, 0.4)"/>
      </linearGradient>
    </defs>

    <!-- App Background Squircle -->
    <rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" fill="url(#bgGrad)"/>
    ${!isMaskable ? `<rect x="1" y="1" width="${size - 2}" height="${size - 2}" rx="${cornerRadius}" fill="none" stroke="url(#borderGrad)" stroke-width="${Math.max(2, size * 0.01)}"/>` : ''}

    <!-- Central Glowing Play Emblem Badge -->
    <g transform="translate(${padding}, ${padding})" filter="url(#glow)">
      <!-- Emblem Container Rounded Box -->
      <rect 
        x="${contentSize * 0.12}" 
        y="${contentSize * 0.12}" 
        width="${contentSize * 0.76}" 
        height="${contentSize * 0.76}" 
        rx="${contentSize * 0.2}" 
        fill="url(#emblemGrad)"
      />

      <!-- Modern Play Triangle (Crisp Centered) -->
      <polygon 
        points="${contentSize * 0.42},${contentSize * 0.32} ${contentSize * 0.68},${contentSize * 0.5} ${contentSize * 0.42},${contentSize * 0.68}" 
        fill="#ffffff"
      />

      <!-- Subtle Accent Dot -->
      <circle 
        cx="${contentSize * 0.76}" 
        cy="${contentSize * 0.24}" 
        r="${contentSize * 0.04}" 
        fill="#10b981"
      />
    </g>
  </svg>
  `;
};

async function generateIcons() {
  console.log('Generating PWA Icons with Sharp...');

  // 1. icon-192x192.png
  const svg192 = Buffer.from(createIconSvg(192));
  await sharp(svg192).png().toFile(path.join(iconsDir, 'icon-192x192.png'));
  console.log('Created icon-192x192.png');

  // 2. icon-512x512.png
  const svg512 = Buffer.from(createIconSvg(512));
  await sharp(svg512).png().toFile(path.join(iconsDir, 'icon-512x512.png'));
  console.log('Created icon-512x512.png');

  // 3. maskable-icon-512x512.png
  const svgMaskable512 = Buffer.from(createIconSvg(512, true));
  await sharp(svgMaskable512).png().toFile(path.join(iconsDir, 'maskable-icon-512x512.png'));
  console.log('Created maskable-icon-512x512.png');

  // 4. apple-touch-icon.png (180x180)
  const svg180 = Buffer.from(createIconSvg(180));
  await sharp(svg180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  // also copy to public root for default iOS Safari lookups
  await sharp(svg180).png().toFile(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 5. favicon-32x32.png
  const svg32 = Buffer.from(createIconSvg(32));
  await sharp(svg32).png().toFile(path.join(iconsDir, 'favicon-32x32.png'));
  console.log('Created favicon-32x32.png');

  console.log('All PWA icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
