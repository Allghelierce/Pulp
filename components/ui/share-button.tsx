"use client"

import React, { useState } from "react"
import { Link as LinkIcon } from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ShareLink {
  icon: React.FC<React.SVGProps<SVGSVGElement>>
  onClick?: () => void
  label?: string
}

interface ShareButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  links: ShareLink[]
  children: React.ReactNode
}

export const ShareButton = ({ className, links, children, ...props }: ShareButtonProps) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative inline-flex justify-center"
      style={{ width: 28 * links.length, height: 28 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Button */}
      <button
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-1.5 rounded-[6px] px-2.5",
          "bg-transparent border border-[#e4e4e7]/60 text-[#6b6b72]",
          "hover:bg-zinc-100 hover:border-zinc-300 hover:text-zinc-700",
          "text-[13.5px] font-normal tracking-wide transition-all active:scale-[0.97]",
          isHovered ? "opacity-0 pointer-events-none" : "opacity-100",
          className
        )}
        style={{ width: 28 * links.length }}
        {...props}
      >
        {children}
      </button>

      {/* Hover Links */}
      <div className="absolute inset-0 flex overflow-hidden rounded-[6px]">
        {links.map((link, index) => {
          const Icon = link.icon
          return (
            <button
              type="button"
              key={index}
              onClick={link.onClick}
              title={link.label}
              className={cn(
                "flex-1 flex items-center justify-center",
                "bg-zinc-800 text-white",
                "hover:bg-zinc-700 transition-all duration-200",
                "border-r border-white/10 last:border-r-0",
                isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
              )}
              style={{
                transitionDelay: isHovered ? `${index * 40}ms` : "0ms",
              }}
            >
              <Icon className="w-3 h-3" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ShareButton
