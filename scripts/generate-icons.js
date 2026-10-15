const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_PATH = 'D:\\XboxGames\\watermarked_img_5564872489908372972-clean.png';
const STUDYOS_PUBLIC = 'D:\\Studyos\\public';
const MOBILE_PUBLIC = 'D:\\Studyos for mobile\\public';
const MOBILE_ASSETS = 'D:\\Studyos for mobile\\assets';
const MOBILE_RES = 'D:\\Studyos for mobile\\android\\app\\src\\main\\res';

if (!fs.existsSync(SOURCE_PATH)) {
  console.error('Source image not found at', SOURCE_PATH);
  process.exit(1);
}

// Ensure directories exist
[STUDYOS_PUBLIC, MOBILE_PUBLIC, MOBILE_ASSETS, MOBILE_RES].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Helper to generate ICO header and directory
function createIco(pngBuffers) {
  // Simple single-image ICO from 32x32 PNG
  const buf = pngBuffers[0];
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type
  header.writeUInt16LE(1, 4); // count: 1

  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // width
  entry.writeUInt8(32, 1); // height
  entry.writeUInt8(0, 2);  // color palette
  entry.writeUInt8(0, 3);  // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(buf.length, 8); // image size
  entry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

  return Buffer.concat([header, entry, buf]);
}

async function run() {
  console.log('Reading source image from', SOURCE_PATH);
  const src = sharp(SOURCE_PATH);
  const metadata = await src.metadata();
  console.log('Source info:', metadata.width, 'x', metadata.height, metadata.format);

  // 1. Generate Web / PWA icons
  console.log('Generating Web & PWA icons...');
  const iconSizes = [
    { name: 'logo.png', size: 1024 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-16x16.png', size: 16 }
  ];

  const generatedBuffers = {};

  for (const item of iconSizes) {
    const buf = await sharp(SOURCE_PATH)
      .resize(item.size, item.size, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toBuffer();
    
    generatedBuffers[item.name] = buf;

    // Save to Studyos/public
    fs.writeFileSync(path.join(STUDYOS_PUBLIC, item.name), buf);
    // Save to Studyos for mobile/public
    fs.writeFileSync(path.join(MOBILE_PUBLIC, item.name), buf);
    console.log(`Saved ${item.name} (${item.size}x${item.size})`);
  }

  // Generate favicon.ico (32x32)
  const icoBuf = createIco([generatedBuffers['favicon-32x32.png']]);
  fs.writeFileSync(path.join(STUDYOS_PUBLIC, 'favicon.ico'), icoBuf);
  fs.writeFileSync(path.join(MOBILE_PUBLIC, 'favicon.ico'), icoBuf);
  console.log('Saved favicon.ico');

  // Generate favicon.svg (with base64 embedded 512x512 PNG and squircle clipPath)
  const base64Png512 = generatedBuffers['pwa-512x512.png'].toString('base64');
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <clipPath id="squircle">
      <rect width="512" height="512" rx="112" ry="112" />
    </clipPath>
  </defs>
  <g clip-path="url(#squircle)">
    <image width="512" height="512" href="data:image/png;base64,${base64Png512}" />
  </g>
</svg>
`;
  fs.writeFileSync(path.join(STUDYOS_PUBLIC, 'favicon.svg'), faviconSvg, 'utf8');
  fs.writeFileSync(path.join(MOBILE_PUBLIC, 'favicon.svg'), faviconSvg, 'utf8');
  console.log('Saved favicon.svg');

  // 2. Mobile Assets (icon.jpg, icon.png)
  console.log('Generating Mobile Assets...');
  const iconJpgBuf = await sharp(SOURCE_PATH)
    .resize(1024, 1024, { fit: 'cover' })
    .jpeg({ quality: 95 })
    .toBuffer();
  fs.writeFileSync(path.join(MOBILE_ASSETS, 'icon.jpg'), iconJpgBuf);
  fs.writeFileSync(path.join(MOBILE_ASSETS, 'icon.png'), generatedBuffers['logo.png']);
  console.log('Saved mobile assets (icon.jpg, icon.png)');

  // 3. Android mipmap assets
  console.log('Generating Android Launcher icons...');
  const androidDensities = [
    { folder: 'mipmap-ldpi', launcherSize: 36, adaptiveSize: 81 },
    { folder: 'mipmap-mdpi', launcherSize: 48, adaptiveSize: 108 },
    { folder: 'mipmap-hdpi', launcherSize: 72, adaptiveSize: 162 },
    { folder: 'mipmap-xhdpi', launcherSize: 96, adaptiveSize: 216 },
    { folder: 'mipmap-xxhdpi', launcherSize: 144, adaptiveSize: 324 },
    { folder: 'mipmap-xxxhdpi', launcherSize: 192, adaptiveSize: 432 }
  ];

  for (const density of androidDensities) {
    const destDir = path.join(MOBILE_RES, density.folder);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const lSize = density.launcherSize;
    const aSize = density.adaptiveSize;

    // A. ic_launcher.png (legacy square launcher with soft rounded corners)
    const squircleMask = Buffer.from(
      `<svg width="${lSize}" height="${lSize}"><rect width="${lSize}" height="${lSize}" rx="${Math.round(lSize * 0.18)}" ry="${Math.round(lSize * 0.18)}" fill="#ffffff" /></svg>`
    );
    const icLauncherBuf = await sharp(SOURCE_PATH)
      .resize(lSize, lSize, { fit: 'cover' })
      .composite([{ input: squircleMask, blend: 'dest-in' }])
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(path.join(destDir, 'ic_launcher.png'), icLauncherBuf);

    // B. ic_launcher_round.png (circular launcher icon)
    const circleMask = Buffer.from(
      `<svg width="${lSize}" height="${lSize}"><circle cx="${lSize / 2}" cy="${lSize / 2}" r="${lSize / 2}" fill="#ffffff" /></svg>`
    );
    const icRoundBuf = await sharp(SOURCE_PATH)
      .resize(lSize, lSize, { fit: 'cover' })
      .composite([{ input: circleMask, blend: 'dest-in' }])
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(path.join(destDir, 'ic_launcher_round.png'), icRoundBuf);

    // C. ic_launcher_foreground.png (for adaptive icon)
    const fgBuf = await sharp(SOURCE_PATH)
      .resize(aSize, aSize, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(path.join(destDir, 'ic_launcher_foreground.png'), fgBuf);

    // D. ic_launcher_background.png (solid slate matching logo background #2e3740)
    const bgBuf = await sharp({
      create: {
        width: aSize,
        height: aSize,
        channels: 4,
        background: { r: 46, g: 55, b: 64, alpha: 1 }
      }
    })
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(path.join(destDir, 'ic_launcher_background.png'), bgBuf);

    console.log(`Generated ${density.folder} (launcher: ${lSize}x${lSize}, adaptive: ${aSize}x${aSize})`);
  }

  // 4. Update adaptive icon XML configurations
  console.log('Configuring Android adaptive icon XML files...');
  const anydpiDir = path.join(MOBILE_RES, 'mipmap-anydpi-v26');
  if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });

  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml, 'utf8');
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml, 'utf8');

  // Update values/ic_launcher_background.xml
  const valuesDir = path.join(MOBILE_RES, 'values');
  if (fs.existsSync(valuesDir)) {
    const bgValXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#2E3740</color>
</resources>
`;
    fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), bgValXml, 'utf8');
  }

  // Remove stale default Android Studio robot drawables if they exist to prevent overriding
  const oldFgVector = path.join(MOBILE_RES, 'drawable-v24', 'ic_launcher_foreground.xml');
  if (fs.existsSync(oldFgVector)) {
    fs.unlinkSync(oldFgVector);
    console.log('Removed obsolete drawable-v24/ic_launcher_foreground.xml');
  }
  const oldBgVector = path.join(MOBILE_RES, 'drawable', 'ic_launcher_background.xml');
  if (fs.existsSync(oldBgVector)) {
    fs.unlinkSync(oldBgVector);
    console.log('Removed obsolete drawable/ic_launcher_background.xml');
  }

  console.log('=== All assets generated successfully! ===');
}

run().catch(err => {
  console.error('Failed generating icons:', err);
  process.exit(1);
});
