"use client";
import { useState } from "react";
import Message from "./Message";
import InputBox from "./InputBox";

export default function Chat() {
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);

  const handleSend = (msg: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: msg },
      { role: "bot", text: "Respuesta simulada" },
    ]);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <Message key={i} role={m.role} text={m.text} />
        ))}
      </div>
      <InputBox onSend={handleSend} />
    </div>
  );
}
