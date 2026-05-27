// src/components/AlumnoDashboard.jsx
import { useState, useEffect, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

// ─── Utilidades ────────────────────────────────────────────────────────────────

const pct = (val, max) => (max > 0 ? Math.round((val / max) * 100) : 0);

/**
 * Semáforo sin rojo:
 *   ≥ 80 → verde esmeralda
 *   50–79 → ámbar
 *   < 50  → gris oscuro / púrpura apagado
 */
function statusColor(percent) {
  if (percent >= 80) return { dot: "bg-emerald-400", text: "text-emerald-400", label: "Satisfactorio" };
  if (percent >= 50) return { dot: "bg-amber-400",   text: "text-amber-400",   label: "En seguimiento" };
  return              { dot: "bg-purple-400",        text: "text-purple-400",  label: "Atención requerida" };
}

// ─── Sub-componentes ────────────────────────────────────────────────────────────

/** Barra de progreso lineal */
function ProgressBar({ percent, colorClass = "bg-purple-500" }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

/** Círculo de progreso SVG puro */
function CircleProgress({ percent, size = 88, stroke = 6, colorClass = "stroke-purple-500" }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
        className="stroke-white/10 fill-none" />
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
        className={`fill-none transition-all duration-700 ease-out ${colorClass}`}
        strokeDasharray={circ} strokeDashoffset={dash}
        strokeLinecap="round" />
    </svg>
  );
}

/** Tarjeta de métrica principal */
function MetricCard({ label, value, sub, percent, colorClass }) {
  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent pointer-events-none" />
      <p className="text-xs font-medium tracking-widest uppercase text-white/50">{label}</p>
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center">
          <CircleProgress percent={percent} colorClass={colorClass} />
          <span className="absolute text-lg font-bold text-white">{percent}%</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-white/50 mt-0.5">{sub}</p>}
        </div>
      </div>
      <ProgressBar percent={percent} colorClass={colorClass.replace("stroke-", "bg-")} />
    </div>
  );
}

/** Fila de materia en la tabla */
function MateriaRow({ materia, index }) {
  const asistPct = pct(materia.asistencias_presentes, materia.asistencias_total);
  const tareaPct = pct(materia.tareas_entregadas, materia.tareas_total);
  const generalPct = Math.round((asistPct + tareaPct) / 2);
  const status = statusColor(generalPct);

  return (
    <tr
      className="border-b border-white/5 hover:bg-white/5 transition-colors duration-150"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Materia */}
      <td className="py-4 px-4">
        <p className="font-semibold text-white text-sm">{materia.nombre}</p>
        <p className="text-xs text-white/40 mt-0.5">{materia.clave || "—"}</p>
      </td>

      {/* Docente */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-purple-800/60 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-purple-200">
              {materia.docente?.charAt(0) ?? "?"}
            </span>
          </div>
          <span className="text-sm text-white/70">{materia.docente ?? "Sin asignar"}</span>
        </div>
      </td>

      {/* Asistencia */}
      <td className="py-4 px-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-white/50">Asistencia</span>
            <span className="font-medium text-white">{asistPct}%</span>
          </div>
          <ProgressBar percent={asistPct} colorClass={statusColor(asistPct).dot.replace("bg-", "bg-")} />
          <p className="text-xs text-white/30">{materia.asistencias_presentes}/{materia.asistencias_total} clases</p>
        </div>
      </td>

      {/* Tareas */}
      <td className="py-4 px-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-white/50">Tareas</span>
            <span className="font-medium text-white">{tareaPct}%</span>
          </div>
          <ProgressBar percent={tareaPct} colorClass={statusColor(tareaPct).dot.replace("bg-", "bg-")} />
          <p className="text-xs text-white/30">{materia.tareas_entregadas}/{materia.tareas_total} entregadas</p>
        </div>
      </td>

      {/* Estatus semáforo */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${status.dot} shadow-sm`} />
          <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
        </div>
      </td>
    </tr>
  );
}

/** Skeleton de carga */
function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />;
}

// ─── Componente principal ───────────────────────────────────────────────────────

export default function AlumnoDashboard() {
  const { user } = useContext(AuthContext);

  const [materias, setMaterias]   = useState([]);
  const [resumen, setResumen]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [searchQ, setSearchQ]     = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [matRes, resRes] = await Promise.all([
          api.get("/alumno/materias/"),
          api.get("/alumno/resumen/"),
        ]);
        if (!cancelled) {
          setMaterias(matRes.data);
          setResumen(resRes.data);
        }
      } catch (e) {
        if (!cancelled) setError("No se pudieron cargar los datos. Intenta de nuevo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = materias.filter(m =>
    m.nombre?.toLowerCase().includes(searchQ.toLowerCase()) ||
    m.docente?.toLowerCase().includes(searchQ.toLowerCase())
  );

  // Métricas generales calculadas en front si el endpoint no las trae
  const globalAsist = resumen?.asistencia_global ?? (
    materias.length
      ? Math.round(materias.reduce((a, m) => a + pct(m.asistencias_presentes, m.asistencias_total), 0) / materias.length)
      : 0
  );
  const globalTareas = resumen?.tareas_global ?? (
    materias.length
      ? Math.round(materias.reduce((a, m) => a + pct(m.tareas_entregadas, m.tareas_total), 0) / materias.length)
      : 0
  );
  const cumplimiento = Math.round((globalAsist + globalTareas) / 2);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#111827] font-['Sora',sans-serif]">
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');`}</style>

      {/* Fondo decorativo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-900/30 blur-3xl" />
        <div className="absolute top-1/2 -right-48 h-80 w-80 rounded-full bg-purple-800/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-violet-900/20 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Header de bienvenida ── */}
        <header className="mb-10">
          <p className="text-xs font-medium tracking-widest uppercase text-purple-400 mb-1">
            Portal del Estudiante · CECyTEM Toluca II
          </p>
          <h1 className="text-3xl font-extrabold text-white">
            Bienvenido, <span className="text-purple-300">{user?.nombre ?? user?.username ?? "Alumno"}</span>
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Ciclo escolar activo · Consulta tu avance académico en tiempo real
          </p>
        </header>

        {/* ── Tarjetas de métricas ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[1,2,3].map(i => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <MetricCard
              label="Cumplimiento General"
              value={`${cumplimiento}%`}
              sub="Promedio asistencia + tareas"
              percent={cumplimiento}
              colorClass="stroke-purple-400"
            />
            <MetricCard
              label="Asistencia Global"
              value={`${globalAsist}%`}
              sub={`${materias.length} materias registradas`}
              percent={globalAsist}
              colorClass="stroke-emerald-400"
            />
            <MetricCard
              label="Entrega de Tareas"
              value={`${globalTareas}%`}
              sub="Promedio entre todas las materias"
              percent={globalTareas}
              colorClass="stroke-amber-400"
            />
          </div>
        )}

        {/* ── Panel de materias ── */}
        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">

          {/* Encabezado del panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white">Materias Inscritas</h2>
              <p className="text-xs text-white/40 mt-0.5">
                {loading ? "Cargando…" : `${filtered.length} de ${materias.length} materias`}
              </p>
            </div>
            {/* Búsqueda */}
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar materia o docente…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/10 pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>
          </div>

          {/* Estado de error */}
          {error && (
            <div className="flex items-center gap-3 mx-6 my-5 rounded-xl bg-amber-900/30 border border-amber-500/30 px-4 py-3">
              <svg className="h-5 w-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
              <p className="text-sm text-amber-300">{error}</p>
            </div>
          )}

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {["Materia", "Docente", "Asistencia", "Tareas", "Estatus"].map(h => (
                    <th key={h} className="py-3 px-4 text-xs font-semibold tracking-widest uppercase text-white/30">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="py-4 px-4">
                            <Skeleton className="h-4 w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filtered.length === 0
                    ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-white/30 text-sm">
                          {searchQ ? "No se encontraron materias con ese criterio." : "No hay materias inscritas en este ciclo."}
                        </td>
                      </tr>
                    )
                    : filtered.map((m, i) => (
                        <MateriaRow key={m.id ?? i} materia={m} index={i} />
                      ))
                }
              </tbody>
            </table>
          </div>

          {/* Leyenda semáforo */}
          {!loading && (
            <div className="flex flex-wrap gap-5 px-6 py-4 border-t border-white/10">
              <p className="text-xs text-white/30 font-medium tracking-wide uppercase mr-2 self-center">Leyenda:</p>
              {[
                { dot: "bg-emerald-400", label: "Satisfactorio (≥ 80%)" },
                { dot: "bg-amber-400",   label: "En seguimiento (50–79%)" },
                { dot: "bg-purple-400",  label: "Atención requerida (< 50%)" },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                  <span className="text-xs text-white/40">{label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pie de página */}
        <footer className="mt-10 text-center text-xs text-white/20">
          CECyTEM Plantel Toluca II · Sistema de Seguimiento Académico
        </footer>
      </main>
    </div>
  );
}
