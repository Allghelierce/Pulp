"use client"

export function SettingToggle({ checked, onChange, isDark }: { checked: boolean; onChange: (v: boolean) => void; isDark: boolean }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-none transition-all duration-200 shrink-0 ${checked 
        ? (isDark ? "bg-zinc-100" : "bg-zinc-800") 
        : (isDark ? "bg-zinc-800" : "bg-zinc-200")}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-none shadow-sm transition-transform duration-200 ${isDark ? "bg-zinc-900" : "bg-white"} ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  )
}

