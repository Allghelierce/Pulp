"use client"

import { useState } from "react"
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"

interface Feature {
  name: string
  description: string
  included: boolean
}

interface PricingTier {
  name: string
  price: { monthly: number; yearly: number }
  description: string
  features: Feature[]
  highlight?: boolean
  badge?: string
  icon: React.ReactNode
  buttonLabel: string
  buttonDisabled?: boolean
  onSelect?: () => void
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
      {/* Toggle */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className={cn(
          "inline-flex items-center p-1 rounded-full border shadow-sm",
          isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
        )}>
          {["Monthly", "Yearly"].map((period) => (
            <button
              key={period}
              onClick={() => setIsYearly(period === "Yearly")}
              className={cn(
                "px-6 py-2 text-xs font-semibold rounded-full transition-all duration-200",
                (period === "Yearly") === isYearly
                  ? "text-white shadow-md"
                  : isDark
                    ? "text-zinc-500 hover:text-zinc-300"
                    : "text-zinc-500 hover:text-zinc-800"
              )}
              style={(period === "Yearly") === isYearly ? { backgroundColor: accentColor } : undefined}
            >
              {period}
              {period === "Yearly" && (
                <span className={cn(
                  "ml-1.5 text-[10px] font-bold",
                  (period === "Yearly") === isYearly ? "text-orange-200" : "text-green-500"
                )}>
                  −25%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "relative flex flex-col rounded-2xl border transition-all duration-200",
              tier.highlight
                ? isDark
                  ? "bg-zinc-900 border-zinc-700 shadow-2xl"
                  : "bg-white border-zinc-300 shadow-xl"
                : isDark
                  ? "bg-zinc-900/50 border-zinc-800"
                  : "bg-zinc-50/60 border-zinc-200"
            )}
            style={tier.highlight ? {
              boxShadow: `0 0 0 1.5px ${accentColor}55, 0 20px 40px -12px ${accentColor}33`
            } : undefined}
          >
            {/* Badge */}
            {tier.badge && (
              <div
                className="absolute -top-3.5 left-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                {tier.badge}
              </div>
            )}

            <div className="p-7 flex-1">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className={cn(
                  "p-2.5 rounded-xl",
                  isDark ? "bg-zinc-800" : "bg-zinc-100"
                )}>
                  {tier.icon}
                </div>
                <h3 className={cn(
                  "text-lg font-semibold",
                  isDark ? "text-zinc-100" : "text-zinc-900"
                )}>
                  {tier.name}
                </h3>
              </div>

              {/* Price */}
              <div className="mb-5">
                <div className="flex items-baseline gap-1.5">
                  <span className={cn("text-4xl font-extrabold", isDark ? "text-white" : "text-zinc-900")}>
                    {tier.price.monthly === 0
                      ? "Free"
                      : `$${isYearly ? tier.price.yearly : tier.price.monthly}`}
                  </span>
                  {tier.price.monthly > 0 && (
                    <span className={cn("text-xs", isDark ? "text-zinc-500" : "text-zinc-400")}>
                      /{isYearly ? "year" : "month"}
                    </span>
                  )}
                </div>
                {isYearly && tier.price.monthly > 0 && (
                  <p className="text-[11px] text-green-500 mt-0.5 font-medium">
                    Save ${(tier.price.monthly * 12 - tier.price.yearly)} vs monthly
                  </p>
                )}
                <p className={cn("text-xs mt-1.5", isDark ? "text-zinc-500" : "text-zinc-500")}>
                  {tier.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature.name} className="flex gap-3">
                    <div className={cn(
                      "mt-0.5 shrink-0",
                      feature.included ? "text-green-500" : isDark ? "text-zinc-700" : "text-zinc-300"
                    )}>
                      <CheckIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={cn("text-xs font-medium", isDark ? "text-zinc-200" : "text-zinc-800")}>
                        {feature.name}
                      </p>
                      <p className={cn("text-[11px]", isDark ? "text-zinc-500" : "text-zinc-500")}>
                        {feature.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="px-7 pb-7">
              <button
                disabled={tier.buttonDisabled}
                onClick={tier.onSelect}
                className={cn(
                  "w-full h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                  tier.buttonDisabled
                    ? isDark
                      ? "bg-zinc-800 text-zinc-600 cursor-default"
                      : "bg-zinc-100 text-zinc-400 cursor-default"
                    : "text-white shadow-md hover:shadow-lg hover:opacity-90 active:scale-[0.98]"
                )}
                style={!tier.buttonDisabled ? { backgroundColor: accentColor } : undefined}
              >
                {tier.buttonLabel}
                {!tier.buttonDisabled && <ArrowRightIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export { PricingSection }
