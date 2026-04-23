type LineSpacing = "compact" | "normal" | "relaxed"
type PaperStyle = "lined" | "dotgrid" | "plain" | "steno"

export function getPaperBg(lineSpacing: LineSpacing, paperStyle: PaperStyle, isDark = false, preview = false) {
  const lh = ({ compact: 24, normal: 32, relaxed: 40 } as Record<string, number>)[lineSpacing] ?? 32
  
  const backgroundColor =
    paperStyle === "steno" ? "#F5EDB8" :
            preview ? "#ffffff" : "#FDFCF9"

  const lineColor = preview ? "#e4e4e7" : "#C2D3E8"
  const stenoLine = preview ? "#fca5a5" : "#f8717166" // Faint red/pink for steno
  
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
