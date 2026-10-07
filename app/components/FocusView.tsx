"use client"
import { memo, useState, useEffect, useCallback } from "react"
import { ACCENT } from "@/lib/accent"
interface FocusViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  blockedSites: string[]
  onUpdateConfig: (updates: Record<string, any>) => void
  openConfirm: (title: string, message: string, onConfirm: (checked?: boolean) => void, confirmLabel?: string, danger?: boolean) => void
}

function cleanDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/:.*$/, "")
}

function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
}

function useExtensionDetected() {
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    const check = () => document.documentElement.getAttribute("data-pulp-extension") === "true"
    if (check()) { setDetected(true); return }

    const markDetected = () => setDetected(true)

    window.addEventListener("pulp-extension-detected", markDetected)

    const pongHandler = (e: MessageEvent) => {
      if (e.data && e.data.type === "pulp-extension-pong") markDetected()
    }
    window.addEventListener("message", pongHandler)

    const interval = setInterval(() => {
      if (check()) { markDetected(); clearInterval(interval); return }
      window.postMessage({ type: "pulp-extension-ping" }, "*")
    }, 500)

    window.postMessage({ type: "pulp-extension-ping" }, "*")

    return () => {
      window.removeEventListener("pulp-extension-detected", markDetected)
      window.removeEventListener("message", pongHandler)
      clearInterval(interval)
    }
  }, [])

  return detected
}

export const FocusView = memo(function FocusView({
  isOpen, onClose, theme, blockedSites, onUpdateConfig, openConfirm,
}: FocusViewProps) {
  const isDark = theme === "dark"
  const extensionInstalled = useExtensionDetected()
  const [input, setInput] = useState("")
  const font = 'Crimson Pro, serif'

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const addSite = useCallback(() => {
    const domain = cleanDomain(input)
    if (domain && !blockedSites.includes(domain)) {
      onUpdateConfig({ blockedSites: [...blockedSites, domain] })
      setInput("")
    }
  }, [input, blockedSites, onUpdateConfig])

  const removeSite = useCallback((domain: string) => {
    openConfirm(
      "Remove Blocked Site",
      `Remove ${domain} from your blocked sites? This will allow you to access this site during focus sessions.`,
      () => {
        onUpdateConfig({ blockedSites: blockedSites.filter(s => s !== domain) })
      },
      "Remove",
      true
    )
  }, [blockedSites, onUpdateConfig, openConfirm])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        className={`relative w-full max-w-[560px] rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] border overflow-hidden flex flex-col ${isDark ? "bg-[#09090b] border-zinc-800/80" : "bg-[#f5f3f1] border-zinc-200/80"}`}
        style={{ maxHeight: 660 }}
      >
        {/* Header */}
        <div className={`px-7 pt-6 pb-4 border-b shrink-0 flex items-center justify-between ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"}`}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              title={extensionInstalled ? "Extension active" : "Extension not detected"}
              style={{
                backgroundColor: extensionInstalled ? "#22c55e" : "#71717a",
                boxShadow: extensionInstalled ? "0 0 6px rgba(34,197,94,0.4)" : "none",
              }}
            />
            <div>
              <h2 className="text-[15px] font-normal tracking-tight" style={{ fontFamily: font, color: isDark ? '#dcd8d0' : '#2a2620' }}>Focus Blocker</h2>
              <p className="text-[11px] mt-0.5" style={{ fontFamily: font, color: isDark ? '#5a5650' : '#a8a4a0' }}>Sites blocked while your timer is running</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/80"}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {/* Extension not detected prompt */}
          {!extensionInstalled && (
            <div className={`rounded-lg px-4 py-3.5 mb-5 flex items-center gap-3 ${isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200"} border`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <p className={`text-[11px] m-0 flex-1 leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`} style={{ fontFamily: font }}>
                Install the Chrome extension to enforce blocks while you write.
              </p>
              <a
                href="https://chromewebstore.google.com/detail/pulp-focus/YOUR_EXTENSION_ID"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-normal text-[var(--accent-contrast)] transition-all hover:brightness-110"
                style={{ background: ACCENT, fontFamily: font }}
              >
                Get Extension
              </a>
            </div>
          )}

          {/* Warning */}
          <div className={`rounded-lg px-4 py-3 mb-4 flex items-start gap-3 ${isDark ? "bg-amber-500/5 border-amber-500/10" : "bg-amber-50 border-amber-200/50"} border`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-amber-500/70">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className={`text-[11px] leading-relaxed m-0 ${isDark ? "text-amber-500/60" : "text-amber-700/70"}`} style={{ fontFamily: font }}>
              Sites you add here will be blocked during focus sessions. Choose carefully.
            </p>
          </div>

          {/* Add site input */}
          <div className="flex gap-2 mb-5">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addSite() }}
              placeholder="Add a website to block..."
              style={{ fontFamily: font }}
              className={`flex-1 px-4 py-2.5 text-[13px] rounded-lg outline-none transition-colors ${isDark ? "bg-zinc-900/80 border-zinc-800 text-zinc-200 placeholder:text-zinc-700 focus:border-zinc-600" : "bg-white border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-300"} border`}
            />
            <button
              onClick={addSite}
              className="px-5 py-2.5 rounded-lg text-[12px] font-normal text-[var(--accent-contrast)] transition-all hover:brightness-110"
              style={{ background: ACCENT, fontFamily: font }}
            >
              Block
            </button>
          </div>

          {/* Blocked sites list */}
          {blockedSites.length > 0 ? (
            <div className={`rounded-lg overflow-hidden border ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
              <div className={`px-4 py-2.5 flex items-center justify-between ${isDark ? "bg-zinc-900/80" : "bg-zinc-50"}`}>
                <span className={`text-[10px] font-normal uppercase tracking-[0.12em] ${isDark ? "text-zinc-500" : "text-zinc-400"}`} style={{ fontFamily: font }}>
                  Blocked Sites
                </span>
                <span className={`text-[10px] font-normal tabular-nums ${isDark ? "text-zinc-600" : "text-zinc-400"}`} style={{ fontFamily: font }}>
                  {blockedSites.length}
                </span>
              </div>
              {blockedSites.map((site, i) => (
                <div
                  key={site}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${i > 0 ? (isDark ? "border-t border-zinc-800/60" : "border-t border-zinc-100") : ""} ${isDark ? "bg-zinc-900/30 hover:bg-zinc-900/50" : "bg-white hover:bg-zinc-50"}`}
                >
                  <img
                    src={getFaviconUrl(site)}
                    alt=""
                    width={16}
                    height={16}
                    className="shrink-0 rounded"
                    style={{ imageRendering: "auto" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                  <span className={`flex-1 text-[13px] min-w-0 truncate ${isDark ? "text-zinc-300" : "text-zinc-700"}`} style={{ fontFamily: font }}>
                    {site}
                  </span>
                  <button
                    onClick={() => removeSite(site)}
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-normal transition-all"
                    style={{
                      fontFamily: font,
                      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                      color: isDark ? "#a1a09c" : "#71717a",
                      cursor: "pointer",
                    }}
                    title="Remove site"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={`rounded-lg p-8 text-center ${isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200"} border`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={`mx-auto mb-3 ${isDark ? "text-zinc-700" : "text-zinc-300"}`}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <p className={`text-[12px] ${isDark ? "text-zinc-600" : "text-zinc-400"}`} style={{ fontFamily: font }}>
                No blocked sites yet. Add a website above to block it during focus sessions.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
})
