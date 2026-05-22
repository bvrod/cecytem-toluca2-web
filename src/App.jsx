import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaArrowRight,
  FaBolt,
  FaBriefcase,
  FaBuilding,
  FaCalendarDays,
  FaCertificate,
  FaChartLine,
  FaChevronRight,
  FaEnvelope,
  FaFacebookF,
  FaFileArrowDown,
  FaFilePdf,
  FaGlobe,
  FaInstagram,
  FaLaptopCode,
  FaPhone,
  FaRegCircleCheck,
  FaShieldHalved,
  FaUsers,
} from "react-icons/fa6";
import { FiMenu, FiX } from "react-icons/fi";
import { GiRobotGolem } from "react-icons/gi";
import { HiSparkles } from "react-icons/hi2";
import {
  LuBuilding2,
  LuCalendarClock,
  LuFileText,
  LuGraduationCap,
  LuInfo,
  LuMapPin,
  LuRocket,
  LuShield,
  LuWrench,
} from "react-icons/lu";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import cecytemLogo from "./imagenes/cecytem-logo.png";
import AnimatedCounter from "./components/AnimatedCounter";
import Lightbox from "./components/Lightbox";
import SectionHeading from "./components/SectionHeading";
import ThemeToggle from "./components/ThemeToggle";
import FacilityGallery from "./components/FacilityGallery";
import heroA from "./imagenes/Toluca 2.jpeg";
import heroB from "./imagenes/cecytem 1.3.jpeg";
import heroC from "./imagenes/Toluac 2.2.jpeg";
import {
  admissionSteps,
  campusMoments,
  contactInfo,
  documentCategories,
  documents,
  facilities,
  facilityStats,
  faqItems,
  guidanceHighlights,
  heroStats,
  historyTimeline,
  importantDates,
  navigation,
  newsItems,
  programs,
  requirements,
  resultStats,
  socialLinks,
  studentLifePosts,
  testimonials,
  upcomingEvents,
  values,
  whyChooseUs,
} from "./data/siteData";
import ComunidadSection from "./sections/ComunidadSection";
const TestimonialSection  = lazy(() => import("./sections/TestimonialSection"));
const FAQSection          = lazy(() => import("./sections/FAQSection"));
const MapSection          = lazy(() => import("./sections/MapSection"));

// ── Icon maps ────────────────────────────────────────────────
const featureIcons = {
  quality:  LuGraduationCap,
  infra:    LuBuilding2,
  cert:     FaCertificate,
  industry: FaBriefcase,
  growth:   FaUsers,
};

const programIcons = {
  programming:  FaLaptopCode,
  electricity:  FaBolt,
  mechatronics: GiRobotGolem,
  construction: FaBuilding,
  administration: FaChartLine,
  maintenance:  LuWrench,
};

const documentIconMap = {
  calendar: LuCalendarClock,
  document: LuFileText,
  info:     LuInfo,
  shield:   LuShield,
};

// ── Skeleton fallback ────────────────────────────────────────
const placeholderFallback = (
  <div className="grid gap-5 md:grid-cols-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={index}
        className="glass-card h-64 animate-pulse rounded-[2rem] bg-white/5"
      />
    ))}
  </div>
);

// ── Shared UI atoms ───────────────────────────────────────────
function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <img src={cecytemLogo} alt="CECyTEM Logo" className="h-12 w-12" />
    </div>
  );
}

function HeroBadge({ children }) {
  return (
    <span className="badge-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
      <HiSparkles className="text-[var(--accent)]" />
      {children}
    </span>
  );
}

function SectionShell({ children, className = "" }) {
  return (
    <section className={`section-shell relative px-4 py-20 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

function FooterLink({ href, children }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--text)]"
    >
      {children}
    </a>
  );
}

// ── Documentos: componente de tarjeta ─────────────────────────
function DocumentCard({ doc, index }) {
  const Icon = documentIconMap[doc.icon] ?? LuFileText;

  return (
    <motion.article
      className="glass-card interactive-card rounded-[1.9rem] p-6 flex flex-col gap-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: index * 0.04 }}
    >
      <div className="flex items-start gap-4">
        <span className="accent-icon flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-xl">
          <Icon />
        </span>
        <div className="min-w-0">
          <span className="inline-block rounded-full border border-[#8B21F2]/30 bg-[#8B21F2]/10 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#8B21F2]">
            {doc.category}
          </span>
          <h3 className="mt-2 font-heading text-lg font-bold leading-snug text-[var(--text)]">
            {doc.title}
          </h3>
        </div>
      </div>

      <p className="flex-1 text-sm leading-7 text-[var(--muted)]">{doc.description}</p>

      <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-4">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <FaFilePdf className="text-rose-400" />
          <span className="font-semibold uppercase tracking-wider">{doc.fileType}</span>
          {doc.fileSize ? (
            <span className="opacity-60">· {doc.fileSize}</span>
          ) : null}
        </div>

        {doc.available ? (
          <a
            href={doc.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-85"
          >
            <FaFileArrowDown />
            Descargar
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Próximamente
          </span>
        )}
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const storedTheme = window.localStorage.getItem("cecytem-theme");
    if (storedTheme) return storedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [activeSection,  setActiveSection]  = useState("inicio");
  const [lightbox,       setLightbox]       = useState({ open: false, title: "", images: [], index: 0 });
  const [docFilter,      setDocFilter]      = useState("Todos");
  const [formData,       setFormData]       = useState({ name: "", email: "", phone: "", program: "" });
  const [formErrors,     setFormErrors]     = useState({});
  const [submitState,    setSubmitState]    = useState("idle");

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
    window.localStorage.setItem("cecytem-theme", theme);
  }, [theme]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = mobileOpen || lightbox.open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox.open, mobileOpen]);

  // Active section tracker
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { threshold: [0.2, 0.35, 0.55], rootMargin: "-18% 0px -54% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Galleries
  const facilityGallery = useMemo(
    () => facilities.map((item) => ({ ...item, date: "Campus CECyTEM" })),
    [],
  );
  const studentGallery = useMemo(() => studentLifePosts.map((item) => ({ ...item })), []);

  // Document filter
  const filteredDocs = useMemo(
    () => (docFilter === "Todos" ? documents : documents.filter((d) => d.category === docFilter)),
    [docFilter],
  );

  // Handlers
  const handleAnchorClick = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
    setActiveSection(id);
  };

  const openStudentStory = (index) => {
    setLightbox({ open: true, title: "Vida Estudiantil CECyTEM", images: studentGallery, index });
  };

  const validateForm = () => {
    const errors = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (formData.name.trim().length < 3) errors.name = "Escribe tu nombre completo.";
    if (!emailRe.test(formData.email))    errors.email = "Ingresa un correo válido.";
    if (cleanPhone.length < 10)           errors.phone = "Escribe un teléfono de al menos 10 dígitos.";
    if (!formData.program)                errors.program = "Selecciona una carrera de interés.";
    return errors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) { setSubmitState("error"); return; }
    setSubmitState("sending");
    window.setTimeout(() => {
      setSubmitState("success");
      setFormData({ name: "", email: "", phone: "", program: "" });
    }, 900);
  };

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden text-[var(--text)]">
      <div className="ambient-background" aria-hidden="true" />

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="glass-card flex items-center justify-between rounded-[1.8rem] px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => handleAnchorClick("inicio")}
              className="text-left"
              aria-label="Ir al inicio"
            >
              <LogoMark />
            </button>

            <div className="hidden items-center gap-2 xl:flex">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAnchorClick(item.id)}
                  className={`nav-link rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    activeSection === item.id ? "is-active" : ""
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle
                theme={theme}
                onToggle={() => setTheme((c) => (c === "light" ? "dark" : "light"))}
              />
              <button
                type="button"
                onClick={() => handleAnchorClick("admisiones")}
                className="cta-primary hidden items-center gap-2 xl:inline-flex"
              >
                Inscríbete
                <FaArrowRight />
              </button>
              <button
                type="button"
                className="glass-card flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--text)] xl:hidden"
                onClick={() => setMobileOpen((c) => !c)}
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
                aria-label="Abrir menú"
              >
                {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileOpen ? (
              <motion.div
                id="mobile-navigation"
                className="glass-card mt-3 overflow-hidden rounded-[1.8rem] p-4 xl:hidden"
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="grid gap-2">
                  {navigation.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAnchorClick(item.id)}
                      className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                        activeSection === item.id
                          ? "bg-[var(--accent)] text-white"
                          : "bg-white/5 text-[var(--text)]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAnchorClick("admisiones")}
                    className="cta-primary mt-2 inline-flex items-center justify-center gap-2"
                  >
                    Inscríbete Ahora
                    <FaArrowRight />
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </header>

      <main>
        {/* ── HERO ─────────────────────────────────────────── */}
        <section id="inicio" className="relative px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-36">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10"
            >
              <HeroBadge>CECyTEM Toluca II · Ciclo 2026–2027</HeroBadge>

              <h1 className="mt-6 max-w-3xl font-heading text-5xl font-black leading-[1.02] tracking-tight text-[var(--text)] sm:text-6xl lg:text-7xl">
                TU BACHILLERATO
                <span className="block text-gradient">CON ESPECIALIDAD TECNICA</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg">
                Estudia el nivel medio superior y obtén al mismo tiempo una carrera técnica
                reconocida por la SEP. Tecnología, práctica y comunidad en un solo plantel.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleAnchorClick("admisiones")}
                  className="cta-primary inline-flex items-center justify-center gap-3"
                >
                  Ver proceso de admisión
                  <FaArrowRight />
                </button>
                <button
                  type="button"
                  onClick={() => handleAnchorClick("oferta")}
                  className="cta-secondary inline-flex items-center justify-center gap-3"
                >
                  Conoce las especialidades
                  <FaChevronRight />
                </button>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {heroStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="glass-card rounded-[1.7rem] p-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.12, duration: 0.55 }}
                  >
                    <p className="font-heading text-3xl font-black text-[var(--text)]">
                      {stat.noFormat
                        ? <span>{stat.value}{stat.suffix}</span>
                        : <AnimatedCounter value={stat.value} suffix={stat.suffix} />}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.98, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
            >
              <div className="hero-orb hero-orb-left" />
              <div className="hero-orb hero-orb-right" />

              <div className="hero-visual glass-card relative overflow-hidden rounded-[2.4rem] p-4 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="overflow-hidden rounded-[2rem]">
                    <img
                      src={heroA}
                      alt="Estudiantes en entorno educativo"
                      className="h-[420px] w-full object-cover sm:h-[520px]"
                      loading="eager"
                      decoding="async"
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="dashboard-card rounded-[1.8rem] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                        Admisión 2026–2027
                      </p>
                      <h3 className="mt-3 font-heading text-xl font-bold text-[var(--text)]">
                        Bachillerato tecnológico con proyección universitaria.
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                        Formación técnica, académica y humana en un plantel en crecimiento.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                      <div className="glass-card rounded-[1.7rem] p-5">
                        <div className="flex items-center gap-3">
                          <span className="accent-icon flex h-12 w-12 items-center justify-center rounded-2xl">
                            <FaShieldHalved />
                          </span>
                          <div>
                            <p className="font-heading text-base font-bold text-[var(--text)]">
                              Ambiente seguro
                            </p>
                            <p className="text-sm text-[var(--muted)]">Tutorías y acompañamiento.</p>
                          </div>
                        </div>
                      </div>

                      <div className="glass-card rounded-[1.7rem] p-5">
                        <div className="flex items-center gap-3">
                          <span className="accent-icon flex h-12 w-12 items-center justify-center rounded-2xl">
                            <LuRocket />
                          </span>
                          <div>
                            <p className="font-heading text-base font-bold text-[var(--text)]">
                              Doble certificación
                            </p>
                            <p className="text-sm text-[var(--muted)]">Bachillerato + carrera técnica.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── NOSOTROS ─────────────────────────────────────── */}
        <section id="nosotros">
          <SectionShell>
            <div className="space-y-12">
              <SectionHeading
                eyebrow="¿Por qué CECyTEM Toluca II?"
                title="Una preparatoria tecnológica con identidad y propósito"
                description="Más que un bachillerato: una comunidad educativa que combina formación técnica, acompañamiento cercano y una experiencia moderna orientada al futuro del estudiante."
                align="center"
              />

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                {whyChooseUs.map((item, index) => {
                  const Icon = featureIcons[item.icon];
                  return (
                    <motion.article
                      key={item.title}
                      className="glass-card interactive-card rounded-[1.9rem] p-6"
                      initial={{ opacity: 0, y: 28 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 0.55, delay: index * 0.06 }}
                    >
                      <span className="accent-icon flex h-14 w-14 items-center justify-center rounded-2xl text-2xl">
                        <Icon />
                      </span>
                      <h3 className="mt-5 font-heading text-xl font-bold text-[var(--text)]">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                        {item.description}
                      </p>
                    </motion.article>
                  );
                })}
              </div>

              {/* Historia + Valores */}
              <div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr]">
                <motion.div
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.65 }}
                  className="relative overflow-hidden rounded-[2.2rem]"
                >
                  <img
                    src={heroB}
                    alt="Estudiantes en campus"
                    className="h-full min-h-[420px] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.72))]" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                    <div className="glass-card max-w-md rounded-[1.8rem] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                        Sobre nosotros
                      </p>
                      <p className="mt-3 leading-8 text-[var(--text)]">
                        Disciplina académica, especialización técnica y una comunidad con identidad propia.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6 }}
                    className="glass-card rounded-[2rem] p-7"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                      Nuestra propuesta educativa
                    </p>
                    <h3 className="mt-4 font-heading text-2xl font-bold text-[var(--text)]">
                      Formación tecnológica con raíces locales y visión de futuro
                    </h3>
                    <p className="mt-4 leading-8 text-[var(--muted)]">
                      El CECyTEM Toluca II consolida una propuesta que conecta el bachillerato con competencias
                      técnicas reales, pensamiento crítico y un entorno que acompaña a cada estudiante en la
                      construcción de su proyecto de vida.
                    </p>
                  </motion.div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {values.map((item, index) => (
                      <motion.article
                        key={item.title}
                        className="glass-card interactive-card rounded-[1.7rem] p-6"
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.15 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                      >
                        <h4 className="font-heading text-lg font-bold text-[var(--text)]">
                          {item.title}
                        </h4>
                        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                          {item.description}
                        </p>
                      </motion.article>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="glass-card rounded-[2.2rem] p-7 sm:p-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                    Trayectoria institucional
                  </p>
                  <h3 className="mt-3 font-heading text-2xl font-bold text-[var(--text)]">
                    Un plantel que crece con su comunidad
                  </h3>
                </div>

                <div className="mt-8 grid gap-5 xl:grid-cols-4">
                  {historyTimeline.map((item, index) => (
                    <motion.article
                      key={`${item.year}-${item.title}`}
                      className="timeline-card rounded-[1.8rem] p-6"
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.55, delay: index * 0.05 }}
                    >
                      <span className="text-sm font-black uppercase tracking-[0.32em] text-[var(--accent)]">
                        {item.year}
                      </span>
                      <h4 className="mt-3 font-heading text-xl font-bold text-[var(--text)]">
                        {item.title}
                      </h4>
                      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                        {item.description}
                      </p>
                    </motion.article>
                  ))}
                </div>
              </div>
            </div>
          </SectionShell>
        </section>

        {/* ── OFERTA EDUCATIVA ──────────────────────────────── */}
        <section id="oferta">
          <SectionShell>
            <SectionHeading
              eyebrow="Oferta Educativa"
              title="2 especialidades técnicas, una decisión importante"
              description="Cada carrera combina el bachillerato con formación técnica aplicada. Al terminar, tienes dos certificaciones y un perfil listo para trabajar o continuar en la universidad."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {programs.map((program, index) => {
                const Icon = programIcons[program.icon];
                return (
                  <motion.article
                    key={program.name}
                    className="glass-card interactive-card overflow-hidden rounded-[2rem]"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.55, delay: index * 0.04 }}
                  >
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={program.image}
                        alt={program.name}
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.7))]" />
                      <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/18 text-xl text-white backdrop-blur-md">
                        <Icon />
                      </div>
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">
                        {program.duration}
                      </p>
                      <h3 className="mt-3 font-heading text-xl font-bold text-[var(--text)]">
                        {program.name}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                        {program.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {program.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="badge-chip rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--muted)]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAnchorClick("contacto")}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] transition-transform duration-300 hover:translate-x-1"
                      >
                        Solicitar información
                        <FaArrowRight />
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {/* Orientación vocacional CTA */}
            <div className="mt-14 overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(135deg,rgba(198,40,40,0.16),rgba(30,58,95,0.18))] p-1">
              <div className="glass-card grid gap-6 rounded-[2.2rem] p-6 sm:p-8 xl:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <span className="badge-chip inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                    Orientación vocacional
                  </span>
                  <h3 className="mt-5 font-heading text-3xl font-black text-[var(--text)] sm:text-4xl">
                    ¿No sabes cuál especialidad elegir?
                  </h3>
                  <p className="mt-4 max-w-2xl leading-8 text-[var(--muted)]">
                    Agenda una visita, conoce los talleres y platica con los maestros de cada carrera.
                    Te ayudamos a encontrar la especialidad que conecte con tus intereses y metas.
                  </p>

                  <div className="mt-6 space-y-3">
                    {guidanceHighlights.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="mt-1 text-[var(--accent)]"><FaRegCircleCheck /></span>
                        <p className="text-sm leading-7 text-[var(--muted)]">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleAnchorClick("contacto")}
                      className="cta-primary inline-flex items-center justify-center gap-3"
                    >
                      Agenda una asesoría
                      <FaArrowRight />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnchorClick("admisiones")}
                      className="cta-secondary inline-flex items-center justify-center gap-3"
                    >
                      Ver proceso de admisión
                      <FaChevronRight />
                    </button>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[2rem]">
                  <img
                    src={heroC}
                    alt="Estudiantes en sesión de orientación"
                    className="h-full min-h-[320px] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.68))]" />
                </div>
              </div>
            </div>
          </SectionShell>
        </section>

        {/* ── INSTALACIONES ────────────────────────────────── */}
        <section id="instalaciones">
          <SectionShell>
            <SectionHeading
              eyebrow="Instalaciones"
              title="Un plantel para aprender haciendo"
              description="Contamos con aulas, laboratorio de cómputo, talleres técnicos y áreas deportivas. Un plantel en crecimiento que fortalece su infraestructura ciclo a ciclo."
            />

            {/* Aviso nuevo plantel */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-8 flex items-start gap-4 rounded-[1.6rem] border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-6 py-5"
            >
              <span className="mt-0.5 text-[var(--accent)]"><LuRocket size={20} /></span>
              <div>
                <p className="font-semibold text-[var(--text)]">Nuevo plantel en desarrollo</p>
                <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
                  CECyTEM Toluca II avanza en la construcción de un nuevo campus que ampliará su
                  capacidad académica y mejorará la experiencia educativa de toda la comunidad estudiantil.
                </p>
              </div>
            </motion.div>

            <div className="mt-10 space-y-10">
              {facilities.map((facility, index) => (
                <motion.div
                  key={facility.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.55, delay: index * 0.08 }}
                  className="glass-card rounded-[2.3rem] p-6 sm:p-8"
                >
                  <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-start">
                    <div>
                      <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                        {facility.category}
                      </span>
                      <h3 className="mt-4 font-heading text-2xl font-black text-[var(--text)]">
                        {facility.title}
                      </h3>
                      <p className="mt-4 max-w-lg text-base leading-7 text-[var(--muted)]">
                        {facility.description}
                      </p>
                    </div>
                    <div>
                      <FacilityGallery photos={facility.photos || []} title={facility.title} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats de instalaciones */}
            <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {facilityStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="glass-card stat-card shadow-glow rounded-[1.8rem] p-6"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.5, delay: index * 0.04 }}
                >
                  <p className="font-heading text-3xl font-black text-[var(--text)] stat-number">
                    {typeof stat.value === "string" ? (
                      <span className="stat-number">{stat.value}{stat.suffix}</span>
                    ) : (
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    )}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Resultados e indicadores */}
            <div className="mt-14 overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(135deg,rgba(17,24,39,0.74),rgba(30,41,59,0.84))] p-1">
              <div className="grid gap-8 rounded-[2.2rem] p-7 text-white sm:p-8 xl:grid-cols-[0.85fr_1.15fr]">
                <div>
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                    Indicadores del plantel
                  </span>
                  <h3 className="mt-5 font-heading text-3xl font-black sm:text-4xl">
                    Cifras que reflejan nuestro compromiso educativo
                  </h3>
                  <p className="mt-4 leading-8 text-white/70">
                    Datos institucionales que muestran la trayectoria y el alcance del CECyTEM Toluca II
                    como parte del sistema educativo del Estado de México.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  {resultStats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      className="rounded-[1.7rem] stat-card shadow-glow p-5"
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, delay: index * 0.04 }}
                    >
                      <p className="font-heading text-3xl font-black stat-number text-white">
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                      </p>
                      <p className="mt-3 text-sm leading-7 text-white/70">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </SectionShell>
        </section>

        {/* ── NOTICIAS Y VIDA ESTUDIANTIL ──────────────────── */}
     <section id="noticias">
  <SectionShell>
    <Suspense fallback={placeholderFallback}>
      <ComunidadSection posts={studentLifePosts} onPreview={openStudentStory} />
    </Suspense>

            <div className="mt-20 grid gap-10 xl:grid-cols-[1.02fr_0.98fr]">
              {/* Noticias */}
              <div className="space-y-6">
                <SectionHeading
                  eyebrow="Noticias"
                  title="Lo más reciente del plantel"
                  description="Actividades, logros estudiantiles y comunicados que mantienen informada a la comunidad del CECyTEM Toluca II."
                />

                <div className="space-y-5">
                  {newsItems.map((item, index) => (
                    <motion.article
                      key={item.title}
                      className="glass-card interactive-card rounded-[1.9rem] p-6"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.55, delay: index * 0.05 }}
                    >
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                        <span className="accent-chip rounded-full px-3 py-2 text-[var(--accent)]">
                          {item.category}
                        </span>
                        <span>{item.date}</span>
                      </div>
                      <h3 className="mt-4 font-heading text-xl font-bold text-[var(--text)]">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                        {item.description}
                      </p>
                    </motion.article>
                  ))}
                </div>
              </div>

              {/* Próximos eventos */}
              <div className="space-y-6">
                <SectionHeading
                  eyebrow="Próximos Eventos"
                  title="Agenda institucional"
                  description="Actividades abiertas a aspirantes, estudiantes y familias de la comunidad CECyTEM Toluca II."
                />

                <div className="glass-card rounded-[2rem] p-6">
                  <div className="space-y-5">
                    {upcomingEvents.map((event, index) => (
                      <motion.article
                        key={event.title}
                        className="timeline-card rounded-[1.7rem] p-5"
                        initial={{ opacity: 0, x: 16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="accent-icon flex h-11 w-11 items-center justify-center rounded-2xl">
                              <FaCalendarDays />
                            </span>
                            <div>
                              <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                                {event.date}
                              </p>
                              <p className="text-sm text-[var(--muted)]">{event.time}</p>
                            </div>
                          </div>
                          <span className="badge-chip rounded-full px-3 py-2 text-xs font-semibold text-[var(--muted)]">
                            {event.category}
                          </span>
                        </div>
                        <h3 className="mt-4 font-heading text-xl font-bold text-[var(--text)]">
                          {event.title}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                          {event.description}
                        </p>
                      </motion.article>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonios */}
            <div className="mt-20">
              <Suspense fallback={placeholderFallback}>
                <TestimonialSection testimonials={testimonials} />
              </Suspense>
            </div>
          </SectionShell>
        </section>

        {/* ── DOCUMENTOS (nueva sección) ───────────────────── */}
        <section id="documentos">
          <SectionShell>
            <SectionHeading
              eyebrow="Centro de Documentos"
              title="Descarga lo que necesitas, cuando lo necesitas"
              description="Convocatorias, formatos, reglamentos y materiales informativos del plantel disponibles en un solo lugar. Los archivos se irán publicando conforme se autoricen."
            />

            {/* Filtros de categoría */}
            <div className="mt-10 flex flex-wrap gap-3">
              {documentCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDocFilter(cat)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    docFilter === cat
                      ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25"
                      : "glass-card text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid de documentos */}
            <motion.div
              key={docFilter}
              className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {filteredDocs.map((doc, index) => (
                <DocumentCard key={`${doc.category}-${doc.title}`} doc={doc} index={index} />
              ))}
            </motion.div>

            {/* Aviso informativo */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 flex items-start gap-4 rounded-[1.6rem] border border-amber-400/20 bg-amber-400/8 px-6 py-5"
            >
              <span className="mt-0.5 text-amber-500"><LuInfo size={18} /></span>
              <p className="text-sm leading-7 text-[var(--muted)]">
                Los documentos marcados como <strong className="text-[var(--text)]">"Próximamente"</strong> estarán
                disponibles para descarga una vez que sean autorizados y publicados por la institución. Si
                necesitas algún documento de urgencia, contáctanos directamente en la sección de Contacto.
              </p>
            </motion.div>
          </SectionShell>
        </section>

        {/* ── ADMISIONES ───────────────────────────────────── */}
        <section id="admisiones">
          <SectionShell>
            <SectionHeading
              eyebrow="Proceso de Admisión"
              title="Un camino claro para integrarte al plantel"
              description="El proceso es el mismo en todos los planteles CECyTEM del Estado de México. Aquí te explicamos paso a paso cómo prepararte."
              align="center"
            />

            <div className="mt-12 grid gap-5 xl:grid-cols-4">
              {admissionSteps.map((step, index) => (
                <motion.article
                  key={step.step}
                  className="glass-card interactive-card rounded-[1.9rem] p-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <span className="text-sm font-black uppercase tracking-[0.3em] text-[var(--accent)]">
                    {step.step}
                  </span>
                  <h3 className="mt-4 font-heading text-2xl font-bold text-[var(--text)]">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                    {step.description}
                  </p>
                </motion.article>
              ))}
            </div>

            <div className="mt-14 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              {/* Requisitos */}
              <div className="glass-card rounded-[2.2rem] p-7">
                <div className="flex items-center gap-3">
                  <span className="accent-icon flex h-12 w-12 items-center justify-center rounded-2xl">
                    <FaRegCircleCheck />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                      Documentación
                    </p>
                    <h3 className="font-heading text-2xl font-bold text-[var(--text)]">
                      Checklist del expediente
                    </h3>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {requirements.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-[1.3rem] border border-white/8 bg-white/4 px-4 py-3.5"
                    >
                      <span className="mt-1 text-[var(--accent)]"><FaRegCircleCheck /></span>
                      <p className="text-sm leading-7 text-[var(--muted)]">{item}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAnchorClick("documentos")}
                  className="cta-secondary mt-8 inline-flex items-center gap-3"
                >
                  Ver documentos descargables
                  <FaArrowRight />
                </button>
              </div>

              {/* Fechas */}
              <div className="space-y-5">
                <div className="glass-card rounded-[2.2rem] p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                    Calendario
                  </p>
                  <h3 className="mt-4 font-heading text-2xl font-bold text-[var(--text)]">
                    Fechas importantes para aspirantes 2026
                  </h3>
                  <p className="mt-3 leading-8 text-[var(--muted)]">
                    Planifica cada etapa con tiempo. Las fechas exactas se confirman con la convocatoria oficial del CECyTEM Estado de México.
                  </p>
                </div>

                {importantDates.map((item, index) => (
                  <motion.article
                    key={item.title}
                    className="glass-card interactive-card rounded-[1.9rem] p-6"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                      {item.date}
                    </p>
                    <h4 className="mt-3 font-heading text-xl font-bold text-[var(--text)]">
                      {item.title}
                    </h4>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      {item.description}
                    </p>
                  </motion.article>
                ))}
              </div>
            </div>
          </SectionShell>
        </section>

        {/* ── CONTACTO ─────────────────────────────────────── */}
        <section id="contacto">
          <SectionShell>
            <div className="grid gap-10 xl:grid-cols-[1fr_1fr]">
              {/* Formulario */}
              <div className="glass-card rounded-[2.3rem] p-7 sm:p-8">
                <SectionHeading
                  eyebrow="Contacto"
                  title="Solicita información y da el primer paso"
                  description="Comparte tus datos y en breve nos comunicaremos contigo para orientarte en el proceso de admisión."
                />

                <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="field-group">
                      <span className="field-label">Nombre</span>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((c) => ({ ...c, name: e.target.value }))}
                        className={`field-input ${formErrors.name ? "field-error" : ""}`}
                        placeholder="Tu nombre completo"
                      />
                      {formErrors.name ? <span className="field-feedback">{formErrors.name}</span> : null}
                    </label>

                    <label className="field-group">
                      <span className="field-label">Correo</span>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))}
                        className={`field-input ${formErrors.email ? "field-error" : ""}`}
                        placeholder="[email protected]"
                      />
                      {formErrors.email ? <span className="field-feedback">{formErrors.email}</span> : null}
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="field-group">
                      <span className="field-label">Teléfono</span>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData((c) => ({ ...c, phone: e.target.value }))}
                        className={`field-input ${formErrors.phone ? "field-error" : ""}`}
                        placeholder="722 000 0000"
                      />
                      {formErrors.phone ? <span className="field-feedback">{formErrors.phone}</span> : null}
                    </label>

                    <label className="field-group">
                      <span className="field-label">Especialidad de interés</span>
                      <select
                        value={formData.program}
                        onChange={(e) => setFormData((c) => ({ ...c, program: e.target.value }))}
                        className={`field-input ${formErrors.program ? "field-error" : ""}`}
                      >
                        <option value="">Selecciona una opción</option>
                        {programs.map((p) => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                      {formErrors.program ? <span className="field-feedback">{formErrors.program}</span> : null}
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="cta-primary inline-flex w-full items-center justify-center gap-3"
                  >
                    {submitState === "sending" ? "Enviando..." : "Enviar solicitud"}
                    <FaArrowRight />
                  </button>

                  <AnimatePresence mode="wait">
                    {submitState === "success" ? (
                      <motion.p
                        key="success"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-[1.4rem] border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-300"
                      >
                        Tu solicitud fue registrada. Pronto recibirás información del plantel.
                      </motion.p>
                    ) : null}

                    {submitState === "error" && Object.keys(formErrors).length > 0 ? (
                      <motion.p
                        key="error"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-[1.4rem] border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-600 dark:text-rose-300"
                      >
                        Revisa los campos marcados para continuar.
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </form>
              </div>

              {/* Datos de contacto + FAQ */}
              <div className="space-y-6">
                <div className="glass-card rounded-[2.3rem] p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                    Información de contacto
                  </p>
                  <h3 className="mt-4 font-heading text-2xl font-bold text-[var(--text)]">
                    Comunícate directamente con el plantel
                  </h3>

                  <div className="mt-6 space-y-5">
                    <div className="flex items-start gap-4">
                      <span className="accent-icon flex h-12 w-12 items-center justify-center rounded-2xl">
                        <FaPhone />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Teléfono</p>
                        <p className="mt-2 text-[var(--text)]">{contactInfo.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <span className="accent-icon flex h-12 w-12 items-center justify-center rounded-2xl">
                        <FaEnvelope />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Correo institucional</p>
                        <p className="mt-2 text-[var(--text)]">{contactInfo.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <span className="accent-icon flex h-12 w-12 items-center justify-center rounded-2xl">
                        <LuMapPin />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Ubicación</p>
                        <p className="mt-2 leading-8 text-[var(--text)]">{contactInfo.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Suspense fallback={placeholderFallback}>
                  <FAQSection items={faqItems} />
                </Suspense>
              </div>
            </div>

            <div className="mt-20">
              <Suspense fallback={placeholderFallback}>
                <MapSection contact={contactInfo} />
              </Suspense>
            </div>
          </SectionShell>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="glass-card rounded-[2.2rem] p-7 sm:p-8">
            <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr]">
              <div>
                <LogoMark />
                <p className="mt-5 max-w-md leading-8 text-[var(--muted)]">
                  CECyTEM Toluca II · Bachillerato tecnológico bivalente del Estado de México.
                  Formación académica, técnica y humana para el futuro de nuestros estudiantes.
                </p>
                <div className="mt-6 flex items-center gap-3">
                  {socialLinks.map((item) => {
                    const icon =
                      item.label === "Facebook" ? <FaFacebookF /> :
                      item.label === "Instagram" ? <FaInstagram /> :
                      <FaGlobe />;
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={item.label}
                        className="glass-card flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--text)] transition-transform duration-300 hover:-translate-y-1"
                      >
                        {icon}
                      </a>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="font-heading text-lg font-bold text-[var(--text)]">Navegación</p>
                <div className="mt-5 grid gap-3">
                  {navigation.map((item) => (
                    <FooterLink key={item.id} href={`#${item.id}`}>{item.label}</FooterLink>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-heading text-lg font-bold text-[var(--text)]">Especialidades</p>
                <div className="mt-5 grid gap-3">
                  {programs.map((p) => (
                    <FooterLink key={p.name} href="#oferta">{p.name}</FooterLink>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-heading text-lg font-bold text-[var(--text)]">Contacto</p>
                <div className="mt-5 space-y-4 text-sm text-[var(--muted)]">
                  <p>{contactInfo.email}</p>
                  <p>{contactInfo.hours}</p>
                  <a
                    href={contactInfo.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-[var(--accent)]"
                  >
                    Sitio oficial CECyTEM
                    <FaArrowRight />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} CECyTEM Toluca II · Todos los derechos reservados</p>
              <div className="flex flex-wrap gap-4">
                <FooterLink href={contactInfo.website}>Aviso de privacidad</FooterLink>
                <FooterLink href={contactInfo.website}>Sitio oficial CECyTEM</FooterLink>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <Lightbox
        open={lightbox.open}
        title={lightbox.title}
        images={lightbox.images}
        startIndex={lightbox.index}
        onClose={() => setLightbox({ open: false, title: "", images: [], index: 0 })}
      />
    </div>
  );
}