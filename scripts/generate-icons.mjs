import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = process.cwd();
const source = path.join(root, 'icon_512x512.png');
const platformSource = path.join(root, 'icon_maskable_512.png');
const buildDir = path.join(root, 'build');
const linuxIconsDir = path.join(buildDir, 'icons');
const assetDir = path.join(root, 'assets');
const splashSize = 2732;

async function ensureTransparentMaster(file) {
  const image = sharp(file).ensureAlpha();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || metadata.width !== metadata.height) {
    throw new Error('AtbinYar source icon must be a valid square PNG.');
  }
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const corners = [
    3,
    (info.width - 1) * 4 + 3,
    ((info.height - 1) * info.width) * 4 + 3,
    (info.width * info.height - 1) * 4 + 3
  ].map(index => data[index]);
  if (corners.some(alpha => alpha !== 0)) {
    throw new Error('Icon master still has an opaque outer corner. Run scripts/process-brand-assets.py before generating platform assets.');
  }
  return metadata;
}

await fs.access(source);
await ensureTransparentMaster(source);
await fs.access(platformSource);
await fs.mkdir(linuxIconsDir, { recursive: true });
await fs.mkdir(assetDir, { recursive: true });

const master = sharp(source).ensureAlpha();
const platformIcon = sharp(platformSource).ensureAlpha();

// Linux hicolor assets all inherit the transparent master.
const linuxSizes = [16, 24, 32, 48, 64, 96, 128, 256, 512];
for (const size of linuxSizes) {
  await platformIcon.clone().resize(size, size, { fit: 'contain' })
    .png().toFile(path.join(linuxIconsDir, `${size}x${size}.png`));
}

// Windows uses a genuine multi-resolution ICO.
const windowsSizes = [16, 24, 32, 48, 64, 128, 256];
const icoInputs = [];
for (const size of windowsSizes) {
  const output = path.join(buildDir, `icon-${size}.png`);
  await platformIcon.clone().resize(size, size, { fit: 'contain' }).png().toFile(output);
  icoInputs.push(output);
}
const ico = await pngToIco(icoInputs);
if (!Buffer.isBuffer(ico) || ico.length < 100) {
  throw new Error('Failed to generate the Windows ICO file.');
}
await fs.writeFile(path.join(buildDir, 'icon.ico'), ico);

// Capacitor launcher source. Transparent corners reveal the selected dark
// adaptive-icon background instead of a baked-in white square.
await master.clone().resize(1024, 1024, { fit: 'contain' })
  .png().toFile(path.join(assetDir, 'icon.png'));
await master.clone().resize(1024, 1024, { fit: 'contain' })
  .png().toFile(path.join(assetDir, 'logo.png'));

// A transparent, premium launch illustration. Capacitor paints the deep-navy
// background behind it; this artwork stays independent of the device theme.
const logoData = (await fs.readFile(source)).toString('base64');
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${splashSize}" height="${splashSize}" viewBox="0 0 2732 2732">
  <defs>
    <radialGradient id="glow">
      <stop offset="0" stop-color="#D6A64A" stop-opacity=".22"/>
      <stop offset=".58" stop-color="#1D5277" stop-opacity=".12"/>
      <stop offset="1" stop-color="#071321" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F7D98B" stop-opacity=".8"/>
      <stop offset="1" stop-color="#B9822F" stop-opacity=".18"/>
    </linearGradient>
  </defs>
  <circle cx="1366" cy="1320" r="920" fill="url(#glow)"/>
  <circle cx="1366" cy="1320" r="670" fill="none" stroke="url(#gold)" stroke-width="3" opacity=".45"/>
  <circle cx="1366" cy="1320" r="760" fill="none" stroke="#75A9C9" stroke-width="2" stroke-dasharray="3 24" opacity=".2"/>
  <circle cx="1366" cy="1320" r="850" fill="none" stroke="#D6A64A" stroke-width="2" opacity=".13"/>
  <path d="M640 1470 C790 970 1940 870 2090 1300 C2180 1560 1810 1780 1450 1840" fill="none" stroke="#D6A64A" stroke-width="5" opacity=".35"/>
  <g fill="#D9E8F4" font-family="serif" opacity=".22" text-anchor="middle">
    <text x="1366" y="400" font-size="110">π</text>
    <text x="430" y="1335" font-size="100">√</text>
    <text x="2300" y="1335" font-size="100">∑</text>
    <text x="1366" y="2280" font-size="110">∞</text>
  </g>
  <g fill="#E8C477" opacity=".55">
    <circle cx="790" cy="690" r="8"/><circle cx="1940" cy="720" r="6"/>
    <circle cx="620" cy="1930" r="5"/><circle cx="2110" cy="1900" r="8"/>
    <circle cx="1366" cy="560" r="5"/><circle cx="1366" cy="2080" r="5"/>
  </g>
  <image href="data:image/png;base64,${logoData}" x="936" y="890" width="860" height="860" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
await sharp(Buffer.from(splashSvg)).png().toFile(path.join(assetDir, 'splash.png'));

console.log('Generated transparent Windows ICO, Linux icons, Android launcher source, and AtbinYar splash artwork.');
