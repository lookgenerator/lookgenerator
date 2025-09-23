import { User, Bot } from "lucide-react";

type Props = {
  role: "user" | "bot";
  text: string;
  product?: {
    name: string;
    image_url: string;
    category?: string;
    id?: number;
  };
};

export default function Message({ role, text, product }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex items-end gap-2 mb-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300">
          <Bot size={18} />
        </div>
      )}

      <div
        className={`px-4 py-2 rounded-2xl shadow max-w-[75%] ${
          isUser
            ? "bg-green-500 text-white rounded-br-none"
            : "bg-gray-200 text-gray-900 rounded-bl-none dark:bg-gray-700 dark:text-gray-100"
        }`}
      >
        <p>{text}</p>
        {product && (
          <div className="mt-2 text-center">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-32 h-32 object-contain mx-auto mb-2 rounded"
            />
            <p className="font-medium">{product.name}</p>
            {product.category && (
              <p className="text-sm text-gray-600">{product.category}</p>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white">
          <User size={18} />
        </div>
      )}
    </div>
  );
}

