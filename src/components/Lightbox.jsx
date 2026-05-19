import { AnimatePresence, motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight, FaXmark } from "react-icons/fa6";
import { Keyboard, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export default function Lightbox({ open, title, images, startIndex, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 px-4 py-8 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Cerrar galería"
            onClick={onClose}
            className="absolute right-5 top-5 z-[72] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <FaXmark />
          </button>

          <motion.div
            className="glass-card relative z-[71] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/35 p-4 sm:p-6"
            initial={{ scale: 0.96, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, y: 18 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                  Vista Expandida
                </p>
                <h3 className="mt-2 font-heading text-2xl font-bold text-white">
                  {title}
                </h3>
              </div>

              <div className="hidden items-center gap-3 text-sm text-white/70 md:flex">
                <span className="flex items-center gap-2">
                  <FaArrowLeft />
                  Desliza
                </span>
                <span className="flex items-center gap-2">
                  Navega
                  <FaArrowRight />
                </span>
              </div>
            </div>

            <Swiper
              initialSlide={startIndex}
              modules={[Navigation, Pagination, Keyboard]}
              navigation
              keyboard
              pagination={{ clickable: true }}
              className="lightbox-swiper"
            >
              {images.map((image) => (
                <SwiperSlide key={`${image.title}-${image.image}`}>
                  <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                    <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/5">
                      <img
                        src={image.image}
                        alt={image.title}
                        className="h-[300px] w-full object-cover sm:h-[420px] lg:h-[560px]"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    <div className="glass-card rounded-[1.7rem] border border-white/10 bg-white/5 p-6 text-white">
                      <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                        {image.category}
                      </span>
                      <h4 className="mt-4 font-heading text-2xl font-bold">
                        {image.title}
                      </h4>
                      <p className="mt-3 text-sm uppercase tracking-[0.22em] text-white/55">
                        {image.date}
                      </p>
                      <p className="mt-5 leading-8 text-white/72">
                        {image.description}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
