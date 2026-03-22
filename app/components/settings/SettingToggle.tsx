"use client"
import { motion } from "framer-motion"

export function SettingToggle({ checked, onChange, isDark }: { checked: boolean; onChange: (v: boolean) => void; isDark: boolean }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-[42px] h-[24px] rounded-full shrink-0 focus:outline-none transition-colors duration-300"
      style={{ backgroundColor: checked ? (isDark ? "#e4e4e7" : "#18181b") : (isDark ? "#3f3f46" : "#d4d4d8") }}
    >
      <motion.div
        className="absolute top-[3px] w-[18px] h-[18px] rounded-full shadow-md"
        style={{ backgroundColor: checked ? (isDark ? "#18181b" : "#ffffff") : (isDark ? "#71717a" : "#ffffff") }}
        animate={{ x: checked ? 21 : 3 }}
        transition={{ type: "spring", stiffness: 600, damping: 40, mass: 0.6 }}
      />
    </button>
  )
}
