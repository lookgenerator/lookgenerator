"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
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
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col w-full max-w-md h-[650px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-green-600 text-white shadow-md dark:bg-green-700">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/0/02/Logo_Corte_Ingl%C3%A9s.svg"
            alt="El Corte Inglés"
            width={40}
            height={40}
            className="rounded"
          />
          <h1 className="text-2xl font-extrabold tracking-tight">
            Asistente Virtual
          </h1>
        </div>

        {/* Chat body */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          {messages.map((m, i) => (
            <Message key={i} role={m.role} text={m.text} />
          ))}
        </div>

        {/* Input */}
        <InputBox onSend={handleSend} />
      </div>
    </div>
  );
}
