import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(
  fileURLToPath(import.meta.url))

const input = path.join(__dirname,
  '../public/icons/logo-source.jpg')

const sizes = [192, 512]

for (const size of sizes) {
  const padding = Math.round(size * 0.08)
  const inner = size - padding * 2

  await sharp(input)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r:10, g:10, b:15, alpha:1 }
    })
    .extend({
      top: padding, bottom: padding,
      left: padding, right: padding,
      background: { r:10, g:10, b:15, alpha:1 }
    })
    .png()
    .toFile(path.join(__dirname,
      `../public/icons/icon-${size}x${size}.png`))

  console.log(`Generated ${size}x${size} icon`)
}

// Also generate apple-touch-icon (180x180)
const appleSize = 180
const applePad = Math.round(appleSize * 0.08)
const appleInner = appleSize - applePad * 2

await sharp(input)
  .resize(appleInner, appleInner, {
    fit: 'contain',
    background: { r:10, g:10, b:15, alpha:1 }
  })
  .extend({
    top: applePad, bottom: applePad,
    left: applePad, right: applePad,
    background: { r:10, g:10, b:15, alpha:1 }
  })
  .png()
  .toFile(path.join(__dirname,
    '../public/icons/apple-touch-icon.png'))

console.log('Generated apple-touch-icon 180x180')
console.log('All icons generated!')
