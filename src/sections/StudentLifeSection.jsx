import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa6";
import SectionHeading from "../components/SectionHeading";

export default function StudentLifeSection({ posts, onPreview }) {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Vida Estudiantil"
        title="Una comunidad que aprende, compite, crea y se inspira"
        description="La experiencia CECyTEM se vive dentro y fuera del aula. Este feed visual combina energía juvenil, actividades institucionales y momentos que convierten al campus en una comunidad vibrante."
      />

      <div className="grid auto-rows-[220px] gap-5 md:grid-cols-12">
        {posts.map((post, index) => (
          <motion.article
            key={`${post.title}-${post.date}`}
            className={`group relative overflow-hidden rounded-[2rem] border border-white/10 ${post.span} min-h-[220px]`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: index * 0.06 }}
          >
            <img
              src={post.image}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.82))]" />

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                  {post.category}
                </span>
                <span>{post.date}</span>
              </div>

              <h3 className="mt-4 font-heading text-xl font-bold text-white sm:text-2xl">
                {post.title}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
                {post.description}
              </p>

              <button
                type="button"
                onClick={() => onPreview(index)}
                className="mt-5 inline-flex items-center gap-3 text-sm font-semibold text-white transition-transform duration-300 hover:translate-x-1"
              >
                Ver más
                <FaArrowRight />
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
