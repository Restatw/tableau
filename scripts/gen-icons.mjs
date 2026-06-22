/**
 * Generate all required PWA icon sizes from the source SVG.
 * Run: node scripts/gen-icons.mjs
 */
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = resolve(__dirname, '..')
const srcSvg    = resolve(root, 'public/icons/icon.svg')
const outDir    = resolve(root, 'public/icons')

mkdirSync(outDir, { recursive: true })

const sizes = [
  // Standard PWA / Android
  { size: 72,  name: 'icon-72x72.png' },
  { size: 96,  name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  // iOS
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 180, name: 'apple-touch-icon.png' },           // canonical iOS icon
  // Favicons
  { size: 16,  name: 'favicon-16x16.png' },
  { size: 32,  name: 'favicon-32x32.png' },
  // Windows tile
  { size: 144, name: 'mstile-144x144.png' },
  { size: 270, name: 'mstile-270x270.png' },
  // Maskable (Android adaptive icon — content centered in safe zone)
  { size: 512, name: 'maskable-512x512.png', maskable: true },
]

const svgBuf = readFileSync(srcSvg)

for (const { size, name, maskable } of sizes) {
  const outPath = resolve(outDir, name)

  let pipeline = sharp(svgBuf, { density: Math.ceil((size / 512) * 300) })
    .resize(size, size)

  if (maskable) {
    // Maskable icons: shrink the graphic to 80% to stay within the safe zone
    pipeline = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 26, g: 115, b: 232, alpha: 1 },  // #1a73e8
      },
    }).composite([{
      input: await sharp(svgBuf, { density: 300 })
        .resize(Math.round(size * 0.8), Math.round(size * 0.8))
        .toBuffer(),
      gravity: 'center',
    }])
  }

  await pipeline.png({ compressionLevel: 9 }).toFile(outPath)
  console.log(`✓ ${name} (${size}px)`)
}

// Copy apple-touch-icon.png to public root for legacy <link rel="apple-touch-icon">
import { copyFileSync } from 'fs'
copyFileSync(
  resolve(outDir, 'apple-touch-icon.png'),
  resolve(root, 'public/apple-touch-icon.png'),
)
console.log('✓ apple-touch-icon.png → public/')
console.log('\nAll icons generated.')
