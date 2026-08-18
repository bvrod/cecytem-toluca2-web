import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import SectionHeading from "../components/SectionHeading";

export default function TestimonialSection({ testimonials }) {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Testimonios"
        title="Recomendaciones Toluca 2"
        description="Opiniones reales de estudiantes y egresados sobre la experiencia que viven en el plantel."
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-[var(--text)]">
                    {testimonial.name}
                  </h3>
                  <p className="mt-2 text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <p className="mt-6 text-base leading-8 text-[var(--muted)]">
                “{testimonial.quote}”
              </p>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
