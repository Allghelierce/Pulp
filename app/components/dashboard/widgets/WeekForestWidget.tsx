"use client"
import { memo, useMemo } from "react"
import { registerWidget, ROW_HEIGHT, GRID_GAP, type WidgetProps } from "../widgetRegistry"
import { GroveBackdrop } from "@/app/components/GroveScene"
import { PlantIcon, ANIMATED_SHAPES } from "@/app/components/PlantIcon"
import { TREE_TYPES } from "@/app/constants"
import { CountUp, fmtMinutes } from "../lively"

const font = 'Crimson Pro, serif'

// Your last seven days as a tiny forest: one plot per day, a tree sized and
// staged by that day's focus minutes, bare dirt for days with none. The
// species is whatever you actually grew that day (tangerine otherwise).
const stageFor = (min: number) => (min < 15 ? 0 : min < 45 ? 1 : min < 90 ? 2 : 3)

const WeekForestWidget = memo(function WeekForestWidget({ isDark, dailyStats, grove, size }: WidgetProps) {
  const H = size[1] * ROW_HEIGHT + (size[1] - 1) * GRID_GAP
  const scale = Math.min(1.8, H / ROW_HEIGHT)
  const label = isDark ? '#e7e5e4' : '#2f2a22'
  const soft = isDark ? 'rgba(231,229,228,0.55)' : 'rgba(47,42,34,0.85)'
  const shadowText = isDark ? '0 1px 2px rgba(0,0,0,0.6)' : '0 0 3px rgba(255,255,255,0.7), 0 1px 0 rgba(255,255,255,0.6)'

  const days = useMemo(() => {
    const stats = new Map(dailyStats.map(e => [e.date, e]))
    const grownOn = new Map<string, string>()
    for (const t of grove) {
      if (!t.plantedAt) continue
      grownOn.set(new Date(t.plantedAt).toISOString().split("T")[0], t.type)
    }
    const out: { key: string; name: string; minutes: number; chars: number; type: string; today: boolean }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const key = d.toISOString().split("T")[0]
      const e = stats.get(key)
      const type = grownOn.get(key)
      out.push({
        key, today: i === 0,
        name: d.toLocaleDateString(undefined, { weekday: 'short' }),
        minutes: e?.focusMinutes ?? 0, chars: e?.charsWritten ?? 0,
        type: type && TREE_TYPES[type] ? type : 'tangerine',
      })
    }
    return out
  }, [dailyStats, grove])

  const total = days.reduce((s, d) => s + d.minutes, 0)
  const bestMinutes = Math.max(...days.map(d => d.minutes))
  const planted = days.filter(d => d.minutes > 0).length

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
      <GroveBackdrop isDark={isDark} height={H} />

      <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 2, textShadow: shadowText, pointerEvents: 'none' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: soft }}>Your week, as a forest</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 1 }}>
          <span style={{ fontFamily: font, fontSize: 20, color: label, lineHeight: 1.1 }}><CountUp value={total} format={fmtMinutes} /></span>
          <span style={{ fontSize: 9, color: soft }}>{planted === 0 ? 'nothing planted yet' : `${planted} of 7 days planted`}</span>
        </div>
      </div>

      {days.map((d, i) => {
        const left = `${((i + 0.5) / 7) * 100}%`
        const title = `${d.today ? 'Today' : d.name} · ${d.minutes} min focus${d.chars ? ` · ${d.chars.toLocaleString()} chars` : ''}`
        const dayLabel = (
          <div style={{ marginTop: 3, fontSize: 10, letterSpacing: '0.04em', whiteSpace: 'nowrap', textShadow: shadowText,
            color: d.today ? '#d97706' : label, fontWeight: d.today ? 600 : 400 }}>
            {d.today ? 'today' : d.name}
            {d.minutes > 0 && <span style={{ color: soft, fontWeight: 400 }}> · {fmtMinutes(d.minutes)}</span>}
          </div>
        )
        if (d.minutes <= 0) {
          // Bare dirt. Today's empty plot holds a seed, waiting.
          return (
            <div key={d.key} title={title} style={{ position: 'absolute', left, bottom: 8, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {d.today && (
                <div className="grove-anim" style={{ marginBottom: -4, animation: 'groveRise .7s cubic-bezier(.2,.8,.2,1) .5s both' }}>
                  <PlantIcon type="tangerine" size={18 * scale} stage={0} isSeed hideGround />
                </div>
              )}
              <div style={{ width: 30 * scale, height: 8 * scale, borderRadius: '50%',
                background: isDark ? 'radial-gradient(ellipse at 50% 35%, #6b4a2c, #3d2a18 75%)' : 'radial-gradient(ellipse at 50% 35%, #a87a4f, #7c5634 75%)',
                boxShadow: d.today ? `0 0 0 1px ${isDark ? 'rgba(253,230,138,0.35)' : 'rgba(217,119,6,0.45)'}` : 'none',
                opacity: d.today ? 1 : 0.85 }} />
              {dayLabel}
            </div>
          )
        }
        const stage = stageFor(d.minutes)
        const glowShape = ANIMATED_SHAPES.has(TREE_TYPES[d.type]?.shape || '')
        // 40px for a short session up to 68px around two hours (the first plot
        // stays a touch smaller so it never reaches the caption); gem trees
        // render taller, so they get a little less width to fit the sky.
        const maxPx = i === 0 ? 56 : 68
        const px = Math.round((40 + (maxPx - 40) * Math.min(1, d.minutes / 120)) * scale * (glowShape ? 0.75 : 1))
        const best = d.minutes === bestMinutes && planted > 1
        return (
          // Outer div centers on the plot; the inner one rises (its keyframes own `transform`).
          <div key={d.key} title={title} style={{ position: 'absolute', left, bottom: 8, transform: 'translateX(-50%)' }}>
          <div className="grove-anim" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
              transformOrigin: '50% 100%', animation: `groveRise .8s cubic-bezier(.2,.8,.2,1) ${0.15 + i * 0.08}s both` }}>
            <div style={{ position: 'relative' }}>
              {best && <div className="grove-anim" style={{ position: 'absolute', inset: -8, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(253,230,138,0.40), transparent 65%)', animation: 'groveGlow 3.4s ease-in-out infinite' }} />}
              <PlantIcon type={d.type} size={px} stage={stage} hideGround />
            </div>
            <div style={{ width: px * 0.6, height: 6, borderRadius: '50%', marginTop: -3,
              background: isDark ? 'rgba(61,42,24,0.9)' : 'rgba(124,86,52,0.55)', filter: 'blur(1px)' }} />
            {dayLabel}
          </div>
          </div>
        )
      })}
    </div>
  )
})

registerWidget({
  id: 'week-forest',
  name: 'Week Forest',
  description: 'Your last seven days as a tiny grove — one tree per day, grown by focus',
  category: 'grove',
  defaultSize: [6, 1],
  minSize: [3, 1],
  maxSize: [6, 2],
  component: WeekForestWidget,
})
