"use client"
import Lottie from "lottie-react"
import animationData from "@/public/loading.json"

export function PulpLoadingScreen() {
  return (
    <div className="h-screen bg-[#0e0c0b] flex flex-col items-center justify-center">
      <Lottie
        animationData={animationData}
        loop
        style={{ width: 160, height: 160 }}
      />
    </div>
  )
}
