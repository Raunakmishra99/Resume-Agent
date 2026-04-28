"use client";
 
import { useState, useRef, useEffect, useCallback } from "react";
 
type Message = {
  role: "user" | "assistant";
  content: string;
};
 
const STORAGE_KEY = "chat_history_session";
 
const SUGGESTED_PROMPTS = [
  { icon: "🚀", label: "Walk me through the Osto case study" },
  { icon: "🤖", label: "How do you approach agentic AI?" },
  { icon: "📊", label: "What are your key product metrics?" },
  { icon: "⚡", label: "What's your biggest achievement?" },
];
 
function getTime() {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}
 
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;
 
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={key++} style={{
          fontSize: "12px", fontWeight: 700, color: "#a78bfa",
          textTransform: "uppercase", letterSpacing: "0.08em",
          marginTop: "12px", marginBottom: "4px",
          fontFamily: "'Space Mono', monospace",
        }}>
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h2 key={key++} style={{
          fontSize: "14px", fontWeight: 700, color: "#c4b5fd",
          marginTop: "8px", marginBottom: "4px",
        }}>
          {line.slice(2)}
        </h2>
      );
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.slice(2);
      elements.push(
        <div key={key++} style={{ display: "flex", gap: "8px", marginTop: "3px", alignItems: "flex-start" }}>
          <span style={{ color: "#7c3aed", marginTop: "1px", flexShrink: 0, fontSize: "10px" }}>◆</span>
          <span style={{ fontSize: "13px", lineHeight: "1.6", color: "#d4d4f0" }}>{renderInline(content)}</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: "4px" }} />);
    } else {
      elements.push(
        <p key={key++} style={{ fontSize: "13px", lineHeight: "1.65", color: "#d4d4f0", margin: "2px 0" }}>
          {renderInline(line)}
        </p>
      );
    }
  }
  return elements;
}
 
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "#e2e0ff", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
 
function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "10px 14px" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: "5px", height: "5px", borderRadius: "50%",
          background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
          display: "block",
          animation: "bounce 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}
 
type Particle = { w: number; h: number; left: number; top: number; opacity: number; dur: number; delay: number; color: string };
 
function Particles() {
  const [particles, setParticles] = useState<Particle[]>([]);
 
  useEffect(() => {
    const colors = ["#7c3aed", "#a78bfa", "#6366f1"];
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        w: Math.random() * 3 + 1,
        h: Math.random() * 3 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        opacity: Math.random() * 0.4 + 0.1,
        dur: Math.random() * 8 + 6,
        delay: Math.random() * 5,
        color: colors[i % 3],
      }))
    );
  }, []);
 
  if (particles.length === 0) return null;
 
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          width: `${p.w}px`, height: `${p.h}px`,
          borderRadius: "50%", background: p.color,
          left: `${p.left}%`, top: `${p.top}%`,
          opacity: p.opacity,
          animation: `float ${p.dur}s ease-in-out infinite`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  );
}
 
export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadPulsing, setDownloadPulsing] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
 
 
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { messages: msgs, timestamps: ts } = JSON.parse(saved);
        setMessages(msgs);
        setTimestamps(ts);
      }
    } catch { /* ignore */ }
  }, []);
 
  useEffect(() => {
    const complete = messages.filter((m) => m.content !== "");
    if (complete.length === 0) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: complete, timestamps }));
    } catch { /* ignore */ }
  }, [messages, timestamps]);
 
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
 
  const newChat = () => {
    setMessages([]);
    setTimestamps([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };
 
  const downloadResume = () => {
    setDownloadPulsing(true);
    setTimeout(() => setDownloadPulsing(false), 1000);
    const link = document.createElement("a");
    link.href = "/resume.pdf";
    link.download = "Raunak_Mishra_Resume.pdf";
    link.click();
  };
 
  const sendMessage = useCallback(async (messageText?: string) => {
    const userMessage = (messageText ?? input).trim();
    if (!userMessage || loading) return;
 
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
    } catch (e) {
      console.error(e);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Something went wrong. Please try again." };
        return updated;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages]);
 
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
 
  const hasMessages = messages.length > 0;
 
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      maxHeight: "100vh",
      background: "#050508",
      color: "white",
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: "relative",
      overflow: "clip",
    }}>
 
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "-20%", left: "50%",
        transform: "translateX(-50%)", width: "600px", height: "400px",
        background: "radial-gradient(ellipse, rgba(109,40,217,0.15) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", right: "-10%",
        width: "400px", height: "400px",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <Particles />
 
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 20px",
        background: "rgba(10,10,20,0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(124,58,237,0.2)",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            position: "absolute", inset: "-3px", borderRadius: "50%",
            background: "conic-gradient(from 0deg, #7c3aed, #a78bfa, #6366f1, #7c3aed)",
            animation: "spin 4s linear infinite", opacity: 0.8,
          }} />
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "linear-gradient(135deg, #4c1d95, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 700, position: "relative",
            border: "2px solid #050508", letterSpacing: "0.5px",
            fontFamily: "'Space Mono', monospace",
          }}>
            RM
          </div>
        </div>
 
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#f0eeff", letterSpacing: "-0.01em" }}>
            Raunak Mishra
          </div>
          <div style={{ fontSize: "11px", color: "#6b7280", display: "flex", alignItems: "center", gap: "5px", marginTop: "1px" }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e",
              display: "inline-block", boxShadow: "0 0 6px #22c55e",
              animation: "pulse 2s ease-in-out infinite",
            }} />
            Product Manager · Available now
          </div>
        </div>
 
        <button
          onClick={downloadResume}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 12px", borderRadius: "10px",
            background: downloadPulsing ? "linear-gradient(135deg, #7c3aed, #6366f1)" : "rgba(124,58,237,0.15)",
            border: "1px solid rgba(124,58,237,0.4)",
            color: "#a78bfa", fontSize: "11px", fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s ease",
            letterSpacing: "0.02em", flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.3)";
            (e.currentTarget as HTMLButtonElement).style.color = "#c4b5fd";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.15)";
            (e.currentTarget as HTMLButtonElement).style.color = "#a78bfa";
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Resume
        </button>
 
        <button
          onClick={newChat}
          style={{
            display: "flex", alignItems: "center", gap: "4px",
            padding: "7px 10px", borderRadius: "10px",
            background: "transparent", border: "1px solid rgba(255,255,255,0.06)",
            color: "#4b5563", fontSize: "11px", fontWeight: 500,
            cursor: "pointer", transition: "all 0.2s ease", flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#4b5563";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New
        </button>
      </div>
 
      {/* Messages */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        position: "relative",
        zIndex: 1,
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(124,58,237,0.3) transparent",
      }}>
 
        {!hasMessages && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "40px 16px", gap: "24px",
            animation: "fadeUp 0.5s ease",
          }}>
            <div style={{ textAlign: "center", maxWidth: "320px" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "linear-gradient(135deg, #4c1d95, #7c3aed, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px", fontWeight: 700,
                margin: "0 auto 16px",
                boxShadow: "0 0 40px rgba(124,58,237,0.4)",
                fontFamily: "'Space Mono', monospace", letterSpacing: "1px",
              }}>
                RM
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f0eeff", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
                Ask me anything
              </h2>
              <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.7", margin: 0 }}>
                I'm a Product Manager with ~3 years of experience.<br />Ask me about my work, projects, or background.
              </p>
            </div>
 
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", maxWidth: "340px" }}>
              {[
                { val: "200+", label: "Endpoints" },
                { val: "40→15m", label: "Onboarding" },
                { val: "4mo", label: "MVP" },
                { val: "3 yrs", label: "Experience" },
              ].map((m) => (
                <div key={m.val} style={{
                  background: "rgba(124,58,237,0.1)",
                  border: "1px solid rgba(124,58,237,0.25)",
                  borderRadius: "8px", padding: "6px 12px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "1px",
                }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#a78bfa", fontFamily: "'Space Mono', monospace" }}>{m.val}</span>
                  <span style={{ fontSize: "9px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.label}</span>
                </div>
              ))}
            </div>
 
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "360px" }}>
              <p style={{ fontSize: "11px", color: "#374151", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
                Suggested questions
              </p>
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.label)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "11px 14px",
                    background: "rgba(15,15,25,0.8)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px", color: "#9ca3af",
                    fontSize: "13px", cursor: "pointer",
                    textAlign: "left", transition: "all 0.2s ease", width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = "rgba(124,58,237,0.1)";
                    b.style.borderColor = "rgba(124,58,237,0.3)";
                    b.style.color = "#c4b5fd";
                  }}
                  onMouseLeave={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = "rgba(15,15,25,0.8)";
                    b.style.borderColor = "rgba(255,255,255,0.06)";
                    b.style.color = "#9ca3af";
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{p.icon}</span>
                  <span>{p.label}</span>
                  <svg style={{ marginLeft: "auto", opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
 
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          const hasMarkdown = !isUser && (msg.content.includes("##") || msg.content.includes("**") || msg.content.includes("\n- "));
 
          return (
            <div key={i} style={{
              display: "flex",
              flexDirection: isUser ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: "8px",
              marginBottom: "10px",
              animation: "fadeUp 0.25s ease",
            }}>
              {!isUser && (
                <div style={{
                  width: "26px", height: "26px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #4c1d95, #7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "8px", fontWeight: 700, flexShrink: 0,
                  marginBottom: "18px",
                  fontFamily: "'Space Mono', monospace",
                  boxShadow: "0 0 12px rgba(124,58,237,0.3)",
                }}>
                  RM
                </div>
              )}
 
              <div style={{
                display: "flex", flexDirection: "column", gap: "4px",
                alignItems: isUser ? "flex-end" : "flex-start",
                maxWidth: "78%",
              }}>
                {msg.content === "" && !isUser ? (
                  <div style={{
                    background: "rgba(18,18,30,0.95)",
                    border: "1px solid rgba(124,58,237,0.2)",
                    borderRadius: "16px", borderBottomLeftRadius: "4px",
                  }}>
                    <TypingDots />
                  </div>
                ) : (
                  <div style={{
                    padding: hasMarkdown ? "14px 16px" : "10px 14px",
                    borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                    background: isUser ? "linear-gradient(135deg, #6d28d9, #5b21b6)" : "rgba(18,18,30,0.95)",
                    border: isUser ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(124,58,237,0.15)",
                    boxShadow: isUser ? "0 4px 20px rgba(109,40,217,0.25)" : "0 2px 12px rgba(0,0,0,0.3)",
                    wordBreak: "break-word",
                  }}>
                    {isUser ? (
                      <span style={{ fontSize: "13.5px", color: "#f0eeff", lineHeight: "1.6" }}>
                        {msg.content}
                      </span>
                    ) : hasMarkdown ? (
                      <div>{renderMarkdown(msg.content)}</div>
                    ) : (
                      <span style={{ fontSize: "13.5px", color: "#d4d4f0", lineHeight: "1.65" }}>
                        {msg.content}
                      </span>
                    )}
                  </div>
                )}
                {timestamps[i] && (
                  <span style={{ fontSize: "10px", color: "#2d2d40", paddingLeft: "2px" }}>
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
      <div style={{
        padding: "12px 16px 16px",
        background: "rgba(8,8,16,0.9)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(124,58,237,0.15)",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: "10px",
          background: "rgba(18,18,30,0.9)",
          border: "1px solid rgba(124,58,237,0.25)",
          borderRadius: "16px", padding: "10px 14px",
          transition: "all 0.2s ease",
        }}
          onFocusCapture={(e) => {
            const c = e.currentTarget as HTMLDivElement;
            c.style.borderColor = "rgba(124,58,237,0.6)";
            c.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
          }}
          onBlurCapture={(e) => {
            const c = e.currentTarget as HTMLDivElement;
            c.style.borderColor = "rgba(124,58,237,0.25)";
            c.style.boxShadow = "none";
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about my experience, skills, or projects…"
            rows={1}
            style={{
              flex: 1, background: "transparent",
              border: "none", outline: "none",
              color: "#e4e4f0", fontSize: "13.5px",
              lineHeight: "1.6", resize: "none", overflow: "hidden",
              padding: "2px 0", fontFamily: "inherit",
              minHeight: "22px", maxHeight: "120px",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: "34px", height: "34px", borderRadius: "10px",
              background: loading || !input.trim() ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg, #7c3aed, #6366f1)",
              border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.2s ease",
              boxShadow: loading || !input.trim() ? "none" : "0 4px 14px rgba(124,58,237,0.4)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p style={{
          textAlign: "center", fontSize: "10px", color: "#1f1f2e",
          marginTop: "8px", letterSpacing: "0.03em",
        }}>
          Powered by AI · All responses reflect Raunak's actual background
        </p>
      </div>
 
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-15px) translateX(8px); }
          66% { transform: translateY(8px) translateX(-8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #22c55e; }
          50% { opacity: 0.6; box-shadow: 0 0 12px #22c55e; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 2px; }
        textarea::placeholder { color: #374151; }
        textarea { scrollbar-width: none; }
        textarea::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}