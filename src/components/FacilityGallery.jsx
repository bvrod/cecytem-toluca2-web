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
      <div className="glass-card rounded-[2.3rem] overflow-hidden p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max min-h-[400px]">
          <AnimatePresence mode="wait">
            {visiblePhotos.map((photo, idx) => (
              <motion.div
                key={`${currentPage}-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-lg group cursor-pointer"
              >
                <img
                  src={photo.src || photo.url}
                  alt={photo.caption || photo.alt}
                  className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
                    </svg>
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          {/* Counter */}
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Mostrando {start + 1}–{end} de <span className="text-[var(--text)]">{photos.length}</span>{" "}
            fotos
          </p>

          {/* Progress Bar */}
          <div className="w-full sm:w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#8B21F2]"
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
                    ? "bg-[#8B21F2] w-2 h-2"
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
              className="ml-2 px-3 py-1.5 rounded-full bg-[#8B21F2]/20 hover:bg-[#8B21F2]/30 transition-colors text-xs font-semibold uppercase text-[#8B21F2]"
            >
              {autoplayOn ? "⏸ ON" : "▶ OFF"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
