// src/components/AlumnoDashboard.jsx
import { useState, useEffect, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

// ─── Design Tokens ─────────────────────────────────────────────────────────────

const T = {
  bg:           "#082030",
  surface:      "rgba(5,18,32,0.72)",
  border:       "rgba(6,182,212,0.18)",
  borderStrong: "rgba(6,182,212,0.32)",
  accent:       "#1db954",
  accentEnd:    "#159b45",
  accentGlow:   "rgba(29,185,84,0.18)",
  cyan:         "#06b6d4",
  cyanDim:      "rgba(6,182,212,0.10)",
  textPrimary:  "#e5e7eb",
  textSecondary:"#9aa5b7",
  textMuted:    "#4d6070",
  amber:        "#f59e0b",
  amberDim:     "rgba(245,158,11,0.12)",
  emerald:      "#34d399",
  emeraldDim:   "rgba(52,211,153,0.12)",
  purple:       "#a78bfa",
  purpleDim:    "rgba(167,139,250,0.12)",
  radius:       "20px",
  radiusSm:     "12px",
  radiusXs:     "8px",
  shadow:       "0 25px 80px rgba(2,10,20,0.55)",
  shadowSm:     "0 8px 30px rgba(2,10,20,0.40)",
};

// Dots background (login pattern)
const DOTS_BG = {
  backgroundImage: `radial-gradient(rgba(6,182,212,0.18) 1.5px, transparent 1.5px)`,
  backgroundSize:  "26px 26px",
};

// ─── Utilidades ─────────────────────────────────────────────────────────────────

const pct = (val, max) => (max > 0 ? Math.round((val / max) * 100) : 0);

function statusInfo(percent) {
  if (percent >= 80) return { color: T.emerald,  dimColor: T.emeraldDim,  label: "Satisfactorio",       border: "rgba(52,211,153,0.22)" };
  if (percent >= 50) return { color: T.amber,    dimColor: T.amberDim,    label: "En seguimiento",      border: "rgba(245,158,11,0.22)" };
  return               { color: T.purple,   dimColor: T.purpleDim,   label: "Atención requerida",  border: "rgba(167,139,250,0.22)" };
}

// ─── Base Card ──────────────────────────────────────────────────────────────────

function Card({ children, style = {}, accentColor }) {
  const topColor = accentColor ?? T.accent;
  return (
    <div
      style={{
        position: "relative",
        borderRadius: T.radius,
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        backdropFilter: "blur(20px)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${topColor} 0%, ${T.accentEnd} 100%)`,
          borderRadius: `${T.radius} ${T.radius} 0 0`,
        }}
      />
      <div style={{ paddingTop: 3 }}>{children}</div>
    </div>
  );
}

// ─── CircleProgress SVG ─────────────────────────────────────────────────────────

function CircleProgress({ percent, size = 84, stroke = 6, color }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
        style={{ stroke: "rgba(255,255,255,0.06)", fill: "none" }} />
      <circle cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
        style={{
          fill: "none",
          stroke: color,
          strokeDasharray: circ,
          strokeDashoffset: dash,
          strokeLinecap: "round",
          transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)",
          filter: `drop-shadow(0 0 6px ${color}66)`,
        }}
      />
    </svg>
  );
}

// ─── Linear ProgressBar ─────────────────────────────────────────────────────────

function ProgressBar({ percent, color }) {
  return (
    <div style={{ height: 5, width: "100%", borderRadius: 100, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${Math.min(percent, 100)}%`,
          borderRadius: 100,
          background: `linear-gradient(90deg, ${color} 0%, ${color}bb 100%)`,
          boxShadow: `0 0 8px ${color}55`,
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}

// ─── MetricCard ─────────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, percent, color }) {
  return (
    <Card accentColor={color}>
      <div style={{ padding: "20px 20px 20px" }}>
        <p style={{ margin: "0 0 14px", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
          {label}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
          <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircleProgress percent={percent} color={color} />
            <span style={{
              position: "absolute",
              fontSize: 15, fontWeight: 700,
              color: T.textPrimary,
              fontFamily: "'Syne', sans-serif",
            }}>
              {percent}%
            </span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.textPrimary, lineHeight: 1.1, fontFamily: "'Syne', sans-serif" }}>{value}</p>
            {sub && <p style={{ margin: "4px 0 0", fontSize: 11, color: T.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>{sub}</p>}
          </div>
        </div>
        <ProgressBar percent={percent} color={color} />
      </div>
    </Card>
  );
}

// ─── StatusBadge ────────────────────────────────────────────────────────────────

function StatusBadge({ percent }) {
  const s = statusInfo(percent);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 100,
      background: s.dimColor, border: `1px solid ${s.border}`,
      fontSize: 11, fontWeight: 600, color: s.color,
      fontFamily: "'DM Sans', sans-serif",
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, boxShadow: `0 0 5px ${s.color}` }} />
      {s.label}
    </span>
  );
}

// ─── MateriaRow ─────────────────────────────────────────────────────────────────

function MateriaRow({ materia, index, isLast }) {
  const asistPct   = pct(materia.asistencias_presentes, materia.asistencias_total);
  const tareaPct   = pct(materia.tareas_entregadas,     materia.tareas_total);
  const generalPct = Math.round((asistPct + tareaPct) / 2);

  const asistColor  = statusInfo(asistPct).color;
  const tareaColor  = statusInfo(tareaPct).color;

  const initials = (materia.docente ?? "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <tr
      style={{
        borderBottom: isLast ? "none" : `1px solid rgba(6,182,212,0.07)`,
        background: index % 2 === 0 ? "rgba(6,182,212,0.02)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      {/* Materia */}
      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
        <p style={{ margin: 0, fontWeight: 600, color: T.textPrimary, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{materia.nombre}</p>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: T.textMuted, fontFamily: "monospace" }}>{materia.clave || "—"}</p>
      </td>

      {/* Docente */}
      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: T.radiusXs, flexShrink: 0,
            background: "linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(29,185,84,0.10) 100%)",
            border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: T.cyan, fontFamily: "'DM Sans', sans-serif",
          }}>
            {initials}
          </div>
          <span style={{ fontSize: 13, color: T.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>{materia.docente ?? "Sin asignar"}</span>
        </div>
      </td>

      {/* Asistencia */}
      <td style={{ padding: "16px 20px", verticalAlign: "middle", minWidth: 140 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>Asistencia</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: asistColor, fontFamily: "'Syne', sans-serif" }}>{asistPct}%</span>
        </div>
        <ProgressBar percent={asistPct} color={asistColor} />
        <p style={{ margin: "5px 0 0", fontSize: 10, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
          {materia.asistencias_presentes}/{materia.asistencias_total} clases
        </p>
      </td>

      {/* Tareas */}
      <td style={{ padding: "16px 20px", verticalAlign: "middle", minWidth: 140 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>Tareas</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: tareaColor, fontFamily: "'Syne', sans-serif" }}>{tareaPct}%</span>
        </div>
        <ProgressBar percent={tareaPct} color={tareaColor} />
        <p style={{ margin: "5px 0 0", fontSize: 10, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
          {materia.tareas_entregadas}/{materia.tareas_total} entregadas
        </p>
      </td>

      {/* Estatus */}
      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
        <StatusBadge percent={generalPct} />
      </td>
    </tr>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton({ width = "100%", height = 16, radius = T.radiusXs }) {
  return (
    <div style={{ width, height, borderRadius: radius, background: "rgba(6,182,212,0.08)", animation: "pulse 1.6s ease-in-out infinite" }} />
  );
}

// ─── AlumnoDashboard ────────────────────────────────────────────────────────────

export default function AlumnoDashboard() {
  const { user }                      = useContext(AuthContext);
  const [materias,  setMaterias]      = useState([]);
  const [resumen,   setResumen]       = useState(null);
  const [loading,   setLoading]       = useState(true);
  const [error,     setError]         = useState(null);
  const [searchQ,   setSearchQ]       = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Rutas relativas: Axios concatena estas con el baseURL definido en api.js
        // Resultado final: <baseURL>/academico/alumnos/resumen/  y  <baseURL>/academico/alumnos/materias/
        const [resRes, matRes] = await Promise.all([
          api.get("academico/alumnos/resumen/"),
          api.get("academico/alumnos/materias/"),
        ]);
        if (!cancelled) {
          setResumen(resRes.data.alumno || resRes.data);
          setMaterias(matRes.data.materias || []);
        }
      } catch (err) {
        console.error("Error detallado:", err);
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

  const globalAsist  = resumen?.asistencia_global ?? (materias.length ? Math.round(materias.reduce((a, m) => a + pct(m.asistencias_presentes, m.asistencias_total), 0) / materias.length) : 0);
  const globalTareas = resumen?.tareas_global     ?? (materias.length ? Math.round(materias.reduce((a, m) => a + pct(m.tareas_entregadas, m.tareas_total),      0) / materias.length) : 0);
  const cumplimiento = Math.round((globalAsist + globalTareas) / 2);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Google Fonts + keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        * { box-sizing: border-box; }
        tr:hover td { background: rgba(6,182,212,0.04) !important; }
        input::placeholder { color: rgba(154,165,183,0.45); }
        input:focus { outline: none; border-color: rgba(6,182,212,0.45) !important; box-shadow: 0 0 0 3px rgba(6,182,212,0.10); }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          fontFamily: "'DM Sans', sans-serif",
          ...DOTS_BG,
        }}
      >
        {/* Ambient glow blobs */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "-120px", left: "-120px", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: "-80px", right: "-80px", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(29,185,84,0.06) 0%, transparent 70%)" }} />
        </div>

        <main style={{ position: "relative", zIndex: 1, maxWidth: 1120, margin: "0 auto", padding: "40px 24px 60px" }}>

          {/* ── Header ── */}
          <header style={{ marginBottom: 36 }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: T.cyan, fontFamily: "'DM Sans', sans-serif" }}>
              Portal del Estudiante · CECyTEM Toluca II
            </p>
            <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: T.textPrimary, fontFamily: "'Syne', sans-serif", lineHeight: 1.2 }}>
              Bienvenido,{" "}
              <span style={{ background: `linear-gradient(90deg, ${T.accent} 0%, ${T.cyan} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {user?.nombre ?? user?.username ?? "Alumno"}
              </span>
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
              Ciclo escolar activo · Consulta tu avance académico en tiempo real
            </p>
          </header>

          {/* ── Metric Cards Grid ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
            {loading ? (
              <>
                <Skeleton height={148} radius={T.radius} />
                <Skeleton height={148} radius={T.radius} />
                <Skeleton height={148} radius={T.radius} />
              </>
            ) : (
              <>
                <MetricCard
                  label="Cumplimiento General"
                  value={`${cumplimiento}%`}
                  sub="Promedio asistencia + tareas"
                  percent={cumplimiento}
                  color={T.accent}
                />
                <MetricCard
                  label="Asistencia Global"
                  value={`${globalAsist}%`}
                  sub={`${materias.length} materia${materias.length !== 1 ? "s" : ""} registrada${materias.length !== 1 ? "s" : ""}`}
                  percent={globalAsist}
                  color={T.emerald}
                />
                <MetricCard
                  label="Entrega de Tareas"
                  value={`${globalTareas}%`}
                  sub="Promedio entre todas las materias"
                  percent={globalTareas}
                  color={T.amber}
                />
              </>
            )}
          </div>

          {/* ── Materias Panel ── */}
          <Card>
            {/* Panel header */}
            <div style={{
              display: "flex", flexWrap: "wrap", alignItems: "center",
              justifyContent: "space-between", gap: 16,
              padding: "20px 24px 18px",
              borderBottom: `1px solid rgba(6,182,212,0.09)`,
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.textPrimary, fontFamily: "'Syne', sans-serif" }}>
                  Materias Inscritas
                </h2>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                  {loading ? "Cargando…" : `${filtered.length} de ${materias.length} materia${materias.length !== 1 ? "s" : ""}`}
                </p>
              </div>

              {/* Search input */}
              <div style={{ position: "relative", width: 240 }}>
                <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: T.textMuted, pointerEvents: "none" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar materia o docente…"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  style={{
                    width: "100%",
                    paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
                    borderRadius: T.radiusSm,
                    background: "rgba(5,18,32,0.60)",
                    border: `1px solid ${T.border}`,
                    fontSize: 13, color: T.textPrimary,
                    fontFamily: "'DM Sans', sans-serif",
                    backdropFilter: "blur(8px)",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                margin: "16px 24px 0",
                padding: "12px 16px", borderRadius: T.radiusXs,
                background: T.amberDim, border: "1px solid rgba(245,158,11,0.25)",
              }}>
                <svg style={{ width: 18, height: 18, color: T.amber, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
                <p style={{ margin: 0, fontSize: 13, color: T.amber, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
              </div>
            )}

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid rgba(6,182,212,0.10)` }}>
                    {["Materia", "Docente", "Asistencia", "Tareas", "Estatus"].map(h => (
                      <th key={h} style={{
                        padding: "12px 20px", textAlign: "left",
                        fontSize: 10, fontWeight: 700,
                        letterSpacing: "0.18em", textTransform: "uppercase",
                        color: T.cyan, fontFamily: "'DM Sans', sans-serif",
                        whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid rgba(6,182,212,0.07)` }}>
                          {[180, 140, 130, 130, 110].map((w, j) => (
                            <td key={j} style={{ padding: "16px 20px" }}>
                              <Skeleton width={w} height={14} />
                            </td>
                          ))}
                        </tr>
                      ))
                    : filtered.length === 0
                      ? (
                        <tr>
                          <td colSpan={5} style={{ padding: "56px 20px", textAlign: "center", fontSize: 13, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                            {searchQ ? "No se encontraron materias con ese criterio." : "No hay materias inscritas en este ciclo."}
                          </td>
                        </tr>
                      )
                      : filtered.map((m, i) => (
                          <MateriaRow key={m.id ?? i} materia={m} index={i} isLast={i === filtered.length - 1} />
                        ))
                  }
                </tbody>
              </table>
            </div>

            {/* Legend */}
            {!loading && (
              <div style={{
                display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20,
                padding: "14px 24px",
                borderTop: `1px solid rgba(6,182,212,0.09)`,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                  Leyenda:
                </span>
                {[
                  { color: T.emerald, label: "Satisfactorio (≥ 80%)" },
                  { color: T.amber,   label: "En seguimiento (50–79%)" },
                  { color: T.purple,  label: "Atención requerida (< 50%)" },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}88`, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: T.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Footer ── */}
          <footer style={{ marginTop: 36, textAlign: "center", fontSize: 11, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
            CECyTEM Plantel Toluca II · Sistema de Seguimiento Académico
          </footer>
        </main>
      </div>
    </>
  );
}