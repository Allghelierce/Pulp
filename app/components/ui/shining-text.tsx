"use client"

import * as React from "react"
import { motion } from "framer-motion"

interface ShiningTextProps {
  text: string
  className?: string
  gradientColor?: string
}

export function ShiningText({
  text,
  className = "text-xs font-light",
  gradientColor = "from-gray-400 via-white to-gray-400",
}: ShiningTextProps) {
  // For red effect, use: "from-red-400 via-red-200 to-red-400"
  const gradientMap: Record<string, string> = {
    red: "110deg,#ef4444,35%,#fca5a5,50%,#ef4444,75%,#ef4444",
    default: "110deg,#404040,35%,#fff,50%,#404040,75%,#404040",
  }

  const isRed = gradientColor.includes("red")
  const gradient = isRed ? gradientMap.red : gradientMap.default

  return (
    <motion.span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(${gradient})`,
        backgroundSize: "200% 100%",
      }}
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "linear",
      }}
    >
      {text}
    </motion.span>
  )
}
