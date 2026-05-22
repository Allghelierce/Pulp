"use client"
import dynamic from "next/dynamic"

const PulpLanding = dynamic(() => import("@/app/pulp-landing"), { ssr: false })

export default function PulpPage() {
  return <PulpLanding />
}
