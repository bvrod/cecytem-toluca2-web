import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

const GALLERY_PER_PAGE = 8;
const GALLERY_AUTOPLAY_MS = 5000;
const GALLERY_FADE_MS = 500;

export default function FacilityGallery({ photos = [], title = "" }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [autoplayOn, setAutoplayOn] = useState(true);
  const autoplayTimer = useRef(null);
  const progressTimer = useRef(null);
  const [progress, setProgress] = useState(0);

  const totalPages = Math.ceil(photos.length / GALLERY_PER_PAGE);

  const start = currentPage * GALLERY_PER_PAGE;
  const end = Math.min(start + GALLERY_PER_PAGE, photos.length);
  const visiblePhotos = photos.slice(start, end);

  const startAutoplay = () => {
    if (!autoplayOn) return;
    if (autoplayTimer.current) clearInterval(autoplayTimer.current);

    autoplayTimer.current = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, GALLERY_AUTOPLAY_MS);

    setProgress(0);
    let elapsed = 0;
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      elapsed += 100;
      setProgress((elapsed / GALLERY_AUTOPLAY_MS) * 100);
    }, 100);
  };

  const stopAutoplay = () => {
    if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
  };

  useEffect(() => {
    if (autoplayOn) {
      startAutoplay();
    } else {
      stopAutoplay();
      setProgress(0);
    }
    return () => stopAutoplay();
  }, [autoplayOn, totalPages]);

  const goToPage = (page) => {
    setCurrentPage(page % totalPages);
    if (autoplayOn) {
      stopAutoplay();
      startAutoplay();
    }
  };

  const handlePrev = () => {
    goToPage(currentPage - 1 + totalPages);
  };

  const handleNext = () => {
    goToPage(currentPage + 1);
  };

  if (photos.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Gallery Grid */}
      <div className="glass-card rounded-[2.3rem] overflow-hidden p-4 sm:p-5 shadow-glow">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[220px] min-h-[420px]">
          <AnimatePresence mode="wait">
            {visiblePhotos.map((photo, idx) => (
              <motion.div
                key={`${currentPage}-${idx}`}
                className="group relative overflow-hidden rounded-[1.5rem] cursor-default gallery-grid-item"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
              >
                <img
                  src={photo.src}
                  alt={photo.caption}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Caption */}
                <div className="absolute inset-x-0 bottom-0 p-3 text-white text-xs font-semibold line-clamp-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  {photo.caption}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        {/* Counter */}
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Mostrando {start + 1}–{end} de <span className="text-[var(--text)]">{photos.length}</span>{" "}
          fotos
        </p>

        {/* Progress Bar */}
        <div className="w-full sm:w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--accent)]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={`rounded-full border-none cursor-pointer transition-all ${
                i === currentPage
                  ? "bg-[var(--accent)] w-2 h-2"
                  : "bg-white/20 w-1.5 h-1.5 hover:bg-white/30"
              }`}
              aria-label={`Página ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-[var(--text)]"
            aria-label="Página anterior"
          >
            <FaChevronLeft size={16} />
          </button>

          <span className="text-xs font-semibold uppercase text-[var(--muted)]">
            {currentPage + 1} / {totalPages}
          </span>

          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-[var(--text)]"
            aria-label="Página siguiente"
          >
            <FaChevronRight size={16} />
          </button>

          <button
            onClick={() => setAutoplayOn(!autoplayOn)}
            className="ml-2 px-3 py-1.5 rounded-full bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 transition-colors text-xs font-semibold uppercase text-[var(--accent)]"
          >
            {autoplayOn ? "⏸ ON" : "▶ OFF"}
          </button>
        </div>
      )}
    </div>
  );
}
