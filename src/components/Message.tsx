type Props = { role: "user" | "bot"; text: string };

export default function Message({ role, text }: Props) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`px-3 py-2 rounded-lg max-w-xs ${
          isUser ? "bg-green-500 text-white" : "bg-gray-200 text-black"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
