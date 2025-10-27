export interface LookArticle {
  tipo: string
  nombre_sugerido: string
  filtros?: {
    mastercategory?: string
    subcategory?: string
    articletype?: string
    basecolour?: string
    gender?: string
    usage?: string
    season?: string
  }
}

export interface LookResponse {
  estilo: string
  descripcion_general: string
  articulos?: LookArticle[]
}