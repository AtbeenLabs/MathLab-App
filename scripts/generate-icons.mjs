import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = process.cwd();
const source = path.join(root, 'icon_512x512.png');
const buildDir = path.join(root, 'build');
const linuxIconsDir = path.join(buildDir, 'icons');
const assetDir = path.join(root, 'assets');

async function ensureSquarePng(file) {
  const metadata = await sharp(file).metadata();
  if (!metadata.width || !metadata.height || metadata.width !== metadata.height) {
    throw new Error('AtbinYar source icon must be a valid square PNG.');
  }
}

await fs.access(source);
await ensureSquarePng(source);

await fs.mkdir(linuxIconsDir, { recursive: true });
await fs.mkdir(assetDir, { recursive: true });

// Linux desktop environments need standard, size-specific hicolor assets.
const linuxSizes = [16, 24, 32, 48, 64, 96, 128, 256, 512];
for (const size of linuxSizes) {
  const output = path.join(linuxIconsDir, `${size}x${size}.png`);
  await sharp(source)
    .resize(size, size, { fit: 'contain' })
    .png()
    .toFile(output);
}

// Windows executables and shortcuts use a real multi-resolution ICO file.
const windowsSizes = [16, 24, 32, 48, 64, 128, 256];
const icoInputs = [];
for (const size of windowsSizes) {
  const output = path.join(buildDir, `icon-${size}.png`);
  await sharp(source)
    .resize(size, size, { fit: 'contain' })
    .png()
    .toFile(output);
  icoInputs.push(output);
}
const ico = await pngToIco(icoInputs);
if (!Buffer.isBuffer(ico) || ico.length < 100) {
  throw new Error('Failed to generate the Windows ICO file.');
}
await fs.writeFile(path.join(buildDir, 'icon.ico'), ico);

// Capacitor Assets expects a 1024px source for native Android launcher assets.
await sharp(source)
  .resize(1024, 1024, { fit: 'contain' })
  .png()
  .toFile(path.join(assetDir, 'logo.png'));

console.log('Generated Windows ICO, Linux icon set, and 1024px Capacitor icon source.');
