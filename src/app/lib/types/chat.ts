export type ChatRole = "user" | "bot";

export interface ChatProduct {
  id?: number;
  name: string;
  image_url: string;
  category?: string;
}

export interface MessageItem {
  role: ChatRole;
  text: string;
  product?: ChatProduct;
}