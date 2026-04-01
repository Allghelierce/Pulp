"use client"
import { useState, useEffect, useRef, useCallback, memo } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

/** 
 * Realistic Physics Twine
 * Quadratic bezier: start (8,0), control (8+bow, 60), end (8,120)
 */
function FlexTwine({ bow }: { bow: import("framer-motion").MotionValue<number> }) {
  const [b, setB] = useState(0)
  useEffect(() => bow.on("change", setB), [bow])
  
  const d1 = `M8 0 Q${8 + b} 60 8 120`
  const d2 = `M8 0 Q${8 + b * 0.7} 60 8 120`
  
  return (
    <svg width="16" height="120" viewBox="0 0 16 120" style={{ overflow: "visible", display: "block" }}>
      <path d={d1} stroke="rgba(0,0,0,0.1)" strokeWidth="1.2" fill="none" />
      <path d={d1} stroke="#e5e5e5" strokeWidth="0.8" fill="none" strokeDasharray="3 2" />
      <path d={d2} stroke="#b85e22" strokeWidth="0.6" fill="none" strokeDasharray="2 3" strokeDashoffset="2" />
    </svg>
  )
}

export const HangingOrange = memo(function HangingOrange({ onClick }: { onClick: () => void }) {
  const angle = useMotionValue(0)
  
  // High-inertia pendulum spring
  const springAngle = useSpring(angle, {
    stiffness: 40,
    damping: 4,
    mass: 1.5,
  })

  // String lag (flex)
  const lagAngle = useSpring(angle, {
    stiffness: 20,
    damping: 3,
    mass: 2,
  })

  const stringBow = useTransform(lagAngle, v => v * 0.8)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nudge = useCallback(() => {
    const mag = 1 + Math.random() * 3
    const dir = Math.random() > 0.5 ? 1 : -1
    angle.set(mag * dir)
    
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(nudge, 4000 + Math.random() * 6000)
  }, [angle])

  useEffect(() => {
    nudge()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [nudge])

  return (
    <motion.div
      onClick={(e) => {
        // High-energy pull animation
        angle.set(angle.get() + (Math.random() > 0.5 ? 15 : -15))
        // Small delay to let the click feel "physical"
        setTimeout(onClick, 100)
      }}
      className="fixed z-[9999]"
      style={{
        top: 0,
        right: 40,
        width: 32,
        height: 180,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        transformOrigin: "top center",
        rotate: springAngle,
      }}
      whileHover={{ y: 2 }}
      whileTap={{ y: 15, scaleX: 1.1, scaleY: 0.9 }}
    >
      <FlexTwine bow={stringBow} />
      
      {/* Connector Ring */}
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        border: "1.5px solid #d4d4d4",
        marginTop: -4,
        zIndex: 2,
        background: "#fff"
      }} />

      {/* The Orange */}
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
        boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3), inset -2px -2px 6px rgba(0,0,0,0.1), inset 2px 2px 6px rgba(255,255,255,0.2)",
        marginTop: -2,
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {/* Leaf */}
        <div style={{
          position: "absolute", top: -4, right: -2,
          width: 12, height: 6,
          background: "#166534",
          borderRadius: "100% 0% 100% 0%",
          rotate: "15deg",
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
        }} />
        
        {/* Shine */}
        <div style={{
          position: "absolute", top: 5, left: 6,
          width: 6, height: 3,
          background: "rgba(255,255,255,0.4)",
          borderRadius: "50%",
          rotate: "-45deg"
        }} />

        {/* Timer Icon or Dot */}
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(0,0,0,0.15)" }} />
      </div>
    </motion.div>
  )
})
