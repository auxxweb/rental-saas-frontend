/**
 * Rasterizes public/app-icon.svg (R + lime gradient) to PWA PNGs.
 * Run: npm run generate-pwa-icons
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '../public')
const svgPath = path.join(publicDir, 'app-icon.svg')

async function main() {
  const svg = fs.readFileSync(svgPath)
  for (const size of [192, 512]) {
    await sharp(svg).resize(size, size).png().toFile(path.join(publicDir, `pwa-${size}x${size}.png`))
  }
  console.log('Wrote public/pwa-192x192.png and public/pwa-512x512.png from app-icon.svg')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
