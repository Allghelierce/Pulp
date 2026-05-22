import { chromium } from 'playwright'

function seededRng(seed) {
  let s = Math.abs(seed) || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000 }
}

const size = 512
const rng = seededRng(42)
let dots = ''
for (let i = 0; i < 4000; i++) {
  const x = rng() * size
  const y = rng() * size
  const r = 0.4 + rng() * 0.6
  const op = 0.25 + rng() * 0.35
  const shade = 60 + Math.floor(rng() * 40)
  dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="rgba(${shade},${shade - 5},${shade - 10},${op.toFixed(2)})" />`
}

const html = `<!DOCTYPE html>
<html><head><style>*{margin:0;padding:0}</style></head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" style="display:block">
  ${dots}
</svg>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: size, height: size } })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({ path: 'public/paper-texture.png', type: 'png', omitBackground: true })
await browser.close()
console.log('Done!')
