import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaXmark } from "react-icons/fa6";

// Importamos la base de datos de imágenes unificada
import { bentoGalleryMoments as MOMENTS } from "../data/siteData"; // Revisa que la ruta apunte correctamente a tu siteData

// Patrón cíclico para las columnas del diseño Bento (en base a un grid de 6 columnas en desktop)
const GRID_SPANS = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-2",
  "md:col-span-2",
  "md:col-span-3 md:row-span-2",
  "md:col-span-2",
  "md:col-span-2",
  "md:col-span-2",
  "md:col-span-3",
];

export default function MomentsGallery() {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % MOMENTS.length);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + MOMENTS.length) % MOMENTS.length);
  };

  return (
    <div className="space-y-8">
      {/* Grid Gallery - Bento Layout Dinámico */}
      <div className="grid auto-rows-[160px] gap-4 md:auto-rows-[180px] md:gap-5 md:grid-cols-6">
        {MOMENTS.map((item, index) => {
          // El operador modular (%) asegura que las proporciones del Bento se repitan cíclicamente
          const spanClass = GRID_SPANS[index % GRID_SPANS.length];

          return (
            <motion.div
              key={`${item.caption}-${index}`}
              className={`group relative overflow-hidden rounded-[1.5rem] cursor-pointer ${spanClass} gallery-grid-item`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.4, delay: (index % 8) * 0.04 }}
              onClick={() => setSelectedIndex(index)}
              whileHover={{ scale: 1.02 }}
            >
              <img
                src={item.src}
                alt={item.alt}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Hover Info */}
              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 z-10">
                <p className="text-xs sm:text-sm font-semibold text-white line-clamp-2">
                  {item.caption}
                </p>
              </div>

              {/* Play / Ver Icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="rounded-full bg-white/20 backdrop-blur-sm p-3">
                  <svg
                    width="20"
                    height="20"
                    fill="white"
                    viewBox="0 0 24 24"
                    className="drop-shadow"
                  >
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox Integrado */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
          >
            <motion.div
              className="relative w-full max-w-5xl max-h-[85vh] rounded-[2.2rem] overflow-hidden bg-black border border-white/10 lightbox-glow"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Contenedor de la Imagen */}
              <div className="relative w-full pt-[60%] overflow-hidden bg-gradient-to-b from-black/10 to-black">
                <img
                  src={MOMENTS[selectedIndex].src}
                  alt={MOMENTS[selectedIndex].alt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              {/* Controles e Información Inferior */}
              <div className="p-6 space-y-4 bg-gradient-to-t from-black via-black/90 to-black/40 backdrop-blur-sm">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-base sm:text-lg font-bold text-white">
                      {MOMENTS[selectedIndex].caption}
                    </p>
                    <p className="text-xs sm:text-sm text-white/50 mt-1">
                      Fotografía {selectedIndex + 1} de {MOMENTS.length} · Campus Toluca II
                    </p>
                  </div>
                </div>

                {/* Barra de Progreso y Botones de Acción */}
                <div className="flex items-center gap-4 flex-wrap pt-2">
                  <button
                    onClick={handlePrev}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white border border-white/10"
                    aria-label="Anterior"
                  >
                    <FaChevronLeft size={18} />
                  </button>

                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[var(--accent)]"
                      initial={{ width: "0%" }}
                      animate={{ width: `${((selectedIndex + 1) / MOMENTS.length) * 100}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>

                  <button
                    onClick={handleNext}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white border border-white/10"
                    aria-label="Siguiente"
                  >
                    <FaChevronRight size={18} />
                  </button>

                  <button
                    onClick={() => setSelectedIndex(null)}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20 ml-2"
                    aria-label="Cerrar"
                  >
                    <FaXmark size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
