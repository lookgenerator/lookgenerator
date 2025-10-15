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
        breakpoints={{
  320: { slidesPerView: 1 },
  640: { slidesPerView: 1.3 },
  768: { slidesPerView: 1.6 },
  1024: { slidesPerView: 2 },
}}
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
  /* 🧭 Flechas de navegación más sutiles */
  .swiper-button-next,
  .swiper-button-prev {
    color: rgba(255, 255, 255, 0.6); /* tono suave */
    width: 28px;
    height: 28px;
    transition: all 0.3s ease;
    opacity: 0;
  }

  /* Aparecen al pasar el ratón */
  .swiper:hover .swiper-button-next,
  .swiper:hover .swiper-button-prev {
    opacity: 1;
  }

  /* Efecto hover */
  .swiper-button-next:hover,
  .swiper-button-prev:hover {
    color: #22c55e; /* verde Tailwind */
    transform: scale(1.1);
  }

  /* Sombra ligera para mejor contraste */
  .swiper-button-next::after,
  .swiper-button-prev::after {
    text-shadow: 0 0 6px rgba(0, 0, 0, 0.4);
    font-size: 22px;
  }

  /* Ajuste de posición para evitar solaparse con las cards */
  .swiper-button-next {
    right: 6px;
  }
  .swiper-button-prev {
    left: 6px;
  }

  /* Mantiene los puntos más abajo */
  .swiper-pagination {
    bottom: -254px !important;
  }
`}</style>

    </div>
  );
}