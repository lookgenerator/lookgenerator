type Props = { role: "user" | "bot"; text: string };

export default function Message({ role, text }: Props) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`px-4 py-2 rounded-2xl max-w-[70%] shadow 
        ${isUser ? "bg-green-500 text-white rounded-br-none" : "bg-gray-200 text-gray-900 rounded-bl-none"}`}
      >
        {text}
      </div>
    </div>
  );
}
