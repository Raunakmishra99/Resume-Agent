"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const STORAGE_KEY = "chat_history_v1";

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

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { messages: msgs, timestamps: ts } = JSON.parse(saved);
        setMessages(msgs);
        setTimestamps(ts);
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  // Persist to localStorage whenever messages change
  useEffect(() => {
    const complete = messages.filter((m) => m.content !== "");
    if (complete.length === 0) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages: complete, timestamps })
      );
    } catch {
      // ignore quota errors
    }
  }, [messages, timestamps]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const newChat = () => {
    setMessages([]);
    setTimestamps([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const userTime = getTime();
    setInput("");
    setLoading(true);

    const completedHistory: Message[] = messages
      .filter((m) => m.content !== "")
      .concat({ role: "user", content: userMessage });

    setMessages((prev) =>
      prev
        .filter((m) => m.content !== "")
        .concat(
          { role: "user", content: userMessage },
          { role: "assistant", content: "" }
        )
    );
    setTimestamps((prev) => [...prev, userTime, ""]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: completedHistory.slice(0, -1),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullText,
          };
          return updated;
        });
      }

      const aiTime = getTime();
      setTimestamps((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = aiTime;
        return updated;
      });
    } catch (e) {
      console.error(e);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col bg-[#0a0a0f] text-white"
      style={{ height: "100dvh" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 bg-[#0d0d14] border-b border-[#1e1e2e] flex-shrink-0"
        style={{
          paddingTop: "max(14px, env(safe-area-inset-top))",
          paddingBottom: "14px",
        }}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
          RM
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#f1f0ff]">Raunak Mishra</p>
          <p className="text-[11px] text-[#6b7280] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Active now
          </p>
        </div>
        <button
          onClick={newChat}
          title="New Chat"
          className="flex items-center gap-1.5 text-[11px] text-[#3d3d52] hover:text-[#a0a0c0] transition-colors px-2 py-1 rounded-lg hover:bg-[#1e1e2e]"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 h-full py-16 select-none">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-semibold">
              RM
            </div>
            <div className="text-center">
              <p className="text-[14px] font-medium text-[#6b6b8a] mb-1">
                Raunak Mishra
              </p>
              <p className="text-[12px] text-[#3d3d52] max-w-[220px] leading-relaxed">
                Ask me anything about my background, experience, or skills.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={i}
              className={`flex items-end gap-2 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
              style={{ animation: "fadeUp 0.25s ease" }}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                  RM
                </div>
              )}
              <div
                className={`flex flex-col gap-1 ${
                  isUser ? "items-end" : "items-start"
                }`}
                style={{ maxWidth: "72%" }}
              >
                {msg.content === "" && !isUser ? (
                  <div className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl rounded-bl-sm">
                    <TypingDots />
                  </div>
                ) : (
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed break-words whitespace-pre-wrap ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-[#16161f] text-[#e4e4f0] border border-[#1e1e2e] rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                )}
                {timestamps[i] && (
                  <span className="text-[10px] text-[#3d3d52] px-1">
                    {timestamps[i]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 bg-[#0d0d14] border-t border-[#1e1e2e] flex-shrink-0"
        style={{
          paddingTop: "12px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-center gap-2 bg-[#16161f] border border-[#252535] rounded-xl px-4 py-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask something…"
            className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-[#e4e4f0] placeholder:text-[#3d3d52] py-2 min-w-0"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center flex-shrink-0"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-[#2a2a3a] mt-2">
          Powered by AI · Responses reflect Raunak's actual background
        </p>
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