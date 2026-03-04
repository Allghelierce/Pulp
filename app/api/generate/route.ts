import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI("AIzaSyCDVk5JEQ-WFz9eICARaLT2Np-wO8zmFaM");

export async function POST(req: Request) {
  try {
    const { rawNotes, persona } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Act as a ${persona}. 
      Convert these notes into a structured JSON object: "${rawNotes}"
      Format:
      {
        "title": "Title",
        "sections": [
          { "header": "Header", "bullets": ["point 1"] }
        ]
      }
      Important: Return ONLY the raw JSON code. No markdown formatting, no backticks.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // This removes any "```json" wrappers the AI might add
    const cleanJson = text.replace(/```json|```/g, "").trim();
    
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error) {
    return NextResponse.json({ 
      title: "Error", 
      sections: [{ header: "Wait!", bullets: ["Make sure your API key is correct."] }] 
    });
  }
}