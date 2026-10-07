// Pulp sounds — tiny Web Audio synth, no audio files.
// Soft, warm tones for key moments (timer, trees, sap, market, recall).
// Prefs live in localStorage ("pulp-sound"); the context starts on first use,
// which is always after a user gesture, so browsers allow it.

export type SoundName =
  | "timerStart" | "timerDone" | "giveUp" | "plant"
  | "collect" | "reveal" | "revealRare" | "buy"
  | "correct" | "partial" | "wrong" | "achievement" | "tap"

const KEY = "pulp-sound"
export const SOUND_CHANGE_EVENT = "pulp-sound-change"

export interface SoundPrefs { enabled: boolean; volume: number } // volume 0..1
const DEFAULTS: SoundPrefs = { enabled: true, volume: 0.5 }

export function getSoundPrefs(): SoundPrefs {
  if (typeof window === "undefined") return DEFAULTS
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") } } catch { return DEFAULTS }
}

export function setSoundPrefs(patch: Partial<SoundPrefs>) {
  const next = { ...getSoundPrefs(), ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  try { window.dispatchEvent(new Event(SOUND_CHANGE_EVENT)) } catch {}
}

let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === "suspended") ctx.resume().catch(() => {})
  return ctx
}

type Note = { f: number; at?: number; dur?: number; type?: OscillatorType; gain?: number; slideTo?: number }

// One enveloped oscillator per note, through a gentle lowpass for warmth.
function play(notes: Note[], master: number) {
  const ac = audio()
  if (!ac) return
  const out = ac.createGain()
  out.gain.value = master
  const warm = ac.createBiquadFilter()
  warm.type = "lowpass"
  warm.frequency.value = 3200
  warm.connect(out).connect(ac.destination)
  const t0 = ac.currentTime + 0.01
  for (const n of notes) {
    const start = t0 + (n.at ?? 0)
    const dur = n.dur ?? 0.18
    const osc = ac.createOscillator()
    const env = ac.createGain()
    osc.type = n.type ?? "sine"
    osc.frequency.setValueAtTime(n.f, start)
    if (n.slideTo) osc.frequency.exponentialRampToValueAtTime(n.slideTo, start + dur)
    const peak = n.gain ?? 0.22
    env.gain.setValueAtTime(0.0001, start)
    env.gain.exponentialRampToValueAtTime(peak, start + 0.012)
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(env).connect(warm)
    osc.start(start)
    osc.stop(start + dur + 0.05)
  }
}

// Pentatonic-ish pitches keep everything consonant together.
const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5, E6 = 1318.5, G4 = 392, C4 = 261.63

const SOUNDS: Record<SoundName, Note[]> = {
  tap: [{ f: 1400, dur: 0.04, gain: 0.08, type: "triangle" }],
  timerStart: [{ f: G4, dur: 0.22 }, { f: C5, at: 0.09, dur: 0.3 }],
  timerDone: [C5, E5, G5, C6].map((f, i) => ({ f, at: i * 0.11, dur: 0.5, type: "triangle" as const, gain: 0.18 })),
  giveUp: [{ f: 330, slideTo: 196, dur: 0.45, type: "triangle", gain: 0.16 }],
  plant: [{ f: 220, slideTo: 440, dur: 0.12, gain: 0.2 }, { f: E6, at: 0.1, dur: 0.25, gain: 0.08 }],
  collect: [E5, G5, A5, C6, E6].map((f, i) => ({ f, at: i * 0.06, dur: 0.16, type: "triangle" as const, gain: 0.12 })),
  reveal: [{ f: 600, slideTo: 1200, dur: 0.18, gain: 0.08 }, { f: A5, at: 0.16, dur: 0.3, gain: 0.16 }],
  revealRare: [{ f: 600, slideTo: 1400, dur: 0.22, gain: 0.08 }, ...[C6, E6, G5 * 2].map((f, i) => ({ f, at: 0.2 + i * 0.09, dur: 0.45, type: "triangle" as const, gain: 0.13 }))],
  buy: [{ f: 1568, dur: 0.08, gain: 0.12, type: "square" }, { f: 2093, at: 0.07, dur: 0.22, gain: 0.1 }],
  correct: [{ f: E5, dur: 0.14 }, { f: A5, at: 0.09, dur: 0.28 }],
  partial: [{ f: D5, dur: 0.2, gain: 0.18 }],
  wrong: [{ f: C4 * 1.5, slideTo: C4, dur: 0.3, type: "triangle", gain: 0.14 }],
  achievement: [C5, E5, G5, C6, G5, C6].map((f, i) => ({ f, at: i * 0.09, dur: i === 5 ? 0.6 : 0.16, type: "triangle" as const, gain: 0.15 })),
}

let lastPlayed = 0
export function playSound(name: SoundName) {
  if (typeof document !== "undefined" && document.hidden) return
  const { enabled, volume } = getSoundPrefs()
  if (!enabled || volume <= 0) return
  const now = Date.now()
  if (name === "tap" && now - lastPlayed < 60) return // no machine-gun clicks
  lastPlayed = now
  try { play(SOUNDS[name], Math.min(1, volume) * 0.9) } catch {}
}
