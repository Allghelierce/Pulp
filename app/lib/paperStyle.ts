type LineSpacing = "compact" | "normal" | "relaxed"
type PaperStyle = "lined" | "dotgrid" | "plain" | "stenopad"

export function getPaperBg(lineSpacing: LineSpacing, paperStyle: PaperStyle, isDark = false, preview = false) {
  const lh = ({ compact: 24, normal: 32, relaxed: 40 } as Record<string, number>)[lineSpacing] ?? 32
  
  const backgroundColor =
    paperStyle === "stenopad" ? "#F5EDB8" :
            preview ? "#ffffff" : "#FDFCF9"

  const lineColor = preview ? "#e4e4e7" : "#C2D3E8"
  
  const dotR = preview ? "1px" : "1.5px"

  const backgroundImage = paperStyle === "plain" ? "none"
    : paperStyle === "dotgrid" ? `radial-gradient(circle, ${lineColor} ${dotR}, transparent ${dotR})`
      : paperStyle === "stenopad" ? `linear-gradient(transparent ${lh - 1}px, #3DBECB ${lh}px)`
              : `linear-gradient(transparent ${lh - 1}px, ${lineColor} ${lh}px)`

  const backgroundSize = paperStyle === "plain" ? "auto"
    : paperStyle === "dotgrid" ? (preview ? `${lh * 0.75}px ${lh * 0.75}px` : "28px 28px")
      : paperStyle === "stenopad" ? `100% ${lh}px`
          : `100% ${lh}px`

  return { backgroundColor, backgroundImage, backgroundSize }
}
