import { useState, useEffect, useCallback } from "react";
// En la línea 2 de tu DocenteDashboard.jsx, cámbialo a esto:
import { Navbar } from './Navbar'; 
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ─── RN15: bloqueo si han pasado más de 7 días del vencimiento ────────────────
function isLocked(fechaVencimiento) {
  if (!fechaVencimiento) return false;
  const venc = new Date(fechaVencimiento);
  const now = new Date();
  const diffMs = now - venc;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 7;
}

function diasDesdeVencimiento(fechaVencimiento) {
  if (!fechaVencimiento) return 0;
  const venc = new Date(fechaVencimiento);
  const now = new Date();
  const diffMs = now - venc;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function LockBadge({ dias }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-amber-300 border border-amber-800/40"
      style={{ background: "rgba(120,60,0,0.2)" }}>
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/>
      </svg>
      Bloqueado — {dias} días vencido (RN15)
    </div>
  );
}

function StatusBadge({ cumplido }) {
  if (cumplido === null || cumplido === undefined)
    return <span className="text-xs text-gray-500 italic">Sin registrar</span>;
  return cumplido ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-700/40">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Cumplido
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800/60 text-gray-400 border border-gray-700/40">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />Pendiente
    </span>
  );
}

const inputClass = "w-full bg-gray-900/60 border border-purple-900/40 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-600/70 transition-all";

// ─── Asignacion Card ──────────────────────────────────────────────────────────

function AsignacionCard({ asignacion, selected, onSelect }) {
  const locked = isLocked(asignacion.actividad_vencimiento);
  return (
    <button
      onClick={() => !locked && onSelect(asignacion)}
      className={`w-full text-left rounded-2xl p-4 transition-all duration-200 ${
        selected
          ? "ring-2 ring-purple-500"
          : "hover:bg-purple-900/10"
      } ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      style={{
        background: selected ? "rgba(88,28,135,0.2)" : "rgba(88,28,135,0.07)",
        border: `1px solid ${selected ? "rgba(88,28,135,0.6)" : "rgba(88,28,135,0.2)"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-200 text-sm truncate">{asignacion.materia_nombre}</div>
          <div className="text-xs text-gray-500 mt-0.5">{asignacion.grupo_nombre} · {asignacion.periodo}</div>
        </div>
        {locked && (
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      {asignacion.actividad_nombre && (
        <div className="mt-2 text-xs text-purple-400 truncate">
          📌 {asignacion.actividad_nombre}
        </div>
      )}
      {asignacion.actividad_vencimiento && (
        <div className={`text-xs mt-1 ${locked ? "text-amber-500" : "text-gray-600"}`}>
          Vence: {new Date(asignacion.actividad_vencimiento).toLocaleDateString("es-MX")}
          {locked && ` · ${diasDesdeVencimiento(asignacion.actividad_vencimiento)}d vencido`}
        </div>
      )}
    </button>
  );
}

// ─── Evaluation Panel ─────────────────────────────────────────────────────────

function EvaluacionPanel({ asignacion, onSuccess }) {
  const [alumnos, setAlumnos] = useState([]);
  const [checks, setChecks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const locked = isLocked(asignacion.actividad_vencimiento);
  const diasVenc = diasDesdeVencimiento(asignacion.actividad_vencimiento);

  useEffect(() => {
    const loadAlumnos = async () => {
      setLoading(true);
      setSaved(false);
      try {
        const res = await api.get(`/evaluaciones/?asignacion=${asignacion.id}`);
        const data = res.data.results ?? res.data;
        setAlumnos(data);
        // Initialize checks from existing records
        const initialChecks = {};
        data.forEach(a => { initialChecks[a.alumno_id] = a.cumplido ?? false; });
        setChecks(initialChecks);
      } catch { setAlumnos([]); }
      finally { setLoading(false); }
    };
    loadAlumnos();
  }, [asignacion.id]);

  const toggleAll = (val) => {
    if (locked) return;
    const next = {};
    alumnos.forEach(a => { next[a.alumno_id] = val; });
    setChecks(next);
  };

  const handleSave = async () => {
    if (locked) return;
    setSaving(true);
    try {
      // RN: send as array batch
      const payload = alumnos.map(a => ({
        alumno_id: a.alumno_id,
        asignacion_id: asignacion.id,
        actividad_id: asignacion.actividad_id,
        cumplido: checks[a.alumno_id] ?? false,
      }));
      await api.post("/evaluaciones/batch/", { evaluaciones: payload });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSuccess?.();
    } catch { } finally { setSaving(false); }
  };

  const totalCumplidos = Object.values(checks).filter(Boolean).length;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{
        background: "rgba(88,28,135,0.07)",
        border: "1px solid rgba(88,28,135,0.2)",
      }}
    >
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-purple-900/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-100">{asignacion.materia_nombre}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{asignacion.grupo_nombre} · {asignacion.periodo}</p>
            {asignacion.actividad_nombre && (
              <p className="text-xs text-purple-400 mt-1">📌 {asignacion.actividad_nombre}</p>
            )}
          </div>
          {locked && <LockBadge dias={diasVenc} />}
        </div>

        {/* Progress bar */}
        {alumnos.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Cumplimiento del grupo</span>
              <span className="font-semibold text-gray-300">{totalCumplidos}/{alumnos.length}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: alumnos.length ? `${(totalCumplidos / alumnos.length) * 100}%` : "0%",
                  background: "linear-gradient(90deg, #581c87, #9333ea)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      {!locked && alumnos.length > 0 && (
        <div className="px-5 py-2.5 flex items-center gap-2 border-b border-purple-900/20"
          style={{ background: "rgba(59,7,100,0.2)" }}>
          <span className="text-xs text-gray-500 mr-1">Selección rápida:</span>
          <button onClick={() => toggleAll(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-purple-300 hover:bg-purple-900/30 transition-colors border border-purple-800/40">
            ✓ Todos
          </button>
          <button onClick={() => toggleAll(false)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800/40 transition-colors border border-gray-700/40">
            ✕ Ninguno
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2" />
            Cargando alumnos...
          </div>
        ) : alumnos.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-600 text-sm">
            Sin alumnos en este grupo
          </div>
        ) : (
          <div className="divide-y divide-purple-900/15">
            {alumnos.map((alumno, idx) => {
              const checked = checks[alumno.alumno_id] ?? false;
              return (
                <label
                  key={alumno.alumno_id}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-all duration-150 ${
                    locked
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer hover:bg-purple-900/10"
                  } ${checked && !locked ? "bg-emerald-900/5" : ""}`}
                >
                  {/* Index */}
                  <span className="text-xs text-gray-700 font-mono w-5 flex-shrink-0">{idx + 1}</span>

                  {/* Checkbox */}
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      disabled={locked}
                      checked={checked}
                      onChange={e => !locked && setChecks(prev => ({ ...prev, [alumno.alumno_id]: e.target.checked }))}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                        checked
                          ? "border-emerald-500 bg-emerald-900/50"
                          : "border-gray-700 bg-gray-900/50"
                      }`}
                    >
                      {checked && (
                        <svg viewBox="0 0 24 24" className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Avatar + Name */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-purple-900/40 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
                      {alumno.nombre_completo?.split(" ").slice(0, 2).map(n => n[0]).join("") ?? "A"}
                    </div>
                    <span className="text-sm text-gray-200 truncate">{alumno.nombre_completo}</span>
                    <span className="text-xs text-gray-600 font-mono ml-auto">{alumno.matricula}</span>
                  </div>

                  {/* Current status */}
                  <StatusBadge cumplido={alumno.cumplido} />
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer / Save button */}
      {!locked && alumnos.length > 0 && (
        <div className="px-5 py-4 border-t border-purple-900/30 flex items-center justify-between"
          style={{ background: "rgba(59,7,100,0.15)" }}>
          <span className="text-xs text-gray-500">
            {totalCumplidos} de {alumnos.length} marcados
          </span>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Guardado
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #581c87, #7c3aed)" }}
            >
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {saving ? "Guardando..." : "💾 Guardar evaluación en lote"}
            </button>
          </div>
        </div>
      )}

      {locked && (
        <div className="px-5 py-4 border-t border-amber-900/30 flex items-center gap-3"
          style={{ background: "rgba(120,60,0,0.1)" }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-xs text-amber-400">
            <strong>Regla RN15 activada:</strong> Han pasado <strong>{diasVenc} días</strong> desde el vencimiento de esta actividad. El registro de evaluaciones está bloqueado.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "evaluacion", label: "Evaluación", icon: "✏️" },
  { id: "resumen", label: "Mi Resumen", icon: "📊" },
];

// ─── Resumen Section ──────────────────────────────────────────────────────────

function ResumenSection({ asignaciones }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-100">Mi Resumen Docente</h2>
        <p className="text-sm text-gray-500 mt-0.5">Panorama general de mis asignaciones y actividades</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {asignaciones.map(a => {
          const locked = isLocked(a.actividad_vencimiento);
          const dias = diasDesdeVencimiento(a.actividad_vencimiento);
          return (
            <div
              key={a.id}
              className="rounded-2xl p-5"
              style={{
                background: "rgba(88,28,135,0.08)",
                border: `1px solid ${locked ? "rgba(180,120,0,0.25)" : "rgba(88,28,135,0.2)"}`,
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-semibold text-gray-200">{a.materia_nombre}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{a.grupo_nombre}</div>
                </div>
                {locked ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                )}
              </div>

              {a.actividad_nombre && (
                <div className="text-xs text-purple-400 mb-2 truncate">📌 {a.actividad_nombre}</div>
              )}

              {a.actividad_vencimiento && (
                <div className={`text-xs ${locked ? "text-amber-500" : "text-gray-600"}`}>
                  {locked
                    ? `⚠ Venció hace ${dias} día${dias !== 1 ? "s" : ""}`
                    : `Vence: ${new Date(a.actividad_vencimiento).toLocaleDateString("es-MX")}`}
                </div>
              )}

              {a.porcentaje_cumplimiento !== undefined && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Cumplimiento</span>
                    <span className="font-semibold text-gray-300">{a.porcentaje_cumplimiento}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${a.porcentaje_cumplimiento}%`,
                        background: "linear-gradient(90deg, #581c87, #9333ea)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {asignaciones.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-600 text-sm">
            Sin asignaciones registradas
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main DocenteDashboard ────────────────────────────────────────────────────

export default function DocenteDashboard() {
  const { user } = useAuth();
  const [section, setSection] = useState("evaluacion");
  const [asignaciones, setAsignaciones] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/asignaciones/mis-asignaciones/");
      const data = res.data.results ?? res.data;
      setAsignaciones(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch { setAsignaciones([]); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const filtered = asignaciones.filter(a =>
    a.materia_nombre?.toLowerCase().includes(search.toLowerCase()) ||
    a.grupo_nombre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "#0a0514" }}>
      <Navbar activeSection={section} setActiveSection={setSection} navItems={NAV_ITEMS} />

      <main className="pt-16 h-screen flex flex-col">
        {/* Header */}
        <div className="px-6 md:px-10 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(88,28,135,0.15)" }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-100">
                Bienvenido, {user?.nombre_completo?.split(" ")[0]}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {asignaciones.length} asignación{asignaciones.length !== 1 ? "es" : ""} activa{asignaciones.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {section === "resumen" ? (
          <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
            <div className="max-w-7xl mx-auto">
              <ResumenSection asignaciones={asignaciones} />
            </div>
          </div>
        ) : (
          /* Evaluacion: two-panel layout */
          <div className="flex-1 overflow-hidden flex">
            <div className="max-w-7xl w-full mx-auto flex flex-1 overflow-hidden px-6 md:px-10 py-6 gap-5">

              {/* Left: assignment list */}
              <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
                <div className="flex-shrink-0">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Mis Asignaciones</h2>
                  <div className="relative">
                    <input
                      className="w-full bg-gray-900/60 border border-purple-900/30 rounded-xl px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50 transition-all pl-8"
                      placeholder="Buscar materia o grupo..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <svg viewBox="0 0 24 24" className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: "rgba(88,28,135,0.08)", border: "1px solid rgba(88,28,135,0.15)" }}>
                        <div className="h-3.5 bg-purple-900/40 rounded w-3/4 mb-2" />
                        <div className="h-2.5 bg-gray-800/60 rounded w-1/2" />
                      </div>
                    ))
                  ) : filtered.map(a => (
                    <AsignacionCard
                      key={a.id}
                      asignacion={a}
                      selected={selected?.id === a.id}
                      onSelect={setSelected}
                    />
                  ))}
                  {!loading && filtered.length === 0 && (
                    <p className="text-center text-gray-600 text-sm py-8">Sin resultados</p>
                  )}
                </div>
              </div>

              {/* Right: evaluation panel */}
              <div className="flex-1 overflow-hidden">
                {selected ? (
                  <EvaluacionPanel asignacion={selected} onSuccess={load} />
                ) : (
                  <div
                    className="h-full rounded-2xl flex items-center justify-center"
                    style={{ border: "1px dashed rgba(88,28,135,0.3)" }}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-gray-500 text-sm">Selecciona una asignación para comenzar a evaluar</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}