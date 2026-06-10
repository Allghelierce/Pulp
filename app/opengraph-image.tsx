import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Pulp — a notebook that turns your hours into trees";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SLICE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="15 15 90 90"><circle cx="60" cy="60" r="42" fill="#F5A623" stroke="#B5751F" stroke-width="6"/><line x1="60" y1="18" x2="60" y2="102" stroke="#B5751F" stroke-width="2.5" opacity=".5"/><line x1="40" y1="22" x2="80" y2="98" stroke="#B5751F" stroke-width="2.5" opacity=".5"/><line x1="80" y1="22" x2="40" y2="98" stroke="#B5751F" stroke-width="2.5" opacity=".5"/><circle cx="60" cy="60" r="5" fill="#B5751F"/></svg>`;

export default async function Image() {
  const [scene, fraunces, ebGaramond] = await Promise.all([
    readFile(join(process.cwd(), "public/landing-terrain.png")),
    readFile(join(process.cwd(), "app/og-assets/Fraunces-400.ttf")),
    readFile(join(process.cwd(), "app/og-assets/EBGaramond-400.ttf")),
  ]);
  const sceneSrc = `data:image/png;base64,${scene.toString("base64")}`;
  const sliceSrc = `data:image/svg+xml;base64,${Buffer.from(SLICE).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sceneSrc} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(9,9,11,0.55) 0%, rgba(9,9,11,0) 30%, rgba(9,9,11,0.15) 60%, rgba(9,9,11,0.85) 100%)",
          }}
        />
        {/* tagline — bottom left */}
        <div
          style={{
            position: "absolute",
            left: 64,
            bottom: 66,
            fontFamily: "EB Garamond",
            fontSize: 34,
            color: "#d4d4d8",
            letterSpacing: 0.5,
          }}
        >
          a notebook that turns your hours into trees
        </div>
        {/* wordmark — bottom right */}
        <div style={{ position: "absolute", right: 64, bottom: 62, display: "flex", alignItems: "center", gap: 11 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sliceSrc} alt="" width={30} height={30} />
          <div style={{ fontFamily: "Fraunces", fontSize: 32, color: "#d97706", letterSpacing: -0.6 }}>pulp</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 400, style: "normal" },
        { name: "EB Garamond", data: ebGaramond, weight: 400, style: "normal" },
      ],
    },
  );
}
