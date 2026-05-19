import { motion } from "framer-motion";

const transition = {
  duration: 0.75,
  ease: [0.22, 1, 0.36, 1],
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}) {
  const center = align === "center";

  return (
    <motion.div
      className={`max-w-3xl ${center ? "mx-auto text-center" : ""}`}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={transition}
    >
      <span className="badge-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
        {eyebrow}
      </span>

      <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl lg:text-[3.2rem]">
        {title}
      </h2>

      <p className="mt-4 text-base leading-8 text-[var(--muted)] sm:text-lg">
        {description}
      </p>
    </motion.div>
  );
}
