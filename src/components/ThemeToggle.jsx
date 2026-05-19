import { FaMoon, FaSun } from "react-icons/fa";

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="glass-card flex h-11 w-11 items-center justify-center rounded-2xl text-lg text-[var(--text)] transition-transform duration-300 hover:-translate-y-1"
      aria-label={isDark ? "Cambiar a modo día" : "Cambiar a modo noche"}
      title={isDark ? "Cambiar a modo día" : "Cambiar a modo noche"}
    >
      {isDark ? <FaSun /> : <FaMoon />}
    </button>
  );
}
