type LineSpacing = "compact" | "normal" | "relaxed"
export type PaperStyle = "lined" | "dotgrid" | "plain" | "steno" | "dark-lined" | "dark-grid" | "dark-plain" | "dark-steno"

const DARK_STYLES: Record<string, { bg: string; line: string }> = {
  "dark-lined":  { bg: "#1a1a1e", line: "rgba(255,255,255,0.08)" },
  "dark-grid":   { bg: "#1a1a1e", line: "rgba(255,255,255,0.08)" },
  "dark-plain":  { bg: "#1a1a1e", line: "" },
  "dark-steno":  { bg: "#2e2a1a", line: "rgba(140,180,140,0.2)" },
}

export function getPaperBg(lineSpacing: LineSpacing, paperStyle: PaperStyle, isDark = false, preview = false) {
  const lh = ({ compact: 24, normal: 32, relaxed: 40 } as Record<string, number>)[lineSpacing] ?? 32

  const dark = DARK_STYLES[paperStyle]
  if (dark) {
    const dotR = preview ? "1px" : "1.5px"
    const backgroundImage = paperStyle === "dark-plain" ? "none"
      : paperStyle === "dark-grid" ? `radial-gradient(circle, ${dark.line} ${dotR}, transparent ${dotR})`
        : `linear-gradient(transparent ${lh - 1}px, ${dark.line} ${lh}px)`
    const backgroundSize = paperStyle === "dark-plain" ? "auto"
      : paperStyle === "dark-grid" ? (preview ? `${lh * 0.75}px ${lh * 0.75}px` : "28px 28px")
        : `100% ${lh}px`
    return { backgroundColor: dark.bg, backgroundImage, backgroundSize }
  }

  const backgroundColor =
    paperStyle === "steno" ? "#F5EDB8" :
            preview ? "#ffffff" : "#FDFCF9"

  const lineColor = preview ? "#e4e4e7" : "#C2D3E8"
  const stenoLine = preview ? "#94a3b8" : "#5f9ea066"

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

export function getInkColor(_paperStyle: PaperStyle, isDark: boolean): string {
  return isDark ? "#e4e4e7" : "#1a1a1a"
}
