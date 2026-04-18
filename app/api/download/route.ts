import { NextRequest, NextResponse } from "next/server"

const RELEASE_BASE_URL = process.env.DOWNLOAD_BASE_URL || "https://github.com/yourusername/pulp/releases/download/v1.0.0"

const DOWNLOAD_URLS: Record<string, string> = {
  mac: `${RELEASE_BASE_URL}/Pulp-1.0.0.dmg`,
  windows: `${RELEASE_BASE_URL}/Pulp-Setup-1.0.0.exe`,
  linux: `${RELEASE_BASE_URL}/pulp-1.0.0.AppImage`,
}

export async function GET(request: NextRequest) {
  try {
    const platform = request.nextUrl.searchParams.get("platform") || "mac"
    const validPlatforms = ["mac", "windows", "linux"]
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
    }
    const url = DOWNLOAD_URLS[platform] || DOWNLOAD_URLS.mac

    // Redirect to GitHub release or your hosting service
    return NextResponse.json(
      { url, platform },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    )
  }
}
