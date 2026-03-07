// app/api/sketch/route.ts
import { NextResponse } from "next/server";

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

if (!HF_TOKEN) {
  console.error("❌ MISSING HUGGINGFACE_API_TOKEN in .env.local");
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    // Use a reliable, free-tier-supported model
    const MODEL = "stabilityai/stable-diffusion-xl-base-1.0";  // or "runwayml/stable-diffusion-v1-5"

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
            num_inference_steps: 20,   // SDXL needs more steps
            guidance_scale: 7.5,
            negative_prompt: "color, photorealistic, blurry, text, logo, watermark, ugly, deformed",
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("HF error:", response.status, errText);
      return NextResponse.json(
        { error: `Hugging Face error: ${response.status} - ${errText}` },
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const url = `data:image/png;base64,${base64}`;

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Generation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}