import { chromium } from 'playwright'
import { readFileSync } from 'fs'

// We'll serve an HTML page with the full static SVG terrain and screenshot it

function seededRng(seed) {
  let s = Math.abs(seed) || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000 }
}

const NIGHT = {
  skyTop: '#0a0a0c', skyMid: '#0a0a0c', skyLow: '#0c0b0a', skyHorizon: '#0c0b0a', skyField: '#0c0b0a', skyBottom: '#0c0b0a',
  mtnTop: '#12100c', mtnMid: '#0e0c0a', mtnBot: '#0c0a08',
  snowTop: '#2a2820', snowFade: '#12100c',
  hillMidTop: '#121808', hillMidBot: '#0e1406',
  hillNearTop: '#161e08', hillNearBot: '#121806',
  fieldTop: '#161e08', fieldMid1: '#141a06', fieldMid2: '#121806', fieldBot: '#0e1404',
}
const p = NIGHT
const trunkC = '#2a1a0e'

const STAR_POSITIONS = Array.from({ length: 20 }, (_, i) => {
  const rng = seededRng(i * 47 + 199)
  return { x: rng() * 200, y: rng() * 6, r: 0.12 + rng() * 0.28, warm: rng() > 0.7, brightness: rng() }
})
const SPECK_STARS = Array.from({ length: 35 }, (_, i) => {
  const rng = seededRng(i * 31 + 503)
  return { x: rng() * 200, y: rng() * 6, r: 0.04 + rng() * 0.08, op: 0.15 + rng() * 0.35 }
})

const backHillTrees = (() => {
  const trunks = [], canopies = [], fruits = []
  const getHillY = (x) => {
    if (x < 70) return 36 - (x + 10) * 10 / 80
    if (x < 140) return 26 - (x - 70) * 7 / 70
    return 19 + (x - 140) * 10 / 70
  }
  for (let i = 0; i < 50; i++) {
    const rng = seededRng(i * 53 + 191)
    const bx = -5 + (i / 50) * 215
    const sz = 0.35 + rng() * 0.45
    const by = getHillY(bx) + 0.5 + rng() * 3
    const th = sz * 1.1, cy = by - th
    const lean = (rng() - 0.5) * 0.2, tx = bx + lean
    trunks.push(`M${bx.toFixed(1)},${by.toFixed(1)}L${tx.toFixed(1)},${(cy + sz * 0.2).toFixed(1)}`)
    const r1 = sz * 0.9, r2 = sz * 0.7
    canopies.push(`M${(tx - r1).toFixed(1)},${cy.toFixed(1)}a${r1.toFixed(1)},${r2.toFixed(1)} 0 1 0 ${(r1 * 2).toFixed(1)},0a${r1.toFixed(1)},${r2.toFixed(1)} 0 1 0 -${(r1 * 2).toFixed(1)},0Z`)
    for (let f = 0; f < 4; f++) {
      const a = f * Math.PI / 2 + i * 0.7
      const fx = tx + Math.cos(a) * r1 * 0.5, fy = cy + Math.sin(a) * r2 * 0.5
      fruits.push(`M${(fx + 0.05).toFixed(2)},${fy.toFixed(2)}a0.05,0.05 0 1 1 -0.10,0a0.05,0.05 0 1 1 0.10,0Z`)
    }
  }
  return { trunks: trunks.join(''), canopies: canopies.join(''), fruits: fruits.join('') }
})()

const midGrove = (() => {
  const trunks = [], canopies = [], fruits = [], shadows = []
  const getHillY = (x) => {
    if (x < 70) return 36 - (x + 10) * 10 / 80
    if (x < 140) return 26 - (x - 70) * 7 / 70
    return 19 + (x - 140) * 10 / 70
  }
  for (let i = 0; i < 80; i++) {
    const rng = seededRng(i * 71 + 303)
    const x = -5 + rng() * 210
    const baseY = getHillY(x) + rng() * 3 + 1.5
    const sz = 0.4 + rng() * 0.6
    const trunkH = sz * (1.2 + rng() * 0.4), cy = baseY - trunkH
    const lean = (rng() - 0.5) * 0.3, tx = x + lean
    shadows.push(`M${(x - sz * 0.8).toFixed(1)},${baseY.toFixed(1)}a${(sz * 0.8).toFixed(1)},${(sz * 0.2).toFixed(1)} 0 1 0 ${(sz * 1.6).toFixed(1)},0a${(sz * 0.8).toFixed(1)},${(sz * 0.2).toFixed(1)} 0 1 0 -${(sz * 1.6).toFixed(1)},0Z`)
    trunks.push(`M${x.toFixed(1)},${baseY.toFixed(1)}Q${(x + lean * 0.5).toFixed(1)},${(baseY - trunkH * 0.5).toFixed(1)} ${tx.toFixed(1)},${(cy + sz * 0.3).toFixed(1)}`)
    const r1 = sz * (0.9 + rng() * 0.3), r2 = sz * (0.7 + rng() * 0.2)
    canopies.push(`M${(tx - r1).toFixed(1)},${(cy + r2 * 0.1).toFixed(1)}Q${(tx - r1 * 0.5).toFixed(1)},${(cy - r2).toFixed(1)} ${tx.toFixed(1)},${(cy - r2).toFixed(1)}Q${(tx + r1 * 0.6).toFixed(1)},${(cy - r2).toFixed(1)} ${(tx + r1).toFixed(1)},${(cy + r2 * 0.15).toFixed(1)}Q${(tx + r1 * 0.4).toFixed(1)},${(cy + r2 * 0.55).toFixed(1)} ${tx.toFixed(1)},${(cy + r2 * 0.4).toFixed(1)}Q${(tx - r1 * 0.35).toFixed(1)},${(cy + r2 * 0.5).toFixed(1)} ${(tx - r1).toFixed(1)},${(cy + r2 * 0.1).toFixed(1)}Z`)
    const fruitCount = 5 + Math.floor(rng() * 6)
    for (let f = 0; f < fruitCount; f++) {
      const a = rng() * Math.PI * 2, dist = (0.15 + rng() * 0.55) * r1
      const fx = tx + Math.cos(a) * dist, fy = cy + Math.sin(a) * dist * (r2 / r1) * 0.8
      const fr = 0.05 + rng() * 0.04
      fruits.push(`M${(fx + fr).toFixed(2)},${fy.toFixed(2)}a${fr.toFixed(2)},${fr.toFixed(2)} 0 1 1 -${(fr * 2).toFixed(2)},0a${fr.toFixed(2)},${fr.toFixed(2)} 0 1 1 ${(fr * 2).toFixed(2)},0Z`)
    }
  }
  return { trunks: trunks.join(''), canopies: canopies.join(''), fruits: fruits.join(''), shadows: shadows.join('') }
})()

const nearHillTrees = (() => {
  const trunks = [], canopies = [], canopyFills = ['#1a3420', '#1c3622', '#16301c', '#203a26', '#142c18', '#1e3824']
  const fillIdx = [], fruits = [], shadows = []
  const getNearY = (x) => {
    if (x < 35) return 34 - (x + 10) * 7 / 45
    if (x < 75) return 27 + (x - 35) * 3 / 40
    return 30 + (x - 75) * 8 / 65
  }
  for (let i = 0; i < 50; i++) {
    const rng = seededRng(i * 89 + 707)
    const x = -5 + rng() * 210
    const baseY = getNearY(x) + rng() * 2.5 + 0.8
    const sz = 0.8 + rng() * 1.6
    const th = sz * (1.2 + rng() * 0.5)
    const lean = (rng() - 0.5) * 0.25, tx = x + lean, cy = baseY - th
    fillIdx.push(Math.floor(rng() * canopyFills.length))
    const tw = sz * 0.1
    trunks.push(`M${(x - tw).toFixed(2)},${baseY.toFixed(1)}L${tx.toFixed(1)},${(cy + sz * 0.2).toFixed(1)}L${(tx + tw).toFixed(2)},${(cy + sz * 0.2).toFixed(1)}L${(x + tw).toFixed(2)},${baseY.toFixed(1)}Z`)
    shadows.push(`M${(x - sz * 0.7).toFixed(1)},${baseY.toFixed(1)}a${(sz * 0.7).toFixed(1)},${(sz * 0.15).toFixed(1)} 0 1 0 ${(sz * 1.4).toFixed(1)},0a${(sz * 0.7).toFixed(1)},${(sz * 0.15).toFixed(1)} 0 1 0 -${(sz * 1.4).toFixed(1)},0Z`)
    const r1 = sz * (0.8 + rng() * 0.4), r2 = sz * (0.6 + rng() * 0.3)
    const w1 = (rng() - 0.5) * r2 * 0.5, w2 = (rng() - 0.5) * r2 * 0.45
    canopies.push({ d: `M${(tx - r1).toFixed(1)},${(cy + r2 * 0.15).toFixed(1)}Q${(tx - r1 * 0.7).toFixed(1)},${(cy - r2 * 0.4).toFixed(1)} ${(tx - r1 * 0.35).toFixed(1)},${(cy - r2 + w1).toFixed(1)}Q${(tx - r1 * 0.1).toFixed(1)},${(cy - r2 * 1.1).toFixed(1)} ${tx.toFixed(1)},${(cy - r2).toFixed(1)}Q${(tx + r1 * 0.15).toFixed(1)},${(cy - r2 * 1.05).toFixed(1)} ${(tx + r1 * 0.4).toFixed(1)},${(cy - r2 + w2).toFixed(1)}Q${(tx + r1 * 0.75).toFixed(1)},${(cy - r2 * 0.35).toFixed(1)} ${(tx + r1).toFixed(1)},${(cy + r2 * 0.1).toFixed(1)}Q${(tx + r1 * 0.5).toFixed(1)},${(cy + r2 * 0.55).toFixed(1)} ${tx.toFixed(1)},${(cy + r2 * 0.4).toFixed(1)}Q${(tx - r1 * 0.45).toFixed(1)},${(cy + r2 * 0.55).toFixed(1)} ${(tx - r1).toFixed(1)},${(cy + r2 * 0.15).toFixed(1)}Z`, fill: canopyFills[fillIdx[i]] })
    const fruitCount = 5 + Math.floor(rng() * 7)
    for (let f = 0; f < fruitCount; f++) {
      const fa = rng() * Math.PI * 2, fd = r1 * (0.1 + rng() * 0.6)
      const fx = tx + Math.cos(fa) * fd, fy = cy + Math.sin(fa) * fd * (r2 / r1)
      const fr = sz * 0.04 + rng() * sz * 0.035
      fruits.push(`M${(fx + fr).toFixed(2)},${fy.toFixed(2)}a${fr.toFixed(2)},${fr.toFixed(2)} 0 1 1 -${(fr * 2).toFixed(2)},0a${fr.toFixed(2)},${fr.toFixed(2)} 0 1 1 ${(fr * 2).toFixed(2)},0Z`)
    }
  }
  return { trunks: trunks.join(''), canopies, fruits: fruits.join(''), shadows: shadows.join('') }
})()

const grassTufts = (() => {
  const d1 = [], d2 = [], patches = [], dirtSpots = []
  for (let i = 0; i < 40; i++) {
    const rng = seededRng(i * 53 + 101)
    const x = 6 + rng() * 188, y = 40 + rng() * 56
    const h = 0.4 + rng() * 0.7, sway = (rng() - 0.5) * 0.3
    d1.push(`M${x.toFixed(1)},${y.toFixed(1)}q${sway.toFixed(2)},${(-h * 0.5).toFixed(2)} ${(sway * 0.3).toFixed(2)},${(-h).toFixed(2)}`)
    d2.push(`M${(x + 0.15).toFixed(2)},${y.toFixed(1)}q${((rng() - 0.5) * 0.25).toFixed(2)},${(-h * 0.4).toFixed(2)} ${((rng() - 0.5) * 0.12).toFixed(2)},${(-h * 0.8).toFixed(2)}`)
  }
  for (let i = 0; i < 10; i++) {
    const rng = seededRng(i * 71 + 3311)
    const px = 10 + rng() * 180, py = 42 + rng() * 52
    const pw = 1.5 + rng() * 3, ph = 0.5 + rng() * 1.5
    patches.push(`M${(px - pw).toFixed(1)},${py.toFixed(1)}Q${(px - pw * 0.3).toFixed(1)},${(py - ph).toFixed(1)} ${px.toFixed(1)},${(py - ph * 0.8).toFixed(1)}Q${(px + pw * 0.4).toFixed(1)},${(py - ph).toFixed(1)} ${(px + pw).toFixed(1)},${py.toFixed(1)}Z`)
  }
  for (let i = 0; i < 8; i++) {
    const rng = seededRng(i * 93 + 5511)
    const dx = 10 + rng() * 180, dy = 42 + rng() * 52, dr = 0.3 + rng() * 0.5
    dirtSpots.push(`M${(dx + dr).toFixed(2)},${dy.toFixed(2)}a${dr.toFixed(2)},${(dr * 0.4).toFixed(2)} 0 1 1 -${(dr * 2).toFixed(2)},0a${dr.toFixed(2)},${(dr * 0.4).toFixed(2)} 0 1 1 ${(dr * 2).toFixed(2)},0Z`)
  }
  return { d1: d1.join(''), d2: d2.join(''), patches: patches.join(''), dirtSpots: dirtSpots.join('') }
})()

const lake = (() => {
  const cx = 30, cy = 33
  const shore = `M${cx-10},${cy+0.5} Q${cx-8},${cy-2.5} ${cx-3},${cy-2.8} Q${cx+2},${cy-3} ${cx+6},${cy-2} Q${cx+9},${cy-1} ${cx+10},${cy+0.8} Q${cx+8},${cy+2.5} ${cx+4},${cy+3} Q${cx-1},${cy+3.5} ${cx-5},${cy+2.8} Q${cx-9},${cy+2} ${cx-10},${cy+0.5}Z`
  const water = `M${cx-8.5},${cy+0.3} Q${cx-7},${cy-2} ${cx-2.5},${cy-2.3} Q${cx+2},${cy-2.5} ${cx+5},${cy-1.5} Q${cx+7.5},${cy-0.5} ${cx+8.5},${cy+0.6} Q${cx+7},${cy+2} ${cx+3.5},${cy+2.5} Q${cx-1},${cy+3} ${cx-4.5},${cy+2.3} Q${cx-7.5},${cy+1.5} ${cx-8.5},${cy+0.3}Z`
  const reeds = [], rng = seededRng(8811)
  for (let i = 0; i < 10; i++) {
    const a = rng() * Math.PI * 2, d = 8 + rng() * 3
    const rx = cx + Math.cos(a) * d, ry = cy + Math.sin(a) * d * 0.3
    const h = 0.5 + rng() * 0.7, sw = (rng() - 0.5) * 0.25
    reeds.push(`M${rx.toFixed(1)},${ry.toFixed(1)}q${sw.toFixed(2)},${(-h*0.5).toFixed(2)} ${(sw*0.3).toFixed(2)},${(-h).toFixed(2)}`)
  }
  const ripples = []
  for (let i = 0; i < 8; i++) {
    const rx = cx - 5 + rng() * 10, ry = cy - 1.5 + rng() * 3, w = 0.6 + rng() * 1.2
    ripples.push(`M${(rx-w).toFixed(1)},${ry.toFixed(1)}Q${rx.toFixed(1)},${(ry-0.12).toFixed(2)} ${(rx+w).toFixed(1)},${ry.toFixed(1)}`)
  }
  return { shore, water, reeds: reeds.join(''), ripples: ripples.join('') }
})()

const fence = { posts: [6,22,38,54,70,86,102,118,134,150,166,182,196], gapAfter: new Set([54,134]) }

const wildflowers = (() => {
  const svgParts = [], stems = []
  const petalCols = ['#d08520','#c07010','#e09830','#b06a08']
  const centerCols = ['#e8a840','#d09020','#e0a038','#c88018']
  for (let i = 0; i < 40; i++) {
    const rng = seededRng(i * 67 + 1237)
    const inField = rng() < 0.75
    const fx = inField ? 12 + rng() * 76 : 2 + rng() * 196
    const fy = inField ? 44 + rng() * 40 : 39 + rng() * 56
    const tillX = fx / 2
    if (tillX >= 14 && tillX <= 86 && fy >= 42 && fy <= 84) continue
    const ci = Math.floor(rng() * petalCols.length)
    const sh = 0.5 + rng() * 0.6
    const tx = fx + (rng() * 0.08 - 0.04), ty = fy - sh
    const pr = 0.25 + rng() * 0.15
    const petals = 4 + Math.floor(rng() * 3)
    stems.push(`M${fx.toFixed(1)},${fy.toFixed(1)}L${tx.toFixed(2)},${ty.toFixed(2)}`)
    for (let pp = 0; pp < petals; pp++) {
      const ang = (pp / petals) * Math.PI * 2 + rng() * 0.3
      const px = tx + Math.cos(ang) * pr, py = ty + Math.sin(ang) * pr * 0.7
      svgParts.push(`<ellipse cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" rx="${(pr*0.5).toFixed(2)}" ry="${(pr*0.35).toFixed(2)}" fill="${petalCols[ci]}" transform="rotate(${(ang*180/Math.PI).toFixed(0)} ${px.toFixed(2)} ${py.toFixed(2)})" />`)
    }
    svgParts.push(`<circle cx="${tx.toFixed(2)}" cy="${ty.toFixed(2)}" r="${(pr*0.25).toFixed(2)}" fill="${centerCols[ci]}" />`)
  }
  return { svgParts: svgParts.join(''), stems: stems.join('') }
})()

// Fence SVG
let fenceSvg = ''
for (let pi = 0; pi < fence.posts.length; pi++) {
  const px = fence.posts[pi], t = pi / (fence.posts.length - 1)
  const yOff = t < 0.15 ? (0.15 - t) / 0.15 * 2.5 : t > 0.85 ? (t - 0.85) / 0.15 * 2.5 : 0
  const py = 38 + yOff
  fenceSvg += `<rect x="${px - 0.3}" y="${py}" width="0.6" height="2.2" rx="0.1" fill="#4a3e28" />`
  fenceSvg += `<rect x="${px - 0.4}" y="${py - 0.2}" width="0.8" height="0.3" rx="0.08" fill="#4a3e28" />`
}
for (let i = 0; i < fence.posts.length - 1; i++) {
  const px = fence.posts[i], nx = fence.posts[i + 1]
  if (fence.gapAfter.has(px)) continue
  const t1 = i / (fence.posts.length - 1), t2 = (i + 1) / (fence.posts.length - 1)
  const yOff1 = t1 < 0.15 ? (0.15 - t1) / 0.15 * 2.5 : t1 > 0.85 ? (t1 - 0.85) / 0.15 * 2.5 : 0
  const yOff2 = t2 < 0.15 ? (0.15 - t2) / 0.15 * 2.5 : t2 > 0.85 ? (t2 - 0.85) / 0.15 * 2.5 : 0
  fenceSvg += `<g opacity="0.8"><line x1="${px}" y1="${38.8 + yOff1}" x2="${nx}" y2="${38.8 + yOff2}" stroke="#4a3e28" stroke-width="0.25" /><line x1="${px}" y1="${39.6 + yOff1}" x2="${nx}" y2="${39.6 + yOff2}" stroke="#4a3e28" stroke-width="0.2" /></g>`
}

// Near hill canopies
let nearCanopySvg = ''
for (let i = 0; i < nearHillTrees.canopies.length; i++) {
  nearCanopySvg += `<path d="${nearHillTrees.canopies[i].d}" fill="${nearHillTrees.canopies[i].fill}" />`
}

// Lamppost
const lx = 170, ly = 46
const lampSvg = `
  <ellipse cx="${lx + 9}" cy="${ly}" rx="27" ry="11" fill="rgba(252,211,77,0.09)" />
  <ellipse cx="${lx + 14}" cy="${ly + 1}" rx="20" ry="8" fill="rgba(252,211,77,0.07)" />
  <circle cx="${lx + 1}" cy="${ly - 4.9}" r="3.3" fill="url(#lt-lamp-glow)" />
  <rect x="${lx - 0.2}" y="${ly - 5.2}" width="0.4" height="5.85" rx="0.1" fill="#3a3a3a" />
  <ellipse cx="${lx}" cy="${ly + 0.65}" rx="0.78" ry="0.26" fill="#2a2a2a" />
  <path d="M${lx},${ly - 4.9} Q${lx + 0.52},${ly - 5.5} ${lx + 0.98},${ly - 5.2}" stroke="#3a3a3a" stroke-width="0.2" fill="none" />
  <rect x="${lx + 0.52}" y="${ly - 5.5}" width="0.9" height="1.17" rx="0.1" fill="#2a2a2a" />
  <rect x="${lx + 0.62}" y="${ly - 5.4}" width="0.72" height="0.9" rx="0.07" fill="#fbbf24" opacity="0.8" />
  <rect x="${lx + 0.78}" y="${ly - 5.4}" width="0.2" height="0.9" fill="#fcd34d" opacity="0.4" />
`

// Stars
let starsSvg = ''
for (const s of STAR_POSITIONS) {
  const r = s.brightness > 0.6 ? s.r * 2.5 : s.r * 1.5
  const fill = s.warm ? 'url(#sg-warm)' : 'url(#sg-cool)'
  const op = s.brightness > 0.6 ? 0.75 : 0.5
  starsSvg += `<circle cx="${s.x}" cy="${s.y}" r="${r}" fill="${fill}" opacity="${op}" />`
}
for (const s of SPECK_STARS) {
  starsSvg += `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#e0e8f4" opacity="${s.op}" />`
}

const html = `<!DOCTYPE html>
<html><head><style>*{margin:0;padding:0}body{background:#000}</style></head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" width="3840" height="1997" viewBox="0 -4 200 104" style="display:block">
  <defs>
    <linearGradient id="lt-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.skyTop}" />
      <stop offset="20%" stop-color="${p.skyMid}" />
      <stop offset="40%" stop-color="${p.skyLow}" />
      <stop offset="60%" stop-color="${p.skyHorizon}" />
      <stop offset="80%" stop-color="${p.skyField}" />
      <stop offset="100%" stop-color="${p.skyBottom}" />
    </linearGradient>
    <linearGradient id="lt-hill-far" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.mtnTop}" />
      <stop offset="60%" stop-color="${p.mtnMid}" />
      <stop offset="100%" stop-color="${p.mtnBot}" />
    </linearGradient>
    <linearGradient id="lt-mtn-snow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.snowTop}" />
      <stop offset="100%" stop-color="${p.snowFade}" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="lt-hill-mid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.hillMidTop}" />
      <stop offset="100%" stop-color="${p.hillMidBot}" />
    </linearGradient>
    <linearGradient id="lt-hill-near" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.hillNearTop}" />
      <stop offset="100%" stop-color="${p.hillNearBot}" />
    </linearGradient>
    <linearGradient id="lt-field" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.fieldTop}" />
      <stop offset="30%" stop-color="${p.fieldMid1}" />
      <stop offset="70%" stop-color="${p.fieldMid2}" />
      <stop offset="100%" stop-color="${p.fieldBot}" />
    </linearGradient>
    <radialGradient id="lt-moon-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#c0cee0" stop-opacity="0.15" />
      <stop offset="30%" stop-color="#a0b0c8" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#8090b0" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="lt-moon-face" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#eef0f5" />
      <stop offset="35%" stop-color="#e0e4ec" />
      <stop offset="100%" stop-color="#b0b8c8" />
    </radialGradient>
    <mask id="lt-moon-mask">
      <circle cx="85" cy="4" r="1.2" fill="white" />
      <circle cx="85.9" cy="3.9" r="1.1" fill="black" />
    </mask>
    <radialGradient id="sg-cool" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#e8f0ff" stop-opacity="0.9" />
      <stop offset="45%" stop-color="#e8f0ff" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#e8f0ff" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="sg-warm" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffeedd" stop-opacity="1" />
      <stop offset="30%" stop-color="#ffeedd" stop-opacity="0.45" />
      <stop offset="100%" stop-color="#ffeedd" stop-opacity="0" />
    </radialGradient>
    <clipPath id="lt-sky-clip">
      <path d="M-10,-5 L210,-5 L210,28 L195,18 L185,22 L175,15 L165,20 L155,10 L145,16 L135,22 L125,13 L115,18 L105,9 L95,22 L85,14 L78,20 L68,11 L58,16 L50,8 L42,18 L35,10 L25,22 L15,12 L5,24 L-10,28 Z" />
    </clipPath>
    <radialGradient id="lt-lamp-glow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#fcd34d" stop-opacity="0.3" />
      <stop offset="50%" stop-color="#fbbf24" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect x="-10" y="-4" width="220" height="108" fill="url(#lt-sky)" />
  <g clip-path="url(#lt-sky-clip)">${starsSvg}</g>

  <ellipse cx="85" cy="4" rx="4" ry="2.8" fill="url(#lt-moon-glow)" />
  <circle cx="85" cy="4" r="1.2" fill="url(#lt-moon-face)" mask="url(#lt-moon-mask)" />
  <ellipse cx="83.3" cy="4.4" rx="1.5" ry="0.35" fill="rgba(180,195,220,0.08)" />
  <ellipse cx="86.8" cy="3.8" rx="2" ry="0.45" fill="rgba(175,190,215,0.07)" />

  <path d="M-10,24 L-5,22 L2,6 L6,5 L10,8 L14,4 L18,6 L22,18 L28,16 L32,8 L36,6 L38,9 L42,22 L48,20 L52,14 L56,6 L60,4 L62,7 L66,18 L72,22 L80,20 L86,16 L90,12 L94,14 L100,20 L106,18 L110,8 L114,5 L116,3 L120,6 L124,16 L130,22 L138,18 L144,10 L148,6 L152,8 L156,14 L160,20 L168,22 L176,16 L180,10 L184,12 L190,20 L196,18 L200,14 L204,16 L210,22 L210,34 L-10,34 Z" fill="#161820" opacity="0.7" />

  <path d="M-10,28 L5,18 L15,22 L25,10 L35,16 L42,8 L52,14 L60,6 L72,12 L82,4 L92,10 L100,2 L110,8 L118,12 L126,5 L136,10 L145,16 L152,9 L162,14 L170,20 L180,14 L190,18 L195,12 L205,20 L210,28 L210,34 L-10,34 Z" fill="url(#lt-hill-far)" opacity="0.5" />
  <path d="M-10,30 L8,22 L20,26 L32,15 L45,20 L55,12 L68,18 L78,8 L88,16 L98,6 L108,14 L118,18 L128,10 L140,16 L150,22 L160,14 L172,20 L182,24 L192,18 L202,24 L210,30 L210,34 L-10,34 Z" fill="${p.mtnBot}" opacity="0.6" />

  <path d="M25,10 L22,16 L28,16 Z" fill="url(#lt-mtn-snow)" />
  <path d="M42,8 L39,14 L45,14 Z" fill="url(#lt-mtn-snow)" />
  <path d="M60,6 L56,13 L64,13 Z" fill="url(#lt-mtn-snow)" />
  <path d="M82,4 L78,12 L86,12 Z" fill="url(#lt-mtn-snow)" />
  <path d="M100,2 L96,10 L104,10 Z" fill="url(#lt-mtn-snow)" />
  <path d="M126,5 L122,13 L130,13 Z" fill="url(#lt-mtn-snow)" />

  <path d="M-10,33 C-5,31 5,26 15,23 C22,21 28,22 35,26 C42,30 50,32 58,30 C64,28 68,25 72,23 C78,22 85,24 90,28 C95,31 100,33 110,34 L210,36 L210,42 L-10,42 Z" fill="${p.hillMidBot}" />

  <path d="M-10,36 C10,34 40,30 70,26 C90,22 115,19 140,19 C160,20 180,23 200,26 C205,27 208,28 210,29 L210,42 L-10,42 Z" fill="url(#lt-hill-mid)" />
  <path d="M-10,39 C10,38 40,36 70,33 C90,30 115,28 140,28 C160,29 180,31 200,33 L210,35 L210,42 L-10,42 Z" fill="rgba(0,0,0,0.06)" />

  <g opacity="0.35">
    <path d="${backHillTrees.trunks}" stroke="${trunkC}" stroke-width="0.3" fill="none" />
    <path d="${backHillTrees.canopies}" fill="#1a3018" />
    <path d="${backHillTrees.fruits}" fill="#b06810" opacity="0.4" />
  </g>

  <path d="${lake.shore}" fill="#1a2a1a" opacity="0.35" />
  <path d="${lake.water}" fill="#0e1e2e" opacity="0.65" />
  <path d="${lake.ripples}" stroke="rgba(120,180,255,0.12)" stroke-width="0.12" fill="none" />
  <path d="${lake.reeds}" stroke="#1a3018" stroke-width="0.2" fill="none" opacity="0.5" />

  <path d="M-5,36.5 Q10,34.5 25,32 Q35,30 45,29 Q55,28 65,27.5 Q80,25.5 95,23.5 Q110,21.5 125,20.5 Q140,20 155,20 Q165,20.5 175,22.5 Q185,24.5 200,27.5" fill="none" stroke="#1a1408" stroke-width="0.6" stroke-linecap="round" opacity="0.12" />
  <path d="M-5,36.5 Q10,34.5 25,32 Q35,30 45,29 Q55,28 65,27.5 Q80,25.5 95,23.5 Q110,21.5 125,20.5 Q140,20 155,20 Q165,20.5 175,22.5 Q185,24.5 200,27.5" fill="none" stroke="#2a2014" stroke-width="0.35" stroke-linecap="round" opacity="0.2" />

  <g opacity="0.8">
    <path d="${midGrove.shadows}" fill="rgba(0,0,0,0.06)" />
    <path d="${midGrove.trunks}" stroke="${trunkC}" stroke-width="0.35" fill="none" stroke-linecap="round" />
    <path d="${midGrove.canopies}" fill="#163018" />
    <path d="${midGrove.fruits}" fill="#b06810" opacity="0.7" />
  </g>

  <g transform="translate(90,28) scale(0.4) translate(-90,-28)">
    <path d="M87.8,28.1 L88,26.2 L91.5,26.2 L91.7,28.1 Z" fill="#3a3028" />
    <path d="M91.5,26.2 L92.8,26.6 L92.9,28.1 L91.7,28.1 Z" fill="#2e2418" />
    <rect x="88.6" y="26.7" width="0.7" height="0.7" rx="0.08" fill="#5a4a20" opacity="0.6" />
    <rect x="90.8" y="26.8" width="0.6" height="1.3" rx="0.08" fill="#241a10" />
    <polygon points="87.3,26.4 93.2,26.4 89.8,24.2" fill="#2a2018" />
    <rect x="88.3" y="24.4" width="0.6" height="1.8" fill="#3a3a3e" />
  </g>
  <g transform="translate(131,24) scale(0.4) translate(-131,-24)">
    <path d="M129.8,24.4 L129.9,22 L132,22 L132.1,24.4 Z" fill="#352a1c" />
    <rect x="130.4" y="22.5" width="0.5" height="0.5" rx="0.06" fill="#4a4020" opacity="0.5" />
    <polygon points="129.3,22 132.2,22 130.95,20" fill="#281e14" />
  </g>
  <g transform="translate(173,26) scale(0.4) translate(-173,-26)">
    <path d="M170.5,26.3 L170.6,25.1 L175.2,25.1 L175.3,26.3 Z" fill="#38281a" />
    <polygon points="170,25.3 175.8,25.3 172.9,23.8" fill="#2a1e12" />
    <rect x="174.2" y="22.8" width="0.7" height="2.3" fill="#3a3a3e" />
  </g>

  <path d="M-10,34 C0,32 15,29 35,27 C50,26 60,27 75,30 C90,33 110,36 140,38 C165,38 190,38 210,38 L210,100 L-10,100 Z" fill="url(#lt-hill-near)" />
  <path d="M-10,37 C0,36 15,34 35,33 C50,32 60,33 75,35 C90,37 110,39 140,40 L210,40 L210,100 L-10,100 Z" fill="rgba(0,0,0,0.05)" />

  <g opacity="0.8">
    <path d="${nearHillTrees.shadows}" fill="rgba(0,0,0,0.06)" />
    <path d="${nearHillTrees.trunks}" fill="${trunkC}" />
    ${nearCanopySvg}
    <path d="${nearHillTrees.fruits}" fill="#b06810" />
  </g>

  <path d="M-5,38 Q20,39 50,38 Q80,37 100,38 Q130,39 160,38 Q185,39 205,38 L205,100 L-5,100 Z" fill="url(#lt-field)" />

  <rect x="-5" y="38" width="210" height="62" fill="rgba(160,185,220,0.06)" />
  <ellipse cx="85" cy="38" rx="120" ry="50" fill="rgba(180,205,240,0.07)" />

  <path d="M0,50 Q50,48 100,50 Q150,52 200,50" fill="none" stroke="rgba(40,60,30,0.15)" stroke-width="0.4" />
  <path d="M0,62 Q40,60 80,62 Q120,64 160,62 Q180,60 200,62" fill="none" stroke="rgba(40,60,30,0.12)" stroke-width="0.35" />
  <path d="M0,74 Q60,72 120,74 Q160,76 200,74" fill="none" stroke="rgba(40,60,30,0.1)" stroke-width="0.3" />

  <path d="${grassTufts.patches}" fill="#2a4a20" opacity="0.08" />
  <path d="${grassTufts.dirtSpots}" fill="#2a2418" opacity="0.06" />
  <path d="${grassTufts.d1}" stroke="#3a5a2e" stroke-width="0.25" fill="none" opacity="0.18" />
  <path d="${grassTufts.d2}" stroke="#4a6a3a" stroke-width="0.2" fill="none" opacity="0.14" />

  <g opacity="0.5">
    <path d="${wildflowers.stems}" stroke="#2a4a1a" stroke-width="0.1" fill="none" opacity="0.5" />
    ${wildflowers.svgParts}
  </g>

  <g>${fenceSvg}</g>
  <g>${lampSvg}</g>

</svg>
</body></html>`

console.log('Launching browser to render terrain...')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 3840, height: 1997 } })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({ path: 'public/landing-terrain.png', type: 'png' })
await browser.close()
console.log('Done! Saved to public/landing-terrain.png')
