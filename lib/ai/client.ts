const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "openrouter/free";

export async function aiComplete(
  systemPrompt: string,
  userPrompt: string,
  _format: "json_object" | "text" = "text"
) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error("AI returned empty response");
  }
  return content;
}
