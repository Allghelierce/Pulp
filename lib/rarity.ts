// One rarity palette for seed names, cards and labels.
export const RARITY_COLOR: Record<string, string> = {
  common: "#a1a1aa",
  uncommon: "#34d399",
  rare: "#60a5fa",
  "true rare": "#c084fc",
  sacred: "#c4b5fd",
}

// Common reads as plain text; the rest use their rarity colour.
export function rarityTextColor(rarity: string | undefined, isDark: boolean): string {
  if (!rarity || rarity === "common") return isDark ? "#e4e4e7" : "#27272a"
  return RARITY_COLOR[rarity] || (isDark ? "#e4e4e7" : "#27272a")
}
