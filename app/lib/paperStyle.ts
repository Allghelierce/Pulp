type LineSpacing = "compact" | "normal" | "relaxed"
type PaperStyle = "lined" | "dotgrid" | "plain" | "steno"

export function getPaperBg(lineSpacing: LineSpacing, paperStyle: PaperStyle, isDark = false, preview = false) {
  const lh = ({ compact: 24, normal: 32, relaxed: 40 } as Record<string, number>)[lineSpacing] ?? 32

  const backgroundColor = isDark
    ? (paperStyle === "steno" ? "#2e2a1a" : "#1a1a1e")
    : (paperStyle === "steno" ? "#F5EDB8" : preview ? "#ffffff" : "#FDFCF9")

  const lineColor = isDark
    ? (preview ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.08)")
    : (preview ? "#e4e4e7" : "#C2D3E8")
  const stenoLine = isDark
    ? (preview ? "rgba(255,255,255,0.12)" : "rgba(140,180,140,0.2)")
    : (preview ? "#94a3b8" : "#5f9ea066")

  const dotR = preview ? "1px" : "1.5px"

  const backgroundImage = paperStyle === "plain" ? "none"
    : paperStyle === "dotgrid" ? `radial-gradient(circle, ${lineColor} ${dotR}, transparent ${dotR})`
      : paperStyle === "steno"
        ? `linear-gradient(transparent ${lh - 1}px, ${stenoLine} ${lh}px)`
        : `linear-gradient(transparent ${lh - 1}px, ${lineColor} ${lh}px)`

  const backgroundSize = paperStyle === "plain" ? "auto"
    : paperStyle === "dotgrid" ? (preview ? `${lh * 0.75}px ${lh * 0.75}px` : "28px 28px")
      : paperStyle === "steno" ? `100% ${lh}px`
          : `100% ${lh}px`

  return { backgroundColor, backgroundImage, backgroundSize }
}

export function getInkColor(paperStyle: PaperStyle, isDark: boolean): string {
  if (isDark) return paperStyle === "steno" ? "#e8dfc0" : "#e4e4e7"
  return paperStyle === "steno" ? "#2d2510" : "#1a1a1a"
}
