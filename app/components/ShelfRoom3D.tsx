"use client"
import { useRef, useState, Suspense, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Text, RoundedBox } from "@react-three/drei"
import { Vector3, Color, MathUtils, DoubleSide, BackSide, type Group } from "three"
import type { NoteData } from "@/app/types"
import { Plus, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"

interface ShelfRoom3DProps {
  notes: NoteData[]
  onOpenNote: (id: string) => void
  onCreateNote: () => void
  onBack: () => void
  theme: "light" | "dark"
}

function sr(n: number) { return ((n * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff }

const BOOK_COLORS = [
  "#8b3a1a","#5a6e2a","#4a5a6a",
  "#7a2a2a","#2a5a3a","#8a5a1a",
  "#2a4a6a","#6a3a5a","#3a5a2a",
  "#7a4a2a","#4a6a5a","#6a2a3a",
]

// Camera positions — close, intimate
const VIEWS = [
  { pos: new Vector3( 2.8, 0.15, -0.3), look: new Vector3(-5, 0.6, -0.8) },
  { pos: new Vector3( 0,   0.15,  1.1), look: new Vector3( 0, 0.6, -4.0) },
  { pos: new Vector3(-2.8, 0.15, -0.3), look: new Vector3( 5, 0.6, -0.8) },
]
const VIEW_LABELS = ["Left Wall", "Front Wall", "Right Wall"]

// ── Camera rig ──────────────────────────────────────────────────────────────
function CameraRig({ viewIdx }: { viewIdx: number }) {
  const { camera } = useThree()
  const lookTarget = useRef(new Vector3(0, 0.6, -4))
  const initialized = useRef(false)
  useEffect(() => {
    if (!initialized.current) {
      camera.position.copy(VIEWS[1].pos)
      lookTarget.current.copy(VIEWS[1].look)
      camera.lookAt(lookTarget.current)
      initialized.current = true
    }
  }, [camera])
  useFrame((_, delta) => {
    const s = Math.min(delta * 3.5, 1)
    camera.position.lerp(VIEWS[viewIdx].pos, s)
    lookTarget.current.lerp(VIEWS[viewIdx].look, s)
    camera.lookAt(lookTarget.current)
  })
  return null
}

// ── Book spine ──────────────────────────────────────────────────────────────
function Book({ x, y, z, rotY = 0, w, h, d, color, label, onClick }: {
  x: number; y: number; z: number; rotY?: number
  w: number; h: number; d: number; color: string; label: string; onClick: () => void
}) {
  const ref = useRef<Group>(null)
  const [hov, setHov] = useState(false)
  useFrame((_, dt) => {
    if (!ref.current) return
    ref.current.position.y = MathUtils.lerp(ref.current.position.y, y + (hov ? 0.12 : 0), dt * 9)
  })
  const col = new Color(color)
  return (
    <group ref={ref} position={[x, y, z]} rotation={[0, rotY, 0]}>
      <RoundedBox args={[w, h, d]} radius={0.012} smoothness={2}
        onClick={e => { e.stopPropagation(); onClick() }}
        onPointerEnter={() => { setHov(true); document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { setHov(false); document.body.style.cursor = 'auto' }}>
        <meshStandardMaterial color={hov ? col.clone().multiplyScalar(1.3) : col} roughness={0.78} metalness={0.03} />
      </RoundedBox>
      <Text position={[0, 0, d / 2 + 0.003]} fontSize={0.04} color="rgba(255,240,210,0.7)"
        anchorX="center" anchorY="middle" maxWidth={h * 0.85} rotation={[0, 0, Math.PI / 2]}>
        {label.substring(0, 16)}
      </Text>
      <mesh position={[-w / 2 + 0.014, 0, 0]}>
        <boxGeometry args={[0.009, h - 0.02, d + 0.001]} />
        <meshStandardMaterial color={col.clone().multiplyScalar(0.55)} roughness={0.9} />
      </mesh>
    </group>
  )
}

// ── Shelf plank ─────────────────────────────────────────────────────────────
function Plank({ x, y, z, w, d }: { x: number; y: number; z: number; w: number; d: number }) {
  return (
    <group>
      <mesh position={[x, y, z]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.038, d]} />
        <meshStandardMaterial color="#c89840" roughness={0.65} metalness={0.04} />
      </mesh>
      {/* Front lip */}
      <mesh position={[x, y + 0.02, z + d / 2 - 0.005]}>
        <boxGeometry args={[w, 0.007, 0.008]} />
        <meshStandardMaterial color="#eecf78" roughness={0.5} />
      </mesh>
    </group>
  )
}

// ── Metal bracket ───────────────────────────────────────────────────────────
function Bracket({ x, y, z, rotY = 0 }: { x: number; y: number; z: number; rotY?: number }) {
  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[0.035, 0.16, 0.22]} />
        <meshStandardMaterial color="#8b6020" roughness={0.8} />
      </mesh>
    </group>
  )
}

// ── Books on a shelf ────────────────────────────────────────────────────────
function ShelfBooks({ notes, y, xStart, xEnd, z, rotY, noteOffset, onOpenNote }: {
  notes: NoteData[]; y: number; xStart: number; xEnd: number
  z: number; rotY: number; noteOffset: number
  onOpenNote: (id: string) => void
}) {
  const BW = 0.115, gap = 0.016, depth = 0.27, pad = 0.08
  const els: React.ReactElement[] = []
  let cx = xStart + pad

  for (let i = 0; i < notes.length; i++) {
    if (cx + BW > xEnd - pad) break
    const seed = noteOffset + i
    const bH = 0.37 + sr(seed * 3) * 0.22
    const color = BOOK_COLORS[(noteOffset + i) % BOOK_COLORS.length]

    // Spine faces inward for left/right walls
    const bx = rotY === 0 ? cx + BW / 2 : z + (rotY > 0 ? depth / 2 - 0.04 : -(depth / 2 - 0.04))
    const bz = rotY === 0 ? z + depth / 2 - 0.04 : cx + BW / 2

    els.push(<Book key={notes[i].id}
      x={bx} y={y + 0.025 + bH / 2} z={bz} rotY={rotY}
      w={BW} h={bH} d={depth} color={color}
      label={notes[i].subject || "Note"} onClick={() => onOpenNote(notes[i].id)} />)
    cx += BW + gap + sr(seed) * 0.006
  }
  return <>{els}</>
}

// ── Sofa ────────────────────────────────────────────────────────────────────
function Sofa() {
  const F = -1.85  // floor y
  const fabric = "#6a6a78"
  const metal = "#1a1a1a"
  return (
    <group position={[0, F, 0.7]}>
      {/* Seat */}
      <RoundedBox args={[2.9, 0.42, 0.92]} radius={0.04} smoothness={3} position={[0, 0.21, 0]}>
        <meshStandardMaterial color={fabric} roughness={0.96} />
      </RoundedBox>
      {/* Back */}
      <RoundedBox args={[2.9, 0.54, 0.22]} radius={0.05} smoothness={3} position={[0, 0.65, 0.35]}>
        <meshStandardMaterial color={fabric} roughness={0.96} />
      </RoundedBox>
      {/* Left arm */}
      <RoundedBox args={[0.2, 0.28, 0.92]} radius={0.04} smoothness={2} position={[-1.55, 0.35, 0]}>
        <meshStandardMaterial color={fabric} roughness={0.96} />
      </RoundedBox>
      {/* Right arm */}
      <RoundedBox args={[0.2, 0.28, 0.92]} radius={0.04} smoothness={2} position={[1.55, 0.35, 0]}>
        <meshStandardMaterial color={fabric} roughness={0.96} />
      </RoundedBox>
      {/* Seat cushions */}
      {[-0.9, 0, 0.9].map((cx, i) => (
        <RoundedBox key={i} args={[0.83, 0.13, 0.86]} radius={0.06} smoothness={2} position={[cx, 0.49, 0]}>
          <meshStandardMaterial color="#74748a" roughness={0.98} />
        </RoundedBox>
      ))}
      {/* Orange accent pillow — matches site */}
      <RoundedBox args={[0.38, 0.22, 0.38]} radius={0.08} smoothness={2} position={[1.1, 0.76, 0.08]} rotation={[0.05, 0.25, 0.1]}>
        <meshStandardMaterial color="#e0601a" roughness={0.92} />
      </RoundedBox>
      {/* Warm gold pillow */}
      <RoundedBox args={[0.34, 0.2, 0.34]} radius={0.08} smoothness={2} position={[0.75, 0.72, 0.1]} rotation={[0.02, -0.2, 0.05]}>
        <meshStandardMaterial color="#ddb855" roughness={0.92} />
      </RoundedBox>
      {/* Throw blanket draped over arm */}
      <RoundedBox args={[0.55, 0.06, 0.7]} radius={0.03} smoothness={2} position={[-1.46, 0.52, -0.08]} rotation={[0.2, 0, 0.05]}>
        <meshStandardMaterial color="#c89840" roughness={0.95} />
      </RoundedBox>
      {/* Legs */}
      {[[-1.2, -0.36], [-1.2, 0.36], [1.2, -0.36], [1.2, 0.36]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx as number, 0.04, lz as number]}>
          <cylinderGeometry args={[0.022, 0.022, 0.1, 8]} />
          <meshStandardMaterial color={metal} metalness={0.85} roughness={0.15} />
        </mesh>
      ))}
    </group>
  )
}

// ── Coffee table ─────────────────────────────────────────────────────────────
function CoffeeTable() {
  const F = -1.85
  const metal = "#1a1a1a"
  return (
    <group position={[0, F, -0.4]}>
      {/* Marble top */}
      <RoundedBox args={[1.3, 0.055, 0.68]} radius={0.012} smoothness={2} position={[0, 0.38, 0]}>
        <meshStandardMaterial color="#e8e0d8" roughness={0.28} metalness={0.06} />
      </RoundedBox>
      {/* Lower shelf */}
      <RoundedBox args={[1.1, 0.04, 0.55]} radius={0.01} smoothness={2} position={[0, 0.14, 0]}>
        <meshStandardMaterial color="#d4c8b8" roughness={0.4} metalness={0.05} />
      </RoundedBox>
      {/* Legs */}
      {[[-0.54, -0.29], [-0.54, 0.29], [0.54, -0.29], [0.54, 0.29]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx as number, 0.19, lz as number]}>
          <boxGeometry args={[0.025, 0.42, 0.025]} />
          <meshStandardMaterial color={metal} metalness={0.85} roughness={0.15} />
        </mesh>
      ))}
      {/* Cross brace */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[1.1, 0.018, 0.025]} />
        <meshStandardMaterial color={metal} metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Stacked books on lower shelf */}
      {[
        { color: "#8b3a1a", w: 0.24, h: 0.042, d: 0.17, ry: 0.1, xi: -0.25 },
        { color: "#4a5a6a", w: 0.22, h: 0.036, d: 0.16, ry: 0.04, xi: -0.25 },
        { color: "#5a6e2a", w: 0.2,  h: 0.038, d: 0.15, ry: -0.06, xi: -0.25 },
      ].map((b, i) => (
        <mesh key={i} position={[b.xi, 0.16 + i * 0.04, 0]} rotation={[0, b.ry, 0]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.color} roughness={0.82} />
        </mesh>
      ))}
      {/* Small orange sphere on top of books */}
      <mesh position={[-0.25, 0.32, 0]}>
        <sphereGeometry args={[0.042, 10, 10]} />
        <meshStandardMaterial color="#F56A00" roughness={0.55} />
      </mesh>
      {/* Small ceramic vase on table top */}
      <mesh position={[0.32, 0.41, 0.06]}>
        <cylinderGeometry args={[0.04, 0.055, 0.14, 10]} />
        <meshStandardMaterial color="#d8d0c0" roughness={0.6} />
      </mesh>
      <mesh position={[0.32, 0.49, 0.06]}>
        <cylinderGeometry args={[0.038, 0.038, 0.02, 10]} />
        <meshStandardMaterial color="#c8c0b0" roughness={0.7} />
      </mesh>
    </group>
  )
}

// ── Floor lamp ───────────────────────────────────────────────────────────────
function FloorLamp({ x, z }: { x: number; z: number }) {
  const F = -1.85
  const metal = "#1e1e1e"
  return (
    <group position={[x, F, z]}>
      {/* Base disk */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.04, 14]} />
        <meshStandardMaterial color={metal} metalness={0.88} roughness={0.12} />
      </mesh>
      {/* Main pole */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 2.2, 8]} />
        <meshStandardMaterial color={metal} metalness={0.88} roughness={0.12} />
      </mesh>
      {/* Shade housing */}
      <mesh position={[0, 2.28, 0]}>
        <cylinderGeometry args={[0.2, 0.12, 0.28, 14, 1, true]} />
        <meshStandardMaterial color="#f0e8d8" side={DoubleSide} roughness={0.9} opacity={0.85} transparent />
      </mesh>
      {/* Shade cap */}
      <mesh position={[0, 2.42, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.015, 14]} />
        <meshStandardMaterial color={metal} metalness={0.88} roughness={0.12} />
      </mesh>
      {/* Inner glow */}
      <mesh position={[0, 2.24, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#fff8e0" emissive="#fff0a0" emissiveIntensity={3} />
      </mesh>
    </group>
  )
}

// ── Pendant lamp ─────────────────────────────────────────────────────────────
function PendantLight({ x = 0, y = 3.0, z = -1.5 }: { x?: number; y?: number; z?: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.7, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0, -0.75, 0]}>
        <sphereGeometry args={[0.18, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1e1e1e" metalness={0.75} roughness={0.3} side={DoubleSide} />
      </mesh>
      <mesh position={[0, -0.74, 0]}>
        <sphereGeometry args={[0.13, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#fff8e0" emissive="#ffe880" emissiveIntensity={3} />
      </mesh>
    </group>
  )
}

// ── Fiddle-leaf plant ─────────────────────────────────────────────────────────
function Plant({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  const F = -1.85
  return (
    <group position={[x, F, z]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.19, 0.14, 0.44, 12]} />
        <meshStandardMaterial color="#c89840" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.185, 0.185, 0.035, 12]} />
        <meshStandardMaterial color="#3a2810" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <cylinderGeometry args={[0.038, 0.055, 1.38, 8]} />
        <meshStandardMaterial color="#8b6020" roughness={0.85} />
      </mesh>
      {[
        [0, 1.72, 0, 0.27], [0.2, 1.52, 0.1, 0.21],
        [-0.16, 1.58, 0.07, 0.2], [0.08, 1.88, -0.12, 0.23],
        [-0.14, 1.82, 0.06, 0.19], [0.06, 1.62, -0.05, 0.17],
      ].map(([lx, ly, lz, r], i) => (
        <mesh key={i} position={[lx as number, ly as number, lz as number]}>
          <sphereGeometry args={[r as number, 6, 6]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#4a7a20" : "#5a8a28"} roughness={0.88} />
        </mesh>
      ))}
    </group>
  )
}

// ── Framed artwork ────────────────────────────────────────────────────────────
function FramedArt({ x, y, z, rotY = 0, w = 0.9, h = 0.65, palette }: {
  x: number; y: number; z: number; rotY?: number; w?: number; h?: number; palette: string[]
}) {
  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[w + 0.06, h + 0.06, 0.038]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Canvas */}
      <mesh position={[0, 0, 0.022]}>
        <boxGeometry args={[w, h, 0.008]} />
        <meshStandardMaterial color={palette[0]} roughness={0.85} />
      </mesh>
      {/* Abstract shapes on canvas */}
      <mesh position={[-w * 0.18, h * 0.1, 0.028]}>
        <circleGeometry args={[h * 0.28, 12]} />
        <meshStandardMaterial color={palette[1]} roughness={0.8} />
      </mesh>
      <mesh position={[w * 0.22, -h * 0.08, 0.028]}>
        <circleGeometry args={[h * 0.18, 12]} />
        <meshStandardMaterial color={palette[2]} roughness={0.8} />
      </mesh>
      <mesh position={[w * 0.05, h * 0.2, 0.028]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[w * 0.35, h * 0.08, 0.002]} />
        <meshStandardMaterial color={palette[1 % palette.length] + "cc"} roughness={0.8} />
      </mesh>
    </group>
  )
}

// ── Window ────────────────────────────────────────────────────────────────────
function Window({ x, y, z, rotY = 0, w = 1.1, h = 1.2 }: {
  x: number; y: number; z: number; rotY?: number; w?: number; h?: number
}) {
  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.06]} />
        <meshStandardMaterial color="#e8dfc8" roughness={0.8} />
      </mesh>
      {/* Glass — soft blue night glow */}
      <mesh position={[0, 0, 0.032]}>
        <boxGeometry args={[w, h, 0.012]} />
        <meshStandardMaterial color="#7aa8c8" emissive="#4070a0" emissiveIntensity={0.45} roughness={0.1} metalness={0.05} opacity={0.75} transparent />
      </mesh>
      {/* Window cross */}
      <mesh position={[0, 0, 0.042]}>
        <boxGeometry args={[w, 0.04, 0.014]} />
        <meshStandardMaterial color="#d8d0c0" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.042]}>
        <boxGeometry args={[0.04, h, 0.014]} />
        <meshStandardMaterial color="#d8d0c0" roughness={0.7} />
      </mesh>
    </group>
  )
}

// ── Wood floor ────────────────────────────────────────────────────────────────
function WoodFloor() {
  const planks: React.ReactElement[] = []
  const plankW = 0.46
  const roomLen = 7.5
  const colors = ["#c89840", "#b8883a", "#d0a44e", "#ba8c3c", "#c49040"]
  for (let i = 0; i < 22; i++) {
    const xPos = -5 + i * plankW + plankW / 2
    if (xPos > 5) break
    planks.push(
      <mesh key={i} position={[xPos, -1.85, -0.5]} receiveShadow>
        <boxGeometry args={[plankW - 0.015, 0.04, roomLen]} />
        <meshStandardMaterial color={colors[i % colors.length]} roughness={0.75} />
      </mesh>
    )
  }
  return <group>{planks}</group>
}

// ── Side table ────────────────────────────────────────────────────────────────
function SideTable({ x, z }: { x: number; z: number }) {
  const F = -1.85
  const metal = "#1a1a1a"
  return (
    <group position={[x, F, z]}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.03, 14]} />
        <meshStandardMaterial color="#d4c8b8" roughness={0.35} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.54, 8]} />
        <meshStandardMaterial color={metal} metalness={0.88} roughness={0.12} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.03, 14]} />
        <meshStandardMaterial color={metal} metalness={0.88} roughness={0.12} />
      </mesh>
    </group>
  )
}

// ── Front wall ────────────────────────────────────────────────────────────────
function FrontWall({ notes, onOpenNote }: { notes: NoteData[]; onOpenNote: (id: string) => void }) {
  const perShelf = Math.ceil(notes.length / 3)
  const shelfY  = [-0.45, 0.58, 1.6]
  const shelfCfg = [
    { xStart: -3.4, xEnd: 2.8 },
    { xStart: -2.8, xEnd: 3.4 },
    { xStart: -2.2, xEnd: 3.0 },
  ]

  return (
    <group>
      {/* Wall */}
      <mesh position={[0, 0.5, -4]} receiveShadow>
        <planeGeometry args={[10, 5.5]} />
        <meshStandardMaterial color="#f0e8d0" roughness={0.95} />
      </mesh>
      {/* Wall panel molding — modern detail */}
      {[-3.2, 3.2].map((px, i) => (
        <mesh key={i} position={[px, 0.5, -3.97]}>
          <boxGeometry args={[0.04, 4.8, 0.018]} />
          <meshStandardMaterial color="#e0d8c4" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 2.55, -3.97]}>
        <boxGeometry args={[10, 0.04, 0.018]} />
        <meshStandardMaterial color="#e0d8c4" roughness={0.9} />
      </mesh>

      {/* Tree trunk */}
      <mesh position={[-4.1, -0.1, -3.82]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 2.8, 8]} />
        <meshStandardMaterial color="#8b6020" roughness={0.87} />
      </mesh>
      {/* Canopy */}
      {[[-3.9, 1.08, -3.68, 0.38], [-4.3, 0.98, -3.7, 0.32], [-3.7, 1.22, -3.74, 0.28], [-4.5, 1.12, -3.65, 0.26]].map(([lx,ly,lz,r], i) => (
        <mesh key={i} position={[lx as number, ly as number, lz as number]}>
          <sphereGeometry args={[r as number, 7, 7]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#4a8a20" : "#5a9a28"} roughness={0.9} />
        </mesh>
      ))}
      {/* Oranges */}
      {[[-3.82, 1.0, -3.48], [-4.12, 0.88, -3.52], [-3.68, 1.18, -3.58]].map(([ox,oy,oz], i) => (
        <mesh key={i} position={[ox as number, oy as number, oz as number]}>
          <sphereGeometry args={[0.062, 8, 8]} />
          <meshStandardMaterial color="#F56A00" roughness={0.55} />
        </mesh>
      ))}

      {/* Shelves */}
      {shelfY.map((y, i) => {
        const cfg = shelfCfg[i]
        const len = cfg.xEnd - cfg.xStart
        return (
          <group key={i}>
            <Plank x={cfg.xStart + len / 2} y={y} z={-3.82} w={len} d={0.32} />
            <Bracket x={cfg.xStart + 0.2} y={y - 0.06} z={-3.82} />
            <Bracket x={cfg.xEnd  - 0.2} y={y - 0.06} z={-3.82} />
            <ShelfBooks
              notes={notes.slice(i * perShelf, (i + 1) * perShelf)}
              y={y} xStart={cfg.xStart} xEnd={cfg.xEnd} z={-3.82}
              rotY={0} noteOffset={i * perShelf}
              onOpenNote={onOpenNote}
            />
          </group>
        )
      })}
    </group>
  )
}

// ── Left wall ─────────────────────────────────────────────────────────────────
function LeftWall({ notes, onOpenNote }: { notes: NoteData[]; onOpenNote: (id: string) => void }) {
  const perShelf = Math.ceil(notes.length / 3)
  const shelfY = [-0.45, 0.58, 1.6]
  const shelfLen = 4.6

  return (
    <group>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-5, 0.5, -0.5]} receiveShadow>
        <planeGeometry args={[7.5, 5.5]} />
        <meshStandardMaterial color="#ede5cf" roughness={0.95} />
      </mesh>
      {/* Molding */}
      {[-3.5, 1.0].map((pz, i) => (
        <mesh key={i} position={[-4.97, 0.5, pz]}>
          <boxGeometry args={[0.018, 4.8, 0.04]} />
          <meshStandardMaterial color="#ddd5bf" roughness={0.9} />
        </mesh>
      ))}

      {/* Framed art */}
      <FramedArt x={-4.97} y={1.55} z={1.6} rotY={Math.PI / 2} w={1.1} h={0.8}
        palette={["#f0e8d0", "#e0601a", "#ddb855"]} />

      {/* Shelves */}
      {shelfY.map((y, i) => (
        <group key={i}>
          <Plank x={-4.84} y={y} z={-2.0 + shelfLen / 2} w={0.3} d={shelfLen} />
          <Bracket x={-4.84} y={y - 0.06} z={-3.5} rotY={Math.PI / 2} />
          <Bracket x={-4.84} y={y - 0.06} z={ 0.6} rotY={Math.PI / 2} />
          {notes.slice(i * perShelf, (i + 1) * perShelf).map((note, j) => {
            if (j > 13) return null
            const seed = i * 100 + j + 100
            const bH = 0.37 + sr(seed * 3) * 0.22
            const color = BOOK_COLORS[(i * 4 + j) % BOOK_COLORS.length]
            const bz = -3.2 + j * 0.134
            return (
              <Book key={note.id}
                x={-4.72} y={y + 0.025 + bH / 2} z={bz}
                rotY={-Math.PI / 2} w={0.115} h={bH} d={0.27}
                color={color} label={note.subject || "Note"}
                onClick={() => onOpenNote(note.id)} />
            )
          })}
        </group>
      ))}
    </group>
  )
}

// ── Right wall ────────────────────────────────────────────────────────────────
function RightWall({ notes, onOpenNote }: { notes: NoteData[]; onOpenNote: (id: string) => void }) {
  const perShelf = Math.ceil(notes.length / 3)
  const shelfY = [-0.45, 0.58, 1.6]
  const shelfLen = 4.6

  return (
    <group>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[5, 0.5, -0.5]} receiveShadow>
        <planeGeometry args={[7.5, 5.5]} />
        <meshStandardMaterial color="#ede5cf" roughness={0.95} />
      </mesh>
      {/* Molding */}
      {[-3.5, 1.0].map((pz, i) => (
        <mesh key={i} position={[4.97, 0.5, pz]}>
          <boxGeometry args={[0.018, 4.8, 0.04]} />
          <meshStandardMaterial color="#ddd5bf" roughness={0.9} />
        </mesh>
      ))}

      {/* Window */}
      <Window x={4.97} y={0.82} z={1.6} rotY={-Math.PI / 2} w={1.2} h={1.3} />

      {/* Framed art */}
      <FramedArt x={4.97} y={1.45} z={-2.5} rotY={-Math.PI / 2} w={0.85} h={0.65}
        palette={["#1a1a2a", "#ddb855", "#e0601a"]} />

      {shelfY.map((y, i) => (
        <group key={i}>
          <Plank x={4.84} y={y} z={-2.0 + shelfLen / 2} w={0.3} d={shelfLen} />
          <Bracket x={4.84} y={y - 0.06} z={-3.5} rotY={-Math.PI / 2} />
          <Bracket x={4.84} y={y - 0.06} z={ 0.6} rotY={-Math.PI / 2} />
          {notes.slice(i * perShelf, (i + 1) * perShelf).map((note, j) => {
            if (j > 13) return null
            const seed = i * 100 + j + 200
            const bH = 0.37 + sr(seed * 3) * 0.22
            const color = BOOK_COLORS[(i * 4 + j + 6) % BOOK_COLORS.length]
            const bz = -3.2 + j * 0.134
            return (
              <Book key={note.id}
                x={4.72} y={y + 0.025 + bH / 2} z={bz}
                rotY={Math.PI / 2} w={0.115} h={bH} d={0.27}
                color={color} label={note.subject || "Note"}
                onClick={() => onOpenNote(note.id)} />
            )
          })}
        </group>
      ))}
    </group>
  )
}

// ── Entrance wall (behind camera — decorated but not navigable) ───────────────
function EntranceWall() {
  return (
    <group>
      <mesh position={[0, 0.5, 3.0]} receiveShadow>
        <planeGeometry args={[10, 5.5]} />
        <meshStandardMaterial color="#ede5cf" roughness={0.95} side={BackSide} />
      </mesh>
      {/* Large arched window — evening glow */}
      <group position={[0, 0.9, 2.98]}>
        {/* Frame */}
        <mesh>
          <boxGeometry args={[2.2, 2.6, 0.06]} />
          <meshStandardMaterial color="#e0d8c4" roughness={0.8} />
        </mesh>
        {/* Glass */}
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[2.0, 2.4, 0.012]} />
          <meshStandardMaterial color="#8ab4d0" emissive="#5080a8" emissiveIntensity={0.4} roughness={0.1} opacity={0.7} transparent />
        </mesh>
        {/* Arch top */}
        <mesh position={[0, 1.22, 0.035]}>
          <cylinderGeometry args={[1.0, 1.0, 0.012, 16, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#8ab4d0" emissive="#5080a8" emissiveIntensity={0.4} roughness={0.1} opacity={0.7} transparent />
        </mesh>
        {/* Cross bar */}
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[2.0, 0.04, 0.015]} />
          <meshStandardMaterial color="#d8d0c0" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.04, 2.4, 0.015]} />
          <meshStandardMaterial color="#d8d0c0" roughness={0.7} />
        </mesh>
      </group>
      {/* Sconce lights on entrance wall */}
      {[-3.5, 3.5].map((wx, i) => (
        <group key={i} position={[wx, 1.2, 2.96]}>
          <mesh position={[0, 0.3, 0.06]}>
            <cylinderGeometry args={[0.08, 0.04, 0.3, 10, 1, true]} />
            <meshStandardMaterial color="#e8e0d0" side={DoubleSide} roughness={0.85} opacity={0.8} transparent />
          </mesh>
          <mesh position={[0, 0.08, 0.06]}>
            <boxGeometry args={[0.06, 0.18, 0.08]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.3, 0.06]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#fff8e0" emissive="#ffe880" emissiveIntensity={3.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ── Ceiling ───────────────────────────────────────────────────────────────────
function Ceiling() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.0, -0.5]}>
        <planeGeometry args={[10, 7.5]} />
        <meshStandardMaterial color="#f5f0e8" roughness={1} />
      </mesh>
      {/* Crown molding */}
      {[
        { pos: [0,   2.98, -4  ] as [number,number,number], rot: [0,0,0]            as [number,number,number], w: 10, d: 0.06 },
        { pos: [0,   2.98,  3  ] as [number,number,number], rot: [0,0,0]            as [number,number,number], w: 10, d: 0.06 },
        { pos: [-5,  2.98, -0.5] as [number,number,number], rot: [0, Math.PI/2, 0]  as [number,number,number], w: 7.5, d: 0.06 },
        { pos: [ 5,  2.98, -0.5] as [number,number,number], rot: [0, Math.PI/2, 0]  as [number,number,number], w: 7.5, d: 0.06 },
      ].map((m, i) => (
        <mesh key={i} position={m.pos} rotation={m.rot}>
          <boxGeometry args={[m.w, 0.06, m.d]} />
          <meshStandardMaterial color="#ece4ce" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// ── Full room ─────────────────────────────────────────────────────────────────
function Room({ notes, onOpenNote }: { notes: NoteData[]; onOpenNote: (id: string) => void }) {
  const third = Math.ceil(notes.length / 3)
  const frontNotes = notes.slice(0, third)
  const leftNotes  = notes.slice(third, third * 2)
  const rightNotes = notes.slice(third * 2)

  return (
    <>
      <WoodFloor />
      <Ceiling />
      <FrontWall  notes={frontNotes} onOpenNote={onOpenNote} />
      <LeftWall   notes={leftNotes}  onOpenNote={onOpenNote} />
      <RightWall  notes={rightNotes} onOpenNote={onOpenNote} />
      <EntranceWall />

      {/* Furniture */}
      <Sofa />
      <CoffeeTable />
      <SideTable x={ 1.9} z={0.72} />
      <SideTable x={-1.9} z={0.72} />
      <FloorLamp x={ 2.4} z={-0.5} />
      <Plant     x={-4.0} z={ 0.8} />
      <Plant     x={ 3.8} z={-3.3} scale={0.75} />

      {/* Pendant lights */}
      <PendantLight x={0}    y={3.0} z={-1.6} />
      <PendantLight x={-2.5} y={3.0} z={-1.4} />
      <PendantLight x={ 2.5} y={3.0} z={-1.4} />
    </>
  )
}

// ── Lighting ──────────────────────────────────────────────────────────────────
function Lights() {
  return (
    <>
      <ambientLight intensity={0.55} color="#fff4e0" />
      {/* Main pendants */}
      <pointLight position={[0,   2.7, -1.6]} intensity={28} color="#fff5d0" castShadow distance={9}  decay={2} />
      <pointLight position={[-2.5, 2.7, -1.4]} intensity={14} color="#fff0c8" distance={6}  decay={2} />
      <pointLight position={[ 2.5, 2.7, -1.4]} intensity={14} color="#fff0c8" distance={6}  decay={2} />
      {/* Floor lamp */}
      <pointLight position={[2.4, 2.3, -0.5]} intensity={10} color="#ffe8a0" distance={5}  decay={2} />
      {/* Entrance sconces */}
      <pointLight position={[-3.5, 1.5, 2.6]} intensity={6}  color="#ffe0a0" distance={4}  decay={2} />
      <pointLight position={[ 3.5, 1.5, 2.6]} intensity={6}  color="#ffe0a0" distance={4}  decay={2} />
      {/* Window ambient from right wall */}
      <pointLight position={[4.5, 0.8, 1.6]}  intensity={5}  color="#a0c8e8" distance={4}  decay={2} />
      {/* Front wall fill */}
      <pointLight position={[0, 0.5, -3.5]}   intensity={6}  color="#ffd090" distance={5}  decay={2} />
    </>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ShelfRoom3D({ notes, onOpenNote, onCreateNote, onBack }: ShelfRoom3DProps) {
  const [viewIdx, setViewIdx] = useState(1)

  return (
    <div className="absolute inset-0 z-50" style={{ background: "#0c0a06" }}>

      {/* Top bar */}
      <div className="absolute top-5 left-5 z-10 flex items-center gap-4">
        <button onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide uppercase backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.5)', color: '#eecf78', border: '1px solid rgba(238,207,120,0.22)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div>
          <h1 className="font-serif italic text-3xl leading-none" style={{ color: '#eecf78' }}>Pulp</h1>
          <p className="text-[9px] tracking-[0.28em] uppercase font-medium mt-0.5" style={{ color: '#aa7e2c' }}>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
      </div>

      {/* Arrow nav */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-5">
        <button onClick={() => setViewIdx(v => Math.max(0, v - 1))} disabled={viewIdx === 0}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
          style={{ background: 'rgba(238,207,120,0.1)', color: '#eecf78', border: '1px solid rgba(238,207,120,0.28)' }}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] tracking-[0.22em] uppercase font-semibold" style={{ color: '#ddb855' }}>
            {VIEW_LABELS[viewIdx]}
          </span>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <button key={i} onClick={() => setViewIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === viewIdx ? 20 : 8,
                  height: 8,
                  background: i === viewIdx ? '#eecf78' : 'rgba(238,207,120,0.22)',
                }} />
            ))}
          </div>
        </div>
        <button onClick={() => setViewIdx(v => Math.min(2, v + 1))} disabled={viewIdx === 2}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
          style={{ background: 'rgba(238,207,120,0.1)', color: '#eecf78', border: '1px solid rgba(238,207,120,0.28)' }}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* New note */}
      <button onClick={onCreateNote}
        className="absolute bottom-8 right-6 z-10 flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-[10px] tracking-[0.18em] uppercase transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #e0601a, #b83e0e)', boxShadow: '0 4px 20px rgba(200,70,10,0.6)' }}>
        <Plus className="w-3.5 h-3.5" /> New Note
      </button>

      <Canvas shadows camera={{ position: [0, 0.15, 1.1], fov: 62 }}
        style={{ width: '100%', height: '100%' }}>
        <Suspense fallback={null}>
          <CameraRig viewIdx={viewIdx} />
          <Lights />
          <Room notes={notes} onOpenNote={onOpenNote} />
        </Suspense>
      </Canvas>
    </div>
  )
}
