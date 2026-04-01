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

// Simple geometric faces for the orange
const faces = [
  { eyes: "circle", eyeSize: 2.5, mouth: "curve-up", label: "happy" },
  { eyes: "circle-happy", eyeSize: 2, mouth: "line-up", label: "excited" },
  { eyes: "line", eyeSize: 2, mouth: "line-straight", label: "serious" },
  { eyes: "circle-big", eyeSize: 3, mouth: "o", label: "surprised" },
  { eyes: "x", eyeSize: 2.5, mouth: "x", label: "dizzy" },
  { eyes: "circle", eyeSize: 2.5, mouth: "curve-down", label: "sad" },
  { eyes: "line-closed", eyeSize: 1.5, mouth: "line-straight", label: "sleepy" },
  { eyes: "heart", eyeSize: 2, mouth: "curve-up", label: "love" },
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

  useEffect(() => {
    const runNudge = () => {
      const mag = 0.3 + Math.random() * 0.5
      const dir = Math.random() > 0.5 ? 1 : -1
      angle.set(mag * dir)
      timerRef.current = setTimeout(runNudge, 2500 + Math.random() * 3500)
    }
    runNudge()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [angle])

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
          width: 32, height: 32, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #fb923c 0%, #ea580c 100%)",
          boxShadow: "0 8px 24px rgba(234,88,12,0.3), inset -4px -4px 10px rgba(0,0,0,0.2), inset 4px 4px 8px rgba(255,255,255,0.3)",
          marginTop: -4,
          position: "relative",
          overflow: "hidden",
          border: "1.5px solid rgba(255,255,255,0.1)"
        }}>
           {/* Flowing Highlight Glow */}
           <motion.div 
             animate={{ x: ["-100%", "100%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
             className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
           />
           
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
             width: 8, height: 4, background: "rgba(0,0,0,0.15)", borderRadius: "50%"
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
           <motion.div style={{ scale: faceScaleSpring }} className="absolute inset-0">
             <svg width="100%" height="100%" viewBox="0 0 30 30" style={{ pointerEvents: "none" }}>
               {/* Eyes */}
               {faces[faceIndex].eyes === "circle" && (
                 <>
                   <circle cx="10" cy="10" r={faces[faceIndex].eyeSize} fill="rgba(0,0,0,0.6)" />
                   <circle cx="20" cy="10" r={faces[faceIndex].eyeSize} fill="rgba(0,0,0,0.6)" />
                 </>
               )}
               {faces[faceIndex].eyes === "circle-happy" && (
                 <>
                   <circle cx="10" cy="11" r={faces[faceIndex].eyeSize} fill="rgba(0,0,0,0.6)" />
                   <circle cx="20" cy="11" r={faces[faceIndex].eyeSize} fill="rgba(0,0,0,0.6)" />
                 </>
               )}
               {faces[faceIndex].eyes === "line" && (
                 <>
                   <line x1="8" y1="10" x2="12" y2="10" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                   <line x1="18" y1="10" x2="22" y2="10" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                 </>
               )}
               {faces[faceIndex].eyes === "circle-big" && (
                 <>
                   <circle cx="10" cy="10" r={faces[faceIndex].eyeSize} fill="rgba(0,0,0,0.6)" />
                   <circle cx="20" cy="10" r={faces[faceIndex].eyeSize} fill="rgba(0,0,0,0.6)" />
                 </>
               )}
               {faces[faceIndex].eyes === "x" && (
                 <>
                   <line x1="8" y1="8" x2="12" y2="12" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                   <line x1="12" y1="8" x2="8" y2="12" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                   <line x1="18" y1="8" x2="22" y2="12" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                   <line x1="22" y1="8" x2="18" y2="12" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                 </>
               )}
               {faces[faceIndex].eyes === "line-closed" && (
                 <>
                   <path d="M 8 11 Q 10 9 12 11" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                   <path d="M 18 11 Q 20 9 22 11" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                 </>
               )}
               {faces[faceIndex].eyes === "heart" && (
                 <>
                   <path d="M 8 12 L 10 10 Q 11 9 12 10 L 10 12 Z" fill="rgba(0,0,0,0.6)" />
                   <path d="M 18 12 L 20 10 Q 21 9 22 10 L 20 12 Z" fill="rgba(0,0,0,0.6)" />
                 </>
               )}

               {/* Mouth */}
               {faces[faceIndex].mouth === "curve-up" && (
                 <path d="M 10 18 Q 15 22 20 18" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
               )}
               {faces[faceIndex].mouth === "line-up" && (
                 <line x1="10" y1="20" x2="20" y2="20" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" />
               )}
               {faces[faceIndex].mouth === "line-straight" && (
                 <line x1="10" y1="19" x2="20" y2="19" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" />
               )}
               {faces[faceIndex].mouth === "o" && (
                 <circle cx="15" cy="19" r="1.5" fill="rgba(0,0,0,0.6)" />
               )}
               {faces[faceIndex].mouth === "x" && (
                 <>
                   <line x1="13" y1="17" x2="17" y2="21" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                   <line x1="17" y1="17" x2="13" y2="21" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                 </>
               )}
               {faces[faceIndex].mouth === "curve-down" && (
                 <path d="M 10 18 Q 15 14 20 18" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
               )}
             </svg>
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
