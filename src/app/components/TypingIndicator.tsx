// src/app/components/TypingIndicator.tsx
"use client";

export default function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center">
      <span className="w-2.5 h-2.5 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce"></span>
      <span className="w-2.5 h-2.5 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]"></span>
      <span className="w-2.5 h-2.5 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]"></span>
    </div>
  );
}
