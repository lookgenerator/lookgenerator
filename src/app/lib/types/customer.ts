export interface Product {
  product_id: number;
  name: string;
  image_url: string;
}

export interface Customer {
  customer_id: string;
  first_name: string;
  last_name: string;
  products: Product[];
}
