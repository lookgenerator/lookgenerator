export type ChatRole = "user" | "bot";

export interface ChatProduct {
  id: number;
  name: string;
  image_url: string;
  category?: string;
  description?:string;
  score?: number;
}

export interface MessageItem {
  role: ChatRole;
  text: string;
  product?: ChatProduct;
  products?: ChatProduct[];
}