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
      className="flex gap-2 p-3 border-t bg-white dark:bg-gray-800 dark:border-gray-700 sticky bottom-0"
    >
      <input
        className="flex-1 p-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe un mensaje..."
      />
      <button
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition"
      >
        ➤
      </button>
    </form>
  );
}
