// app/api/sketch/route.ts
import { NextResponse } from "next/server";
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit";

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const MAX_PROMPT_LENGTH = 500;

if (!HF_TOKEN) {
  console.error("❌ MISSING HUGGINGFACE_API_TOKEN in .env.local");
}

export async function POST(req: Request) {
  try {
    // Rate limiting - sketch is expensive
    const key = getRateLimitKey(req);
    if (!checkRateLimit(key, { windowMs: 60000, maxRequests: 10 })) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt provided" }, { status: 400 });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH}` },
        { status: 400 }
      );
    }

    // Use a reliable, free-tier-supported model
    const MODEL = "stabilityai/stable-diffusion-xl-base-1.0";

    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `simple minimalist black and white hand-drawn pencil sketch of ${prompt}, notebook doodle style, clean lines, white background, line art, no color, no shading, no text, no watermark`,
          parameters: {
            num_inference_steps: 20,
            guidance_scale: 7.5,
            negative_prompt: "color, photorealistic, blurry, text, logo, watermark, ugly, deformed",
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("HF error:", response.status);
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const url = `data:image/png;base64,${base64}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}