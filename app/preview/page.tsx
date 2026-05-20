"use client"
import { useState } from "react"

function seededRng(seed: number) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647 }
}

function getHillY(x: number): number {
  if (x < 140) return 170 - (x + 20) * 50 / 160
  if (x < 280) return 120 - (x - 140) * 15 / 140
  return 105 + (x - 280) * 45 / 130
}

function Sky({ isDark }: { isDark: boolean }) {
  return <>
    <defs>
      <linearGradient id="m-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isDark ? '#08060a' : '#c8b8a0'} />
        <stop offset="50%" stopColor={isDark ? '#10100e' : '#d8c8b0'} />
        <stop offset="100%" stopColor={isDark ? '#1e1a12' : '#e4d8c0'} />
      </linearGradient>
      <linearGradient id="m-hill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isDark ? '#162018' : '#6a8060'} />
        <stop offset="40%" stopColor={isDark ? '#0e1610' : '#7a9070'} />
        <stop offset="100%" stopColor={isDark ? '#0a0e0c' : '#7a8870'} />
      </linearGradient>
      <linearGradient id="m-ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isDark ? '#1a2014' : '#3e4e34'} />
        <stop offset="100%" stopColor={isDark ? '#141810' : '#2e3e24'} />
      </linearGradient>
      <radialGradient id="m-star-g">
        <stop offset="0%" stopColor="#ffeedd" stopOpacity="1" />
        <stop offset="40%" stopColor="#ffeedd" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#ffeedd" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="400" height="300" fill="url(#m-sky)" />
    {isDark && <>
      {[[32,18,1.2],[78,12,0.8],[125,28,1.0],[168,8,0.7],[210,22,1.1],[258,15,0.9],[305,25,0.7],[350,10,1.0],[55,40,0.6],[145,42,0.8],[240,38,0.7],[310,35,0.9],[380,42,0.6],[20,55,0.5],[95,50,0.7],[195,52,0.6],[280,48,0.8],[365,55,0.5]].map(([x,y,r], i) => (
        <circle key={`st${i}`} cx={x} cy={y} r={r as number} fill="url(#m-star-g)" opacity={0.75 + (i % 3) * 0.08} />
      ))}
    </>}
  </>
}

function Moon({ isDark, mx, my, sc }: { isDark: boolean; mx: number; my: number; sc: number }) {
  if (!isDark) return null
  return (
    <g>
      <defs>
        <radialGradient id="bg-moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c0cee0" stopOpacity="0.15" />
          <stop offset="30%" stopColor="#a0b0c8" stopOpacity="0.06" />
          <stop offset="70%" stopColor="#8090b0" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#8090b0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bg-moon-edge" cx="20%" cy="45%" r="80%">
          <stop offset="0%" stopColor="#f0f4ff" />
          <stop offset="40%" stopColor="#dde4f0" />
          <stop offset="100%" stopColor="#b8c4d8" />
        </radialGradient>
        <mask id="bg-moon-mask">
          <circle cx={mx} cy={my} r={1.2 * sc} fill="white" />
          <circle cx={mx + 0.9 * sc} cy={my - 0.1 * sc} r={1.1 * sc} fill="black" />
        </mask>
      </defs>
      <ellipse cx={mx} cy={my} rx={5 * sc} ry={3.5 * sc} fill="url(#bg-moon-glow)" />
      <circle cx={mx} cy={my} r={1.2 * sc} fill="url(#bg-moon-edge)" mask="url(#bg-moon-mask)" />
      <circle cx={mx - 0.4 * sc} cy={my - 0.2 * sc} r={0.15 * sc} fill="rgba(160,170,190,0.35)" mask="url(#bg-moon-mask)" />
      <circle cx={mx - 0.2 * sc} cy={my + 0.33 * sc} r={0.1 * sc} fill="rgba(155,165,185,0.3)" mask="url(#bg-moon-mask)" />
      <ellipse cx={mx - 0.57 * sc} cy={my + 0.03 * sc} rx={0.07 * sc} ry={0.05 * sc} fill="rgba(150,162,182,0.28)" mask="url(#bg-moon-mask)" />
      <ellipse cx={mx - 1.7 * sc} cy={my + 0.4 * sc} rx={1.5 * sc} ry={0.35 * sc} fill="rgba(180,195,220,0.08)" />
      <ellipse cx={mx + 1.8 * sc} cy={my - 0.2 * sc} rx={2 * sc} ry={0.45 * sc} fill="rgba(175,190,215,0.07)" />
    </g>
  )
}

function Lamppost({ isDark, lx, ly, sc }: { isDark: boolean; lx: number; ly: number; sc: number }) {
  const iron = isDark ? '#3a3a3a' : '#4a4a4a'
  const ironD = isDark ? '#2a2a2a' : '#3a3a3a'
  const isNight = isDark
  const glass = isNight ? '#fbbf24' : '#8a8a82'
  const glassL = isNight ? '#fcd34d' : '#9a9a92'
  return (
    <g>
      <defs>
        <radialGradient id="bg-lamp-glow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor={glassL} stopOpacity="0.3" />
          <stop offset="50%" stopColor={glass} stopOpacity="0.1" />
          <stop offset="100%" stopColor={glass} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bg-lamp-wash-a" cx="30%" cy="45%" r="55%">
          <stop offset="0%" stopColor={glassL} stopOpacity="0.09" />
          <stop offset="30%" stopColor={glass} stopOpacity="0.05" />
          <stop offset="65%" stopColor={glass} stopOpacity="0.02" />
          <stop offset="100%" stopColor={glass} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bg-lamp-ground" cx="40%" cy="25%" r="55%">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.07" />
          <stop offset="40%" stopColor="#92400e" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#92400e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bg-lamp-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={glassL} stopOpacity="0.14" />
          <stop offset="35%" stopColor={glass} stopOpacity="0.04" />
          <stop offset="100%" stopColor={glass} stopOpacity="0" />
        </linearGradient>
      </defs>
      {isNight && <>
        <ellipse cx={lx + 20 * sc / 0.65} cy={ly} rx={50 * sc} ry={20 * sc} fill="url(#bg-lamp-wash-a)" />
        <ellipse cx={lx + 12 * sc / 0.65} cy={ly + 6 * sc / 0.65} rx={25 * sc} ry={8 * sc} fill="url(#bg-lamp-ground)" />
        <path d={`M${lx - 1.5 * sc},${ly - 7 * sc} L${lx + 8 * sc},${ly + 6 * sc} L${lx - 4 * sc},${ly + 6 * sc} Z`} fill="url(#bg-lamp-cone)" opacity="0.5" />
        <circle cx={lx - 1.5 * sc} cy={ly - 7.5 * sc} r={5 * sc} fill="url(#bg-lamp-glow)" />
      </>}
      {/* Shadow — left */}
      <ellipse cx={lx - 4 * sc} cy={ly + 1.5 * sc} rx={6 * sc} ry={1 * sc} fill={isDark ? 'rgba(0,0,0,0.18)' : 'rgba(20,15,5,0.12)'} />
      {/* Pole */}
      <rect x={lx - 0.3 * sc} y={ly - 8 * sc} width={0.6 * sc} height={9 * sc} rx={0.15 * sc} fill={iron} />
      {/* Base */}
      <ellipse cx={lx} cy={ly + 1 * sc} rx={1.2 * sc} ry={0.4 * sc} fill={ironD} />
      {/* Arm — faces left */}
      <path d={`M${lx},${ly - 7.5 * sc} Q${lx - 0.8 * sc},${ly - 8.5 * sc} ${lx - 1.5 * sc},${ly - 8 * sc}`} stroke={iron} strokeWidth={0.3 * sc} fill="none" />
      {/* Lantern housing — left */}
      <rect x={lx - 2.2 * sc} y={ly - 8.5 * sc} width={1.4 * sc} height={1.8 * sc} rx={0.15 * sc} fill={ironD} />
      <rect x={lx - 2.05 * sc} y={ly - 8.3 * sc} width={1.1 * sc} height={1.4 * sc} rx={0.1 * sc} fill={glass} opacity="0.8" />
      <rect x={lx - 1.5 * sc} y={ly - 8.3 * sc} width={0.3 * sc} height={1.4 * sc} fill={glassL} opacity="0.4" />
      {/* Top cap */}
      <polygon points={`${lx - 0.6 * sc},${ly - 8.5 * sc} ${lx - 1.5 * sc},${ly - 9.2 * sc} ${lx - 2.4 * sc},${ly - 8.5 * sc}`} fill={iron} />
    </g>
  )
}

function Fence({ isDark, groundY }: { isDark: boolean; groundY: number }) {
  const fenceColor = isDark ? '#4a3e28' : '#6a5a3a'
  const fenceLight = isDark ? '#5a4e32' : '#7a6a4a'
  const posts = [60, 200, 340]
  const postH = 24
  const postW = 4.5
  const railYTop = (px: number) => groundY + Math.sin(px / 400 * Math.PI) * -2.5 - postH * 0.7
  const railYBot = (px: number) => groundY + Math.sin(px / 400 * Math.PI) * -2.5 - postH * 0.25
  return (
    <g>
      {/* Horizontal rails spanning full width */}
      <line x1={0} y1={railYTop(0)} x2={400} y2={railYTop(400)} stroke={fenceColor} strokeWidth="1" />
      <line x1={0} y1={railYBot(0)} x2={400} y2={railYBot(400)} stroke={fenceColor} strokeWidth="0.8" />
      <line x1={0} y1={railYTop(0)} x2={400} y2={railYTop(400)} stroke={fenceLight} strokeWidth="0.3" opacity="0.3" />
      {posts.map(px => {
        const t = px / 400
        const yOff = Math.sin(t * Math.PI) * -2.5
        const py = groundY + yOff
        return (
          <g key={`fp-${px}`}>
            <rect x={px - postW / 2} y={py - postH} width={postW} height={postH + 0.5} rx={0.3} fill={fenceColor} />
            <rect x={px - postW * 0.2} y={py - postH} width={postW * 0.35} height={postH + 0.5} fill={fenceLight} opacity="0.35" />
            <rect x={px - postW * 0.6} y={py - postH - 0.5} width={postW * 1.2} height={0.8} rx={0.15} fill={fenceColor} />
          </g>
        )
      })}
    </g>
  )
}

function HillGrass({ isDark }: { isDark: boolean }) {
  const rng = seededRng(557)
  const tufts: string[] = []
  const bushPaths: string[] = []
  const bladesPaths: string[] = []
  for (let i = 0; i < 120; i++) {
    const x = 5 + (i / 120) * 400 + (rng() - 0.5) * 12
    const ridgeY = getHillY(x)
    const baseY = ridgeY + 0.5 + rng() * 8
    const h = 1.0 + rng() * 2.0
    tufts.push(`M${x.toFixed(1)},${baseY.toFixed(1)}l${(-0.6).toFixed(2)},${(-h).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.5).toFixed(1)},${(-h * 0.85).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.8).toFixed(2)},${(-h * 0.65).toFixed(1)}`)
  }
  for (let i = 0; i < 80; i++) {
    const x = 5 + (i / 80) * 400 + (rng() - 0.5) * 15
    const ridgeY = getHillY(x)
    const by = ridgeY + 1 + rng() * 8
    const bw = 1.0 + rng() * 2.0
    const bh = 0.5 + rng() * 1.2
    bushPaths.push(`M${(x - bw).toFixed(1)},${by.toFixed(1)}Q${(x - bw * 0.3).toFixed(1)},${(by - bh * 1.5).toFixed(1)} ${x.toFixed(1)},${(by - bh).toFixed(1)}Q${(x + bw * 0.4).toFixed(1)},${(by - bh * 1.4).toFixed(1)} ${(x + bw).toFixed(1)},${by.toFixed(1)}Z`)
  }
  for (let i = 0; i < 100; i++) {
    const x = 5 + (i / 100) * 400 + (rng() - 0.5) * 12
    const ridgeY = getHillY(x)
    const by = ridgeY + 1 + rng() * 9
    const bh = 1.0 + rng() * 2.0
    const curve = (rng() - 0.5) * 1.5
    bladesPaths.push(`M${x.toFixed(1)},${by.toFixed(1)}C${(x + curve * 0.2).toFixed(1)},${(by - bh * 0.3).toFixed(1)} ${(x + curve * 0.7).toFixed(1)},${(by - bh * 0.6).toFixed(1)} ${(x + curve * 0.5).toFixed(1)},${(by - bh).toFixed(1)}`)
  }
  return <>
    <path d={bushPaths.join('')} fill={isDark ? '#182c12' : '#3a6a2e'} opacity={isDark ? 0.25 : 0.15} />
    <path d={tufts.join('')} stroke={isDark ? '#223e1e' : '#527e42'} strokeWidth="0.5" fill="none" opacity="0.45" />
    <path d={bladesPaths.join('')} stroke={isDark ? '#1e3818' : '#3e6e34'} strokeWidth="0.35" fill="none" opacity="0.35" />
  </>
}

function HillPaths({ isDark }: { isDark: boolean }) {
  const dirtBase = isDark ? '#2a2014' : '#8a7050'
  const dirtDark = isDark ? '#1a1408' : '#6a5030'
  const dirtLight = isDark ? '#342a1a' : '#a08a60'
  const edgeGrass = isDark ? '#1a2c14' : '#4a7a3a'
  const rng = seededRng(5599)
  const pts: [number,number][] = []
  for (let x = -5; x <= 410; x += 25) pts.push([x, getHillY(x) + 2])
  const mainD = "M" + pts.map(p => `${p[0].toFixed(0)},${p[1].toFixed(0)}`).join(" Q")
  const pebbles: string[] = []
  const grassEdgeD: string[] = []
  const ruts: string[] = []
  const wornPatches: string[] = []
  for (let i = 0; i < 80; i++) {
    const t = rng()
    const idx = Math.floor(t * (pts.length - 1))
    const frac = t * (pts.length - 1) - idx
    const nxt = Math.min(idx + 1, pts.length - 1)
    const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
    const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
    const ox = (rng() - 0.5) * 2
    const oy = (rng() - 0.5) * 1.5
    const pr = 0.1 + rng() * 0.2
    pebbles.push(`M${(px+ox+pr).toFixed(2)},${(py+oy).toFixed(2)}a${pr.toFixed(2)},${(pr*0.7).toFixed(2)} 0 1 1 -${(pr*2).toFixed(2)},0a${pr.toFixed(2)},${(pr*0.7).toFixed(2)} 0 1 1 ${(pr*2).toFixed(2)},0Z`)
  }
  for (let i = 0; i < 50; i++) {
    const t = rng()
    const idx = Math.floor(t * (pts.length - 1))
    const frac = t * (pts.length - 1) - idx
    const nxt = Math.min(idx + 1, pts.length - 1)
    const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
    const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
    const side = rng() > 0.5 ? 1 : -1
    const gx = px + side * (0.8 + rng() * 1)
    const gy = py + side * (0.2 + rng() * 0.5)
    const gh = 0.5 + rng() * 1
    const gsway = (rng() - 0.5) * 0.6
    grassEdgeD.push(`M${gx.toFixed(1)},${gy.toFixed(1)}q${gsway.toFixed(2)},${(-gh*0.5).toFixed(2)} ${(gsway*0.3).toFixed(2)},${(-gh).toFixed(2)}`)
  }
  for (let i = 0; i < 15; i++) {
    const t = 0.05 + rng() * 0.9
    const idx = Math.floor(t * (pts.length - 1))
    const frac = t * (pts.length - 1) - idx
    const nxt = Math.min(idx + 1, pts.length - 1)
    const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
    const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
    const dx = (pts[nxt][0] - pts[idx][0]) * 0.08
    const dy = (pts[nxt][1] - pts[idx][1]) * 0.08
    ruts.push(`M${(px-dx).toFixed(1)},${(py-dy+0.2).toFixed(1)}L${(px+dx).toFixed(1)},${(py+dy+0.2).toFixed(1)}`)
  }
  for (let i = 0; i < 12; i++) {
    const t = rng()
    const idx = Math.floor(t * (pts.length - 1))
    const frac = t * (pts.length - 1) - idx
    const nxt = Math.min(idx + 1, pts.length - 1)
    const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
    const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
    const wr = 0.5 + rng() * 1
    wornPatches.push(`M${(px-wr).toFixed(1)},${py.toFixed(1)}a${wr.toFixed(2)},${(wr*0.35).toFixed(2)} 0 1 1 ${(wr*2).toFixed(2)},0a${wr.toFixed(2)},${(wr*0.35).toFixed(2)} 0 1 1 -${(wr*2).toFixed(2)},0Z`)
  }
  const branchPts: [number,number][] = []
  for (let x = 100; x <= 280; x += 20) branchPts.push([x, getHillY(x) + 8 + Math.sin(x * 0.03) * 3])
  const branchD = "M" + branchPts.map(p => `${p[0].toFixed(0)},${p[1].toFixed(0)}`).join(" L")
  const spurD = `M60,${(getHillY(60) + 5).toFixed(0)} Q75,${(getHillY(75) + 7).toFixed(0)} 90,${(getHillY(90) + 6).toFixed(0)}`
  return <g>
    <path d={mainD} fill="none" stroke={dirtDark} strokeWidth="1.2" strokeLinecap="round" opacity={isDark ? 0.12 : 0.08} />
    <path d={mainD} fill="none" stroke={dirtBase} strokeWidth="0.7" strokeLinecap="round" opacity={isDark ? 0.2 : 0.14} />
    <path d={branchD} fill="none" stroke={dirtDark} strokeWidth="0.8" strokeLinecap="round" opacity={isDark ? 0.1 : 0.06} />
    <path d={branchD} fill="none" stroke={dirtBase} strokeWidth="0.4" strokeLinecap="round" opacity={isDark ? 0.18 : 0.12} />
    <path d={spurD} fill="none" stroke={dirtBase} strokeWidth="0.35" opacity={isDark ? 0.15 : 0.1} strokeLinecap="round" />
    <path d={wornPatches.join('')} fill={dirtLight} opacity={isDark ? 0.06 : 0.04} />
    <path d={ruts.join('')} stroke={dirtDark} strokeWidth="0.15" fill="none" opacity={isDark ? 0.12 : 0.08} strokeLinecap="round" />
    <path d={pebbles.join('')} fill={dirtDark} opacity={isDark ? 0.15 : 0.1} />
    <path d={grassEdgeD.join('')} stroke={edgeGrass} strokeWidth="0.2" fill="none" opacity={isDark ? 0.18 : 0.1} />
  </g>
}

function TangerineTrees({ isDark }: { isDark: boolean }) {
  const rng = seededRng(331)
  const trunkC = isDark ? '#1a1208' : '#3a2e1a'
  const canopyC = isDark ? '#142a12' : '#2e5a26'
  const canopyS = isDark ? '#0c1e0a' : '#1e4a1a'
  const fruitC = isDark ? '#7a4e08' : '#a06010'
  const count = 35
  const trunks: string[] = []
  const mainBranches: string[] = []
  const canopies: string[] = []
  const shade: string[] = []
  const leafTufts: string[] = []
  const fruits: string[] = []

  for (let i = 0; i < count; i++) {
    const bx = 5 + (i / count) * 395 + (rng() - 0.5) * 18
    if (bx > 245 && bx < 275) { rng(); rng(); rng(); continue }
    const by = getHillY(bx) + 1 + rng() * 10
    const sc = 0.4 + rng() * 0.55
    const tx = bx + (rng() - 0.5) * 4, ty = by
    const s = sc
    const trunkCurve = (rng() - 0.5) * 4 * s
    const trunkH = (14 + rng() * 6) * s
    const topY = ty - trunkH
    trunks.push(`M${tx.toFixed(1)},${ty.toFixed(1)}C${(tx + trunkCurve).toFixed(1)},${(ty - trunkH * 0.4).toFixed(1)} ${(tx - trunkCurve * 0.5).toFixed(1)},${(ty - trunkH * 0.7).toFixed(1)} ${tx.toFixed(1)},${topY.toFixed(1)}`)
    // branches — randomized spread and droop
    const brL = 8 + rng() * 6, brR = 8 + rng() * 6
    const brDroopL = rng() * 3, brDroopR = rng() * 3
    mainBranches.push(`M${tx.toFixed(1)},${(topY + 2 * s).toFixed(1)}C${(tx - brL * 0.4 * s).toFixed(1)},${(topY - 2 * s).toFixed(1)} ${(tx - brL * 0.8 * s).toFixed(1)},${(topY - 2 * s).toFixed(1)} ${(tx - brL * s).toFixed(1)},${(topY + brDroopL * s).toFixed(1)}`)
    mainBranches.push(`M${tx.toFixed(1)},${(topY + 2 * s).toFixed(1)}C${(tx + brR * 0.4 * s).toFixed(1)},${(topY - 2 * s).toFixed(1)} ${(tx + brR * 0.8 * s).toFixed(1)},${(topY - 2 * s).toFixed(1)} ${(tx + brR * s).toFixed(1)},${(topY + brDroopR * s).toFixed(1)}`)
    // canopy — randomized proportions and wobble
    const rxBase = 14 + rng() * 8, ryBase = 10 + rng() * 8
    const cx = tx + (rng() - 0.5) * 3 * s, cy = topY - ryBase * 0.5 * s
    const rx = rxBase * s, ry = ryBase * s
    const w1 = (rng() - 0.5) * rx * 0.3
    const w2 = (rng() - 0.5) * ry * 0.3
    const w3 = (rng() - 0.5) * rx * 0.25
    canopies.push(`M${(cx - rx).toFixed(1)},${(cy + ry * 0.4 + w2).toFixed(1)}C${(cx - rx + w1).toFixed(1)},${(cy - ry * 0.5).toFixed(1)} ${(cx - rx * 0.3 + w3).toFixed(1)},${(cy - ry).toFixed(1)} ${cx.toFixed(1)},${(cy - ry + w2 * 0.3).toFixed(1)}C${(cx + rx * 0.35 - w3).toFixed(1)},${(cy - ry).toFixed(1)} ${(cx + rx - w1).toFixed(1)},${(cy - ry * 0.5).toFixed(1)} ${(cx + rx).toFixed(1)},${(cy + ry * 0.4 - w2).toFixed(1)}C${(cx + rx * 0.5).toFixed(1)},${(cy + ry * 0.9).toFixed(1)} ${cx.toFixed(1)},${(cy + ry * 0.7).toFixed(1)} ${cx.toFixed(1)},${(cy + ry * 0.7).toFixed(1)}C${cx.toFixed(1)},${(cy + ry * 0.7).toFixed(1)} ${(cx - rx * 0.5).toFixed(1)},${(cy + ry * 0.9).toFixed(1)} ${(cx - rx).toFixed(1)},${(cy + ry * 0.4 + w2).toFixed(1)}Z`)
    // shade
    shade.push(`M${(cx - rx * 0.7).toFixed(1)},${(cy + ry * 0.15).toFixed(1)}Q${cx.toFixed(1)},${(cy + ry * 0.8).toFixed(1)} ${(cx + rx * 0.7).toFixed(1)},${(cy + ry * 0.15).toFixed(1)}`)
    // leaf tufts — random positions around canopy edge
    const tuftCount = 3 + Math.floor(rng() * 4)
    for (let t = 0; t < tuftCount; t++) {
      const ang = rng() * Math.PI * 2
      const dist = 0.8 + rng() * 0.2
      const lx = cx + Math.cos(ang) * rx * dist, ly = cy + Math.sin(ang) * ry * dist
      const ls = (1.5 + rng() * 1.5) * s
      const tiltX = (rng() - 0.5) * ls
      leafTufts.push(`M${(lx - ls).toFixed(1)},${ly.toFixed(1)}Q${(lx + tiltX).toFixed(1)},${(ly - ls * (0.8 + rng() * 0.6)).toFixed(1)} ${(lx + ls).toFixed(1)},${ly.toFixed(1)}Z`)
    }
    // fruits — random scatter within canopy
    const fruitCount = 3 + Math.floor(rng() * 5)
    for (let f = 0; f < fruitCount; f++) {
      const fAng = rng() * Math.PI * 2
      const fDist = 0.2 + rng() * 0.55
      const fpx = cx + Math.cos(fAng) * rx * fDist, fpy = cy + Math.sin(fAng) * ry * fDist
      const fr = (0.6 + rng() * 0.6) * s
      fruits.push(`M${(fpx + fr).toFixed(2)},${fpy.toFixed(2)}a${fr.toFixed(2)},${fr.toFixed(2)} 0 1 1 -${(fr * 2).toFixed(2)},0a${fr.toFixed(2)},${fr.toFixed(2)} 0 1 1 ${(fr * 2).toFixed(2)},0Z`)
    }
  }
  return (
    <g>
      <path d={trunks.join('')} stroke={trunkC} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d={mainBranches.join('')} stroke={trunkC} strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d={canopies.join('')} fill={canopyC} />
      <path d={shade.join('')} stroke={canopyS} strokeWidth="1.2" fill="none" />
      <path d={leafTufts.join('')} fill={canopyC} />
      <path d={fruits.join('')} fill={fruitC} />
    </g>
  )
}

function GroundGrass({ isDark, groundY }: { isDark: boolean; groundY: number }) {
  const rng = seededRng(2557)
  const spread = 300 - groundY + 5
  const tufts: string[] = []
  const bushPaths: string[] = []
  const bladesPaths: string[] = []
  const flowerStems: string[] = []
  const flowerPetals: string[] = []
  const flowerCenters: string[] = []
  for (let i = 0; i < 160; i++) {
    const x = 5 + (i / 160) * 400 + (rng() - 0.5) * 10
    const baseY = groundY - 2 + rng() * spread
    const h = 1.8 + rng() * 3.0
    tufts.push(`M${x.toFixed(1)},${baseY.toFixed(1)}l${(-0.8).toFixed(2)},${(-h).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.7).toFixed(1)},${(-h * 0.85).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(1.1).toFixed(2)},${(-h * 0.65).toFixed(1)}`)
  }
  for (let i = 0; i < 100; i++) {
    const x = 5 + (i / 100) * 400 + (rng() - 0.5) * 12
    const by = groundY - 2 + rng() * spread
    const bw = 1.8 + rng() * 3.0
    const bh = 0.8 + rng() * 1.6
    bushPaths.push(`M${(x - bw).toFixed(1)},${by.toFixed(1)}Q${(x - bw * 0.3).toFixed(1)},${(by - bh * 1.5).toFixed(1)} ${x.toFixed(1)},${(by - bh).toFixed(1)}Q${(x + bw * 0.4).toFixed(1)},${(by - bh * 1.4).toFixed(1)} ${(x + bw).toFixed(1)},${by.toFixed(1)}Z`)
  }
  for (let i = 0; i < 120; i++) {
    const x = 5 + (i / 120) * 400 + (rng() - 0.5) * 10
    const by = groundY - 2 + rng() * spread
    const bh = 1.8 + rng() * 3.0
    const curve = (rng() - 0.5) * 1.5
    bladesPaths.push(`M${x.toFixed(1)},${by.toFixed(1)}C${(x + curve * 0.2).toFixed(1)},${(by - bh * 0.3).toFixed(1)} ${(x + curve * 0.7).toFixed(1)},${(by - bh * 0.6).toFixed(1)} ${(x + curve * 0.5).toFixed(1)},${(by - bh).toFixed(1)}`)
  }
  // Orange wildflowers
  const petalC = isDark ? '#8a5510' : '#d97706'
  const centerC = isDark ? '#b07820' : '#f0a828'
  for (let i = 0; i < 20; i++) {
    const fx = 5 + (i / 20) * 400 + (rng() - 0.5) * 20
    const fy = groundY - 1 + rng() * spread
    const sh = 3.0 + rng() * 3.5
    const tx = fx + (rng() - 0.5) * 0.5
    const ty = fy - sh
    const pr = 1.5 + rng() * 1.0
    flowerStems.push(`M${fx.toFixed(1)},${fy.toFixed(1)}L${tx.toFixed(1)},${ty.toFixed(1)}`)
    const petals = 4 + Math.floor(rng() * 3)
    for (let p = 0; p < petals; p++) {
      const ang = (p / petals) * Math.PI * 2 + rng() * 0.3
      const px = tx + Math.cos(ang) * pr
      const py = ty + Math.sin(ang) * pr * 0.7
      const prx = pr * 0.5, pry = pr * 0.35
      flowerPetals.push(`M${(px + prx).toFixed(2)},${py.toFixed(2)}a${prx.toFixed(2)},${pry.toFixed(2)} 0 1 1 -${(prx * 2).toFixed(2)},0a${prx.toFixed(2)},${pry.toFixed(2)} 0 1 1 ${(prx * 2).toFixed(2)},0Z`)
    }
    flowerCenters.push(`M${(tx + pr * 0.25).toFixed(2)},${ty.toFixed(2)}a${(pr * 0.25).toFixed(2)},${(pr * 0.25).toFixed(2)} 0 1 1 -${(pr * 0.5).toFixed(2)},0a${(pr * 0.25).toFixed(2)},${(pr * 0.25).toFixed(2)} 0 1 1 ${(pr * 0.5).toFixed(2)},0Z`)
  }
  return <>
    <path d={bushPaths.join('')} fill={isDark ? '#182c12' : '#3a6a2e'} opacity={isDark ? 0.25 : 0.15} />
    <path d={tufts.join('')} stroke={isDark ? '#223e1e' : '#527e42'} strokeWidth="0.6" fill="none" opacity="0.45" />
    <path d={bladesPaths.join('')} stroke={isDark ? '#1e3818' : '#3e6e34'} strokeWidth="0.4" fill="none" opacity="0.35" />
    <path d={flowerStems.join('')} stroke={isDark ? '#1a3a10' : '#5a8a40'} strokeWidth="0.2" fill="none" opacity="0.4" />
    <path d={flowerPetals.join('')} fill={petalC} opacity={isDark ? 0.45 : 0.35} />
    <path d={flowerCenters.join('')} fill={centerC} opacity={isDark ? 0.5 : 0.4} />
  </>
}

export default function PreviewPage() {
  const [isDark, setIsDark] = useState(true)
  const groundY = 200
  const hillPts: string[] = []
  for (let x = -10; x <= 410; x += 10) hillPts.push(`${x},${getHillY(x).toFixed(1)}`)
  const hillPath = `M${hillPts[0]} ${hillPts.slice(1).map(p => `L${p}`).join(' ')} L410,${groundY} L-10,${groundY} Z`
  const hillRidge = `M${hillPts[0]} ${hillPts.slice(1).map(p => `L${p}`).join(' ')}`

  return (
    <div style={{ background: isDark ? '#0e0c09' : '#f5f0e8', minHeight: '100vh', padding: 32, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: isDark ? '#dcd8d0' : '#2a2620', fontFamily: 'Crimson Pro, serif', fontSize: 28, fontWeight: 400, margin: 0 }}>Market Background Preview</h1>
        <button onClick={() => setIsDark(d => !d)} style={{
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
          color: isDark ? '#dcd8d0' : '#2a2620', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Crimson Pro, serif', fontSize: 14
        }}>{isDark ? 'Switch to Light' : 'Switch to Dark'}</button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
        {/* Background scene */}
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', display: 'block', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 12, background: isDark ? '#0e0c09' : '#ede6d8' }}>
          <Sky isDark={isDark} />
          <Moon isDark={isDark} mx={310} my={35} sc={4} />

          {/* Distant far hill — left side */}
          <defs>
            <linearGradient id="m-far-hill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isDark ? '#0a0e0c' : '#7a8870'} />
              <stop offset="100%" stopColor={isDark ? '#080c0a' : '#6a7860'} />
            </linearGradient>
          </defs>
          <path d="M-10,130 C10,118 40,100 80,92 C110,86 140,88 170,95 C190,100 210,108 230,118 L230,170 L-10,170 Z" fill="url(#m-far-hill)" opacity="0.8" />
          <path d="M-10,130 C10,118 40,100 80,92 C110,86 140,88 170,95 C190,100 210,108 230,118" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <path d="M-10,133 C10,121 40,104 80,96 C110,90 140,92 170,99 C190,104 210,112 230,122" fill="none" stroke={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} strokeWidth="0.3" />
          {/* Boulders on far hill */}
          {(() => {
            const rng = seededRng(7712)
            const farPts: [number,number][] = [[-10,130],[10,118],[40,100],[80,92],[110,86],[140,88],[170,95],[190,100],[210,108],[230,118]]
            const getFarY = (x: number) => {
              for (let j = 0; j < farPts.length - 1; j++) {
                if (x >= farPts[j][0] && x <= farPts[j+1][0]) {
                  const t = (x - farPts[j][0]) / (farPts[j+1][0] - farPts[j][0])
                  return farPts[j][1] + t * (farPts[j+1][1] - farPts[j][1])
                }
              }
              return 120
            }
            const rocks: string[] = []
            const rockDark: string[] = []
            const highlights: string[] = []
            const cracks: string[] = []
            const baseC = isDark ? '#141816' : '#6a7462'
            const darkC = isDark ? '#0e1210' : '#586858'
            const lightC = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'
            const crackC = isDark ? '#0c0e0c' : '#4a5a44'
            const sizes = [1, 0.3, 1.8, 0.5, 2.5, 0.4, 1.3, 0.7, 3, 0.6, 1.5, 0.35, 2, 0.8]
            for (let i = 0; i < 14; i++) {
              const rx = 5 + (i / 14) * 220 + (rng() - 0.5) * 25
              const ry = getFarY(rx) + 2 + rng() * 18
              const sizeMul = sizes[i]
              const w = sizeMul * (2 + rng() * 3), h = sizeMul * (1.5 + rng() * 2.5)
              const tilt = (rng() - 0.5) * 0.8
              const flatL = rng() * 0.4, flatR = rng() * 0.4
              // irregular rock — top half visible, bottom half buried in hill
              const jL = rng() * 0.3, jR = rng() * 0.3, jT = rng() * 0.2
              rocks.push(`M${(rx - w).toFixed(1)},${ry.toFixed(1)}Q${(rx - w * (0.7 + jL)).toFixed(1)},${(ry - h * (0.5 + jL)).toFixed(1)} ${(rx - w * 0.3 + tilt).toFixed(1)},${(ry - h * (0.9 + jT)).toFixed(1)}Q${(rx + tilt).toFixed(1)},${(ry - h * (1.05 + jT)).toFixed(1)} ${(rx + w * 0.35 + tilt).toFixed(1)},${(ry - h * (0.8 + jR)).toFixed(1)}Q${(rx + w * (0.8 + jR)).toFixed(1)},${(ry - h * (0.4 + jR)).toFixed(1)} ${(rx + w).toFixed(1)},${ry.toFixed(1)}Z`)
              // shadow at base
              rockDark.push(`M${(rx - w * 0.9).toFixed(1)},${(ry + 0.5).toFixed(1)}Q${rx.toFixed(1)},${(ry + h * 0.15 + 0.5).toFixed(1)} ${(rx + w * 0.9).toFixed(1)},${(ry + 0.5).toFixed(1)}`)
              // highlight on top
              highlights.push(`M${(rx - w * 0.3 + tilt).toFixed(1)},${(ry - h * (0.9 + jT)).toFixed(1)}Q${(rx + tilt).toFixed(1)},${(ry - h * (1.05 + jT)).toFixed(1)} ${(rx + w * 0.35 + tilt).toFixed(1)},${(ry - h * (0.8 + jR)).toFixed(1)}`)
              // cracks
              const cx1 = rx + (rng() - 0.5) * w * 0.5, cy1 = ry - h * (0.3 + rng() * 0.4)
              cracks.push(`M${cx1.toFixed(1)},${cy1.toFixed(1)}l${(rng() * 1.5 - 0.7).toFixed(1)},${(rng() * 1).toFixed(1)}`)
              if (w > 4) {
                const cx2 = rx + (rng() - 0.5) * w * 0.4, cy2 = ry - h * (0.2 + rng() * 0.3)
                cracks.push(`M${cx2.toFixed(1)},${cy2.toFixed(1)}l${(rng() - 0.5).toFixed(1)},${(rng() * 0.8).toFixed(1)}`)
              }
            }
            return <g>
              <path d={rocks.join('')} fill={baseC} />
              <path d={rockDark.join('')} stroke={darkC} strokeWidth="0.5" fill="none" opacity="0.6" />
              <path d={highlights.join('')} stroke={lightC} strokeWidth="0.5" fill="none" />
              <path d={cracks.join('')} stroke={crackC} strokeWidth="0.3" fill="none" opacity="0.5" />
            </g>
          })()}

          {/* Background hill */}
          <path d={hillPath} fill="url(#m-hill)" />
          {/* Ridge highlight */}
          <path d={hillRidge} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.6" />
          {/* Shadow band for depth */}
          {(() => {
            const shadowPts: string[] = []
            for (let x = -10; x <= 410; x += 10) shadowPts.push(`${x},${(getHillY(x) + 8).toFixed(1)}`)
            const shadowPath = `M${shadowPts[0]} ${shadowPts.slice(1).map(p => `L${p}`).join(' ')} L410,${groundY} L-10,${groundY} Z`
            return <path d={shadowPath} fill="rgba(0,0,0,0.08)" />
          })()}
          {/* Contour lines */}
          {[3, 6].map(offset => {
            const cPts: string[] = []
            for (let x = -10; x <= 410; x += 10) cPts.push(`${x},${(getHillY(x) + offset).toFixed(1)}`)
            return <path key={`c-${offset}`} d={`M${cPts[0]} ${cPts.slice(1).map(p => `L${p}`).join(' ')}`} fill="none" stroke={isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)'} strokeWidth={offset === 3 ? "0.4" : "0.3"} />
          })}

          {/* Dirt paths on hill */}
          <HillPaths isDark={isDark} />

          {/* Tangerine trees on hill */}
          <TangerineTrees isDark={isDark} />

          {/* Hill grass — tufts, bushes, blades all over the hill */}
          <HillGrass isDark={isDark} />

          {/* Ground plane */}
          <path d={`M-10,${groundY} L200,${groundY - 2} L410,${groundY} L410,300 L-10,300 Z`} fill="url(#m-ground)" />
          {/* Foreground hill contour lines */}
          <path d={`M-10,${groundY + 3} L200,${groundY + 1} L410,${groundY + 3}`} fill="none" stroke={isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)'} strokeWidth="0.4" />
          <path d={`M-10,${groundY + 8} L200,${groundY + 6} L410,${groundY + 8}`} fill="none" stroke={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.025)'} strokeWidth="0.3" />
          <path d={`M-10,${groundY + 15} L200,${groundY + 13} L410,${groundY + 15}`} fill="none" stroke={isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.02)'} strokeWidth="0.25" />
          {/* Shadow band */}
          <path d={`M-10,${groundY + 6} L200,${groundY + 4} L410,${groundY + 6} L410,300 L-10,300 Z`} fill="rgba(0,0,0,0.05)" />
          <GroundGrass isDark={isDark} groundY={groundY - 1} />

          {/* Fence — no gap, bigger, orchard style with slight slope */}
          <Fence isDark={isDark} groundY={groundY} />

          {/* Lamppost — shifted left, faces left, bigger */}
          <Lamppost isDark={isDark} lx={170} ly={groundY} sc={6} />
        </svg>

        {/* Stall overlay — same SVG from BoutiqueView, full size at bottom */}
        <svg viewBox="0 0 400 265" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '65%' }}>
          <defs>
            <radialGradient id="o-body" cx="38%" cy="35%">
              <stop offset="0%" stopColor="#e8a030" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b06205" />
            </radialGradient>
            <radialGradient id="lantern-glow">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.35" />
              <stop offset="25%" stopColor="#d97706" stopOpacity="0.18" />
              <stop offset="50%" stopColor="#d97706" stopOpacity="0.07" />
              <stop offset="75%" stopColor="#d97706" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>
          </defs>
          <style>{`
            @keyframes root-sway-l { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-0.3px,-0.4px); } }
            @keyframes root-sway-r { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(0.3px,-0.4px); } }
            @keyframes blink-open { 0%, 90%, 95%, 100% { opacity: 1; } 92.5% { opacity: 0; } }
            @keyframes blink-shut { 0%, 90%, 95%, 100% { opacity: 0; } 92.5% { opacity: 1; } }
          `}</style>

          {/* Left pole */}
          <rect x="113" y="103" width="7" height="114" rx="2.5" fill={isDark ? '#3e3018' : '#a89878'} />
          <rect x="114" y="103" width="5" height="114" rx="2" fill={isDark ? '#5a4a32' : '#b8a888'} />
          {/* Right pole */}
          <rect x="279" y="103" width="7" height="114" rx="2.5" fill={isDark ? '#3e3018' : '#a89878'} />
          <rect x="280" y="103" width="5" height="114" rx="2" fill={isDark ? '#5a4a32' : '#b8a888'} />
          {/* Finials */}
          <circle cx="117" cy="103" r="5" fill={isDark ? '#5a4a32' : '#b8a888'} />
          <circle cx="117" cy="103" r="3.5" fill={isDark ? '#6a5a42' : '#c8b898'} />
          <circle cx="283" cy="103" r="5" fill={isDark ? '#5a4a32' : '#b8a888'} />
          <circle cx="283" cy="103" r="3.5" fill={isDark ? '#6a5a42' : '#c8b898'} />

          {/* String lights */}
          <path d="M117 125 Q200 158 283 125" stroke={isDark ? '#4a3a28' : '#8a7a60'} strokeWidth="0.5" fill="none" />
          {[130,145,160,175,190,205,220,235,250,265].map((lx, li) => {
            const t = (lx - 117) / (283 - 117)
            const ly = 125 + 2 * t * (1 - t) * 33
            return (
              <g key={`sl-${li}`}>
                <line x1={lx} y1={ly} x2={lx} y2={ly + 4} stroke={isDark ? '#4a3a28' : '#8a7a60'} strokeWidth="0.3" />
                <circle cx={lx} cy={ly + 4.5} r={1.4} fill="#d97706" opacity="0.8" />
                <circle cx={lx} cy={ly + 4.5} r={0.6} fill="#f0c050" />
              </g>
            )
          })}

          {/* Canopy */}
          <path d="M103 105 Q200 84 297 105 L293 116 Q200 97 107 116 Z" fill="#d97706" />
          <path d="M107 116 Q200 97 293 116 L290 125 Q200 108 110 125 Z" fill={isDark ? '#a06820' : '#c8a050'} />
          <path d="M110 125 Q200 108 290 125 L287 132 Q200 116 113 132 Z" fill="#c48a18" />
          <path d="M103 105 Q110 112 117 105 Q124 112 131 105 Q138 112 145 105 Q152 112 159 105 Q166 112 173 105 Q180 112 187 105 Q194 112 201 105 Q208 112 215 105 Q222 112 229 105 Q236 112 243 105 Q250 112 257 105 Q264 112 271 105 Q278 112 285 105 Q292 112 297 105" fill="none" stroke="#b07a10" strokeWidth="1.5" />

          {/* Lanterns */}
          <line x1="140" y1="126" x2="140" y2="147" stroke={isDark ? '#3e3018' : '#a89878'} strokeWidth="1" />
          <rect x="131" y="147" width="18" height="22" rx="4.5" fill={isDark ? '#3a3020' : '#988868'} stroke={isDark ? '#2a2418' : '#8a8070'} strokeWidth="0.4" />
          <rect x="133" y="149" width="14" height="18" rx="3.5" fill={isDark ? '#2a2418' : '#8a8070'} />
          <line x1="133" y1="158" x2="147" y2="158" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.6" />
          <line x1="140" y1="149" x2="140" y2="167" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.6" />
          <circle cx="140" cy="158" r="4.5" fill="#d97706" />
          <circle cx="140" cy="158" r="2.5" fill="#e8a030" />
          <circle cx="140" cy="158" r="35" fill="url(#lantern-glow)" />

          <line x1="260" y1="126" x2="260" y2="147" stroke={isDark ? '#3e3018' : '#a89878'} strokeWidth="1" />
          <rect x="251" y="147" width="18" height="22" rx="4.5" fill={isDark ? '#3a3020' : '#988868'} stroke={isDark ? '#2a2418' : '#8a8070'} strokeWidth="0.4" />
          <rect x="253" y="149" width="14" height="18" rx="3.5" fill={isDark ? '#2a2418' : '#8a8070'} />
          <line x1="253" y1="158" x2="267" y2="158" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.6" />
          <line x1="260" y1="149" x2="260" y2="167" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.6" />
          <circle cx="260" cy="158" r="4.5" fill="#d97706" />
          <circle cx="260" cy="158" r="2.5" fill="#e8a030" />
          <circle cx="260" cy="158" r="35" fill="url(#lantern-glow)" />

          {/* Root arms */}
          <g style={{ animation: 'root-sway-l 6s ease-in-out infinite', transformOrigin: '186px 210px' }}>
            <path d="M186 212 Q174 213 164 214 Q156 215 150 216" stroke={isDark ? '#5a3e1e' : '#8a7050'} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M150 216 Q146 218 144 222 Q142 228 141 235 Q140 242 140 248" stroke={isDark ? '#5a3e1e' : '#8a7050'} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M140 248 Q139 252 139 255" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1.1" fill="none" strokeLinecap="round" />
            <path d="M168 214 Q164 211 160 208" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1.1" fill="none" strokeLinecap="round" />
            <path d="M160 208 Q158 206 156 205" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.7" fill="none" strokeLinecap="round" />
            <path d="M156 205 Q155 203 154 204" fill={isDark ? '#3a5a1a' : '#7a9a5a'} />
          </g>
          <g style={{ animation: 'root-sway-r 7s ease-in-out infinite', transformOrigin: '214px 210px' }}>
            <path d="M214 212 Q226 213 236 214 Q244 215 250 216" stroke={isDark ? '#5a3e1e' : '#8a7050'} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M250 216 Q254 218 256 222 Q258 228 259 235 Q260 242 260 248" stroke={isDark ? '#5a3e1e' : '#8a7050'} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M260 248 Q261 252 261 255" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M232 214 Q234 210 236 207" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M236 207 Q237 205 238 203" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M238 203 Q239 201 238 200" fill={isDark ? '#3a5a1a' : '#7a9a5a'} />
          </g>

          {/* The orange */}
          <circle cx="200" cy="210" r="20" fill="url(#o-body)" stroke={isDark ? '#1a1410' : '#8a7050'} strokeWidth="0.15" />
          <ellipse cx="194" cy="201" rx="5" ry="7" fill="#e0a830" opacity="0.35" transform="rotate(-15 194 201)" />
          <rect x="199" y="188" width="2.5" height="4" rx="1" fill="#4a6a2a" />
          <path d="M201.5 190 Q206 184 210 186 Q206 189 201.5 190" fill="#4a7a2a" />
          {/* Earrings */}
          <line x1="181" y1="212" x2="179" y2="215" stroke={isDark ? '#5a4a32' : '#b8a888'} strokeWidth="0.4" />
          <circle cx="179" cy="216" r="1.2" fill="#d97706" />
          <line x1="219" y1="212" x2="221" y2="215" stroke={isDark ? '#5a4a32' : '#b8a888'} strokeWidth="0.4" />
          <circle cx="221" cy="216" r="1.2" fill="#d97706" />
          {/* Face */}
          <g style={{ animation: 'blink-open 5s ease-in-out infinite' }}>
            <circle cx="194" cy="207" r="2.5" fill={isDark ? '#1a1410' : '#3a3020'} />
            <circle cx="206" cy="207" r="2.5" fill={isDark ? '#1a1410' : '#3a3020'} />
            <circle cx="195" cy="205.8" r="1" fill="#fff" />
            <circle cx="207" cy="205.8" r="1" fill="#fff" />
          </g>
          <g style={{ animation: 'blink-shut 5s ease-in-out infinite' }}>
            <path d="M192 207 Q194 209 196 207" stroke={isDark ? '#1a1410' : '#3a3020'} strokeWidth="1.3" fill="none" strokeLinecap="round" />
            <path d="M204 207 Q206 209 208 207" stroke={isDark ? '#1a1410' : '#3a3020'} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          </g>
          <ellipse cx="200" cy="216" rx="2.2" ry="2.8" fill="#8a4a05" />
          <ellipse cx="200" cy="216" rx="1.5" ry="2" fill="#6a3a04" />

          {/* Cart */}
          <rect x="100" y="218" width="200" height="44" rx="3" fill={isDark ? '#3a2e20' : '#a09070'} />
          <rect x="100" y="218" width="200" height="10" rx="2" fill={isDark ? '#4a3a28' : '#b0a080'} />
          <rect x="100" y="228" width="200" height="9" fill={isDark ? '#423626' : '#a89878'} />
          <rect x="100" y="237" width="200" height="9" fill={isDark ? '#4a3a28' : '#b0a080'} />
          <rect x="100" y="246" width="200" height="9" fill={isDark ? '#3e3222' : '#a09070'} />
          <rect x="100" y="255" width="200" height="7" fill={isDark ? '#4a3a28' : '#b0a080'} />
          <line x1="148" y1="218" x2="147" y2="262" stroke={isDark ? '#342a1c' : '#988868'} strokeWidth="0.6" />
          <line x1="205" y1="218" x2="204" y2="262" stroke={isDark ? '#342a1c' : '#988868'} strokeWidth="0.6" />
          <line x1="260" y1="218" x2="261" y2="262" stroke={isDark ? '#342a1c' : '#988868'} strokeWidth="0.6" />
          {/* Top rail */}
          <rect x="95" y="212" width="210" height="8" rx="3" fill={isDark ? '#4a3a28' : '#b0a080'} />
          <rect x="95" y="212" width="210" height="4" rx="2" fill={isDark ? '#6a5a42' : '#c8b898'} />
          <rect x="95" y="212" width="210" height="2" rx="1" fill={isDark ? '#7a6a52' : '#d0c0a0'} />
          {/* Iron corners */}
          <path d="M97 212 L97 230" stroke={isDark ? '#3a3018' : '#9a9080'} strokeWidth="3" strokeLinecap="round" />
          <path d="M97 212 L112 212" stroke={isDark ? '#3a3018' : '#9a9080'} strokeWidth="3" strokeLinecap="round" />
          <path d="M303 212 L303 230" stroke={isDark ? '#3a3018' : '#9a9080'} strokeWidth="3" strokeLinecap="round" />
          <path d="M288 212 L303 212" stroke={isDark ? '#3a3018' : '#9a9080'} strokeWidth="3" strokeLinecap="round" />
          {/* SEEDS sign */}
          <line x1="200" y1="220" x2="200" y2="228" stroke={isDark ? '#4a3a28' : '#8a7a60'} strokeWidth="1" />
          <rect x="178" y="228" width="44" height="18" rx="2.5" fill={isDark ? '#3a3020' : '#988868'} stroke={isDark ? '#2a2418' : '#8a8070'} strokeWidth="0.4" />
          <text x="200" y="242" textAnchor="middle" fill={isDark ? '#1a1410' : '#2a2218'} fontSize="12" fontFamily="'Brush Script MT', cursive" fontStyle="italic" opacity="0.9" letterSpacing="1">Trade</text>
          {/* Shadow */}
          <ellipse cx="200" cy="262" rx="60" ry="3" fill={isDark ? '#0a0806' : '#b0a890'} opacity="0.3" />
        </svg>
      </div>

      <div style={{ color: isDark ? 'rgba(220,216,208,0.4)' : 'rgba(42,38,32,0.4)', fontSize: 11, textAlign: 'center', marginTop: 16 }}>
        Full shop sprite · No fence gap · Bigger fence + lamppost · Orchard grass on hill · Moon + tangerine trees
      </div>
    </div>
  )
}
