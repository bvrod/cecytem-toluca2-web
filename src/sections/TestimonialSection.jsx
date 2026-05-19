import { FaStar } from "react-icons/fa";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import SectionHeading from "../components/SectionHeading";

export default function TestimonialSection({ testimonials }) {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Testimonios"
        title="Historias que reflejan confianza, crecimiento y visión"
        description="Detrás de cada laboratorio, proyecto y actividad, hay estudiantes que encontraron dirección, herramientas y una comunidad que los impulsa."
        align="center"
      />

      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 4200, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        spaceBetween={24}
        slidesPerView={1}
        breakpoints={{
          768: { slidesPerView: 2 },
          1200: { slidesPerView: 3 },
        }}
        className="pb-14"
      >
        {testimonials.map((testimonial) => (
          <SwiperSlide key={testimonial.name}>
            <article className="glass-card interactive-card h-full rounded-[2rem] p-7">
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.photo}
                  alt={testimonial.name}
                  className="h-16 w-16 rounded-2xl object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <h3 className="font-heading text-lg font-bold text-[var(--text)]">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">{testimonial.program}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-1 text-amber-400">
                {Array.from({ length: testimonial.rating }).map((_, index) => (
                  <FaStar key={`${testimonial.name}-${index}`} />
                ))}
              </div>

              <p className="mt-6 text-base leading-8 text-[var(--muted)]">
                “{testimonial.comment}”
              </p>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                {testimonial.company}
              </p>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
