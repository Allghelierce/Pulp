"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const btn = document.getElementById("generateBtn") as HTMLButtonElement;
    const textarea = document.getElementById("notesInput") as HTMLTextAreaElement;
    const canvas = document.getElementById("notesCanvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set handwriting font
    ctx.font = "24px 'Patrick Hand', cursive";
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "top";

    btn.addEventListener("click", () => {
      const text = textarea.value;
      ctx.clearRect(0, 0, canvas.width, canvas.height); // clear previous

      const lines = text.split("\n");
      let y = 20;
      for (let line of lines) {
        ctx.fillText(line, 20, y);
        y += 30; // line spacing
      }
    });
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-10">
      <h1 className="text-3xl font-bold mb-6 text-black">
        Handwritten Notes Generator
      </h1>

      <textarea
        id="notesInput"
        className="w-full max-w-3xl h-64 p-4 border rounded-lg shadow-sm text-black"
        placeholder="Paste your Google Docs notes here..."
      />

      <button
        id="generateBtn"
        className="mt-6 px-6 py-3 bg-black text-white rounded-lg"
      >
        Generate Notes
      </button>

      <canvas
        id="notesCanvas"
        className="mt-6 border rounded-lg shadow-md"
        width={800}
        height={600}
      ></canvas>
    </main>
  );
}