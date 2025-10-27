export interface LookArticle {
  tipo: string;
  nombre_sugerido: string;
  filtros?: {
    mastercategory?: string;
    subcategory?: string;
    articletype?: string;
    basecolour?: string;
    gender?: string;
    usage?: string;
    season?: string;
  };
  producto?: {
    product_id: number;
    name: string;
    image_url: string;
    category?: string;
  } | null;
};

export interface LookResponse {
  estilo: string
  descripcion_general: string
  articulos?: LookArticle[]
}