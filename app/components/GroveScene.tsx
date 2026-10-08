"use client"

// Shared forest-grove scene: dawn sky (light) / night sky with stars and
// fireflies (dark), layered hills, drifting mist. Used by the Party grove and
// the Stats dashboard's week forest. Pure CSS animation, no React re-renders.

export const SCENE_CSS = `
@keyframes groveFirefly { 0%,100% { transform: translate(0,0); opacity: 0 } 20% { opacity: .9 } 50% { transform: translate(var(--dx), var(--dy)); opacity: .6 } 80% { opacity: .9 } }
@keyframes groveTwinkle { 0%,100% { opacity: .55 } 50% { opacity: .9 } }
@keyframes groveMist { 0% { transform: translateX(-6%) } 100% { transform: translateX(6%) } }
@keyframes groveRise { from { transform: translateY(10px) scale(.92); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes groveGlow { 0%,100% { opacity: .55 } 50% { opacity: .9 } }
@keyframes groveFocus { 0%,100% { transform: scale(.92); opacity: .45 } 50% { transform: scale(1.08); opacity: .95 } }
@keyframes groveBurst { 0% { transform: translate(0,0) scale(.6); opacity: 1 } 100% { transform: translate(var(--dx), var(--dy)) scale(1); opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .grove-anim { animation: none !important } }
`

export function GroveBackdrop({ isDark, height }: { isDark: boolean; height: number }) {
  const sky = isDark
    ? 'linear-gradient(180deg, #0b1a1a 0%, #10241f 45%, #16301f 100%)'
    : 'linear-gradient(180deg, #fde9c8 0%, #f3ecd2 40%, #dfe9cf 100%)'
  const hills = isDark ? ['#183a2a', '#12301f', '#0c2416'] : ['#c5dbb0', '#a9cc92', '#8fbd78']
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: sky }} />
      {/* Moon / sun */}
      <div style={{ position: 'absolute', top: 16, right: 28, width: 26, height: 26, borderRadius: '50%',
        background: isDark ? 'radial-gradient(circle at 35% 35%, #fff8e1, #f5deb3 70%)' : 'radial-gradient(circle, #fff4d6, #fbbf24 75%)',
        boxShadow: isDark ? '0 0 24px 6px rgba(253,230,138,0.18)' : '0 0 36px 12px rgba(251,191,36,0.35)' }} />
      {isDark && [[12, 18], [30, 10], [48, 24], [64, 12], [80, 30], [22, 34], [56, 6], [90, 16]].map(([x, y], i) => (
        <span key={i} className="grove-anim" style={{ position: 'absolute', left: `${x}%`, top: y, width: 2, height: 2, borderRadius: 1,
          background: '#fef3c7', animation: `groveTwinkle ${3.6 + (i % 4) * 0.9}s ease-in-out ${i * 0.7}s infinite` }} />
      ))}
      {/* Fireflies drift in the sky, behind the hills (the hills cover any that dip low). */}
      {isDark && Array.from({ length: 7 }, (_, i) => (
        <span key={i} className="grove-anim" style={{ position: 'absolute', left: `${8 + i * 13}%`, bottom: height * 0.5 + (i * 11) % Math.max(8, height * 0.22), width: 3, height: 3, borderRadius: '50%',
          background: '#fde68a', boxShadow: '0 0 6px 2px rgba(253,230,138,0.6)',
          ['--dx' as string]: `${(i % 2 ? 1 : -1) * (8 + i * 2)}px`, ['--dy' as string]: `${-10 - (i % 3) * 6}px`,
          animation: `groveFirefly ${5 + (i % 3)}s ease-in-out ${i * 0.7}s infinite` } as React.CSSProperties} />
      ))}
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: height * 0.62 }}>
        <path d="M0 60 Q60 20 130 48 T260 40 T400 52 V120 H0Z" fill={hills[0]} />
        {/* distant pines */}
        {[18, 44, 70, 300, 332, 360, 384].map((x, i) => (
          <path key={i} d={`M${x} ${46 - (i % 3) * 4} l-7 18 h14z`} fill={hills[1]} opacity={0.9} />
        ))}
        <path d="M0 78 Q90 52 190 74 T400 70 V120 H0Z" fill={hills[1]} />
        <path d="M0 98 Q120 84 220 96 T400 92 V120 H0Z" fill={hills[2]} />
      </svg>
      <div className="grove-anim" style={{ position: 'absolute', left: '-10%', right: '-10%', bottom: height * 0.22, height: 34,
        background: isDark ? 'linear-gradient(90deg, transparent, rgba(167,243,208,0.07), transparent)' : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
        filter: 'blur(6px)', animation: 'groveMist 9s ease-in-out infinite alternate' }} />

    </>
  )
}
