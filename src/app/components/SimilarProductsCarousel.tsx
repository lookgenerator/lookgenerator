"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, EffectCoverflow } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";

import ProductCard from "./ProductCard";
import type { ChatProduct } from "../lib/types/chat";

export default function SimilarProductsCarousel({ products }: { products: ChatProduct[] }) {
  if (!products || products.length === 0) {
    return <p className="text-sm text-gray-500">⚠️ No hay productos similares disponibles.</p>;
  }

  return (
    <div className="w-full">
      <Swiper
        modules={[Navigation, Pagination, EffectCoverflow]}
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={1.5}
        navigation
        pagination={{ clickable: true }}
        coverflowEffect={{
          rotate: 30,   // ángulo de rotación de las tarjetas
          stretch: 0,   // separación entre ellas
          depth: 100,   // profundidad 3D
          modifier: 1,  // intensidad del efecto
          slideShadows: true, // sombras
        }}
        className="py-6"
      >
        {products.map((p) => (
          <SwiperSlide
            key={p.id}
            className="w-56 flex justify-center" // ancho fijo para cada card
          >
            <ProductCard product={p} />
          </SwiperSlide>
        ))}
      </Swiper>
      <style jsx global>{`
  .swiper-pagination {
    bottom: -254px !important; /* desplaza los puntitos hacia abajo */
  }
`}</style>
    </div>
  );
}