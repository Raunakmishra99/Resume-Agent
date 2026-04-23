"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

function getTime() {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-[5px] px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[6px] h-[6px] rounded-full bg-indigo-500 block animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const userTime = getTime();
    setInput("");
    setLoading(true);

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setTimestamps((prev) => [...prev, userTime, ""]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: newMessages }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: fullText };
          return updated;
        });
      }

      const aiTime = getTime();
      setTimestamps((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = aiTime;
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Something went wrong." };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0f] text-white">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-[#0d0d14] border-b border-[#1e1e2e] flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
          RM
        </div>
        <div>
          <p className="text-sm font-semibold text-[#f1f0ff]">Raunak Mishra</p>
          <p className="text-[11px] text-[#6b7280] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Active now
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-[#1e1e2e]">
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={i}
              className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              style={{ animation: "fadeUp 0.25s ease" }}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                  RM
                </div>
              )}
              <div className={`flex flex-col gap-1 max-w-[72%] ${isUser ? "items-end" : "items-start"}`}>
                {msg.content === "" && !isUser ? (
                  <div className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl rounded-bl-sm">
                    <TypingDots />
                  </div>
                ) : (
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed break-words ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-[#16161f] text-[#e4e4f0] border border-[#1e1e2e] rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                )}
                {timestamps[i] && (
                  <span className="text-[10px] text-[#3d3d52] px-1">{timestamps[i]}</span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-[#0d0d14] border-t border-[#1e1e2e] flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#16161f] border border-[#252535] rounded-xl px-4 py-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask something…"
            className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-[#e4e4f0] placeholder:text-[#3d3d52] py-2"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}