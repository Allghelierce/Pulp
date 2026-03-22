type LineSpacing = "compact" | "normal" | "relaxed"
type PaperStyle = "lined" | "dotgrid" | "plain" | "stenopad" | "parchment" | "kraft" | "ledger"

export function getPaperBg(lineSpacing: LineSpacing, paperStyle: PaperStyle, isDark = false, preview = false) {
  const lh = ({ compact: 24, normal: 32, relaxed: 40 } as Record<string, number>)[lineSpacing] ?? 32
  const lineColor = preview ? "#e4e4e7" : "#C2D3E8"
  const backgroundColor =
    paperStyle === "stenopad" ? "#F5EDB8" :
      paperStyle === "parchment" ? "#F2E8C9" :
        paperStyle === "kraft" ? "#C5B08E" :
          paperStyle === "ledger" ? "#FBF8EF" :
            preview ? "#ffffff" : "#FDFCF9"

  const dotR = preview ? "1px" : "1.5px"

  const backgroundImage = paperStyle === "plain" ? "none"
    : paperStyle === "dotgrid" ? `radial-gradient(circle, ${lineColor} ${dotR}, transparent ${dotR})`
      : paperStyle === "stenopad" ? `linear-gradient(transparent ${lh - 1}px, #3DBECB ${lh}px)`
        : paperStyle === "parchment" ? `linear-gradient(transparent ${lh - 1}px, rgba(139, 69, 19, 0.12) ${lh}px), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`
          : paperStyle === "kraft" ? `linear-gradient(transparent ${lh - 1}px, rgba(0, 0, 0, 0.08) ${lh}px), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='sf'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23sf)' opacity='0.12'/%3E%3C/svg%3E")`
            : paperStyle === "ledger" ? `linear-gradient(90deg, transparent 79px, #d14d4d 80px, #d14d4d 81px, transparent 82px), linear-gradient(transparent ${lh - 1}px, #A5C2D3 ${lh}px)`
              : `linear-gradient(transparent ${lh - 1}px, ${lineColor} ${lh}px)`

  const backgroundSize = paperStyle === "plain" ? "auto"
    : paperStyle === "dotgrid" ? (preview ? `${lh * 0.75}px ${lh * 0.75}px` : "28px 28px")
      : paperStyle === "stenopad" ? `100% ${lh}px`
        : paperStyle === "ledger" ? `82px 100%, 100% ${lh}px`
          : `100% ${lh}px`

  return { backgroundColor, backgroundImage, backgroundSize }
}
