"use client"

import { useState } from "react"
import { cn } from "@/app/lib/utils"

interface Feature {
  name: string
  description: string
  included: boolean
}

interface PricingTier {
  name: string
  price: { monthly: number; yearly: number } | string
  description: string
  features: Feature[]
  highlight?: boolean
  badge?: string
  icon: React.ReactNode
  buttonLabel: string
  buttonDisabled?: boolean
  onSelect?: () => void
  ctaOverride?: (props: { className: string; style?: React.CSSProperties; children: React.ReactNode }) => React.ReactNode
}

interface PricingSectionProps {
  tiers: PricingTier[]
  isDark?: boolean
  accentColor?: string
  className?: string
}

function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : "184,94,34"
}

function PricingSection({ tiers, isDark, accentColor = "#d97706", className }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false)
  const rgb = hexToRgb(accentColor)

  return (
    <section className={cn("w-full", className)}>
      {tiers.some(t => typeof t.price === 'object') && (
        <div className="flex items-center justify-center mb-5">
          <div className={cn(
            "inline-flex items-center p-0.5 rounded-lg border",
            isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200/80"
          )}>
            {(["Monthly", "Yearly"] as const).map((period) => {
              const active = (period === "Yearly") === isYearly
              return (
                <button
                  key={period}
                  onClick={() => setIsYearly(period === "Yearly")}
                  className={cn(
                    "relative px-4 py-1 text-[11px] font-semibold rounded-md transition-all duration-200",
                    active
                      ? isDark ? "bg-zinc-700 text-white shadow-sm" : "bg-white text-zinc-900 shadow-sm"
                      : isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-700"
                  )}
                >
                  {period}
                  {period === "Yearly" && (
                    <span className={cn("ml-1 text-[9px] font-bold", active ? "text-green-400" : "text-green-500")}>
                      −25%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "relative flex flex-col rounded-xl border transition-all duration-200",
              tier.highlight
                ? isDark
                  ? "bg-zinc-900 border-zinc-700"
                  : "bg-white border-zinc-300"
                : isDark
                  ? "bg-zinc-900/40 border-zinc-800/80"
                  : "bg-zinc-50 border-zinc-200/70"
            )}
            style={tier.highlight ? {
              boxShadow: `0 0 0 1px rgba(${rgb},0.25), 0 8px 24px -4px rgba(0,0,0,0.12)`
            } : undefined}
          >
            {tier.badge && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                <span
                  className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-lg"
                  style={{ backgroundColor: accentColor }}
                >
                  {tier.badge}
                </span>
              </div>
            )}
            {tier.highlight && (
              <div className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden">
                <div style={{
                  position: "absolute", inset: 0,
                  background: `radial-gradient(ellipse at 50% -10%, rgba(${rgb},0.18) 0%, rgba(${rgb},0.06) 45%, transparent 70%)`,
                }} />
              </div>
            )}

            <div className="p-5 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("p-1.5 rounded-lg", isDark ? "bg-zinc-800" : "bg-zinc-100")}>
                  {tier.icon}
                </div>
                <div>
                  <h3 className={cn("text-[13px] font-bold leading-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>
                    {tier.name}
                  </h3>
                  <p className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-zinc-400")}>
                    {tier.description}
                  </p>
                </div>
              </div>

              <div className="mb-3 pb-3 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-[28px] font-extrabold tracking-tight leading-none", isDark ? "text-white" : "text-zinc-900")}>
                    {typeof tier.price === 'string'
                      ? tier.price
                      : (tier.price.monthly === 0 ? "Free" : `$${isYearly ? tier.price.yearly : tier.price.monthly}`)}
                  </span>
                  {typeof tier.price === 'object' && tier.price.monthly > 0 && (
                    <span className={cn("text-[11px] font-medium", isDark ? "text-zinc-500" : "text-zinc-400")}>
                      /{isYearly ? "yr" : "mo"}
                    </span>
                  )}
                </div>
                {typeof tier.price === 'object' && isYearly && tier.price.monthly > 0 && (
                  <p className="text-[10px] text-green-500 font-semibold mt-0.5">
                    Save ${tier.price.monthly * 12 - tier.price.yearly}/yr
                  </p>
                )}
              </div>

              <ul className="space-y-1.5">
                {tier.features.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-2">
                    <div className={cn(
                      "w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0",
                      feature.included ? "bg-green-500/15" : isDark ? "bg-zinc-800" : "bg-zinc-100"
                    )}>
                      {feature.included ? (
                        <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="5" height="5" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5h6" stroke={isDark ? "#52525b" : "#d4d4d8"} strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                    <p className={cn(
                      "text-[11px] font-medium",
                      feature.included
                        ? isDark ? "text-zinc-300" : "text-zinc-700"
                        : isDark ? "text-zinc-600" : "text-zinc-400"
                    )}>
                      {feature.name}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-5 pb-4">
              {tier.ctaOverride ? (
                tier.ctaOverride({
                  className: "w-full h-9 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 text-white hover:opacity-90 active:scale-[0.98]",
                  style: { backgroundColor: accentColor },
                  children: (
                    <>
                      {tier.buttonLabel}
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </>
                  )
                })
              ) : (
                <button
                  disabled={tier.buttonDisabled}
                  onClick={tier.onSelect}
                  className={cn(
                    "w-full h-9 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5",
                    tier.buttonDisabled
                      ? isDark ? "bg-zinc-800/80 text-zinc-600 cursor-default border border-zinc-800" : "bg-zinc-100 text-zinc-400 cursor-default border border-zinc-200"
                      : "text-white hover:opacity-90 active:scale-[0.98]"
                  )}
                  style={!tier.buttonDisabled ? { backgroundColor: accentColor } : undefined}
                >
                  {tier.buttonDisabled ? (
                    <span className="flex items-center gap-1.5">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                      {tier.buttonLabel}
                    </span>
                  ) : (
                    <>
                      {tier.buttonLabel}
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export { PricingSection }
