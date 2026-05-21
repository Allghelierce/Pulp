"use client"
import { memo, useMemo } from "react"
import { TREE_TYPES } from "@/app/constants"
import { CachedPlantImage } from "./CachedPlantImage"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = 'Crimson Pro, serif'

const RecentlyGrownWidget = memo(function RecentlyGrownWidget({ isDark, grove }: WidgetProps) {
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'

  const styled = useMemo(() => {
    if (grove.length === 0) return []
    const recent = [...grove].sort((a, b) => new Date(b.plantedAt).getTime() - new Date(a.plantedAt).getTime()).slice(0, 5)
    return recent.map((tree, i) => {
      const seed = ((tree.type.charCodeAt(0) * 7 + i * 13) % 100) / 100
      return { tree, yOff: Math.round(seed * 6 - 1), tilt: ((seed * 6) - 3) * 0.5, size: 34 + Math.round(seed * 4) }
    })
  }, [grove])

  if (grove.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <span style={{ fontSize: 10, color: textMuted, fontStyle: 'italic' }}>No trees yet</span>
      </div>
    )
  }

  const itemW = 70
  const halfW = styled.length * itemW
  const doubled = [...styled, ...styled]

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', borderRadius: 20 }}>
      <span style={{
        position: 'absolute', top: 8, left: 14, fontSize: 10, fontWeight: 400,
        color: isDark ? '#5a5650' : '#a8a4a0', letterSpacing: '0.1em',
        textTransform: 'uppercase', fontFamily: font, zIndex: 2,
      }}>Recently Grown</span>
      <div style={{
        position: 'absolute', inset: 0,
        background: isDark
          ? 'linear-gradient(180deg, #141210 0%, #1a1610 40%, #2a2418 75%, #1e1a12 100%)'
          : 'linear-gradient(180deg, #f5f3ef 0%, #ebe5d8 40%, #ddd5c4 75%, #c8b890 100%)',
      }} />
      <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 24 }} preserveAspectRatio="none" viewBox="0 0 100 10">
        <ellipse cx="15" cy="6" rx="18" ry="5" fill={isDark ? '#2e2818' : '#c0a878'} />
        <ellipse cx="50" cy="7" rx="30" ry="4.5" fill={isDark ? '#2a2414' : '#baa470'} />
        <ellipse cx="85" cy="5.5" rx="20" ry="5.5" fill={isDark ? '#2c2616' : '#c4ac7c'} />
        <rect y="8" width="100" height="3" fill={isDark ? '#1a1610' : '#b09a68'} />
      </svg>
      <div style={{
        position: 'absolute', bottom: 10, left: 0, right: 0, height: 54,
        overflow: 'hidden',
        maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', width: halfW * 2,
          animation: 'conveyorScroll 35s linear infinite',
          willChange: 'transform',
        }}>
          {doubled.map(({ tree, yOff, tilt, size }, i) => (
            <div key={`t-${i}`} title={TREE_TYPES[tree.type]?.name ?? tree.type} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              width: itemW, flexShrink: 0, marginBottom: yOff,
              transform: `rotate(${tilt}deg)`,
            }}>
              <CachedPlantImage type={tree.type} size={size} stage={tree.stage} />
              <div style={{
                width: size * 0.6, height: 3, borderRadius: '50%', marginTop: -2,
                background: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)',
                filter: 'blur(1.5px)',
              }} />
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes conveyorScroll { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`}</style>
    </div>
  )
})

registerWidget({
  id: 'recently-grown',
  name: 'Recently Grown',
  description: 'Scrolling parade of your latest trees',
  category: 'grove',
  defaultSize: [3, 1],
  minSize: [2, 1],
  maxSize: [4, 1],
  component: RecentlyGrownWidget,
})
