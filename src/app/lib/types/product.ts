export interface ProductSingle {
  product_id: number;
  name: string;
  category: string;
  image_url: string;
}

export interface ProductNeighbor {
  product_id: number;
  name: string;
  image_url: string;
  score: number;
}

export interface SimilarProductsResponse {
  base_product: {
    product_id: number;
    name: string;
    image_url: string;
  };
  neighbors: ProductNeighbor[];
}

export interface ProductFilter {
  product_id: number;
  name: string;
  category: string;
  image_url: string;
  gender: string;
  mastercategory: string;
  subcategory: string;
  articletype: string;
  basecolour: string;
  season: string;
  year: number;
  usage: string;
}

export interface DistinctValues {
  column: string;
  values: string[];
}

export interface SimilarProductsResponse {
  base_product: {
    product_id: number;
    name: string;
    image_url: string;
  };
  neighbors: ProductNeighbor[];
}