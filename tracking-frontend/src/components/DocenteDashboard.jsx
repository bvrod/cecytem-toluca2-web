import { useState, useEffect, useCallback, useMemo } from "react";
import { Navbar } from './Navbar';
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ─── Design Tokens ─────────────────────────────────────────────────────────────

const T = {
  bg:            "#082030",
  surface:       "rgba(5,18,32,0.72)",
  surfaceDeep:   "rgba(4,13,24,0.97)",
  border:        "rgba(6,182,212,0.18)",
  borderStrong:  "rgba(6,182,212,0.32)",
  borderGreen:   "rgba(29,185,84,0.28)",
  accent:        "#1db954",
  accentEnd:     "#159b45",
  accentGlow:    "rgba(29,185,84,0.15)",
  cyan:          "#06b6d4",
  cyanDim:       "rgba(6,182,212,0.10)",
  textPrimary:   "#e5e7eb",
  textSecondary: "#9aa5b7",
  textMuted:     "#4d6070",
  amber:         "#f59e0b",
  amberDim:      "rgba(245,158,11,0.12)",
  amberBorder:   "rgba(245,158,11,0.25)",
  emerald:       "#34d399",
  emeraldDim:    "rgba(52,211,153,0.10)",
  danger:        "rgba(239,68,68,0.10)",
  dangerBorder:  "rgba(239,68,68,0.25)",
  dangerText:    "#fca5a5",
  radius:        "20px",
  radiusSm:      "12px",
  radiusXs:      "8px",
  shadow:        "0 25px 80px rgba(2,10,20,0.55)",
  shadowSm:      "0 8px 30px rgba(2,10,20,0.40)",
};

const DOTS_BG = {
  backgroundImage: `radial-gradient(rgba(6,182,212,0.18) 1.5px, transparent 1.5px)`,
  backgroundSize:  "26px 26px",
};

const inputStyle = {
  width: "100%",
  background: "rgba(5,18,32,0.55)",
  border: `1px solid ${T.border}`,
  borderRadius: T.radiusXs,
  padding: "9px 12px",
  fontSize: 12,
  color: T.textPrimary,
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.2s, box-shadow 0.2s",
  backdropFilter: "blur(8px)",
};

// ─── Utilidades ─────────────────────────────────────────────────────────────────

function isLocked(fechaVencimiento) {
  if (!fechaVencimiento) return false;
  return (new Date() - new Date(fechaVencimiento)) / (1000 * 60 * 60 * 24) > 7;
}

function extractNombreMateria(asignacion) {
  if (!asignacion) return "Materia";
  return (
    asignacion.nombre_materia || asignacion.materia_nombre ||
    asignacion.materia?.nombre || asignacion.materia?.clave ||
    (typeof asignacion.materia === 'object' ? "Asignación Académica" : `Materia (ID: ${asignacion.materia})`)
  );
}

function extractNombreGrupo(asignacion) {
  if (!asignacion) return "Grupo";
  return (
    asignacion.nombre_grupo || asignacion.detalle_grupo ||
    asignacion.grupo_nombre || asignacion.grupo?.nombre ||
    asignacion.grupo?.codigo || `Grupo: ${asignacion.grupo}`
  );
}

function extractAula(asignacion) {
  if (!asignacion) return "Por asignar";
  return asignacion.aula_nombre || asignacion.salon || asignacion.aula || "Por asignar";
}

function normalizeArrayResponse(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  return (
    data.asignaciones || data.results || data.data ||
    (Array.isArray(data.asignacion) ? data.asignacion : [])
  );
}

// ─── Glass Card ─────────────────────────────────────────────────────────────────

function Card({ children, style = {}, accentColor, padding = "0" }) {
  const topColor = accentColor ?? T.accent;
  return (
    <div style={{
      position: "relative",
      borderRadius: T.radius,
      background: T.surface,
      border: `1px solid ${T.border}`,
      boxShadow: T.shadow,
      backdropFilter: "blur(20px)",
      overflow: "hidden",
      padding,
      ...style,
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${topColor} 0%, ${T.accentEnd} 100%)`,
        borderRadius: `${T.radius} ${T.radius} 0 0`,
      }} />
      <div style={{ paddingTop: 3, height: "100%" }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label style={{
      display: "block", marginBottom: 6,
      fontSize: 10, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.18em", color: T.textMuted,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {children}
    </label>
  );
}

// ─── DocenteDashboard ───────────────────────────────────────────────────────────

export default function DocenteDashboard() {
  const { user } = useAuth();

  const [asignaciones,       setAsignaciones]       = useState([]);
  const [selectedAsignacion, setSelectedAsignacion] = useState(null);
  const [actividades,        setActividades]        = useState([]);
  const [alumnos,            setAlumnos]            = useState([]);
  const [asistencia,         setAsistencia]         = useState({});
  const [evaluaciones,       setEvaluaciones]       = useState({});
  const [searchQuery,        setSearchQuery]        = useState("");
  const [loadingDashboard,   setLoadingDashboard]   = useState(true);
  const [loadingDetalles,    setLoadingDetalles]    = useState(false);
  const [showModal,          setShowModal]          = useState(false);
  const [error,              setError]              = useState(null);
  const [selectedActividad,  setSelectedActividad]  = useState(null);

  // ── Cargar asignaciones ────────────────────────────────────────────────────

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingDashboard(true);
      setError(null);
      const res = await api.get("academico/docentes/dashboard/");
      const data = normalizeArrayResponse(res.data);
      setAsignaciones(data);
      if (selectedAsignacion) {
        const updated = data.find(a => a.id === selectedAsignacion.id);
        if (updated) setSelectedAsignacion(updated);
      }
    } catch {
      setError("No se pudieron cargar tus asignaciones. Intenta recargar la página.");
    } finally {
      setLoadingDashboard(false);
    }
  }, [selectedAsignacion]);

  useEffect(() => { fetchDashboardData(); }, []);

  // ── Cargar detalles ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedAsignacion?.id) { setActividades([]); setAlumnos([]); return; }

    const fetchDetalles = async () => {
      try {
        setLoadingDetalles(true);
        setError(null);
        const [resAct, resAlu] = await Promise.all([
          api.get(`seguimiento/actividades/?asignacion=${selectedAsignacion.id}`),
          api.get(`academico/alumnos/?asignacion=${selectedAsignacion.id}`).catch(() => ({ data: [] })),
        ]);
        setActividades(normalizeArrayResponse(resAct.data));
        const lista = normalizeArrayResponse(resAlu.data);
        setAlumnos(lista.length ? lista : selectedAsignacion.alumnos || selectedAsignacion.grupo?.alumnos || []);
      } catch {
        setError("No se pudieron cargar los detalles de esta materia.");
      } finally {
        setLoadingDetalles(false);
      }
    };

    fetchDetalles();
  }, [selectedAsignacion]);

  // ── Filtrado ───────────────────────────────────────────────────────────────

  const filteredAsignaciones = useMemo(() => asignaciones.filter(a => {
    if (!a) return false;
    const q = String(searchQuery).toLowerCase();
    return (
      String(extractNombreMateria(a)).toLowerCase().includes(q) ||
      String(extractNombreGrupo(a)).toLowerCase().includes(q) ||
      String(extractAula(a)).toLowerCase().includes(q)
    );
  }), [asignaciones, searchQuery]);

  // ── Guardar asistencia ─────────────────────────────────────────────────────
  // CORRECCIÓN: ruta sin barra inicial para respetar el baseURL de Axios

  const guardarAsistencia = async () => {
    if (!selectedActividad) {
      alert("Selecciona una actividad para registrar la asistencia");
      return;
    }
    try {
      const res = await api.post("seguimiento/cumplimiento/guardar_asistencia/", {
        actividad_id: selectedActividad,
        asistencias: asistencia,
        evaluaciones,
      });
      alert(`✅ Se guardaron ${res.data.registros_guardados} registros`);
      setAsistencia({});
      setEvaluaciones({});
      setSelectedActividad(null);
    } catch (err) {
      alert(`❌ ${err.response?.data?.detail || "Error al guardar"}`);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: rgba(6,182,212,0.04); }
        ::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.18); border-radius: 4px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        input::placeholder, textarea::placeholder { color: ${T.textMuted}; }
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: rgba(6,182,212,0.40) !important;
          box-shadow: 0 0 0 3px rgba(6,182,212,0.08);
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', sans-serif", ...DOTS_BG }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
          <div style={{ position: "absolute", top: -120, left: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: -80, right: -80, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(29,185,84,0.05) 0%, transparent 70%)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />

          <main style={{
            maxWidth: 1600, margin: "0 auto",
            padding: "20px 24px",
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 20,
            height: "calc(100vh - 60px)",
            overflow: "hidden",
          }}>

            {/* ── PANEL IZQUIERDO ── */}
            <aside style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", overflow: "hidden" }}>
              <Card accentColor={T.cyan}>
                <div style={{ padding: "18px 18px 16px" }}>
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.textMuted }}>
                      Portal Docente · CECyTEM
                    </p>
                    <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.textPrimary, fontFamily: "'Syne', sans-serif", lineHeight: 1.2 }}>
                      {user?.nombre || user?.username || "Docente"}
                    </h1>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: T.textMuted }}>
                      {loadingDashboard ? "Cargando..." : `${asignaciones.length} asignación${asignaciones.length !== 1 ? "es" : ""} activa${asignaciones.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>

                  <div style={{ position: "relative" }}>
                    <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: T.textMuted, pointerEvents: "none" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar materia, grupo o aula..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: 32 }}
                    />
                  </div>
                </div>
              </Card>

              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 2 }}>
                {loadingDashboard ? (
                  <LoadingSpinner message="Cargando tus clases del CECyTEM..." />
                ) : error ? (
                  <ErrorBanner message={error} />
                ) : filteredAsignaciones.length === 0 ? (
                  <EmptyState icon="📋" title="Sin asignaciones" message={searchQuery ? "Ninguna clase coincide con tu búsqueda." : "Ninguna asignación disponible."} />
                ) : filteredAsignaciones.map(asignacion => (
                  <ClassroomCard
                    key={asignacion.id}
                    asignacion={asignacion}
                    isSelected={selectedAsignacion?.id === asignacion.id}
                    onClick={() => setSelectedAsignacion(asignacion)}
                    actividadesCount={asignacion.actividades_count || 0}
                  />
                ))}
              </div>
            </aside>

            {/* ── PANEL DERECHO ── */}
            <Card style={{ height: "100%", overflow: "hidden" }}>
              <div style={{ height: "100%", overflowY: "auto", padding: "20px 24px" }}>
                {selectedAsignacion ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>

                    <div style={{
                      display: "flex", flexWrap: "wrap", alignItems: "flex-start",
                      justifyContent: "space-between", gap: 14,
                      paddingBottom: 18,
                      borderBottom: `1px solid rgba(6,182,212,0.10)`,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: "0.16em", color: T.cyan,
                            background: T.cyanDim, border: `1px solid ${T.border}`,
                            padding: "3px 10px", borderRadius: T.radiusXs,
                          }}>
                            Clase seleccionada
                          </span>
                          <span style={{ fontSize: 10, fontFamily: "monospace", color: T.textMuted }}>
                            ID: {selectedAsignacion.id}
                          </span>
                        </div>
                        <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: T.textPrimary, fontFamily: "'Syne', sans-serif", lineHeight: 1.2 }}>
                          {extractNombreMateria(selectedAsignacion)}
                        </h2>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: T.textSecondary }}>
                          <span>Grupo: <strong style={{ color: T.cyan }}>{extractNombreGrupo(selectedAsignacion)}</strong></span>
                          <span>Aula: <strong style={{ color: T.cyan }}>{extractAula(selectedAsignacion)}</strong></span>
                          <span style={{ color: T.textMuted }}>{selectedAsignacion.total_alumnos || alumnos.length || 0} alumnos</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowModal(true)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "10px 20px", borderRadius: T.radiusSm,
                          background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentEnd} 100%)`,
                          border: "none", color: "#fff",
                          fontSize: 12, fontWeight: 700, cursor: "pointer",
                          boxShadow: `0 4px 20px ${T.accentGlow}`,
                          fontFamily: "'DM Sans', sans-serif",
                          transition: "filter 0.18s, transform 0.1s",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.1)"}
                        onMouseLeave={e => e.currentTarget.style.filter = "none"}
                      >
                        + Nueva actividad
                      </button>
                    </div>

                    {loadingDetalles ? (
                      <LoadingSpinner message="Cargando detalles..." />
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flex: 1, minHeight: 0, overflow: "hidden" }}>

                        {/* Columna A: Actividades */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <h3 style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: T.textMuted }}>
                              Planeaciones
                            </h3>
                            <span style={{
                              padding: "2px 10px", borderRadius: 100,
                              background: T.cyanDim, border: `1px solid ${T.border}`,
                              fontSize: 10, fontWeight: 700, fontFamily: "monospace", color: T.cyan,
                            }}>
                              {actividades.length}
                            </span>
                          </div>
                          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                            {actividades.length === 0
                              ? <EmptyState icon="📚" title="Sin planeaciones" message="Crea la primera actividad para este grupo." />
                              : actividades.map(act => <ActivityCard key={act.id} actividad={act} />)
                            }
                          </div>
                        </div>

                        {/* Columna B: Alumnos */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <h3 style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: T.textMuted }}>
                              Alumnos matriculados
                            </h3>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{
                                padding: "2px 10px", borderRadius: 100,
                                background: T.cyanDim, border: `1px solid ${T.border}`,
                                fontSize: 10, fontWeight: 700, fontFamily: "monospace", color: T.cyan,
                              }}>
                                {alumnos.length}
                              </span>
                              {Object.keys(asistencia).length > 0 && (
                                <button
                                  onClick={guardarAsistencia}
                                  style={{
                                    padding: "4px 12px", borderRadius: T.radiusXs,
                                    background: "rgba(29,185,84,0.15)",
                                    border: `1px solid ${T.borderGreen}`,
                                    color: T.accent, fontSize: 10, fontWeight: 700,
                                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                                  }}
                                >
                                  Guardar
                                </button>
                              )}
                            </div>
                          </div>
                          <div style={{ flex: 1, overflowY: "auto", borderRadius: T.radiusSm, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                            {alumnos.length === 0 ? (
                              <EmptyState icon="📋" title="Sin alumnos" message="No se encontraron alumnos matriculados." />
                            ) : (
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                                <thead>
                                  <tr style={{ background: T.cyanDim, borderBottom: `1px solid ${T.border}` }}>
                                    {["Matrícula", "Nombre", "Asist.", "Calif.", "Acción"].map(h => (
                                      <th key={h} style={{
                                        padding: "9px 10px", textAlign: h === "Matrícula" || h === "Nombre" ? "left" : "center",
                                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                                        letterSpacing: "0.12em", color: T.cyan,
                                        fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
                                      }}>
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {alumnos.map((alu, i) => (
                                    <StudentTableRow
                                      key={alu.id}
                                      alumno={alu}
                                      idx={i}
                                      asistencia={asistencia[alu.id] || false}
                                      calificacion={evaluaciones[alu.id] || ""}
                                      onToggleAsistencia={() => setAsistencia(prev => ({ ...prev, [alu.id]: !prev[alu.id] }))}
                                      onCalificacionChange={val => setEvaluaciones(prev => ({ ...prev, [alu.id]: val }))}
                                      selectedActividad={selectedActividad}
                                      onSelectActividad={() => setSelectedActividad(selectedActividad === alu.id ? null : alu.id)}
                                    />
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: T.radiusSm, marginBottom: 20,
                      background: T.cyanDim, border: `1px solid ${T.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                    }}>
                      🏫
                    </div>
                    <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: T.textPrimary, fontFamily: "'Syne', sans-serif" }}>
                      Panel de control del docente
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: T.textMuted, maxWidth: 340, lineHeight: 1.7 }}>
                      Selecciona una de tus materias asignadas en la barra lateral para gestionar planeaciones, ver el listado de alumnos e ingresar actividades.
                    </p>
                    {asignaciones.length === 0 && (
                      <div style={{
                        marginTop: 20, padding: "12px 20px",
                        borderRadius: T.radiusXs, border: `1px dashed ${T.border}`,
                        background: T.cyanDim, fontSize: 11, color: T.textMuted,
                      }}>
                        Parece que no tienes asignaciones aún. Contacta a Dirección.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

          </main>
        </div>
      </div>

      {showModal && selectedAsignacion && (
        <ModalNuevaActividad
          asignacion={selectedAsignacion}
          nombreMateria={extractNombreMateria(selectedAsignacion)}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchDashboardData(); }}
        />
      )}
    </>
  );
}

// ─── ClassroomCard ──────────────────────────────────────────────────────────────

function ClassroomCard({ asignacion, isSelected, onClick, actividadesCount }) {
  const nombre = extractNombreMateria(asignacion);
  const grupo  = extractNombreGrupo(asignacion);
  const aula   = extractAula(asignacion);
  const total  = asignacion.total_alumnos || 0;
  const activo = actividadesCount > 0;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
      style={{
        cursor: "pointer", borderRadius: T.radiusSm, overflow: "hidden",
        border: `1px solid ${isSelected ? T.borderGreen : T.border}`,
        background: isSelected
          ? "linear-gradient(135deg, rgba(29,185,84,0.10) 0%, rgba(6,182,212,0.06) 100%)"
          : T.surface,
        backdropFilter: "blur(20px)",
        boxShadow: isSelected ? `0 0 24px ${T.accentGlow}` : T.shadowSm,
        transition: "all 0.18s",
        outline: isSelected ? `2px solid rgba(29,185,84,0.35)` : "none",
        outlineOffset: 2,
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = T.borderStrong; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = T.border; }}
    >
      <div style={{
        height: 3,
        background: isSelected
          ? `linear-gradient(90deg, ${T.accent} 0%, ${T.accentEnd} 100%)`
          : `linear-gradient(90deg, ${T.cyan} 0%, rgba(6,182,212,0.4) 100%)`,
      }} />

      <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid rgba(6,182,212,0.08)` }}>
        <h3 style={{
          margin: 0, fontSize: 12, fontWeight: 700, color: T.textPrimary,
          fontFamily: "'Syne', sans-serif",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }} title={nombre}>
          {nombre}
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: T.cyan, fontWeight: 600 }}>
          Gr. {grupo}
        </p>
      </div>

      <div style={{ padding: "10px 14px 12px", fontSize: 11, color: T.textSecondary }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span>{aula}</span>
          <span style={{ color: T.textMuted, fontFamily: "monospace" }}>{total} alumnos</span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: 8, borderTop: `1px solid rgba(6,182,212,0.07)`,
        }}>
          {activo ? (
            <span style={{
              fontSize: 10, fontWeight: 700, color: T.accent,
              background: T.accentGlow, border: `1px solid ${T.borderGreen}`,
              padding: "2px 8px", borderRadius: 100,
            }}>
              ✓ Activa ({actividadesCount})
            </span>
          ) : (
            <span style={{
              fontSize: 10, fontWeight: 700, color: T.amber,
              background: T.amberDim, border: `1px solid ${T.amberBorder}`,
              padding: "2px 8px", borderRadius: 100,
            }}>
              Requiere planeación
            </span>
          )}
          <span style={{ color: isSelected ? T.accent : T.textMuted, fontSize: 13, transition: "transform 0.2s" }}>→</span>
        </div>
      </div>
    </div>
  );
}

// ─── ActivityCard ───────────────────────────────────────────────────────────────

function ActivityCard({ actividad }) {
  const locked = isLocked(actividad.fecha_limite);
  const dias   = actividad.fecha_limite
    ? Math.ceil((new Date(actividad.fecha_limite) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const statusColor = locked ? T.dangerText : dias !== null && dias <= 3 ? T.amber : T.emerald;

  return (
    <div style={{
      padding: "12px 14px", borderRadius: T.radiusXs,
      background: T.cyanDim, border: `1px solid ${T.border}`,
      transition: "border-color 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.borderStrong}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.textPrimary, flex: 1, lineHeight: 1.4, fontFamily: "'Syne', sans-serif" }}>
          {actividad.titulo}
        </h4>
        <span style={{
          padding: "2px 7px", borderRadius: T.radiusXs, flexShrink: 0,
          background: "rgba(6,182,212,0.08)", border: `1px solid ${T.border}`,
          fontSize: 9, fontWeight: 700, fontFamily: "monospace", color: T.cyan,
        }}>
          S{actividad.semana}
        </span>
      </div>
      {actividad.descripcion && (
        <p style={{ margin: "0 0 8px", fontSize: 11, color: T.textSecondary, lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {actividad.descripcion}
        </p>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textMuted }}>
        <span>
          {new Date(actividad.fecha_limite || "").toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
        </span>
        {dias !== null && (
          <span style={{ fontWeight: 700, color: statusColor }}>
            {locked ? "🔒 Bloqueada" : dias <= 0 ? "Hoy" : `${dias}d restantes`}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── StudentTableRow ────────────────────────────────────────────────────────────

function StudentTableRow({ alumno, idx, asistencia, calificacion, onToggleAsistencia, onCalificacionChange, selectedActividad, onSelectActividad }) {
  const nombre = alumno.nombre_completo || alumno.alumno_nombre ||
    `${alumno.nombre || ""} ${alumno.apellido || ""}`.trim() || "Sin nombre";
  const matricula = alumno.matricula || alumno.id || "—";

  return (
    <tr style={{ borderBottom: `1px solid rgba(6,182,212,0.07)`, background: idx % 2 === 0 ? "rgba(6,182,212,0.02)" : "transparent" }}>
      <td style={{ padding: "9px 10px", fontFamily: "monospace", fontSize: 10, color: T.textMuted }}>{matricula}</td>
      <td style={{ padding: "9px 10px", fontSize: 11, fontWeight: 600, color: T.textPrimary, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombre}</td>
      <td style={{ padding: "9px 10px", textAlign: "center" }}>
        <button
          onClick={onToggleAsistencia}
          style={{
            width: 24, height: 24, borderRadius: "50%",
            background: asistencia ? "rgba(29,185,84,0.20)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${asistencia ? T.borderGreen : T.border}`,
            color: asistencia ? T.accent : T.textMuted,
            fontSize: 12, cursor: "pointer", transition: "all 0.15s",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {asistencia ? "✓" : "–"}
        </button>
      </td>
      <td style={{ padding: "9px 10px", textAlign: "center" }}>
        <input
          type="number" min="0" max="10"
          value={calificacion}
          onChange={e => onCalificacionChange(e.target.value)}
          placeholder="–"
          style={{
            width: 44, padding: "4px 6px", textAlign: "center",
            background: "rgba(5,18,32,0.55)", border: `1px solid ${T.border}`,
            borderRadius: T.radiusXs, color: T.textPrimary, fontSize: 11,
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      </td>
      <td style={{ padding: "9px 10px", textAlign: "center" }}>
        <button
          onClick={onSelectActividad}
          style={{
            padding: "3px 10px", borderRadius: T.radiusXs,
            background: selectedActividad ? "rgba(29,185,84,0.18)" : T.cyanDim,
            border: `1px solid ${selectedActividad ? T.borderGreen : T.border}`,
            color: selectedActividad ? T.accent : T.cyan,
            fontSize: 10, fontWeight: 700, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
          }}
        >
          Reg.
        </button>
      </td>
    </tr>
  );
}

// ─── EmptyState ─────────────────────────────────────────────────────────────────

function EmptyState({ icon, title, message }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", textAlign: "center", padding: 24,
      border: `1px dashed ${T.border}`, borderRadius: T.radiusSm,
      background: T.cyanDim, minHeight: 120,
    }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <h4 style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: T.textSecondary, fontFamily: "'Syne', sans-serif" }}>{title}</h4>
      <p style={{ margin: 0, fontSize: 11, color: T.textMuted, lineHeight: 1.6, maxWidth: 180 }}>{message}</p>
    </div>
  );
}

// ─── LoadingSpinner ──────────────────────────────────────────────────────────────

function LoadingSpinner({ message }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${T.cyan}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <p style={{ margin: 0, fontSize: 11, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{message}</p>
    </div>
  );
}

// ─── ErrorBanner ────────────────────────────────────────────────────────────────

function ErrorBanner({ message }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
      borderRadius: T.radiusXs, background: T.amberDim, border: `1px solid ${T.amberBorder}`,
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
      <p style={{ margin: 0, fontSize: 12, color: T.amber, fontFamily: "'DM Sans', sans-serif" }}>{message}</p>
    </div>
  );
}

// ─── ModalNuevaActividad ────────────────────────────────────────────────────────

function ModalNuevaActividad({ asignacion, nombreMateria, onClose, onCreated }) {
  const [formData,   setFormData]   = useState({ titulo: "", descripcion: "", semana: "1", fecha_limite: "" });
  const [enviando,   setEnviando]   = useState(false);
  const [errorLocal, setErrorLocal] = useState(null);

  const set = (field, value) => { setFormData(prev => ({ ...prev, [field]: value })); setErrorLocal(null); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.titulo.trim()) { setErrorLocal("El título de la actividad es obligatorio."); return; }
    if (!formData.fecha_limite)  { setErrorLocal("Debes especificar una fecha límite."); return; }
    setEnviando(true);
    try {
      const fecha = new Date(formData.fecha_limite + "T00:00:00");
      // CORRECCIÓN: ruta sin barra inicial
      await api.post("seguimiento/actividades/", {
        asignacion: typeof asignacion === 'object' ? asignacion.id : asignacion,
        titulo:      formData.titulo.trim(),
        descripcion: formData.descripcion.trim() || "",
        semana:      parseInt(formData.semana, 10),
        mes:         fecha.getMonth() + 1,
        fecha_limite: formData.fecha_limite,
      });
      onCreated();
    } catch (err) {
      let msg = "No se pudo guardar la actividad.";
      if (err.response?.data) {
        const d = err.response.data;
        msg = typeof d === 'object'
          ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\n")
          : String(d);
      }
      setErrorLocal(msg);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, background: "rgba(2,8,16,0.80)", backdropFilter: "blur(8px)",
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        borderRadius: T.radius,
        background: T.surfaceDeep,
        border: `1px solid ${T.borderStrong}`,
        boxShadow: T.shadow,
        backdropFilter: "blur(24px)",
        overflow: "hidden",
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${T.accent} 0%, ${T.accentEnd} 100%)` }} />

        <div style={{ padding: "20px 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: T.textPrimary, fontFamily: "'Syne', sans-serif" }}>
                Nueva actividad
              </h3>
              <p style={{ margin: 0, fontSize: 11, color: T.cyan, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>
                {nombreMateria}
              </p>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: T.radiusXs, flexShrink: 0,
              background: T.cyanDim, border: `1px solid ${T.border}`,
              color: T.textSecondary, cursor: "pointer", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              ✕
            </button>
          </div>

          {errorLocal && (
            <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: T.radiusXs, background: T.danger, border: `1px solid ${T.dangerBorder}` }}>
              <p style={{ margin: 0, fontSize: 12, color: T.dangerText, whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif" }}>{errorLocal}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <FieldLabel>Título de la actividad *</FieldLabel>
              <input type="text" required placeholder="Ej. Práctica 1: Modelado de Datos"
                value={formData.titulo} onChange={e => set('titulo', e.target.value)}
                style={inputStyle} />
            </div>

            <div>
              <FieldLabel>Instrucciones o criterios</FieldLabel>
              <textarea rows={3} placeholder="Describe qué deben hacer los alumnos..."
                value={formData.descripcion} onChange={e => set('descripcion', e.target.value)}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <FieldLabel>Semana *</FieldLabel>
                <select value={formData.semana} onChange={e => set('semana', e.target.value)}
                  style={{ ...inputStyle, colorScheme: "dark" }}>
                  {[1,2,3,4,5].map(s => <option key={s} value={s} style={{ background: "#04141e" }}>Semana {s}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Fecha límite *</FieldLabel>
                <input type="date" required value={formData.fecha_limite}
                  onChange={e => set('fecha_limite', e.target.value)}
                  style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
              <button type="button" onClick={onClose} disabled={enviando}
                style={{ padding: "9px 16px", borderRadius: T.radiusXs, border: "none", background: "transparent", color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Cancelar
              </button>
              <button type="submit" disabled={enviando}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 20px", borderRadius: T.radiusSm, border: "none",
                  background: enviando ? "rgba(29,185,84,0.30)" : `linear-gradient(135deg, ${T.accent} 0%, ${T.accentEnd} 100%)`,
                  color: "#fff", fontSize: 12, fontWeight: 700, cursor: enviando ? "not-allowed" : "pointer",
                  boxShadow: enviando ? "none" : `0 4px 20px ${T.accentGlow}`,
                  fontFamily: "'DM Sans', sans-serif", opacity: enviando ? 0.7 : 1, transition: "all 0.18s",
                }}>
                {enviando
                  ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Publicando...</>
                  : "Publicar actividad"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}