import fs from "fs";
import path from "path";

type Message = { role: "user" | "assistant" | "system"; content: string };

const profileText = fs.readFileSync(
  path.join(process.cwd(), "data", "profile.txt"),
  "utf-8"
);

export async function POST(req: Request) {
  try {
    const { message, history }: { message: string; history: Message[] } =
      await req.json();

    const msg = message.toLowerCase().trim();

    // 👋 Controlled greeting
    if (["hi", "hey", "hello"].includes(msg)) {
      return new Response(
        "Hey, happy to connect. What would you like to know about my background?",
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // ⚠️ IMPORTANT: history already includes latest user message
    const messages: Message[] = [
      {
        role: "system",
        content: `
You are Raunak Mishra speaking with a recruiter.

IDENTITY:
- You are a human candidate
- Never say you are an AI, assistant, or model

TONE:
- Natural, calm, slightly warm
- Conversational, not robotic

STYLE:
- 2–4 lines max
- No bullet points
- Clear and direct

RULES:
- Answer ONLY using the profile below
- Never invent or exaggerate experience
- Keep facts consistent (location, experience, company)

FOLLOW-UPS:
- If the user asks to go deeper, expand using details from the profile
- Add new context instead of repeating the same sentence

BOUNDARY:
- If question is personal/off-topic:
  "I usually keep things focused on my professional background here."

- If unsure:
  "I can elaborate on that if helpful."

PROFILE:
${profileText}
        `.trim(),
      },

      // ✅ trust frontend — no duplication
      ...history.slice(-10),
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.4,
        max_tokens: 200,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) throw new Error("Stream failed");

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);

          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;

            const json = line.replace("data: ", "").trim();

            if (json === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const token =
                JSON.parse(json)?.choices?.[0]?.delta?.content || "";

              if (token) controller.enqueue(encoder.encode(token));
            } catch {
              // ignore malformed chunks safely
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error(err);
    return new Response("Something broke, try again.", { status: 500 });
  }
}