import { NextRequest, NextResponse } from "next/server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

const MAX_BYTES = 512 * 1024
const MAX_REDIRECTS = 3

// True for loopback, private, link-local, CGNAT, and unspecified addresses (v4 + v6).
function isPrivateIP(ip: string): boolean {
  let v = ip.toLowerCase()
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v)
  if (mapped) v = mapped[1]
  if (isIP(v) === 4) {
    const [a, b] = v.split(".").map(Number)
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  }
  return v === "::" || v === "::1" || /^f[cd]/.test(v) || /^fe[89ab]/.test(v) || v.startsWith("::ffff:")
}

// Resolve the host and refuse anything that lands on an internal address.
async function resolvesPublic(url: URL): Promise<boolean> {
  const host = url.hostname.replace(/^\[|\]$/g, "")
  if (isIP(host)) return !isPrivateIP(host)
  try {
    const addrs = await lookup(host, { all: true })
    return addrs.length > 0 && addrs.every(a => !isPrivateIP(a.address))
  } catch { return false }
}

async function readCapped(res: Response): Promise<string> {
  if (!res.body) return ""
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value); size += value.byteLength
  }
  reader.cancel().catch(() => {})
  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, MAX_BYTES))
}

// Validate URL to prevent SSRF attacks
function isValidURL(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    // Only allow http and https
    if (!["http:", "https:"].includes(url.protocol)) {
      return false
    }
    // Block private/internal IPs
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "")
    const privateIPPatterns = [
      /^localhost$/,
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^::1$/,
      /^fc00:/i,
      /^fe80:/i,
      /^169\.254\./,
      /^0\.0\.0\.0$/,
    ]

    if (privateIPPatterns.some(pattern => pattern.test(hostname))) {
      return false
    }

    // Block cloud metadata endpoints
    if (hostname === "metadata.google.internal" ||
        hostname === "169.254.169.254" ||
        hostname === "metadata.aliyun.com") {
      return false
    }

    return true
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const key = getRateLimitKey(req)
  if (!checkRateLimit(`bookmark:${key}`, { windowMs: 60000, maxRequests: 30 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const url = req.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  if (!isValidURL(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  try {
    // Follow redirects by hand so every hop is re-checked against internal addresses.
    let target = url
    let res: Response | null = null
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!isValidURL(target) || !(await resolvesPublic(new URL(target)))) {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
      }
      res = await fetch(target, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
        signal: AbortSignal.timeout(8000),
        redirect: "manual",
      })
      const loc = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null
      if (!loc) break
      target = new URL(loc, target).toString()
      res = null
    }
    if (!res) return NextResponse.json({ error: "Too many redirects" }, { status: 400 })
    const html = await readCapped(res)

    const get = (pattern: RegExp) => pattern.exec(html)?.[1]?.trim() ?? ""

    const title =
      get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/) ||
      get(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/) ||
      get(/<title[^>]*>([^<]+)<\/title>/)

    const description =
      get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/) ||
      get(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/) ||
      get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/) ||
      get(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/)

    const image =
      get(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/) ||
      get(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/)

    const domain = new URL(url).hostname.replace(/^www\./, "")

    return NextResponse.json({ title, description, image, domain })
  } catch (error) {
    console.error("Bookmark fetch error:", error)
    return NextResponse.json({ error: "Could not fetch URL" }, { status: 500 })
  }
}
