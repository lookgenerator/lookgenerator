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