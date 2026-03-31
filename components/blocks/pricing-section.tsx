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

function PricingSection({ tiers, isDark, accentColor = "#b85c20", className }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section className={cn("w-full", className)}>
      {/* Billing toggle (Only show if at least one tier has monthly/yearly pricing) */}
      {tiers.some(t => typeof t.price === 'object') && (
        <div className="flex items-center justify-center mb-7">
          <div className={cn(
            "inline-flex items-center p-1 rounded-xl border",
            isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200/80"
          )}>
            {(["Monthly", "Yearly"] as const).map((period) => {
              const active = (period === "Yearly") === isYearly
              return (
                <button
                  key={period}
                  onClick={() => setIsYearly(period === "Yearly")}
                  className={cn(
                    "relative px-5 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-200",
                    active
                      ? isDark ? "bg-zinc-700 text-white shadow-sm" : "bg-white text-zinc-900 shadow-sm"
                      : isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-700"
                  )}
                >
                  {period}
                  {period === "Yearly" && (
                    <span className={cn(
                      "ml-1.5 text-[10px] font-bold",
                      active ? "text-green-400" : "text-green-500"
                    )}>
                      −25%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "relative flex flex-col rounded-2xl border transition-all duration-200",
              tier.highlight
                ? isDark
                  ? "bg-zinc-900 border-blue-700/60"
                  : "bg-white border-blue-300/80"
                : isDark
                  ? "bg-zinc-900/40 border-zinc-800/80"
                  : "bg-zinc-50 border-zinc-200/70"
            )}
            style={tier.highlight ? {
              boxShadow: `0 0 0 1px rgba(59,130,246,0.35), 0 24px 48px -8px rgba(0,0,0,0.18)`
            } : undefined}
          >
            {/* Orange ambient glow for Pro */}
            {tier.highlight && (
              <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
                <div style={{
                  position: "absolute", inset: 0,
                  background: "radial-gradient(ellipse at 50% -10%, rgba(184,94,34,0.22) 0%, rgba(184,94,34,0.08) 45%, transparent 70%)",
                }} />
              </div>
            )}

            <div className="p-6 flex-1">
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-5">
                <div className={cn(
                  "p-2 rounded-xl",
                  isDark ? "bg-zinc-800" : "bg-zinc-100"
                )}>
                  {tier.icon}
                </div>
                <div>
                  <h3 className={cn("text-[14px] font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                    {tier.name}
                  </h3>
                  <p className={cn("text-[11px]", isDark ? "text-zinc-500" : "text-zinc-400")}>
                    {tier.description}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-5 pb-5 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-[36px] font-extrabold tracking-tight leading-none", isDark ? "text-white" : "text-zinc-900")}>
                    {typeof tier.price === 'string' 
                      ? tier.price 
                      : (tier.price.monthly === 0 ? "Free" : `$${isYearly ? tier.price.yearly : tier.price.monthly}`)}
                  </span>
                  {typeof tier.price === 'object' && tier.price.monthly > 0 && (
                    <span className={cn("text-[12px] font-medium", isDark ? "text-zinc-500" : "text-zinc-400")}>
                      /{isYearly ? "yr" : "mo"}
                    </span>
                  )}
                  {typeof tier.price === 'string' && tier.price !== "Free" && (
                    <span className={cn("text-[12px] font-medium ml-1", isDark ? "text-zinc-500" : "text-zinc-400")}>
                      one-time
                    </span>
                  )}
                </div>
                {typeof tier.price === 'object' && isYearly && tier.price.monthly > 0 && (
                  <p className="text-[11px] text-green-500 font-semibold mt-1">
                    Save ${tier.price.monthly * 12 - tier.price.yearly} vs monthly billing
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature.name} className="flex items-start gap-2.5">
                    <div className={cn(
                      "mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                      feature.included
                        ? "bg-green-500/15"
                        : isDark ? "bg-zinc-800" : "bg-zinc-100"
                    )}>
                      {feature.included ? (
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="6" height="6" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5h6" stroke={isDark ? "#52525b" : "#d4d4d8"} strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={cn(
                        "text-[12px] font-medium leading-tight",
                        feature.included
                          ? isDark ? "text-zinc-200" : "text-zinc-800"
                          : isDark ? "text-zinc-600" : "text-zinc-400"
                      )}>
                        {feature.name}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="px-6 pb-6">
              {tier.ctaOverride ? (
                tier.ctaOverride({
                  className: "w-full h-10 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 text-white shadow-md hover:opacity-90 active:scale-[0.98]",
                  style: { backgroundColor: "#2563eb" },
                  children: (
                    <>
                      {tier.buttonLabel}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </>
                  )
                })
              ) : (
                <button
                  disabled={tier.buttonDisabled}
                  onClick={tier.onSelect}
                  className={cn(
                    "w-full h-10 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5",
                    tier.buttonDisabled
                      ? isDark ? "bg-zinc-800/80 text-zinc-600 cursor-default border border-zinc-800" : "bg-zinc-100 text-zinc-400 cursor-default border border-zinc-200"
                      : "text-white shadow-md hover:opacity-90 active:scale-[0.98]"
                  )}
                  style={!tier.buttonDisabled ? { backgroundColor: tier.highlight ? "#2563eb" : accentColor } : undefined}
                >
                  {tier.buttonDisabled ? (
                    <span className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                      {tier.buttonLabel}
                    </span>
                  ) : (
                    <>
                      {tier.buttonLabel}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
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
