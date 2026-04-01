// Test script to verify Groq API
const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function testGroqAPI() {
  console.log("Testing Groq API...");
  console.log(`API Key: ${GROQ_API_KEY.slice(0, 20)}...`);
  console.log(`URL: ${GROQ_API_URL}`);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gemma-7b-it",
        max_tokens: 100,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "You are a helpful writing assistant. Be concise.",
          },
          {
            role: "user",
            content: "Test: Make this text shorter: 'The quick brown fox jumps over the lazy dog'",
          },
        ],
      }),
    });

    console.log(`\nResponse Status: ${response.status} ${response.statusText}`);
    const data = await response.json();

    if (response.ok) {
      console.log("✅ API Request Successful!");
      console.log(`Response:`, data.choices?.[0]?.message?.content || "No content");
    } else {
      console.log("❌ API Error:");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testGroqAPI();
