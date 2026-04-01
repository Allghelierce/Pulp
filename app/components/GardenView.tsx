"use client"
import { useState } from "react"
import { motion } from "framer-motion"

interface Plant {
  id: string
  type: "flower" | "shrub" | "tree"
  x: number
  y: number
  color: string
  size: number
  rarity?: "common" | "rare" | "legendary"
}

const PLANTS: Plant[] = [
  { id: "f1", type: "flower", x: 15, y: 30, color: "#ec4899", size: 1, rarity: "common" },
  { id: "f2", type: "flower", x: 25, y: 45, color: "#f97316", size: 0.8, rarity: "common" },
  { id: "f3", type: "flower", x: 35, y: 20, color: "#a855f7", size: 1.2, rarity: "rare" },
  { id: "f4", type: "flower", x: 10, y: 60, color: "#06b6d4", size: 0.9, rarity: "common" },
  { id: "f5", type: "flower", x: 80, y: 25, color: "#f43f5e", size: 1, rarity: "common" },
  { id: "f6", type: "flower", x: 70, y: 50, color: "#facc15", size: 1.1, rarity: "rare" },
  { id: "f7", type: "flower", x: 85, y: 65, color: "#06b6d4", size: 0.8, rarity: "common" },
  { id: "s1", type: "shrub", x: 20, y: 75, color: "#22c55e", size: 1.3, rarity: "common" },
  { id: "s2", type: "shrub", x: 75, y: 80, color: "#22c55e", size: 1.2, rarity: "common" },
  { id: "t1", type: "tree", x: 15, y: 15, color: "#84cc16", size: 1.5, rarity: "rare" },
  { id: "t2", type: "tree", x: 82, y: 10, color: "#84cc16", size: 1.4, rarity: "rare" },
]

function Flower({ plant, onClick }: { plant: Plant; onClick: () => void }) {
  return (
    <motion.g
      onClick={onClick}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      style={{ cursor: "pointer" }}
    >
      {/* Stem */}
      <line x1="0" y1="0" x2="0" y2="8" stroke="#22c55e" strokeWidth="0.4" />
      {/* Petals */}
      <circle cx="0" cy="-2" r="1.2" fill={plant.color} opacity="0.9" />
      <circle cx="1.5" cy="-1" r="1.2" fill={plant.color} opacity="0.85" />
      <circle cx="1.5" cy="1" r="1.2" fill={plant.color} opacity="0.85" />
      <circle cx="0" cy="2" r="1.2" fill={plant.color} opacity="0.9" />
      <circle cx="-1.5" cy="1" r="1.2" fill={plant.color} opacity="0.85" />
      <circle cx="-1.5" cy="-1" r="1.2" fill={plant.color} opacity="0.85" />
      {/* Center */}
      <circle cx="0" cy="0" r="0.6" fill="#fef08a" />
    </motion.g>
  )
}

function Shrub({ plant, onClick }: { plant: Plant; onClick: () => void }) {
  return (
    <motion.g
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{ cursor: "pointer" }}
    >
      <ellipse cx="0" cy="0" rx="4" ry="5" fill={plant.color} opacity="0.8" />
      <ellipse cx="-2" cy="-2" rx="3" ry="3.5" fill={plant.color} opacity="0.85" />
      <ellipse cx="2" cy="-2" rx="3" ry="3.5" fill={plant.color} opacity="0.85" />
    </motion.g>
  )
}

function Tree({ plant, onClick }: { plant: Plant; onClick: () => void }) {
  return (
    <motion.g
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.97 }}
      style={{ cursor: "pointer" }}
    >
      {/* Trunk */}
      <rect x="-1.5" y="3" width="3" height="8" fill="#92400e" />
      {/* Foliage */}
      <circle cx="0" cy="-2" r="6" fill={plant.color} opacity="0.85" />
      <circle cx="-4" cy="2" r="5" fill={plant.color} opacity="0.8" />
      <circle cx="4" cy="2" r="5" fill={plant.color} opacity="0.8" />
      <circle cx="0" cy="4" r="5.5" fill={plant.color} opacity="0.82" />
    </motion.g>
  )
}

function OrangeTree() {
  const [face, setFace] = useState(0)
  const faces = ["😊", "😆", "🥰", "😴", "😐", "😮"]

  return (
    <motion.g
      onClick={() => setFace((f) => (f + 1) % faces.length)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      style={{ cursor: "pointer" }}
    >
      {/* Trunk */}
      <rect x="-8" y="20" width="16" height="35" fill="#8b4513" rx="4" />

      {/* Roots */}
      <path d="M -6 55 Q -10 65 -12 70" stroke="#8b4513" strokeWidth="2" fill="none" />
      <path d="M 6 55 Q 10 65 12 70" stroke="#8b4513" strokeWidth="2" fill="none" />
      <path d="M 0 55 Q 0 68 0 75" stroke="#8b4513" strokeWidth="2" fill="none" />

      {/* Main foliage - large spheres */}
      <circle cx="0" cy="-5" r="22" fill="#84cc16" opacity="0.9" />
      <circle cx="-18" cy="8" r="18" fill="#84cc16" opacity="0.85" />
      <circle cx="18" cy="8" r="18" fill="#84cc16" opacity="0.85" />
      <circle cx="-12" cy="-8" r="16" fill="#84cc16" opacity="0.88" />
      <circle cx="12" cy="-8" r="16" fill="#84cc16" opacity="0.88" />

      {/* Oranges scattered throughout */}
      <circle cx="-8" cy="-10" r="3" fill="#fb923c" />
      <circle cx="6" cy="-5" r="3" fill="#fb923c" />
      <circle cx="-15" cy="5" r="3" fill="#fb923c" />
      <circle cx="16" cy="8" r="3" fill="#fb923c" />
      <circle cx="0" cy="10" r="3" fill="#fb923c" />
      <circle cx="-20" cy="-2" r="2.5" fill="#ea580c" />
      <circle cx="20" cy="2" r="2.5" fill="#ea580c" />

      {/* Face on trunk */}
      <text
        x="0"
        y="40"
        textAnchor="middle"
        fontSize="24"
        style={{ userSelect: "none", pointerEvents: "none" }}
      >
        {faces[face]}
      </text>
    </motion.g>
  )
}

export function GardenView() {
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null)
  const [hoveredPlant, setHoveredPlant] = useState<string | null>(null)

  const plantInfo: Record<string, { name: string; description: string }> = {
    f1: { name: "Rose", description: "A classic beauty" },
    f2: { name: "Marigold", description: "Sunny and bright" },
    f3: { name: "Iris", description: "Elegant and rare" },
    f4: { name: "Daisy", description: "Fresh and cheerful" },
    f5: { name: "Tulip", description: "Spring beauty" },
    f6: { name: "Sunflower", description: "Golden rare find" },
    f7: { name: "Bluebell", description: "Serene and calm" },
    s1: { name: "Hedge", description: "Lush greenery" },
    s2: { name: "Bush", description: "Garden centerpiece" },
    t1: { name: "Fruit Tree", description: "Rare treasure" },
    t2: { name: "Apple Tree", description: "Orchard bounty" },
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-sky-300 via-sky-100 to-emerald-50 overflow-hidden relative">
      {/* Clouds */}
      <div className="absolute top-10 left-20 w-32 h-16 bg-white/40 rounded-full blur-lg" />
      <div className="absolute top-20 right-40 w-40 h-20 bg-white/30 rounded-full blur-lg" />

      {/* Garden SVG */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="flex-1"
      >
        {/* Grass base */}
        <ellipse cx="50" cy="85" rx="60" ry="20" fill="#22c55e" opacity="0.3" />

        {/* Orange tree centerpiece */}
        <g transform="translate(50, 35)">
          <OrangeTree />
        </g>

        {/* Surrounding plants */}
        {PLANTS.map((plant) => (
          <motion.g
            key={plant.id}
            transform={`translate(${plant.x}, ${plant.y}) scale(${plant.size})`}
            onMouseEnter={() => setHoveredPlant(plant.id)}
            onMouseLeave={() => setHoveredPlant(null)}
          >
            {plant.type === "flower" && (
              <Flower plant={plant} onClick={() => setSelectedPlant(plant.id)} />
            )}
            {plant.type === "shrub" && (
              <Shrub plant={plant} onClick={() => setSelectedPlant(plant.id)} />
            )}
            {plant.type === "tree" && (
              <Tree plant={plant} onClick={() => setSelectedPlant(plant.id)} />
            )}

            {/* Glow on hover */}
            {hoveredPlant === plant.id && (
              <motion.circle
                cx="0"
                cy="0"
                r="8"
                fill={plant.color}
                opacity="0.2"
                animate={{ r: [6, 10] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.g>
        ))}
      </svg>

      {/* Info panel */}
      {selectedPlant && plantInfo[selectedPlant] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-xs"
        >
          <h3 className="font-bold text-lg mb-2">{plantInfo[selectedPlant].name}</h3>
          <p className="text-sm text-gray-600">{plantInfo[selectedPlant].description}</p>
          <button
            onClick={() => setSelectedPlant(null)}
            className="mt-3 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Close ✕
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="absolute top-6 left-8 text-white drop-shadow-lg">
        <h1 className="text-3xl font-bold">Your Garden</h1>
        <p className="text-sm opacity-80">Click plants to explore • Click the orange tree for surprises</p>
      </div>
    </div>
  )
}
