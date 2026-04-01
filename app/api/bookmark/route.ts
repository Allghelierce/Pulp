import { NextRequest, NextResponse } from "next/server"

// Validate URL to prevent SSRF attacks
function isValidURL(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    // Only allow http and https
    if (!["http:", "https:"].includes(url.protocol)) {
      return false
    }
    // Block private/internal IPs
    const hostname = url.hostname.toLowerCase()
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
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  // Validate URL before fetching
  if (!isValidURL(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()

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
