import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import SectionHeading from "../components/SectionHeading";

export default function FAQSection({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="FAQ"
        title="Resolvemos las dudas más frecuentes de aspirantes y familias"
        description="Un proceso claro genera confianza. Estas preguntas ayudan a entender la admisión, la oferta técnica y la experiencia que vivirás en el plantel."
      />

      <div className="space-y-4">
        {items.map((item, index) => {
          const isOpen = activeIndex === index;

          return (
            <article
              key={item.question}
              className="glass-card overflow-hidden rounded-[1.7rem]"
            >
              <button
                type="button"
                onClick={() => setActiveIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-heading text-lg font-bold text-[var(--text)]">
                  {item.question}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-[var(--accent)]"
                >
                  <FaChevronDown />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                  >
                    <p className="px-6 pb-6 text-base leading-8 text-[var(--muted)]">
                      {item.answer}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </article>
          );
        })}
      </div>
    </div>
  );
}
