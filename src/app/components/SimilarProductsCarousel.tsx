"use client";
import { useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import type { ChatProduct } from "../lib/types/chat";

export default function SimilarProductsCarousel({ products, onFindSimilar }: { products: ChatProduct[];onFindSimilar?: (product: ChatProduct) => void; }) {
  const autoplay = Autoplay({ delay: 3500, stopOnInteraction: false });
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "center", loop: true, containScroll: "trimSnaps" },
    [autoplay]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // 🧠 Pausar/Reanudar desde eventos globales
  useEffect(() => {
    const handlePause = () => autoplay.stop();
    const handleResume = () => autoplay.play();

    window.addEventListener("pauseCarousel", handlePause);
    window.addEventListener("resumeCarousel", handleResume);

    return () => {
      window.removeEventListener("pauseCarousel", handlePause);
      window.removeEventListener("resumeCarousel", handleResume);
    };
  }, [autoplay]);

  if (!products?.length) {
    return <p className="text-sm text-gray-500">⚠️ No hay productos similares disponibles.</p>;
  }

  return (
    <div className="relative w-full mt-4">
      {/* Carrusel principal */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              className="flex-[0_0_70%] sm:flex-[0_0_40%] md:flex-[0_0_30%] px-3"
              whileHover={{ scale: 1.05, rotateY: 5 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <motion.div
                className="transform perspective"
                initial={{ rotateY: i % 2 === 0 ? -15 : 15, opacity: 0, scale: 0.9 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              >
                <ProductCard product={p} isSimilar={true}  onFindSimilar={onFindSimilar}/>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Botones de navegación */}
      <button
        onClick={scrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-green-500/80 text-green-700 shadow-md"
      >
        ←
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-green-500/80 text-green-700 shadow-md"
      >
        →
      </button>
    </div>
  );
}
