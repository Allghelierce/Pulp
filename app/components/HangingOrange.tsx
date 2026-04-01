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
  
  // Start from -100 to ensure it's always attached to top
  const d1 = `M8 -100 Q${8 + b} 60 8 120`
  const d2 = `M8 -100 Q${8 + b * 0.7} 60 8 120`
  
  return (
    <svg width="16" height="220" viewBox="0 -100 16 220" style={{ overflow: "visible", display: "block", marginTop: -100 }}>
      <path d={d1} stroke="rgba(0,0,0,0.1)" strokeWidth="1.2" fill="none" />
      <path d={d1} stroke="#e5e5e5" strokeWidth="0.8" fill="none" strokeDasharray="3 2" />
      <path d={d2} stroke="#b85e22" strokeWidth="0.6" fill="none" strokeDasharray="2 3" strokeDashoffset="2" />
    </svg>
  )
}

// Random faces for the orange - cute and small
const faces = [
  { emoji: "😊", label: "happy" },
  { emoji: "😆", label: "excited" },
  { emoji: "😐", label: "serious" },
  { emoji: "😮", label: "surprised" },
  { emoji: "😵", label: "dizzy" },
  { emoji: "😢", label: "sad" },
  { emoji: "😴", label: "sleepy" },
  { emoji: "😍", label: "love" },
  { emoji: "🥰", label: "grateful" },
  { emoji: "😋", label: "yummy" },
  { emoji: "🤔", label: "thinking" },
  { emoji: "😎", label: "cool" },
]

export const HangingOrange = memo(function HangingOrange({ onClick }: { onClick: () => void }) {
  const angle = useMotionValue(0)
  const [faceIndex, setFaceIndex] = useState(0)
  const faceScaleMotion = useMotionValue(1)
  const faceScaleSpring = useSpring(faceScaleMotion, { stiffness: 200, damping: 15 })
  
  // Smooth, elastic pendulum
  const springAngle = useSpring(angle, {
    stiffness: 80,
    damping: 12,
    mass: 0.8,
  })

  // String lag (flex)
  const lagAngle = useSpring(angle, {
    stiffness: 60,
    damping: 10,
    mass: 0.9,
  })

  const stringBow = useTransform(lagAngle, v => v * 0.8)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const changeFace = useCallback(() => {
    // Random face, exclude current one
    let newIndex = Math.floor(Math.random() * faces.length)
    while (newIndex === faceIndex) {
      newIndex = Math.floor(Math.random() * faces.length)
    }
    setFaceIndex(newIndex)

    // Trigger scale animation
    faceScaleMotion.set(0.7)
    setTimeout(() => {
      faceScaleMotion.set(1)
    }, 50)
  }, [faceIndex, faceScaleMotion])

  const nudge = useCallback(() => {
    const mag = 0.3 + Math.random() * 0.5
    const dir = Math.random() > 0.5 ? 1 : -1
    angle.set(mag * dir)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(nudge, 2500 + Math.random() * 3500)
  }, [angle])

  useEffect(() => {
    nudge()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [nudge])

  return (
    <motion.div
      onClick={() => {
        changeFace()
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
      whileTap={{ y: 12, scaleX: 1.03, scaleY: 0.97 }}
    >
      <FlexTwine bow={stringBow} />
      
      {/* Fruit Asset - Simplified for Natural look */}
      <div className="relative flex flex-col items-center">
        {/* Connector Ring (sits on top dimple) */}
        <div className="relative z-20 -mt-2 flex flex-col items-center">
           <div style={{ width: 8, height: 8, borderRadius: "50%", border: "1.2px solid #d4d4d8", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }} />
        </div>

        {/* The Orange Ball */}
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #fb923c 0%, #ea580c 100%)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.15), inset -3px -3px 8px rgba(0,0,0,0.15), inset 3px 3px 6px rgba(255,255,255,0.25)",
          marginTop: -4,
          position: "relative",
          overflow: "hidden"
        }}>
           {/* Pores / Texture */}
           <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.15 }}>
             <filter id="orange-noise">
               <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" />
             </filter>
             <rect width="100%" height="100%" filter="url(#orange-noise)" />
           </svg>

           {/* Stem dimple */}
           <div style={{
             position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
             width: 8, height: 4, background: "rgba(0,0,0,0.08)", borderRadius: "50%"
           }} />
           
           {/* Primary Shine */}
           <div style={{
             position: "absolute", top: 5, left: 6,
             width: 8, height: 4,
             background: "rgba(255,255,255,0.4)",
             borderRadius: "50%",
             rotate: "-35deg",
             filter: "blur(1px)"
           }} />

           {/* Face */}
           <motion.div style={{ scale: faceScaleSpring }} className="absolute inset-0 flex items-center justify-center">
             <div style={{
               fontSize: "18px",
               lineHeight: 1,
               userSelect: "none",
               pointerEvents: "none",
               display: "flex",
               alignItems: "center",
               justifyContent: "center"
             }}>
               {faces[faceIndex].emoji}
             </div>
           </motion.div>
        </div>

        {/* Leaf positioned at the very top center */}
        <div style={{
          position: "absolute", top: -2, right: -4,
          width: 15, height: 8,
          background: "linear-gradient(to bottom right, #16a34a, #166534)",
          borderRadius: "100% 0% 100% 0%",
          rotate: "15deg",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          border: "0.2px solid rgba(255,255,255,0.05)",
          zIndex: 15
        }}>
          {/* Leaf Vein */}
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 0.5, background: "rgba(255,255,255,0.1)", opacity: 0.5 }} />
        </div>
      </div>
    </motion.div>
  )
})
