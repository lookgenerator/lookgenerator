"use client";
import { useState, useRef, useEffect } from "react";
import Message from "./Message";
import InputBox from "./InputBox";

export default function Chat() {
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  const handleSend = (msg: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: msg },
      { role: "bot", text: "Respuesta simulada" },
    ]);
  };

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="flex flex-col w-full max-w-md h-[600px] bg-white rounded-2xl shadow-lg overflow-hidden">
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <Message key={i} role={m.role} text={m.text} />
          ))}
        </div>
        <InputBox onSend={handleSend} />
      </div>
    </div>
  );
}
