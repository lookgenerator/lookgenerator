import { User, Bot } from "lucide-react";

type Props = { role: "user" | "bot"; text: string };

export default function Message({ role, text }: Props) {
  const isUser = role === "user";
  return (
    <div className={`flex items-end gap-2 mb-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300">
          <Bot size={18} />
        </div>
      )}
      <div
        className={`px-4 py-2 rounded-2xl max-w-[70%] shadow ${
          isUser
            ? "bg-green-500 text-white rounded-br-none"
            : "bg-gray-200 text-gray-900 rounded-bl-none dark:bg-gray-700 dark:text-gray-100"
        }`}
      >
        {text}
      </div>
      {isUser && (
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white">
          <User size={18} />
        </div>
      )}
    </div>
  );
}
