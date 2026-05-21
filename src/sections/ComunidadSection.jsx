import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaXmark } from "react-icons/fa6";

const galleryModules = import.meta.glob("../imagenes/*.{jpeg,jpg,png}", { eager: true });
const ALL_ITEMS = Object.entries(galleryModules)
  .sort(([left], [right]) =>
    left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" })
  )
  .map(([path, module]) => {
    const filename = path.split("/").pop();
    const cleanName = filename
      .replace(/[-_]/g, " ")
      .replace(/\.(jpe?g|png)$/i, "")
      .replace(/\s+/g, " ")
      .trim();

    const caption = cleanName.replace(/\b(\w)/g, (match) => match.toUpperCase());

    return {
      src: module.default ?? module,
      caption,
      alt: caption,
    };
  });

const ITEMS_PER_PAGE = 10;
const GRID_SPANS = [
  "md:col-span-3 md:row-span-2",
  "md:col-span-2",
  "md:col-span-2",
  "md:col-span-3",
  "md:col-span-2",
  "md:col-span-2 md:row-span-2",
  "md:col-span-2",
  "md:col-span-3",
  "md:col-span-2",
  "md:col-span-3",
];

const getGridSpan = (index) => GRID_SPANS[index % GRID_SPANS.length];

export default function ComunidadSection({ posts = [], onPreview = () => {} }) {
  const photos = useMemo(() => ALL_ITEMS, []);
  const [activeIndex, setActiveIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [stackIndex, setStackIndex] = useState(0);
  const [showHint, setShowHint] = useState(true);

  const pageCount = Math.ceil(photos.length / ITEMS_PER_PAGE);
  const currentItems = photos.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  const visibleStack = currentItems.slice(stackIndex);

  useEffect(() => {
    setStackIndex(0);
    setShowHint(true);
  }, [currentPage]);

  useEffect(() => {
    if (pageCount <= 1) return undefined;

    const interval = window.setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % pageCount);
    }, 10000);

    return () => window.clearInterval(interval);
  }, [pageCount]);

  const openPhoto = (index) => setActiveIndex(index);
  const closePhoto = () => setActiveIndex(null);
  const showPrev = () => setActiveIndex((prev) => (prev === null ? null : (prev - 1 + photos.length) % photos.length));
  const showNext = () => setActiveIndex((prev) => (prev === null ? null : (prev + 1) % photos.length));

  const handlePage = (page) => {
    setCurrentPage((page + pageCount) % pageCount);
  };

  const handleMobileAdvance = () => {
    setShowHint(false);
    setStackIndex((prev) => Math.min(prev + 1, currentItems.length - 1));
  };

  if (photos.length === 0) return null;

  return (
    <section id="comunidad" className="space-y-10 py-10 transition-colors duration-300">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
              Comunidad
            </p>
            <h2 className="font-heading text-3xl font-black text-[var(--text)] sm:text-4xl">
              Galería de fotos del plantel
            </h2>
          </div>
        </div>
      </div>

      {/* Desktop grid: 10 fotos por página */}
      <div className="hidden md:grid gap-4 md:grid-cols-12">
        {currentItems.map((photo, index) => (
          <motion.button
            key={photo.src}
            type="button"
            onClick={() => openPhoto(currentPage * ITEMS_PER_PAGE + index)}
            className={`col-span-6 overflow-hidden rounded-[1.8rem] border border-[var(--border)] bg-[var(--surface-strong)] shadow-[var(--shadow)] transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] relative ${getGridSpan(index)}`}
            initial={{ opacity: 0, y: 20 }}
            whileHover={{ scale: 1.02 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: (index % 8) * 0.04 }}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 text-white">
              <p className="text-sm font-semibold">{photo.caption}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Mobile view: stacked cards for page-like interaction */}
      <div className="md:hidden">
        <div className="relative h-[76vh] w-full overflow-hidden">
          <AnimatePresence>
            {visibleStack.map((photo, index) => {
              const isTop = index === 0;
              const offset = index * 9;
              const scale = 1 - index * 0.015;

              return (
                <motion.button
                  key={photo.src}
                  type="button"
                  onClick={isTop ? handleMobileAdvance : undefined}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: offset, scale }}
                  exit={isTop ? { opacity: 0, y: -48, scale: 0.92 } : undefined}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className={`absolute left-0 right-0 top-0 overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] shadow-[var(--shadow)] ${isTop ? "cursor-pointer" : "pointer-events-none"}`}
                  style={{ zIndex: visibleStack.length - index }}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-5 text-white">
                    <p className="text-sm font-semibold">{photo.caption}</p>
                  </div>
                  {isTop && showHint && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 px-4 text-center text-sm font-semibold text-white backdrop-blur-sm">
                      <div className="rounded-3xl border border-white/20 bg-black/60 px-4 py-3">
                        Pulsa la foto para cambiar a la siguiente imagen
                      </div>
                    </div>
                  )}
                  {isTop && (
                    <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/50 px-3 py-2 text-xs uppercase tracking-[0.24em] text-white">
                      {`Foto ${stackIndex + 1} / ${currentItems.length}`}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Contenedor de Paginación e Indicador de Progreso */}
      <div className="space-y-4">
        {/* Barra de progreso de avance automático (Solo si hay más de 1 página) */}
        {pageCount > 1 && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              key={currentPage}
              className="h-full bg-[var(--accent)]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 10, ease: "linear" }}
            />
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[var(--muted)]">
            Página {currentPage + 1} de {pageCount} · Mostrando {currentItems.length} de {photos.length} fotos
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePage(currentPage - 1)}
              className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--bg)]"
            >
              Anterior
            </button>
            {Array.from({ length: pageCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handlePage(index)}
                className={`h-2 w-2 rounded-full transition ${index === currentPage ? "bg-[var(--accent)]" : "bg-white/30 hover:bg-white/50"}`}
                aria-label={`Página ${index + 1}`}
              />
            ))}
            <button
              type="button"
              onClick={() => handlePage(currentPage + 1)}
              className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--bg)]"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox solo en desktop */}
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-full max-w-5xl md:block hidden">
              <button
                type="button"
                onClick={closePhoto}
                className="absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-[var(--surface-strong)] p-3 text-[var(--text)] shadow-[var(--shadow)] transition hover:bg-[var(--bg)]"
                aria-label="Cerrar galería"
              >
                <FaXmark size={18} />
              </button>

              <img
                src={photos[activeIndex]?.src}
                alt={photos[activeIndex]?.alt}
                className="max-h-[80vh] w-full rounded-[2rem] object-contain border border-[var(--border)] shadow-[var(--shadow)] bg-[var(--surface)]"
                loading="eager"
              />

              <div className="mt-4 flex items-center justify-between gap-3 text-[var(--text)]">
                <button
                  type="button"
                  onClick={showPrev}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--bg)] hover:text-[var(--accent)]"
                >
                  <FaChevronLeft /> Anterior
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--bg)] hover:text-[var(--accent)]"
                >
                  Siguiente <FaChevronRight />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}