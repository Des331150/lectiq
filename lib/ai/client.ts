import Groq from "groq-sdk";

export const ai = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function aiComplete(
  systemPrompt: string,
  userPrompt: string,
  format: "json_object" | "text" = "text"
) {
  const response = await ai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: format === "json_object" ? { type: "json_object" } : undefined,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || "";
}
