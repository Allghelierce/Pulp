import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })

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
  } catch {
    return NextResponse.json({ error: "Could not fetch URL" }, { status: 500 })
  }
}
