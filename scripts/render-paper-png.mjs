import { chromium } from 'playwright'

function seededRng(seed) {
  let s = Math.abs(seed) || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000 }
}

const size = 1024
const rng = seededRng(42)
let dots = ''
for (let i = 0; i < 72000; i++) {
  const x = rng() * size
  const y = rng() * size
  const r = 0.3 + rng() * 0.8
  const op = 0.08 + rng() * 0.18
  const warm = rng() > 0.5
  const fill = warm
    ? `rgba(${120 + Math.floor(rng() * 30)},${105 + Math.floor(rng() * 25)},${85 + Math.floor(rng() * 20)},${op.toFixed(2)})`
    : `rgba(${100 + Math.floor(rng() * 25)},${95 + Math.floor(rng() * 20)},${80 + Math.floor(rng() * 15)},${op.toFixed(2)})`
  dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${fill}" />`
}

const html = `<!DOCTYPE html>
<html><head><style>*{margin:0;padding:0}</style></head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" style="display:block">
  <rect width="${size}" height="${size}" fill="#E0D7C1" />
  ${dots}
</svg>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: size, height: size } })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({ path: 'public/paper-texture.png', type: 'png' })
await browser.close()
console.log('Done!')
