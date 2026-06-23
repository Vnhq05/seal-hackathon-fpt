"use client";

import { useState, useRef, useEffect } from "react";
import { useChatMessages, useSendMessage } from "@/features/teams/hooks/use-mentor-chat";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, outline: "none", flex: 1,
};

export function MentorHubPage({ eventId, teamId }: { eventId: string; teamId: string }) {
  const { data: messages = [], isLoading } = useChatMessages(eventId, teamId);
  const { mutate: send, isPending } = useSendMessage(eventId, teamId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    send(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528", marginBottom: 16 }}>MentorHub</h1>

      <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ height: 480, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {isLoading && (
            <p style={{ fontSize: 14, color: "#8891a5", textAlign: "center", padding: 32 }}>Loading messages...</p>
          )}

          {!isLoading && messages.length === 0 && (
            <p style={{ fontSize: 14, color: "#8891a5", textAlign: "center", padding: 32 }}>
              No messages yet. Start a conversation with your mentor!
            </p>
          )}

          {messages.map((msg) => (
            <div key={msg.id} style={{ maxWidth: "75%" }}>
              <div style={{
                backgroundColor: "#f0f9ff",
                borderRadius: 12,
                padding: "10px 14px",
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#0284c7", marginBottom: 4 }}>{msg.senderName}</p>
                <p style={{ fontSize: 14, color: "#0e1528", lineHeight: "20px" }}>{msg.message}</p>
                <p style={{ fontSize: 11, color: "#8891a5", marginTop: 4 }}>
                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div style={{ borderTop: "1px solid rgba(223,226,236,0.5)", padding: 12, display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={inputStyle}
            placeholder="Type a message..."
            disabled={isPending}
          />
          <button
            onClick={handleSend}
            disabled={isPending || !input.trim()}
            style={{
              backgroundColor: "#38bdf8", color: "#fff", padding: "10px 20px", borderRadius: 8,
              border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
              opacity: isPending || !input.trim() ? 0.6 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
