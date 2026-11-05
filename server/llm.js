const Groq = require("groq-sdk");

let groq;

async function generateText(prompt) {
  if (typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt must be a non-empty string");
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
  });

  const text = completion.choices[0]?.message?.content;

  if (typeof text !== "string") {
    throw new Error("Groq returned no text");
  }

  return text;
}

module.exports = generateText;