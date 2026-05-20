import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaXmark } from "react-icons/fa6";
import cecytemAlumnos1 from "../imagenes/cecytem alumnos.jpeg";
import cecytemAlumnos2 from "../imagenes/cecytem alumnos 1.1.jpeg";
import cecytem1 from "../imagenes/cecytem 1.2.jpeg";
import cecytem2 from "../imagenes/cecytem 1.3.jpeg";
import cecytem3 from "../imagenes/cecytem 1.4.jpeg";
import cecytem4 from "../imagenes/Cecytem 1.5.jpeg";
import cecytem5 from "../imagenes/cecytem 1.6.jpeg";
import cecytem6 from "../imagenes/cecytem 1.7.jpeg";

const MOMENTS = [
  {
    src: cecytemAlumnos1,
    caption: "Momentos de aprendizaje en el campus",
    alt: "Estudiantes en actividad",
  },
  {
    src: cecytemAlumnos2,
    caption: "Vida estudiantil CECyTEM",
    alt: "Actividad de alumnos",
  },
  {
    src: cecytem1,
    caption: "Campus CECyTEM Toluca II",
    alt: "Instalaciones del plantel",
  },
  {
    src: cecytem2,
    caption: "Espacios académicos",
    alt: "Área del campus",
  },
  {
    src: cecytem3,
    caption: "Ambiente de trabajo colaborativo",
    alt: "Estudiantes colaborando",
  },
  {
    src: cecytem4,
    caption: "Desarrollo de habilidades técnicas",
    alt: "Actividad técnica",
  },
  {
    src: cecytem5,
    caption: "Formación integral del estudiante",
    alt: "Experiencia educativa",
  },
  {
    src: cecytem6,
    caption: "Innovación en el aula",
    alt: "Proyecto estudiantil",
  },
];

export default function MomentsGallery() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % MOMENTS.length);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + MOMENTS.length) % MOMENTS.length);
  };

  const gridItems = [
    { span: "md:col-span-2 md:row-span-2", index: 0 },
    { span: "md:col-span-2", index: 1 },
    { span: "md:col-span-2", index: 2 },
    { span: "md:col-span-3 md:row-span-2", index: 3 },
    { span: "md:col-span-2", index: 4 },
    { span: "md:col-span-2", index: 5 },
    { span: "md:col-span-2", index: 6 },
    { span: "md:col-span-3", index: 7 },
  ];

  return (
    <div className="space-y-8">
      {/* Grid Gallery */}
      <div className="grid auto-rows-[160px] gap-4 md:auto-rows-[180px] md:gap-5 md:grid-cols-6">
        {gridItems.map((item) => (
          <motion.div
            key={MOMENTS[item.index].caption}
            className={`group relative overflow-hidden rounded-[1.5rem] cursor-pointer ${item.span} border border-white/10 backdrop-blur-sm gallery-item-glow`}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: item.index * 0.05 }}
            onClick={() => setSelectedIndex(item.index)}
            whileHover={{ scale: 1.02 }}
          >
            <img
              src={MOMENTS[item.index].src}
              alt={MOMENTS[item.index].alt}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Hover Info */}
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-xs sm:text-sm font-semibold text-white line-clamp-2">
                {MOMENTS[item.index].caption}
              </p>
            </div>

            {/* Play Icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="rounded-full bg-white/20 backdrop-blur-sm p-3 sm:p-4">
                <svg
                  width="20"
                  height="20"
                  fill="white"
                  viewBox="0 0 24 24"
                  className="drop-shadow"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
          >
            <motion.div
              className="relative w-full max-w-4xl max-h-[90vh] rounded-[2rem] overflow-hidden bg-black border border-white/10 lightbox-glow"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <div className="relative w-full pt-[66.67%] overflow-hidden">
                <img
                  src={MOMENTS[selectedIndex].src}
                  alt={MOMENTS[selectedIndex].alt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              {/* Info and Controls */}
              <div className="p-6 space-y-4">
                <p className="text-lg font-bold text-white">
                  {MOMENTS[selectedIndex].caption}
                </p>
                <p className="text-sm text-white/70">
                  {selectedIndex + 1} de {MOMENTS.length}
                </p>

                {/* Controls */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handlePrev}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    aria-label="Anterior"
                  >
                    <FaChevronLeft size={20} />
                  </button>

                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#8B21F2]"
                      initial={{ width: "0%" }}
                      animate={{ width: `${((selectedIndex + 1) / MOMENTS.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <button
                    onClick={handleNext}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    aria-label="Siguiente"
                  >
                    <FaChevronRight size={20} />
                  </button>

                  <button
                    onClick={() => setSelectedIndex(null)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    aria-label="Cerrar"
                  >
                    <FaXmark size={20} />
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
