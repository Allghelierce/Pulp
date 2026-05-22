const S = 'pulp_g_'
const K = [0x6a, 0x75, 0x69, 0x63, 0x65]

function hash(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  let h2 = 0x01000193
  for (let i = input.length - 1; i >= 0; i--) {
    h2 ^= input.charCodeAt(i) ^ K[i % K.length]
    h2 = Math.imul(h2, 0x811c9dc5)
  }
  return ((h >>> 0).toString(36) + (h2 >>> 0).toString(36))
}

function groveFingerprint(grove: any[]): string {
  const parts = grove.map(t =>
    `${t.id}:${t.type}:${t.stage}:${t.plantedAt}`
  )
  parts.sort()
  return parts.join('|')
}

export function signGrove(data: any): any {
  if (!data.grove || !Array.isArray(data.grove)) return data
  const fp = groveFingerprint(data.grove)
  return { ...data, [S + 'k']: hash(fp) }
}

export function verifyGrove(data: any): boolean {
  if (!data.grove || !Array.isArray(data.grove)) return true
  const stored = data[S + 'k']
  if (!stored) return true
  const fp = groveFingerprint(data.grove)
  return hash(fp) === stored
}
