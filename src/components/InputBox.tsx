"use client";
import { useState } from "react";

export default function InputBox({ onSend }: { onSend: (msg: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText("");
      }}
      className="flex gap-2 p-2 border-t"
    >
      <input
        className="flex-1 p-2 border rounded"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe un mensaje..."
      />
      <button className="bg-green-500 text-white px-4 py-2 rounded">
        Enviar
      </button>
    </form>
  );
}
