import { useState, useEffect, useCallback, useMemo } from "react";
import { Navbar } from './Navbar';
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ENDPOINTS } from "../services/endpoints";

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
function extractNombreMateria(a) {
  if (!a) return "Materia";
  return a.nombre_materia || a.materia_nombre || a.materia?.nombre || a.materia?.clave ||
    (typeof a.materia === 'object' ? "Asignación Académica" : `Materia (ID: ${a.materia})`);
}
function extractNombreGrupo(a) {
  if (!a) return "Grupo";
  return a.nombre_grupo || a.detalle_grupo || a.grupo_nombre || a.grupo?.nombre ||
    a.grupo?.codigo || `Grupo: ${a.grupo}`;
}
function extractAula(a) {
  if (!a) return "Por asignar";
  return a.aula_nombre || a.salon || a.aula || "Por asignar";
}
function normalizeArrayResponse(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  return data.asignaciones || data.results || data.data ||
    (Array.isArray(data.asignacion) ? data.asignacion : []);
}

// ─── Card ────────────────────────────────────────────────────────────────────────
function Card({ children, style = {}, accentColor, padding = "0", className = "" }) {
  const topColor = accentColor ?? T.accent;
  return (
    <div className={className} style={{
      position: "relative", borderRadius: T.radius, background: T.surface,
      border: `1px solid ${T.border}`, boxShadow: T.shadow,
      backdropFilter: "blur(20px)", overflow: "hidden", padding, ...style,
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${topColor} 0%, ${T.accentEnd} 100%)`,
      }} />
      <div style={{ paddingTop: 3, height: "100%" }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label style={{
      display: "block", marginBottom: 6, fontSize: 10, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.18em", color: T.textMuted,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {children}
    </label>
  );
}

// ─── DocenteDashboard ────────────────────────────────────────────────────────────
export default function DocenteDashboard() {
  const { user } = useAuth();

  const [asignaciones,       setAsignaciones]       = useState([]);
  const [selectedAsignacion, setSelectedAsignacion] = useState(null);
  const [actividades,        setActividades]        = useState([]);
  const [alumnos,            setAlumnos]            = useState([]);

  // Datos en edición (pendientes de guardar)
  const [entregas,           setEntregas]           = useState({});
  const [calificaciones,     setCalificaciones]     = useState({});

  // Historial ya guardado: { [actividadId]: { entregas, calificaciones, fecha } }
  const [historial,          setHistorial]          = useState({});

  // Modo edición: actividades que se están re-editando tras haber sido guardadas
  const [modoEdicion,        setModoEdicion]        = useState({});

  const [searchQuery,        setSearchQuery]        = useState("");
  const [loadingDashboard,   setLoadingDashboard]   = useState(true);
  const [loadingDetalles,    setLoadingDetalles]    = useState(false);
  const [showModal,          setShowModal]          = useState(false);
  const [error,              setError]              = useState(null);
  const [guardando,          setGuardando]          = useState(false);
  const [selectedActividad,  setSelectedActividad]  = useState(null);
  const [vistaPrincipal,     setVistaPrincipal]     = useState("clases"); // 'clases' | 'estadisticas'

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingDashboard(true); setError(null);
      const res = await api.get(ENDPOINTS.ACADEMICO.DOCENTES_DASHBOARD);
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

  useEffect(() => {
    if (!selectedAsignacion?.id) { setActividades([]); setAlumnos([]); return; }
    const fetchDetalles = async () => {
      try {
        setLoadingDetalles(true); setError(null);
        const [resAct, resAlu] = await Promise.all([
          api.get(`${ENDPOINTS.SEGUIMIENTO.ACTIVIDADES}?asignacion=${selectedAsignacion.id}`),
          api.get(`${ENDPOINTS.ACADEMICO.ALUMNOS}?asignacion=${selectedAsignacion.id}`).catch(() => ({ data: [] })),
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
    setSelectedActividad(null);
  }, [selectedAsignacion]);

  const filteredAsignaciones = useMemo(() => asignaciones.filter(a => {
    if (!a) return false;
    const q = String(searchQuery).toLowerCase();
    return (
      String(extractNombreMateria(a)).toLowerCase().includes(q) ||
      String(extractNombreGrupo(a)).toLowerCase().includes(q) ||
      String(extractAula(a)).toLowerCase().includes(q)
    );
  }), [asignaciones, searchQuery]);

  const toggleActividad = (id) => {
    setSelectedActividad(prev => prev === id ? null : id);
  };

  // ── Helpers de estado por actividad ─────────────────────────────────────────
  const estaCalificada  = (id) => !!historial[id];
  const estaEnEdicion   = (id) => !!modoEdicion[id];
  // Una actividad está "bloqueada" si ya fue guardada Y no está en modo edición
  const estaBloqueada   = (id) => estaCalificada(id) && !estaEnEdicion(id);

  // Datos que se muestran en la tabla: si está bloqueada, los del historial; si en edición, los pendientes
  const entregasVista = (actId) => {
    if (!actId) return {};
    if (estaBloqueada(actId)) return historial[actId]?.entregas || {};
    return entregas[actId] || {};
  };
  const calificacionesVista = (actId) => {
    if (!actId) return {};
    if (estaBloqueada(actId)) return historial[actId]?.calificaciones || {};
    return calificaciones[actId] || {};
  };

  const toggleEntrega = (alumnoId) => {
    if (!selectedActividad || estaBloqueada(selectedActividad)) return;
    setEntregas(prev => ({
      ...prev,
      [selectedActividad]: { ...(prev[selectedActividad] || {}), [alumnoId]: !(prev[selectedActividad]?.[alumnoId]) },
    }));
  };

  const setCalificacion = (alumnoId, value) => {
    if (!selectedActividad || estaBloqueada(selectedActividad)) return;
    setCalificaciones(prev => ({
      ...prev,
      [selectedActividad]: { ...(prev[selectedActividad] || {}), [alumnoId]: value },
    }));
  };

  const entregasActuales       = entregasVista(selectedActividad);
  const calificacionesActuales = calificacionesVista(selectedActividad);

  const hayCambiosPendientes = selectedActividad && !estaBloqueada(selectedActividad) &&
    (Object.keys(entregas[selectedActividad] || {}).length > 0 ||
     Object.keys(calificaciones[selectedActividad] || {}).length > 0);

  // ── Guardar ─────────────────────────────────────────────────────────────────
  const guardarRegistros = async () => {
    if (!selectedActividad) return;
    const entregasAct = entregas[selectedActividad] || {};
    const califAct    = calificaciones[selectedActividad] || {};
    try {
      setGuardando(true);
      const res = await api.post(ENDPOINTS.SEGUIMIENTO.GUARDAR_ASISTENCIA, {
        actividad_id:  selectedActividad,
        asistencias:   entregasAct,
        evaluaciones:  califAct,
      });

      
      // Mover al historial y marcar como calificada
      setHistorial(prev => ({
        ...prev,
        [selectedActividad]: {
          entregas:       entregasAct,
          calificaciones: califAct,
          fecha:          new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          registros:      res.data.registros_guardados,
        },
      }));
      // Limpiar pendientes y modo edición
      setEntregas(prev => { const n = { ...prev }; delete n[selectedActividad]; return n; });
      setCalificaciones(prev => { const n = { ...prev }; delete n[selectedActividad]; return n; });
      setModoEdicion(prev => { const n = { ...prev }; delete n[selectedActividad]; return n; });
    } catch (err) {
      alert(`❌ ${err.response?.data?.detail || "Error al guardar"}`);
    } finally {
      setGuardando(false);
    }
  };

    // ── Eliminar Actividad ───────────────────────────────────────────────────────
  const eliminarActividad = async (actividadId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      // Petición DELETE a la API
      await api.delete(`${ENDPOINTS.SEGUIMIENTO.ACTIVIDADES}${actividadId}/`);

      // Actualizar el estado local quitando la actividad
      setActividades((prev) => prev.filter((act) => act.id !== actividadId));

      // Si la actividad eliminada estaba seleccionada, limpiar la selección
      if (selectedActividad === actividadId) {
        setSelectedActividad(null);
      }

      // Limpiar datos del historial o estado de edición
      setHistorial((prev) => {
        const copy = { ...prev };
        delete copy[actividadId];
        return copy;
      });
      setEntregas((prev) => {
        const copy = { ...prev };
        delete copy[actividadId];
        return copy;
      });
      setCalificaciones((prev) => {
        const copy = { ...prev };
        delete copy[actividadId];
        return copy;
      });

    } catch (err) {
      alert(`❌ ${err.response?.data?.detail || "No se pudo eliminar la actividad"}`);
    }
  };


  // ── Iniciar re-edición ───────────────────────────────────────────────────────
  const iniciarEdicion = () => {
    if (!selectedActividad || !estaCalificada(selectedActividad)) return;
    // Pre-cargar los valores guardados para editar sobre ellos
    const hist = historial[selectedActividad];
    setEntregas(prev => ({ ...prev, [selectedActividad]: { ...hist.entregas } }));
    setCalificaciones(prev => ({ ...prev, [selectedActividad]: { ...hist.calificaciones } }));
    setModoEdicion(prev => ({ ...prev, [selectedActividad]: true }));
  };

  const cancelarEdicion = () => {
    if (!selectedActividad) return;
    setEntregas(prev => { const n = { ...prev }; delete n[selectedActividad]; return n; });
    setCalificaciones(prev => { const n = { ...prev }; delete n[selectedActividad]; return n; });
    setModoEdicion(prev => { const n = { ...prev }; delete n[selectedActividad]; return n; });
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const actividadSeleccionadaInfo = actividades.find(a => a.id === selectedActividad);
  const bloqueada = selectedActividad ? estaBloqueada(selectedActividad) : false;
  const enEdicion  = selectedActividad ? estaEnEdicion(selectedActividad) : false;
  const histActual = selectedActividad ? historial[selectedActividad] : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { overflow-x: hidden; }
        body { overflow-x: hidden; max-width: 100vw; }

        .docente-wrap { min-height: 100vh; width: 100%; max-width: 100vw; overflow-x: hidden; }
        .docente-main {
          max-width: 1600px; margin: 0 auto;
          padding: 20px 24px;
          display: grid; grid-template-columns: 320px 1fr;
          gap: 20px; height: calc(100vh - 60px); overflow: hidden;
        }
        .docente-aside { display: flex; flex-direction: column; gap: 16px; height: 100%; overflow: hidden; min-width: 0; }
        .aside-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 2px; }
        .docente-right-panel { height: 100%; overflow: hidden; min-width: 0; }
        .right-inner { height: 100%; overflow-y: auto; padding: 20px 24px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; flex: 1; min-height: 0; overflow: hidden; }
        .detail-col { display: flex; flex-direction: column; gap: 12px; min-height: 0; }
        .detail-col-scroll { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
        .header-row { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 14px; padding-bottom: 18px; border-bottom: 1px solid rgba(6,182,212,0.10); }
        .class-meta { display: flex; flex-wrap: wrap; gap: 8px 16px; font-size: 12px; color: #9aa5b7; }
        .table-wrap { overflow: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; border: 1px solid rgba(6,182,212,0.18); }
        .alumnos-table { width: 100%; border-collapse: collapse; font-size: 11px; min-width: 320px; }
        .status-banner { animation: fadeIn 0.2s ease; }
        .action-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .modo-toggle { display: flex; gap: 6px; padding: 4px; border-radius: 12px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .stats-scroll { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .stats-table { width: 100%; border-collapse: collapse; font-size: 11px; min-width: 320px; }

        @media (max-width: 1024px) {
          .docente-main { grid-template-columns: 260px 1fr; gap: 14px; padding: 16px; }
        }
        @media (max-width: 768px) {
          .docente-main { grid-template-columns: 1fr; height: auto; overflow: visible; padding: 10px; gap: 12px; }
          .docente-aside { height: auto; overflow: visible; }
          .aside-list { max-height: 280px; }
          .docente-right-panel { height: auto; }
          .right-inner { height: auto; padding: 16px; overflow: visible; }
          .detail-grid { grid-template-columns: 1fr; overflow: visible; min-height: auto; }
          .detail-col { min-height: auto; }
          .detail-col-scroll { overflow: visible; max-height: none; }
          .header-row { flex-direction: column; align-items: stretch; }
          .nueva-act-btn { width: 100%; justify-content: center !important; }
          .action-row { flex-direction: column; align-items: stretch; }
          .action-row button { width: 100%; justify-content: center !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .stats-scroll { overflow: visible; }
        }
        @media (max-width: 480px) {
          .docente-main { padding: 8px; gap: 10px; }
          .right-inner { padding: 12px; }
          .modal-grid { grid-template-columns: 1fr !important; }
          .alumnos-table { font-size: 10px; }
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: rgba(6,182,212,0.04); }
        ::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.18); border-radius: 4px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        input::placeholder, textarea::placeholder { color: #4d6070; }
        input:focus, textarea:focus, select:focus {
          outline: none; border-color: rgba(6,182,212,0.40) !important;
          box-shadow: 0 0 0 3px rgba(6,182,212,0.08);
        }
      `}</style>

      <div className="docente-wrap" style={{ background: T.bg, fontFamily: "'DM Sans', sans-serif", ...DOTS_BG }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
          <div style={{ position: "absolute", top: -120, left: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: -80, right: -80, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(29,185,84,0.05) 0%, transparent 70%)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />

          <main className="docente-main">

        {/* ── PANEL IZQUIERDO ── */}
        <aside className="docente-aside">
          <Card accentColor={T.cyan}>
            <div style={{ padding: "18px 18px 16px" }}>
              <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.textMuted }}>Portal Docente · CECyTEM</p>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary, fontFamily: "'Syne', sans-serif", lineHeight: 1.2, marginTop: 2 }}>
                {user?.nombre || user?.username || "Docente"}
              </h1>
              <p style={{ marginTop: 4, fontSize: 11, color: T.textMuted }}>
                {loadingDashboard ? "Cargando..." : `${asignaciones.length} asignación${asignaciones.length !== 1 ? "es" : ""} activa${asignaciones.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Toggle: Mis clases / Estadísticas */}
            <div className="modo-toggle" style={{ marginBottom: 12, background: "rgba(5,18,32,0.55)", border: `1px solid ${T.border}` }}>
              {[{ id: "clases", label: "📋 Mis clases" }, { id: "estadisticas", label: "📊 Estadísticas" }].map(opt => (
                <button key={opt.id} type="button" onClick={() => setVistaPrincipal(opt.id)}
                  style={{
                    flex: 1, padding: "8px 10px", borderRadius: T.radiusXs, border: "none", cursor: "pointer",
                    fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                    background: vistaPrincipal === opt.id ? `linear-gradient(135deg, ${T.accent} 0%, ${T.accentEnd} 100%)` : "transparent",
                    color: vistaPrincipal === opt.id ? "#fff" : T.textMuted,
                    transition: "all 0.15s",
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {vistaPrincipal === "clases" && (
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: T.textMuted, pointerEvents: "none" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input type="text" placeholder="Buscar materia, grupo o aula..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 32 }} />
              </div>
            )}
          </div>
        </Card>

        {vistaPrincipal === "clases" && (
          <div className="aside-list">
            {loadingDashboard ? <LoadingSpinner message="Cargando tus clases del CECyTEM..." />
            : error ? <ErrorBanner message={error} />
            : filteredAsignaciones.length === 0 ? <EmptyState icon="📋" title="Sin asignaciones" message={searchQuery ? "Ninguna clase coincide." : "Ninguna asignación disponible."} />
            : filteredAsignaciones.map(a => (
              <ClassroomCard key={a.id} asignacion={a}
                isSelected={selectedAsignacion?.id === a.id}
                onClick={() => setSelectedAsignacion(a)}
                actividadesCount={a.actividades_count || 0} />
            ))}
          </div>
        )}
  </aside>

{/* ── PANEL DERECHO ── */}
<Card className="docente-right-panel">
  <div className="right-inner">
    {vistaPrincipal === "estadisticas" ? (
      <EstadisticasDocente asignaciones={asignaciones} />
    ) : selectedAsignacion ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div className="header-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: T.cyan, background: T.cyanDim, border: `1px solid ${T.border}`, padding: "3px 10px", borderRadius: T.radiusXs }}>Clase seleccionada</span>
              <span style={{ fontSize: 10, fontFamily: "monospace", color: T.textMuted }}>ID: {selectedAsignacion.id}</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary, fontFamily: "'Syne', sans-serif", lineHeight: 1.2, marginBottom: 6 }}>
              {extractNombreMateria(selectedAsignacion)}
            </h2>
            <div className="class-meta">
              <span>Grupo: <strong style={{ color: T.cyan }}>{extractNombreGrupo(selectedAsignacion)}</strong></span>
              <span>Aula: <strong style={{ color: T.cyan }}>{extractAula(selectedAsignacion)}</strong></span>
              <span style={{ color: T.textMuted }}>{selectedAsignacion.total_alumnos || alumnos.length || 0} alumnos</span>
            </div>
          </div>
          <button className="nueva-act-btn" onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: T.radiusSm, background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentEnd} 100%)`, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 20px ${T.accentGlow}`, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
            + Nueva actividad
          </button>
        </div>

        {loadingDetalles ? <LoadingSpinner message="Cargando detalles..." /> : (
          <div className="detail-grid">

            {/* Columna A: Planeaciones */}
            <div className="detail-col">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: T.textMuted }}>Planeaciones</h3>
                <span style={{ padding: "2px 10px", borderRadius: 100, background: T.cyanDim, border: `1px solid ${T.border}`, fontSize: 10, fontWeight: 700, fontFamily: "monospace", color: T.cyan }}>{actividades.length}</span>
              </div>
              {actividades.length > 0 && (
                <p style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>
                  Toca una actividad para ver o registrar entregas. Las actividades ya calificadas muestran 🔒.
                </p>
              )}
              <div className="detail-col-scroll">
                {actividades.length === 0
                  ? <EmptyState icon="📚" title="Sin planeaciones" message="Crea la primera actividad para este grupo." />
                  : actividades.map(act => (
                    <ActivityCard 
                      key={act.id} 
                      actividad={act}
                      isSelected={selectedActividad === act.id}
                      isCalificada={estaCalificada(act.id)}
                      enEdicion={estaEnEdicion(act.id)}
                      onClick={() => toggleActividad(act.id)}
                      onDelete={(e) => {
                        e.stopPropagation(); // Previene que la tarjeta se seleccione al intentar borrar
                        eliminarActividad(act.id);
                      }} 
                    />
                  ))}
              </div>
            </div>

            {/* Columna B: Alumnos */}
            <div className="detail-col">
              {/* Header de la columna */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: T.textMuted }}>Alumnos matriculados</h3>
                <span style={{ padding: "2px 10px", borderRadius: 100, background: T.cyanDim, border: `1px solid ${T.border}`, fontSize: 10, fontWeight: 700, fontFamily: "monospace", color: T.cyan }}>{alumnos.length}</span>
              </div>

              {/* Banner de estado según el caso */}
              {!selectedActividad ? (
                <div className="status-banner" style={{ padding: "10px 14px", borderRadius: T.radiusXs, background: T.amberDim, border: `1px solid ${T.amberBorder}`, fontSize: 11, color: T.amber, lineHeight: 1.5 }}>
                  Selecciona una actividad en "Planeaciones" para ver o registrar entregas.
                </div>
              ) : bloqueada ? (
                /* ── Actividad YA CALIFICADA y bloqueada ── */
                <div className="status-banner" style={{ borderRadius: T.radiusXs, border: `1px solid ${T.borderGreen}`, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", background: "rgba(29,185,84,0.10)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13 }}>🔒</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>Actividad calificada</span>
                      </div>
                      <p style={{ fontSize: 10, color: T.textSecondary, lineHeight: 1.4 }}>
                        <strong style={{ color: T.textPrimary }}>{actividadSeleccionadaInfo?.titulo}</strong>
                        {histActual && <> · Guardado el {histActual.fecha} · {histActual.registros} registro{histActual.registros !== 1 ? "s" : ""}</>}
                      </p>
                    </div>
                    <button onClick={iniciarEdicion} style={{ padding: "5px 14px", borderRadius: T.radiusXs, background: "rgba(6,182,212,0.12)", border: `1px solid ${T.border}`, color: T.cyan, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
                      ✏️ Editar calificaciones
                    </button>
                  </div>
                </div>
              ) : enEdicion ? (
                /* ── En modo RE-EDICIÓN ── */
                <div className="status-banner" style={{ padding: "10px 14px", borderRadius: T.radiusXs, background: T.amberDim, border: `1px solid ${T.amberBorder}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.amber }}>✏️ Modo edición</span>
                      <p style={{ fontSize: 10, color: T.textMuted, marginTop: 2, lineHeight: 1.4 }}>
                        Modifica las calificaciones y guarda para actualizar.
                      </p>
                    </div>
                    <div className="action-row">
                      <button onClick={cancelarEdicion} style={{ padding: "5px 12px", borderRadius: T.radiusXs, background: "transparent", border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                        Cancelar
                      </button>
                      <button onClick={guardarRegistros} disabled={guardando} style={{ padding: "5px 14px", borderRadius: T.radiusXs, background: `linear-gradient(135deg, ${T.accent}, ${T.accentEnd})`, border: "none", color: "#fff", fontSize: 10, fontWeight: 700, cursor: guardando ? "not-allowed" : "pointer", opacity: guardando ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif" }}>
                        {guardando ? "Guardando..." : "💾 Guardar cambios"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Actividad seleccionada, lista para calificar ── */
                <div className="status-banner" style={{ padding: "10px 14px", borderRadius: T.radiusXs, background: T.cyanDim, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.cyan }}>📝 Calificando</span>
                      <p style={{ fontSize: 10, color: T.textSecondary, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {actividadSeleccionadaInfo?.titulo}
                      </p>
                    </div>
                    {hayCambiosPendientes && (
                      <button onClick={guardarRegistros} disabled={guardando} style={{ padding: "6px 16px", borderRadius: T.radiusXs, background: `linear-gradient(135deg, ${T.accent}, ${T.accentEnd})`, border: "none", color: "#fff", fontSize: 10, fontWeight: 700, cursor: guardando ? "not-allowed" : "pointer", opacity: guardando ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
                        {guardando ? "Guardando..." : "💾 Guardar"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tabla de alumnos */}
              <div className="table-wrap">
                {alumnos.length === 0 ? (
                  <EmptyState icon="📋" title="Sin alumnos" message="No se encontraron alumnos matriculados." />
                ) : (
                  <table className="alumnos-table">
                    <thead>
                      <tr style={{ background: T.cyanDim, borderBottom: `1px solid ${T.border}` }}>
                        {["Matrícula", "Nombre", "Entregó", "Calif."].map(h => (
                          <th key={h} style={{ padding: "9px 10px", textAlign: h === "Matrícula" || h === "Nombre" ? "left" : "center", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: T.cyan, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {alumnos.map((alu, i) => (
                        <StudentTableRow key={alu.id} alumno={alu} idx={i}
                          entrego={entregasActuales[alu.id] || false}
                          calificacion={calificacionesActuales[alu.id] || ""}
                          disabled={!selectedActividad}
                          readonly={bloqueada}
                          onToggleEntrega={() => toggleEntrega(alu.id)}
                          onCalificacionChange={val => setCalificacion(alu.id, val)} />
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40, minHeight: 300 }}>
        <div style={{ width: 64, height: 64, borderRadius: T.radiusSm, marginBottom: 20, background: T.cyanDim, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🏫</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>Panel de control del docente</h3>
        <p style={{ fontSize: 12, color: T.textMuted, maxWidth: 340, lineHeight: 1.7 }}>Selecciona una de tus materias en la barra lateral para gestionar planeaciones y alumnos.</p>
        {asignaciones.length === 0 && (
          <div style={{ marginTop: 20, padding: "12px 20px", borderRadius: T.radiusXs, border: `1px dashed ${T.border}`, background: T.cyanDim, fontSize: 11, color: T.textMuted }}>
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
          onCreated={() => { setShowModal(false); fetchDashboardData(); }} />
      )}
    </>
  );
}

// ─── ClassroomCard ────────────────────────────────────────────────────────────────
function ClassroomCard({ asignacion, isSelected, onClick, actividadesCount }) {
  const nombre = extractNombreMateria(asignacion);
  const grupo  = extractNombreGrupo(asignacion);
  const aula   = extractAula(asignacion);
  const total  = asignacion.total_alumnos || 0;
  const activo = actividadesCount > 0;

  return (
    <div onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
      style={{ cursor: "pointer", borderRadius: T.radiusSm, overflow: "hidden", border: `1px solid ${isSelected ? T.borderGreen : T.border}`, background: isSelected ? "linear-gradient(135deg, rgba(29,185,84,0.10) 0%, rgba(6,182,212,0.06) 100%)" : T.surface, backdropFilter: "blur(20px)", boxShadow: isSelected ? `0 0 24px ${T.accentGlow}` : T.shadowSm, transition: "all 0.18s", outline: isSelected ? `2px solid rgba(29,185,84,0.35)` : "none", outlineOffset: 2 }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = T.borderStrong; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = T.border; }}>
      <div style={{ height: 3, background: isSelected ? `linear-gradient(90deg, ${T.accent} 0%, ${T.accentEnd} 100%)` : `linear-gradient(90deg, ${T.cyan} 0%, rgba(6,182,212,0.4) 100%)` }} />
      <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid rgba(6,182,212,0.08)` }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, fontFamily: "'Syne', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={nombre}>{nombre}</h3>
        <p style={{ marginTop: 4, fontSize: 11, color: T.cyan, fontWeight: 600 }}>Gr. {grupo}</p>
      </div>
      <div style={{ padding: "10px 14px 12px", fontSize: 11, color: T.textSecondary }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{aula}</span>
          <span style={{ color: T.textMuted, fontFamily: "monospace", whiteSpace: "nowrap", flexShrink: 0 }}>{total} alumnos</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid rgba(6,182,212,0.07)`, gap: 8 }}>
          {activo
            ? <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, background: T.accentGlow, border: `1px solid ${T.borderGreen}`, padding: "2px 8px", borderRadius: 100 }}>✓ Activa ({actividadesCount})</span>
            : <span style={{ fontSize: 10, fontWeight: 700, color: T.amber, background: T.amberDim, border: `1px solid ${T.amberBorder}`, padding: "2px 8px", borderRadius: 100 }}>Requiere planeación</span>
          }
          <span style={{ color: isSelected ? T.accent : T.textMuted, fontSize: 13, flexShrink: 0 }}>→</span>
        </div>
      </div>
    </div>
  );
}

// ─── ActivityCard ─────────────────────────────────────────────────────────────────
function ActivityCard({ actividad, isSelected, isCalificada, enEdicion, onClick, onDelete }) {
  const locked = isLocked(actividad.fecha_limite);
  const dias   = actividad.fecha_limite
    ? Math.ceil((new Date(actividad.fecha_limite) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const statusColor = locked ? T.dangerText : dias !== null && dias <= 3 ? T.amber : T.emerald;

  // Colores según estado
  const cardBg     = isCalificada && !enEdicion ? "rgba(29,185,84,0.07)"
                   : enEdicion                  ? T.amberDim
                   : isSelected                 ? "rgba(6,182,212,0.12)"
                   : T.cyanDim;
  const cardBorder = isCalificada && !enEdicion ? T.borderGreen
                   : enEdicion                  ? T.amberBorder
                   : isSelected                 ? T.borderStrong
                   : T.border;

  return (
    <div onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
      style={{ cursor: "pointer", padding: "12px 14px", borderRadius: T.radiusXs, background: cardBg, border: `1px solid ${cardBorder}`, transition: "all 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <h4 style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, flex: 1, lineHeight: 1.4, fontFamily: "'Syne', sans-serif" }}>
          {actividad.titulo}
        </h4>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {/* Badges de estado */}
          {isCalificada && !enEdicion && (
            <span style={{ padding: "2px 7px", borderRadius: T.radiusXs, background: "rgba(29,185,84,0.18)", border: `1px solid ${T.borderGreen}`, fontSize: 9, fontWeight: 700, color: T.accent }}>
              🔒 Calificada
            </span>
          )}
          {enEdicion && (
            <span style={{ padding: "2px 7px", borderRadius: T.radiusXs, background: T.amberDim, border: `1px solid ${T.amberBorder}`, fontSize: 9, fontWeight: 700, color: T.amber }}>
              ✏️ Editando
            </span>
          )}
          {isSelected && !isCalificada && !enEdicion && (
            <span style={{ padding: "2px 7px", borderRadius: T.radiusXs, background: "rgba(6,182,212,0.18)", border: `1px solid ${T.border}`, fontSize: 9, fontWeight: 700, color: T.cyan }}>
              ✓ Seleccionada
            </span>
          )}
          <span style={{ padding: "2px 7px", borderRadius: T.radiusXs, background: "rgba(6,182,212,0.08)", border: `1px solid ${T.border}`, fontSize: 9, fontWeight: 700, fontFamily: "monospace", color: T.cyan }}>
            S{actividad.semana}
          </span>

          {/* Botón de Eliminar */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Evita seleccionar la tarjeta al hacer clic en eliminar
              if (onDelete) onDelete(e);
            }}
            title="Eliminar actividad"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${T.dangerBorder || "rgba(239, 68, 68, 0.3)"}`,
              color: T.dangerText || "#f87171",
              borderRadius: T.radiusXs,
              padding: "2px 6px",
              fontSize: 10,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      {actividad.descripcion && (
        <p style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {actividad.descripcion}
        </p>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textMuted }}>
        <span>{new Date(actividad.fecha_limite || "").toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}</span>
        {dias !== null && (
          <span style={{ fontWeight: 700, color: statusColor }}>
            {locked ? "🔒 Bloqueada" : dias <= 0 ? "Hoy" : `${dias}d restantes`}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── StudentTableRow ───────────────────────────────────────────────────────────────
// readonly = true → muestra valores guardados sin poder editar
function StudentTableRow({ alumno, idx, entrego, calificacion, disabled, readonly, onToggleEntrega, onCalificacionChange }) {
  const nombre    = alumno.nombre_completo || alumno.alumno_nombre ||
    `${alumno.nombre || ""} ${alumno.apellido || ""}`.trim() || "Sin nombre";
  const matricula = alumno.matricula || alumno.id || "—";

  const isDisabled = disabled || readonly;

  return (
    <tr style={{ borderBottom: `1px solid rgba(6,182,212,0.07)`, background: idx % 2 === 0 ? "rgba(6,182,212,0.02)" : "transparent" }}>
      <td style={{ padding: "9px 10px", fontFamily: "monospace", fontSize: 10, color: T.textMuted, whiteSpace: "nowrap" }}>{matricula}</td>
      <td style={{ padding: "9px 10px", fontSize: 11, fontWeight: 600, color: T.textPrimary, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombre}</td>
      <td style={{ padding: "9px 10px", textAlign: "center" }}>
        {readonly ? (
          /* Modo solo lectura: ícono estático */
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%", background: entrego ? "rgba(29,185,84,0.20)" : "rgba(239,68,68,0.10)", border: `1px solid ${entrego ? T.borderGreen : T.dangerBorder}`, color: entrego ? T.accent : T.dangerText, fontSize: 12 }}>
            {entrego ? "✓" : "✗"}
          </span>
        ) : (
          <button onClick={onToggleEntrega} disabled={isDisabled}
            title={isDisabled ? "Selecciona una actividad primero" : entrego ? "Entregó" : "No entregó"}
            style={{ width: 26, height: 26, borderRadius: "50%", background: entrego ? "rgba(29,185,84,0.20)" : "rgba(239,68,68,0.10)", border: `1px solid ${entrego ? T.borderGreen : T.dangerBorder}`, color: entrego ? T.accent : T.dangerText, fontSize: 12, cursor: isDisabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", opacity: isDisabled ? 0.45 : 1 }}>
            {entrego ? "✓" : "✗"}
          </button>
        )}
      </td>
      <td style={{ padding: "9px 10px", textAlign: "center" }}>
        {readonly ? (
          /* Modo solo lectura: badge de calificación */
          <span style={{ display: "inline-block", minWidth: 32, padding: "3px 8px", borderRadius: T.radiusXs, background: calificacion !== "" ? "rgba(29,185,84,0.15)" : "rgba(6,182,212,0.08)", border: `1px solid ${calificacion !== "" ? T.borderGreen : T.border}`, color: calificacion !== "" ? T.accent : T.textMuted, fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
            {calificacion !== "" ? calificacion : "—"}
          </span>
        ) : (
          <input type="number" min="0" max="10"
            value={calificacion} disabled={isDisabled}
            onChange={e => onCalificacionChange(e.target.value)}
            placeholder="–"
            style={{ width: 44, padding: "4px 6px", textAlign: "center", background: "rgba(5,18,32,0.55)", border: `1px solid ${T.border}`, borderRadius: T.radiusXs, color: T.textPrimary, fontSize: 11, fontFamily: "'DM Sans', sans-serif", cursor: isDisabled ? "not-allowed" : "text", opacity: isDisabled ? 0.45 : 1 }} />
        )}
      </td>
    </tr>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────────
function EmptyState({ icon, title, message }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, border: `1px dashed ${T.border}`, borderRadius: T.radiusSm, background: T.cyanDim, minHeight: 100 }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <h4 style={{ fontSize: 12, fontWeight: 700, color: T.textSecondary, fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>{title}</h4>
      <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, maxWidth: 180 }}>{message}</p>
    </div>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────────
function LoadingSpinner({ message }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${T.cyan}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <p style={{ fontSize: 11, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{message}</p>
    </div>
  );
}

// ─── ErrorBanner ──────────────────────────────────────────────────────────────────
function ErrorBanner({ message }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: T.radiusXs, background: T.amberDim, border: `1px solid ${T.amberBorder}` }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
      <p style={{ fontSize: 12, color: T.amber, fontFamily: "'DM Sans', sans-serif" }}>{message}</p>
    </div>
  );
}

// ─── ModalNuevaActividad ──────────────────────────────────────────────────────────
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
      await api.post(ENDPOINTS.SEGUIMIENTO.ACTIVIDADES, {
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
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(2,8,16,0.80)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxWidth: 480, borderRadius: T.radius, background: T.surfaceDeep, border: `1px solid ${T.borderStrong}`, boxShadow: T.shadow, overflow: "hidden", maxHeight: "calc(100vh - 32px)", overflowY: "auto" }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${T.accent} 0%, ${T.accentEnd} 100%)` }} />
        <div style={{ padding: "20px 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Nueva actividad</h3>
              <p style={{ fontSize: 11, color: T.cyan, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{nombreMateria}</p>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: T.radiusXs, flexShrink: 0, background: T.cyanDim, border: `1px solid ${T.border}`, color: T.textSecondary, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>

          {errorLocal && (
            <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: T.radiusXs, background: T.danger, border: `1px solid ${T.dangerBorder}` }}>
              <p style={{ fontSize: 12, color: T.dangerText, whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif" }}>{errorLocal}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <FieldLabel>Título de la actividad *</FieldLabel>
              <input type="text" required placeholder="Ej. Práctica 1: Modelado de Datos" value={formData.titulo} onChange={e => set('titulo', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <FieldLabel>Instrucciones o criterios</FieldLabel>
              <textarea rows={3} placeholder="Describe qué deben hacer los alumnos..." value={formData.descripcion} onChange={e => set('descripcion', e.target.value)} style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
            </div>
            <div className="modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <FieldLabel>Semana *</FieldLabel>
                <select value={formData.semana} onChange={e => set('semana', e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }}>
                  {[1,2,3,4,5].map(s => <option key={s} value={s} style={{ background: "#04141e" }}>Semana {s}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Fecha límite *</FieldLabel>
                <input type="date" required value={formData.fecha_limite} onChange={e => set('fecha_limite', e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
              <button type="button" onClick={onClose} disabled={enviando} style={{ padding: "9px 16px", borderRadius: T.radiusXs, border: "none", background: "transparent", color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
              <button type="submit" disabled={enviando} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: T.radiusSm, border: "none", background: enviando ? "rgba(29,185,84,0.30)" : `linear-gradient(135deg, ${T.accent} 0%, ${T.accentEnd} 100%)`, color: "#fff", fontSize: 12, fontWeight: 700, cursor: enviando ? "not-allowed" : "pointer", boxShadow: enviando ? "none" : `0 4px 20px ${T.accentGlow}`, fontFamily: "'DM Sans', sans-serif", opacity: enviando ? 0.7 : 1 }}>
                {enviando
                  ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Publicando...</>
                  : "Publicar actividad"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Estadísticas (Docente) ─────────────────────────────────────────────────────
// Basadas en Cumplimiento (seguimiento/cumplimiento), acotadas SOLO a las asignaciones
// (materia + grupo) que pertenecen a este docente. No requiere endpoints nuevos:
// cruza /seguimiento/actividades/?asignacion=X (por cada clase del docente) con
// /seguimiento/cumplimiento/ (filtrado en el cliente por las actividades propias).

function pctValue(entregados, total) {
  return total > 0 ? Math.round((entregados / total) * 100) : 0;
}

function pctColor(p) {
  if (p >= 80) return T.accent;
  if (p >= 50) return T.cyan;
  return T.dangerText;
}

function StatsProgressBar({ value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 130 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: pctColor(value), borderRadius: 999, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: pctColor(value), minWidth: 32, textAlign: "right", fontFamily: "monospace" }}>{value}%</span>
    </div>
  );
}

function StatMini({ label, value }) {
  return (
    <div style={{ borderRadius: T.radiusSm, background: T.cyanDim, border: `1px solid ${T.border}`, padding: "12px 14px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary, fontFamily: "'Syne', sans-serif", lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
}

function StatsEmpty({ message }) {
  return (
    <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 11, color: T.textMuted, border: `1px dashed ${T.border}`, borderRadius: T.radiusSm, background: T.cyanDim }}>
      {message}
    </div>
  );
}

function EstadisticasDocente({ asignaciones }) {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [porAsignacion, setPorAsignacion] = useState([]); // [{ asignacion, actividades, alumnos }]
  const [cumplimientos, setCumplimientos] = useState([]);
  const [vista, setVista]       = useState("general"); // general | clase | alumno
  const [claseSel, setClaseSel] = useState("");
  const [alumnoSel, setAlumnoSel] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!asignaciones || asignaciones.length === 0) { setLoading(false); return; }
      setLoading(true); setError(null);
      try {
        const perAsignacion = await Promise.all(asignaciones.map(async (a) => {
          const [resAct, resAlu] = await Promise.allSettled([
            api.get(`${ENDPOINTS.SEGUIMIENTO.ACTIVIDADES}?asignacion=${a.id}`),
            api.get(`${ENDPOINTS.ACADEMICO.ALUMNOS}?asignacion=${a.id}`),
          ]);
          return {
            asignacion: a,
            actividades: resAct.status === "fulfilled" ? normalizeArrayResponse(resAct.value.data) : [],
            alumnos:     resAlu.status === "fulfilled" ? normalizeArrayResponse(resAlu.value.data) : [],
          };
        }));

        let cumplimientoData = [];
        try {
          const resCum = await api.get("/seguimiento/cumplimiento/");
          cumplimientoData = normalizeArrayResponse(resCum.data);
        } catch {
          // Si falla, seguimos mostrando conteos de actividades/alumnos aunque sin % de cumplimiento
        }

        if (!cancelled) {
          setPorAsignacion(perAsignacion);
          setCumplimientos(cumplimientoData);
        }
      } catch {
        if (!cancelled) setError("No se pudieron cargar las estadísticas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [asignaciones]);

  // ── Enriquecer cada registro de cumplimiento con su asignación/actividad (solo las propias) ──
  const registros = useMemo(() => {
    const actividadMap = new Map();
    porAsignacion.forEach(p => p.actividades.forEach(act => actividadMap.set(act.id, { actividad: act, asignacion: p.asignacion })));
    return cumplimientos
      .filter(c => actividadMap.has(c.actividad))
      .map(c => {
        const { actividad, asignacion } = actividadMap.get(c.actividad);
        return { ...c, actividad_detalle: actividad, asignacion };
      });
  }, [cumplimientos, porAsignacion]);

  // ── General: todas mis clases ──
  const general = useMemo(() => {
    const total = registros.length;
    const entregados = registros.filter(r => r.entregado).length;
    const porClase = porAsignacion.map(p => {
      const regs = registros.filter(r => r.asignacion.id === p.asignacion.id);
      const t = regs.length;
      const e = regs.filter(r => r.entregado).length;
      return { asignacion: p.asignacion, total: t, entregados: e };
    }).sort((a, b) => pctValue(b.entregados, b.total) - pctValue(a.entregados, a.total));
    return { total, entregados, pct: pctValue(entregados, total), porClase };
  }, [registros, porAsignacion]);

  // ── Por clase seleccionada ──
  const statsClase = useMemo(() => {
    if (!claseSel) return null;
    const p = porAsignacion.find(x => String(x.asignacion.id) === String(claseSel));
    if (!p) return null;
    const regs = registros.filter(r => String(r.asignacion.id) === String(claseSel));
    const total = regs.length;
    const entregados = regs.filter(r => r.entregado).length;

    const porAlumno = new Map();
    regs.forEach(r => {
      const key = r.alumno;
      if (!porAlumno.has(key)) porAlumno.set(key, { alumno: r.alumno_detalle, total: 0, entregados: 0 });
      const b = porAlumno.get(key);
      b.total += 1;
      if (r.entregado) b.entregados += 1;
    });
    // Incluir alumnos sin ningún registro (0/0)
    const idsConRegistro = new Set(porAlumno.keys());
    p.alumnos.forEach(al => {
      if (!idsConRegistro.has(al.id)) {
        porAlumno.set(al.id, {
          alumno: { id: al.id, nombre_completo: al.nombre_completo || al.alumno_nombre || `${al.nombre || ""} ${al.apellido || ""}`.trim(), matricula: al.matricula },
          total: 0, entregados: 0,
        });
      }
    });

    return {
      asignacion: p.asignacion, alumnos: p.alumnos,
      total, entregados, pct: pctValue(entregados, total),
      porAlumno: [...porAlumno.values()].sort((a, b) => pctValue(b.entregados, b.total) - pctValue(a.entregados, a.total)),
    };
  }, [registros, porAsignacion, claseSel]);

  // ── Individual ──
  const statsAlumno = useMemo(() => {
    if (!claseSel || !alumnoSel) return null;
    const p = porAsignacion.find(x => String(x.asignacion.id) === String(claseSel));
    const alumno = p?.alumnos.find(a => String(a.id) === String(alumnoSel));
    const regs = registros.filter(r => String(r.asignacion.id) === String(claseSel) && String(r.alumno) === String(alumnoSel));
    const total = regs.length;
    const entregados = regs.filter(r => r.entregado).length;
    return {
      alumno, total, entregados, pct: pctValue(entregados, total),
      detalle: regs.slice().sort((a, b) => new Date(b.fecha_registro || 0) - new Date(a.fecha_registro || 0)).slice(0, 30),
    };
  }, [registros, porAsignacion, claseSel, alumnoSel]);

  const alumnosDeClaseSel = porAsignacion.find(x => String(x.asignacion.id) === String(claseSel))?.alumnos || [];

  const tabs = [
    { id: "general", label: "General" },
    { id: "clase",   label: "Por clase" },
    { id: "alumno",  label: "Individual" },
  ];

  if (!asignaciones || asignaciones.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary, fontFamily: "'Syne', sans-serif" }}>Estadísticas</h2>
        <StatsEmpty message="Aún no tienes asignaciones registradas." />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary, fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Estadísticas</h2>
        <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>Rendimiento (cumplimiento de actividades) de tus grupos y alumnos.</p>
      </div>

      {/* Selector de vista */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tabs.map(t => {
          const active = vista === t.id;
          return (
            <button key={t.id} type="button" onClick={() => setVista(t.id)}
              style={{
                padding: "7px 14px", borderRadius: T.radiusXs, cursor: "pointer",
                fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                border: `1px solid ${active ? T.borderGreen : T.border}`,
                background: active ? "linear-gradient(135deg, rgba(29,185,84,0.15) 0%, rgba(6,182,212,0.10) 100%)" : T.cyanDim,
                color: active ? T.accent : T.textSecondary,
              }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? <LoadingSpinner message="Calculando estadísticas..." />
      : error ? <ErrorBanner message={error} />
      : (
        <div className="stats-scroll">

          {/* ── GENERAL ── */}
          {vista === "general" && (
            <>
              <div className="stats-grid">
                <StatMini label="Actividades evaluadas" value={general.total} />
                <StatMini label="Entregadas" value={general.entregados} />
                <StatMini label="Cumplimiento global" value={`${general.pct}%`} />
                <StatMini label="Clases con datos" value={general.porClase.filter(c => c.total > 0).length} />
              </div>

              <div>
                <h4 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: T.textMuted, marginBottom: 10 }}>Cumplimiento por clase</h4>
                {general.porClase.length === 0 ? <StatsEmpty message="Aún no hay actividades con registros." /> : (
                  <div className="table-wrap">
                    <table className="stats-table">
                      <thead>
                        <tr style={{ background: T.cyanDim, borderBottom: `1px solid ${T.border}` }}>
                          {["Materia", "Grupo", "Entregadas / Total", "% Cumplimiento"].map(h => (
                            <th key={h} style={{ padding: "9px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: T.cyan, whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {general.porClase.map((row, idx) => (
                          <tr key={row.asignacion.id} style={{ borderBottom: `1px solid rgba(6,182,212,0.07)`, background: idx % 2 === 0 ? "rgba(6,182,212,0.02)" : "transparent" }}>
                            <td style={{ padding: "9px 10px", fontSize: 11, fontWeight: 600, color: T.textPrimary, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{extractNombreMateria(row.asignacion)}</td>
                            <td style={{ padding: "9px 10px", fontSize: 11, color: T.cyan, fontWeight: 600, whiteSpace: "nowrap" }}>{extractNombreGrupo(row.asignacion)}</td>
                            <td style={{ padding: "9px 10px", fontSize: 11, fontFamily: "monospace", color: T.textSecondary }}>{row.entregados} / {row.total}</td>
                            <td style={{ padding: "9px 10px" }}><StatsProgressBar value={pctValue(row.entregados, row.total)} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── POR CLASE ── */}
          {vista === "clase" && (
            <>
              <div>
                <FieldLabel>Selecciona una clase</FieldLabel>
                <select value={claseSel} onChange={e => { setClaseSel(e.target.value); setAlumnoSel(""); }} style={{ ...inputStyle, colorScheme: "dark" }}>
                  <option value="">Seleccionar clase</option>
                  {asignaciones.map(a => (
                    <option key={a.id} value={a.id} style={{ background: "#04141e" }}>
                      {extractNombreMateria(a)} · Gr. {extractNombreGrupo(a)}
                    </option>
                  ))}
                </select>
              </div>

              {!claseSel ? <StatsEmpty message="Selecciona una clase para ver sus estadísticas." /> : !statsClase ? (
                <LoadingSpinner message="Cargando..." />
              ) : (
                <>
                  <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                    <StatMini label="Actividades evaluadas" value={statsClase.total} />
                    <StatMini label="Entregadas" value={statsClase.entregados} />
                    <StatMini label="Cumplimiento" value={`${statsClase.pct}%`} />
                  </div>

                  <div>
                    <h4 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: T.textMuted, marginBottom: 10 }}>Cumplimiento por alumno</h4>
                    {statsClase.porAlumno.length === 0 ? <StatsEmpty message="Sin alumnos en esta clase." /> : (
                      <div className="table-wrap">
                        <table className="stats-table">
                          <thead>
                            <tr style={{ background: T.cyanDim, borderBottom: `1px solid ${T.border}` }}>
                              {["Matrícula", "Nombre", "Entregadas / Total", "% Cumplimiento"].map(h => (
                                <th key={h} style={{ padding: "9px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: T.cyan, whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {statsClase.porAlumno.map((row, idx) => (
                              <tr key={row.alumno?.id ?? idx} style={{ borderBottom: `1px solid rgba(6,182,212,0.07)`, background: idx % 2 === 0 ? "rgba(6,182,212,0.02)" : "transparent" }}>
                                <td style={{ padding: "9px 10px", fontFamily: "monospace", fontSize: 10, color: T.textMuted, whiteSpace: "nowrap" }}>{row.alumno?.matricula ?? "—"}</td>
                                <td style={{ padding: "9px 10px", fontSize: 11, fontWeight: 600, color: T.textPrimary, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.alumno?.nombre_completo ?? "—"}</td>
                                <td style={{ padding: "9px 10px", fontSize: 11, fontFamily: "monospace", color: T.textSecondary }}>{row.entregados} / {row.total}</td>
                                <td style={{ padding: "9px 10px" }}><StatsProgressBar value={pctValue(row.entregados, row.total)} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── INDIVIDUAL ── */}
          {vista === "alumno" && (
            <>
              <div className="modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <FieldLabel>Clase</FieldLabel>
                  <select value={claseSel} onChange={e => { setClaseSel(e.target.value); setAlumnoSel(""); }} style={{ ...inputStyle, colorScheme: "dark" }}>
                    <option value="">Seleccionar clase</option>
                    {asignaciones.map(a => (
                      <option key={a.id} value={a.id} style={{ background: "#04141e" }}>
                        {extractNombreMateria(a)} · Gr. {extractNombreGrupo(a)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Alumno</FieldLabel>
                  <select value={alumnoSel} onChange={e => setAlumnoSel(e.target.value)} disabled={!claseSel} style={{ ...inputStyle, colorScheme: "dark", opacity: claseSel ? 1 : 0.5 }}>
                    <option value="">{claseSel ? "Seleccionar alumno" : "Elige una clase primero"}</option>
                    {alumnosDeClaseSel.map(al => (
                      <option key={al.id} value={al.id} style={{ background: "#04141e" }}>
                        {al.nombre_completo || al.alumno_nombre || `${al.nombre || ""} ${al.apellido || ""}`.trim()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!alumnoSel ? <StatsEmpty message="Selecciona una clase y un alumno para ver su rendimiento." /> : !statsAlumno ? (
                <LoadingSpinner message="Cargando..." />
              ) : (
                <>
                  <Card style={{ padding: 14 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, fontFamily: "'Syne', sans-serif" }}>
                          {statsAlumno.alumno?.nombre_completo || statsAlumno.alumno?.alumno_nombre || "Alumno"}
                        </div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{statsAlumno.alumno?.matricula || "Sin matrícula"}</div>
                      </div>
                      <div style={{ minWidth: 160 }}>
                        <StatsProgressBar value={statsAlumno.pct} />
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, textAlign: "right" }}>{statsAlumno.entregados} / {statsAlumno.total} entregadas</div>
                      </div>
                    </div>
                  </Card>

                  <div>
                    <h4 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: T.textMuted, marginBottom: 10 }}>Actividades recientes</h4>
                    {statsAlumno.detalle.length === 0 ? <StatsEmpty message="Sin actividades registradas para este alumno." /> : (
                      <div className="table-wrap">
                        <table className="stats-table">
                          <thead>
                            <tr style={{ background: T.cyanDim, borderBottom: `1px solid ${T.border}` }}>
                              {["Actividad", "Semana", "Estado"].map(h => (
                                <th key={h} style={{ padding: "9px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: T.cyan, whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {statsAlumno.detalle.map((r, idx) => (
                              <tr key={r.id} style={{ borderBottom: `1px solid rgba(6,182,212,0.07)`, background: idx % 2 === 0 ? "rgba(6,182,212,0.02)" : "transparent" }}>
                                <td style={{ padding: "9px 10px", fontSize: 11, color: T.textPrimary, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.actividad_detalle?.titulo ?? "—"}</td>
                                <td style={{ padding: "9px 10px", fontSize: 11, color: T.textSecondary }}>{r.actividad_detalle?.semana ?? "—"}</td>
                                <td style={{ padding: "9px 10px" }}>
                                  {r.entregado
                                    ? <span style={{ padding: "2px 8px", borderRadius: 100, background: "rgba(29,185,84,0.15)", border: `1px solid ${T.borderGreen}`, fontSize: 10, fontWeight: 700, color: T.accent }}>Entregada</span>
                                    : <span style={{ padding: "2px 8px", borderRadius: 100, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, fontWeight: 700, color: T.textSecondary }}>Pendiente</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

        </div>
      )}
    </div>
  );
}