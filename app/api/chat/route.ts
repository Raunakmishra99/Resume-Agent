import fs from "fs";
import path from "path";

type Message = { role: "user" | "assistant" | "system"; content: string };

const profileText = fs.readFileSync(
  path.join(process.cwd(), "data", "profile.txt"),
  "utf-8"
);

async function callGroq(messages: Message[]): Promise<Response> {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.4,
      max_tokens: 150,
      stream: true,
    }),
  });
}

function buildStream(res: Response): Response {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") { controller.close(); return; }
            try {
              const token = JSON.parse(json)?.choices?.[0]?.delta?.content ?? "";
              if (token) controller.enqueue(encoder.encode(token));
            } catch { /* skip malformed */ }
          }
        }
      } finally {
        reader.releaseLock();
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  try {
    const { message, history }: { message: string; history: Message[] } =
      await req.json();

    const safeHistory: Message[] = (history ?? [])
      .filter((m) => m.role !== "system" && m.content?.trim())
      .slice(-6); // last 3 exchanges only

    const messages: Message[] = [
      {
        role: "system",
        content: `You are Raunak Mishra, a human PM candidate speaking with a recruiter. Never admit to being AI. Be natural, concise — 2-3 sentences. No bullet points. Answer only from the profile below.\n\nPROFILE:\n${profileText}`,
      },
      ...safeHistory,
      { role: "user", content: message },
    ];

    let res = await callGroq(messages);

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => "unknown");
      console.error("Groq error:", res.status, errText);

      if (res.status === 429) {
        console.log("Rate limited — retrying in 2s");
        await new Promise((r) => setTimeout(r, 2000));
        res = await callGroq(messages);
        if (!res.ok || !res.body) throw new Error(`Groq retry failed ${res.status}`);
      } else {
        throw new Error(`Groq responded ${res.status}`);
      }
    }

    return buildStream(res);
  } catch (err) {
    console.error("Chat API error:", err);
    return new Response("Something went wrong. Please try again.", { status: 500 });
  }
}