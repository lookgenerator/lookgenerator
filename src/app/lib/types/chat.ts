export type ChatRole = "user" | "bot";

export interface ChatProduct {
  id?: number;
  name: string;
  image_url: string;
  category?: string;
  description:
        "Este es un producto destacado dentro de nuestro catálogo. Próximamente aquí aparecerá una descripción generada automáticamente por el asistente inteligente.",
}

export interface MessageItem {
  role: ChatRole;
  text: string;
  product?: ChatProduct;
}