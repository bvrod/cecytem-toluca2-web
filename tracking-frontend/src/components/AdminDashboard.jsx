import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import CecytoLogo from '../imagenes/cecytem-logo.png'; 

// ─── Design Tokens (Login-coherent palette) ────────────────────────────────────

const T = {
  bg:            "#082030",
  bgDeep:        "#051220",
  surface:       "rgba(5,18,32,0.72)",
  surfaceHover:  "rgba(5,18,32,0.88)",
  border:        "rgba(6,182,212,0.18)",
  borderStrong:  "rgba(6,182,212,0.32)",
  borderGreen:   "rgba(29,185,84,0.30)",
  accent:        "#1db954",
  accentHover:   "#159b45",
  accentGlow:    "rgba(29,185,84,0.18)",
  textPrimary:   "#e5e7eb",
  textSecondary: "#9aa5b7",
  textMuted:     "#617082",
  cyan:          "#06b6d4",
  cyanDim:       "rgba(6,182,212,0.12)",
  danger:        "rgba(239,68,68,0.12)",
  dangerBorder:  "rgba(239,68,68,0.25)",
  dangerText:    "#fca5a5",
  radius:        "20px",
  radiusSm:      "12px",
  radiusXs:      "8px",
  shadow:        "0 25px 80px rgba(2,10,20,0.55)",
  shadowSm:      "0 8px 30px rgba(2,10,20,0.35)",
  glass:         "backdrop-filter:blur(20px)",
  fontBody:      "'DM Sans', 'Inter', sans-serif",
  fontHeading:   "'Syne', 'DM Sans', sans-serif",
};

// ─── Background dots pattern (from login) ─────────────────────────────────────

const BG_DOTS = {
  backgroundImage: `radial-gradient(circle at 20% 20%, rgba(6,182,212,0.07) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(29,185,84,0.06) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(6,182,212,0.04) 0%, transparent 70%)`,
};

// ─── Shared input style ────────────────────────────────────────────────────────

const inputStyle = {
  width: "100%",
  borderRadius: T.radiusXs,
  border: `1px solid ${T.border}`,
  background: "rgba(5,18,32,0.55)",
  padding: "10px 14px",
  fontSize: "13px",
  color: T.textPrimary,
  outline: "none",
  transition: "border-color 0.2s",
  backdropFilter: "blur(8px)",
  fontFamily: T.fontBody,
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const carreraLabels = {
  LOGISTICA:        "Logistica",
  CIENCIA_DATOS:    "Ciencia de Datos",
  ANIMACION_DIGITAL:"Animacion Digital",
};

const SECTIONS = [
  { id: "alumnos",  label: "Alumnos",  desc: "Consulta y grupos",  icon: "A" },
  { id: "docentes", label: "Docentes", desc: "Plantilla activa",   icon: "D" },
  { id: "grupos",   label: "Grupos",   desc: "Oferta académica",   icon: "G" },
  { id: "materias", label: "Materias", desc: "Catálogo base",      icon: "M" },
];

// ─── Pure helpers ──────────────────────────────────────────────────────────────

const extractList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
};

const normalizeMateriaPayload = (form) => ({
  nombre:   form.nombre.trim(),
  clave:    form.clave.trim(),
  creditos: Number.parseInt(form.creditos, 10) || 0,
});

const groupCode = (grupo) => {
  if (!grupo) return "—";
  return `${grupo.semestre}${String(grupo.grupo_letra ?? "").padStart(2, "0")}`;
};

const groupLabel = (grupo) => {
  if (!grupo) return "—";
  return `${groupCode(grupo)} ${carreraLabels[grupo.carrera] ?? grupo.carrera}`;
};

const CARRERAS_POR_SEMESTRE = (semestre) => {
  const n = Number.parseInt(semestre, 10);
  const base = [
    { value: "LOGISTICA",     label: "Técnico en Logística" },
    { value: "CIENCIA_DATOS", label: "Técnico en Ciencia de Datos" },
  ];
  if (n === 4 || n === 6) {
    return [...base, { value: "ANIMACION_DIGITAL", label: "Técnico en Animación Digital" }];
  }
  return base;
};

// ─── UI Primitives ─────────────────────────────────────────────────────────────

function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: T.radius,
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        backdropFilter: "blur(20px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", type = "button", size = "md", loading = false, disabled = false }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    borderRadius: T.radiusSm,
    fontWeight: 600,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.5 : 1,
    transition: "all 0.2s",
    fontFamily: T.fontBody,
    border: "none",
    outline: "none",
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: "12px" },
    md: { padding: "10px 18px", fontSize: "13px" },
  };
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentHover} 100%)`,
      color: "#fff",
      boxShadow: `0 4px 20px ${T.accentGlow}`,
    },
    ghost: {
      background: T.cyanDim,
      border: `1px solid ${T.border}`,
      color: T.textPrimary,
    },
    danger: {
      background: T.danger,
      border: `1px solid ${T.dangerBorder}`,
      color: T.dangerText,
    },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
    >
      {loading ? (
        <span
          style={{
            width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff", borderRadius: "50%",
            display: "inline-block", animation: "spin 0.7s linear infinite",
          }}
        />
      ) : null}
      {children}
    </button>
  );
}

function Pill({ children, color = "cyan" }) {
  const colors = {
    cyan:    { background: T.cyanDim,   border: `1px solid ${T.border}`,       color: T.cyan },
    green:   { background: T.accentGlow, border: `1px solid ${T.borderGreen}`, color: T.accent },
    gray:    { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: T.textSecondary },
  };
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        borderRadius: 100, padding: "3px 9px",
        fontSize: 11, fontWeight: 600, ...colors[color],
      }}
    >
      {children}
    </span>
  );
}

function Avatar({ label = "?" }) {
  const initials = String(label || "").trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return (
    <span
      style={{
        display: "flex", width: 36, height: 36, flexShrink: 0,
        alignItems: "center", justifyContent: "center",
        borderRadius: T.radiusXs,
        background: "linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(29,185,84,0.12) 100%)",
        border: `1px solid ${T.border}`,
        fontSize: 12, fontWeight: 700, color: T.cyan,
        fontFamily: T.fontBody,
      }}
    >
      {initials || "?"}
    </span>
  );
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.textPrimary, fontFamily: T.fontHeading }}>{title}</h2>
        {subtitle ? <p style={{ margin: "4px 0 0", fontSize: 12, color: T.textMuted, fontFamily: T.fontBody }}>{subtitle}</p> : null}
      </div>
      {action ? <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{action}</div> : null}
    </div>
  );
}

function StatCard({ label, value, icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: "unset",
        display: "block",
        cursor: "pointer",
        borderRadius: T.radius,
        background: active
          ? "linear-gradient(135deg, rgba(29,185,84,0.15) 0%, rgba(6,182,212,0.10) 100%)"
          : T.surface,
        border: `1px solid ${active ? T.borderGreen : T.border}`,
        boxShadow: active ? `0 0 30px ${T.accentGlow}` : T.shadowSm,
        backdropFilter: "blur(20px)",
        padding: 16,
        transition: "all 0.2s",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: T.radiusSm,
            background: active
              ? "linear-gradient(135deg, rgba(29,185,84,0.25) 0%, rgba(6,182,212,0.15) 100%)"
              : T.cyanDim,
            border: `1px solid ${active ? T.borderGreen : T.border}`,
            fontSize: 14, fontWeight: 700,
            color: active ? T.accent : T.cyan,
            fontFamily: T.fontHeading,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.textPrimary, lineHeight: 1.2, fontFamily: T.fontHeading }}>
            {value ?? "—"}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, fontFamily: T.fontBody }}>{label}</div>
        </div>
      </div>
    </button>
  );
}

// ─── Table ──────────────────────────────────────────────────────────────────────

function Table({ cols, children, loading, emptyText = "Sin registros" }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div style={{ overflowX: "auto", borderRadius: T.radius, border: `1px solid ${T.border}`, background: T.surface, backdropFilter: "blur(20px)", boxShadow: T.shadowSm }}>
      <table style={{ minWidth: 680, width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "rgba(6,182,212,0.06)", borderBottom: `1px solid ${T.border}` }}>
            {cols.map((col) => (
              <th
                key={col}
                style={{
                  padding: "12px 16px", textAlign: "left",
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  color: T.cyan, whiteSpace: "nowrap",
                  fontFamily: T.fontBody,
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={cols.length} style={{ padding: "48px 20px", textAlign: "center" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: T.textMuted }}>
                  <span style={{ width: 16, height: 16, border: `2px solid ${T.cyan}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  Cargando datos...
                </div>
              </td>
            </tr>
          ) : hasRows ? children : (
            <tr>
              <td colSpan={cols.length} style={{ padding: "48px 20px", textAlign: "center", fontSize: 12, color: T.textMuted }}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TR({ children, idx }) {
  return (
    <tr
      style={{
        borderTop: `1px solid rgba(6,182,212,0.07)`,
        background: idx % 2 === 0 ? "rgba(6,182,212,0.025)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      {children}
    </tr>
  );
}

function TD({ children }) {
  return (
    <td style={{ padding: "12px 16px", verticalAlign: "top", color: T.textSecondary, fontFamily: T.fontBody }}>
      {children}
    </td>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        style={{ position: "absolute", inset: 0, background: "rgba(2,8,16,0.75)", backdropFilter: "blur(6px)", border: "none", cursor: "pointer" }}
      />
      <div
        style={{
          position: "relative", zIndex: 10,
          maxHeight: "90vh", width: "100%", maxWidth: 560,
          overflowY: "auto", borderRadius: T.radius,
          padding: 24,
          background: "rgba(4,13,24,0.97)",
          border: `1px solid ${T.borderStrong}`,
          boxShadow: T.shadow,
          backdropFilter: "blur(24px)",
          ...BG_DOTS,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.textPrimary, fontFamily: T.fontHeading }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              borderRadius: T.radiusXs, border: `1px solid ${T.border}`,
              background: T.cyanDim, padding: "6px 10px",
              color: T.textSecondary, cursor: "pointer", fontSize: 13,
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, required = false, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: T.textMuted, fontFamily: T.fontBody }}>
        {label}{required ? <span style={{ color: "#fca5a5", marginLeft: 4 }}>*</span> : null}
      </label>
      {children}
    </div>
  );
}

// ─── StyledInput / StyledSelect ────────────────────────────────────────────────

function StyledInput({ value, onChange, placeholder, type = "text", maxLength, disabled }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      style={inputStyle}
    />
  );
}

function StyledSelect({ value, onChange, children, disabled }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        ...inputStyle,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </select>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    window.clearTimeout(show.timeoutId);
    show.timeoutId = window.setTimeout(() => setToast(null), 3200);
  }, []);
  return { toast, show };
}

function Toast({ toast }) {
  if (!toast) return null;
  const palette = {
    success: { background: "rgba(29,185,84,0.12)", border: `1px solid ${T.borderGreen}`, color: "#6ee7a0" },
    error:   { background: T.danger, border: `1px solid ${T.dangerBorder}`, color: T.dangerText },
  };
  return (
    <div
      style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 60,
        borderRadius: T.radiusSm, padding: "12px 16px",
        fontSize: 13, boxShadow: T.shadow, backdropFilter: "blur(16px)",
        fontFamily: T.fontBody, ...palette[toast.type],
      }}
    >
      {toast.msg}
    </div>
  );
}

function Sidebar({ active, onSelect, stats, mobileOpen, onClose, user }) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            border: "none", cursor: "pointer",
          }}
        />
      )}
      <aside
        style={{
          position: "fixed", top: 0, bottom: 0, left: 0,
          zIndex: 50, width: 272,
          display: "flex", flexDirection: "column",
          background: "rgba(4,13,24,0.96)",
          borderRight: `1px solid ${T.border}`,
          backdropFilter: "blur(24px)",
          transform: mobileOpen ? "translateX(0)" : undefined,
          transition: "transform 0.2s",
          ...BG_DOTS,
        }}
      >
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 45,
                borderRadius: T.radiusSm,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: `0 4px 20px ${T.accentGlow}`,
                background: "rgba(255,255,255,0.05)" // Fondo leve por si el logo tiene transparencia
              }}
            >
              <img
                src={CecytoLogo}
                alt="Logo CECyTEM"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, fontFamily: T.fontHeading }}>CECyTEM</div>
              <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontBody }}>Panel administrativo</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: T.cyanDim, border: `1px solid ${T.border}`, borderRadius: T.radiusXs, padding: "6px 8px", color: T.textSecondary, cursor: "pointer", fontSize: 13 }}
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}>
          {SECTIONS.map((section) => {
            const isActive = section.id === active;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => { onSelect(section.id); onClose(); }}
                style={{
                  all: "unset",
                  display: "block",
                  width: "100%", boxSizing: "border-box",
                  borderRadius: T.radiusSm,
                  padding: "12px",
                  marginBottom: 4,
                  cursor: "pointer",
                  border: `1px solid ${isActive ? T.borderGreen : "transparent"}`,
                  background: isActive
                    ? "linear-gradient(135deg, rgba(29,185,84,0.12) 0%, rgba(6,182,212,0.08) 100%)"
                    : "transparent",
                  transition: "all 0.18s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 38, height: 38, borderRadius: T.radiusXs,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isActive ? "rgba(29,185,84,0.18)" : "rgba(6,182,212,0.08)",
                      border: `1px solid ${isActive ? T.borderGreen : T.border}`,
                      fontSize: 13, fontWeight: 700,
                      color: isActive ? T.accent : T.cyan,
                      fontFamily: T.fontHeading,
                    }}
                  >
                    {section.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? "#d1fae5" : T.textPrimary, fontFamily: T.fontBody }}>
                      {section.label}
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontBody }}>{section.desc}</div>
                  </div>
                  <span style={{ fontSize: 12, fontFamily: "monospace", color: isActive ? T.accent : T.textMuted }}>
                    {stats[section.id] ?? "—"}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, fontFamily: T.fontBody }}>{user?.first_name || user?.username}</div>
          <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontBody }}>Administrador</div>
        </div>
      </aside>
    </>
  );
}

// ─── AlumnosSection ─────────────────────────────────────────────────────────────

function AlumnosSection() {
  const [alumnos, setAlumnos]           = useState([]);
  const [grupos,  setGrupos]            = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal,   setModal]             = useState(null);
  const [form,    setForm]              = useState({ grupo: "", semestre: "", turno: "" });
  const [saving,  setSaving]            = useState(false);
  const [alumnoModalOpen, setAlumnoModalOpen] = useState(false);
  const [formAlumno, setFormAlumno]     = useState({
    firstName: "", lastName: "", numeroControl: "", curp: "",
    carrera: "", semestre: "", grupo: "", turno: "Matutino",
  });
  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const [alumnosResult, gruposResult] = await Promise.allSettled([
      api.get("/academico/alumnos/"),
      api.get("/academico/grupos/"),
    ]);
    setAlumnos(alumnosResult.status === "fulfilled" ? extractList(alumnosResult.value.data) : []);
    setGrupos(gruposResult.status  === "fulfilled" ? extractList(gruposResult.value.data)  : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredGrupos = grupos.filter((g) => {
    const semesterMatch = !form.semestre || g.semestre === Number.parseInt(form.semestre, 10);
    const turnoMatch    = !form.turno    || g.turno === form.turno;
    return semesterMatch && turnoMatch;
  });

  const openEdit = (alumno) => {
    const grupo = grupos.find((g) => g.id === alumno.grupo);
    setForm({
      grupo:    alumno.grupo ? String(alumno.grupo) : "",
      semestre: grupo?.semestre ? String(grupo.semestre) : "",
      turno:    grupo?.turno ?? "",
    });
    setModal({ id: alumno.id, userId: alumno.user, matricula: alumno.matricula ?? "", nombre: alumno.nombre_completo ?? "", email: alumno.email ?? "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!modal?.userId || !form.grupo) { show("Selecciona un grupo válido.", "error"); return; }
    setSaving(true);
    try {
      await api.put(`/academico/alumnos/${modal.id}/`, { user: modal.userId, grupo: Number.parseInt(form.grupo, 10) });
      show("Alumno actualizado correctamente.");
      setModal(null);
      await load();
    } catch { show("No se pudo actualizar el alumno.", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este alumno?")) return;
    try { await api.delete(`/academico/alumnos/${id}/`); show("Alumno eliminado."); await load(); }
    catch { show("No se pudo eliminar el alumno.", "error"); }
  };

  const gruposFiltrados = grupos.filter((g) => {
    if (!g) return false;
    const carreraF = (formAlumno.carrera || "").replace(/_/g,"").replace(/\s+/g,"").trim().toUpperCase();
    const carreraB = (g.carrera || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/_/g,"").replace(/\s+/g,"").trim().toUpperCase();
    const carreraMatch = !formAlumno.carrera || carreraB.includes(carreraF) || carreraF.includes(carreraB);
    const semestreMatch = !formAlumno.semestre || Number(g.semestre) === Number(formAlumno.semestre);
    const turnoMatch = !formAlumno.turno || String(g.turno||"").trim().toLowerCase() === String(formAlumno.turno).trim().toLowerCase();
    return carreraMatch && semestreMatch && turnoMatch;
  });

  const handleSaveAlumno = async (e) => {
    e.preventDefault();
    if (!formAlumno.firstName.trim() || !formAlumno.lastName.trim() || !formAlumno.numeroControl.trim() || !formAlumno.curp.trim() || !formAlumno.carrera || !formAlumno.semestre || !formAlumno.grupo) {
      show("Por favor completa todos los campos requeridos.", "error"); return;
    }
    setSaving(true);
    try {
      const userResponse = await api.post("/auth/usuarios/", {
        username: formAlumno.numeroControl.trim(), first_name: formAlumno.firstName.trim(),
        last_name: formAlumno.lastName.trim(), email: `${formAlumno.numeroControl.trim()}@cecytem.edu.mx`,
        password: formAlumno.curp.trim(), rol: "ALUMNO",
      });
      const userUuid = userResponse.data.id;
      if (!userUuid) throw new Error("El servidor no devolvió un ID válido.");
      await api.post("/academico/alumnos/", {
        user: userUuid, curp: formAlumno.curp.trim(), carrera: formAlumno.carrera,
        semestre: Number.parseInt(formAlumno.semestre, 10), grupo: Number.parseInt(formAlumno.grupo, 10), turno: formAlumno.turno,
      });
      show(`Alumno ${formAlumno.firstName} ${formAlumno.lastName} creado e inscrito exitosamente.`);
      setAlumnoModalOpen(false);
      setFormAlumno({ firstName: "", lastName: "", numeroControl: "", curp: "", carrera: "", semestre: "", grupo: "", turno: "Matutino" });
      await load();
    } catch (err) {
      if (err.response) alert("DJANGO RECHAZÓ:\n" + JSON.stringify(err.response.data, null, 2));
      else alert("Error: " + err.message);
    } finally { setSaving(false); }
  };

  return (
    <>
      <Toast toast={toast} />
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
        <SectionTitle title="Alumnos" subtitle="Consulta el padrón y reasigna grupos." />
        <Btn onClick={() => setAlumnoModalOpen(true)}>+ Nuevo alumno</Btn>
      </div>

      <Table cols={["Matrícula", "Nombre", "Correo", "Grupo", "Semestre", "Turno", ""]} loading={loading} emptyText="Sin alumnos registrados">
        {alumnos.map((alumno, idx) => {
          const grupo = grupos.find((g) => g.id === alumno.grupo);
          return (
            <TR key={alumno.id} idx={idx}>
              <TD><span style={{ fontFamily: "monospace", fontSize: 12, color: T.cyan }}>{alumno.matricula ?? "—"}</span></TD>
              <TD>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar label={alumno.nombre_completo ?? ""} />
                  <div>
                    <div style={{ fontWeight: 600, color: T.textPrimary, fontSize: 13 }}>{alumno.nombre_completo}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{alumno.user ? `Usuario #${alumno.user}` : "Sin usuario"}</div>
                  </div>
                </div>
              </TD>
              <TD><span style={{ fontSize: 12, color: T.textSecondary }}>{alumno.email || "—"}</span></TD>
              <TD><Pill>{groupLabel(grupo)}</Pill></TD>
              <TD><span style={{ fontSize: 12, color: T.textSecondary }}>{grupo?.semestre ? `${grupo.semestre}°` : "—"}</span></TD>
              <TD><span style={{ fontSize: 12, color: T.textSecondary }}>{grupo?.turno ?? "—"}</span></TD>
              <TD>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn variant="ghost" size="sm" onClick={() => openEdit(alumno)}>Editar grupo</Btn>
                  <Btn variant="danger" size="sm" onClick={() => handleDelete(alumno.id)}>Eliminar</Btn>
                </div>
              </TD>
            </TR>
          );
        })}
      </Table>

      {modal ? (
        <Modal title="Actualizar alumno" onClose={() => setModal(null)}>
          <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSave}>
            <Card style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar label={modal.nombre} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{modal.nombre}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{modal.matricula || "Sin matrícula"} · {modal.email || "Sin correo"}</div>
                </div>
              </div>
            </Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Semestre">
                <StyledSelect value={form.semestre} onChange={(e) => setForm((c) => ({ ...c, semestre: e.target.value, grupo: "" }))}>
                  <option value="">Todos</option>
                  {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}°</option>)}
                </StyledSelect>
              </Field>
              <Field label="Turno">
                <StyledSelect value={form.turno} onChange={(e) => setForm((c) => ({ ...c, turno: e.target.value, grupo: "" }))}>
                  <option value="">Todos</option>
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                </StyledSelect>
              </Field>
            </div>
            <Field label="Grupo" required>
              <StyledSelect value={form.grupo} onChange={(e) => setForm((c) => ({ ...c, grupo: e.target.value }))}>
                <option value="">Seleccionar grupo</option>
                {filteredGrupos.map((g) => <option key={g.id} value={g.id}>{groupLabel(g)} ({g.turno})</option>)}
              </StyledSelect>
            </Field>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn type="submit" loading={saving}>Guardar cambios</Btn>
            </div>
          </form>
        </Modal>
      ) : null}

      {alumnoModalOpen ? (
        <Modal title="Registrar nuevo alumno" onClose={() => setAlumnoModalOpen(false)}>
          <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSaveAlumno}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Nombre(s)" required>
                <StyledInput value={formAlumno.firstName} onChange={(e) => setFormAlumno(c => ({ ...c, firstName: e.target.value }))} placeholder="Ej. Luis Rodrigo" />
              </Field>
              <Field label="Apellidos" required>
                <StyledInput value={formAlumno.lastName} onChange={(e) => setFormAlumno(c => ({ ...c, lastName: e.target.value }))} placeholder="Ej. Briseño" />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Número de control" required>
                <StyledInput value={formAlumno.numeroControl} onChange={(e) => setFormAlumno(c => ({ ...c, numeroControl: e.target.value }))} placeholder="231502..." />
              </Field>
              <Field label="CURP (contraseña)" required>
                <StyledInput value={formAlumno.curp} onChange={(e) => setFormAlumno(c => ({ ...c, curp: e.target.value }))} placeholder="18 caracteres" maxLength={18} />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Carrera" required>
                <StyledSelect value={formAlumno.carrera} onChange={(e) => setFormAlumno(c => ({ ...c, carrera: e.target.value, grupo: "" }))}>
                  <option value="">Seleccionar carrera</option>
                  <option value="LOGISTICA">Técnico en Logística</option>
                  <option value="CIENCIA_DATOS">Técnico en Ciencia de Datos</option>
                </StyledSelect>
              </Field>
              <Field label="Semestre" required>
                <StyledSelect value={formAlumno.semestre} onChange={(e) => setFormAlumno(c => ({ ...c, semestre: e.target.value, grupo: "" }))}>
                  <option value="">Seleccionar semestre</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}° Semestre</option>)}
                </StyledSelect>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Turno" required>
                <StyledSelect value={formAlumno.turno} onChange={(e) => setFormAlumno(c => ({ ...c, turno: e.target.value, grupo: "" }))}>
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                </StyledSelect>
              </Field>
              <Field label="Grupo destino" required>
                <StyledSelect value={formAlumno.grupo} onChange={(e) => setFormAlumno(c => ({ ...c, grupo: e.target.value }))}>
                  {!formAlumno.carrera || !formAlumno.semestre ? (
                    <option value="">Selecciona carrera y semestre primero</option>
                  ) : gruposFiltrados.length === 0 ? (
                    <option value="">Sin grupos disponibles ({formAlumno.turno})</option>
                  ) : (
                    <option value="">Seleccionar grupo ({gruposFiltrados.length} disponible/s)</option>
                  )}
                  {gruposFiltrados.map((g) => (
                    <option key={g.id} value={g.id}>{g.semestre}0{g.grupo_letra || "2"} - {carreraLabels[g.carrera] || g.carrera} ({g.turno})</option>
                  ))}
                </StyledSelect>
              </Field>
            </div>
            <div style={{ borderRadius: T.radiusXs, padding: 12, background: T.accentGlow, border: `1px solid ${T.borderGreen}`, fontSize: 12, color: "#d1fae5" }}>
              💡 <strong>Credenciales automáticas:</strong> El alumno iniciará sesión con su <strong>Número de Control</strong> y su contraseña será su <strong>CURP</strong>.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
              <Btn variant="ghost" onClick={() => setAlumnoModalOpen(false)}>Cancelar</Btn>
              <Btn type="submit" loading={saving}>Crear e inscribir alumno</Btn>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

// ─── DocentesSection ────────────────────────────────────────────────────────────

function DocentesSection() {
  const [docentes,     setDocentes]     = useState([]);
  const [materias,     setMaterias]     = useState([]);
  const [grupos,       setGrupos]       = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [form,         setForm]         = useState({ materia_id: "", grupo_id: "" });
  const [formDocente,  setFormDocente]  = useState({ firstName: "", lastName: "", email: "", claveServidor: "" });
  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, m, g, a] = await Promise.allSettled([
        api.get("/auth/usuarios/?rol=DOCENTE"), api.get("/academico/materias/"),
        api.get("/academico/grupos/"), api.get("/seguimiento/asignaciones/"),
      ]);
      setDocentes(d.status === "fulfilled" ? extractList(d.value.data) : []);
      setMaterias(m.status === "fulfilled" ? extractList(m.value.data) : []);
      setGrupos(g.status   === "fulfilled" ? extractList(g.value.data) : []);
      setAsignaciones(a.status === "fulfilled" ? extractList(a.value.data) : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getAssignments = (docenteId) => asignaciones.filter((a) => a.docente === docenteId);

  const openDetails = (docente) => setDetailsModal({ docente, assignments: getAssignments(docente.id) });
  const openAddMateria = (docente) => {
    setModal({ mode: "add_materia", docenteId: docente.id, docenteName: `${docente.first_name ?? ""} ${docente.last_name ?? ""}`.trim() || docente.username });
    setForm({ materia_id: "", grupo_id: "" });
  };
  const openRegisterDocente = () => { setModal({ mode: "register_docente" }); setFormDocente({ firstName: "", lastName: "", email: "", claveServidor: "" }); };

  const handleCreateDocente = async (e) => {
    e.preventDefault();
    if (!formDocente.firstName.trim() || !formDocente.lastName.trim() || !formDocente.email.trim() || !formDocente.claveServidor.trim()) {
      show("Completa todos los campos del docente.", "error"); return;
    }
    setSaving(true);
    try {
      await api.post("/auth/usuarios/", {
        username: formDocente.email.trim(), email: formDocente.email.trim(),
        first_name: formDocente.firstName.trim(), last_name: formDocente.lastName.trim(),
        password: formDocente.claveServidor.trim(), rol: "DOCENTE",
      });
      show(`Docente ${formDocente.firstName} creado con éxito.`);
      setModal(null); await load();
    } catch (err) {
      if (err.response) alert("DJANGO RECHAZÓ:\n" + JSON.stringify(err.response.data, null, 2));
      else show("No se pudo registrar al docente.", "error");
    } finally { setSaving(false); }
  };

  const handleAddMateria = async (e) => {
    e.preventDefault();
    if (!form.materia_id || !form.grupo_id) { show("Selecciona materia y grupo.", "error"); return; }
    setSaving(true);
    try {
      const existing = asignaciones.find((a) => a.docente === modal.docenteId && a.materia === Number.parseInt(form.materia_id, 10) && a.grupo === Number.parseInt(form.grupo_id, 10));
      if (existing) { show("Ya tiene esta materia asignada en ese grupo.", "error"); setSaving(false); return; }
      await api.post("/seguimiento/asignaciones/", { docente: modal.docenteId, materia: Number.parseInt(form.materia_id, 10), grupo: Number.parseInt(form.grupo_id, 10) });
      show("Materia y grupo asignados correctamente.");
      setModal(null); await load();
    } catch (err) {
      if (err.response) alert("DJANGO RECHAZÓ:\n" + JSON.stringify(err.response.data, null, 2));
      else show("No se pudo asignar la materia.", "error");
    } finally { setSaving(false); }
  };

  const handleRemoveMateria = async (asignacionId) => {
    if (!window.confirm("¿Remover esta asignación?")) return;
    try { await api.delete(`/seguimiento/asignaciones/${asignacionId}/`); show("Materia removida."); await load(); }
    catch { show("No se pudo remover la materia.", "error"); }
  };

  const handleDeleteDocente = async (docente) => {
    const name = [docente.first_name, docente.last_name].filter(Boolean).join(" ") || docente.username;
    if (!window.confirm(`¿Eliminar al docente "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/auth/usuarios/${docente.id}/`);
      show(`Docente ${name} eliminado.`);
      await load();
    } catch (err) {
      if (err.response) alert("DJANGO RECHAZÓ:\n" + JSON.stringify(err.response.data, null, 2));
      else show("No se pudo eliminar al docente.", "error");
    }
  };

  return (
    <>
      <Toast toast={toast} />
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
        <SectionTitle title="Docentes" subtitle="Listado sincronizado con usuarios y asignaciones activas." />
        <Btn onClick={openRegisterDocente}>+ Registrar docente</Btn>
      </div>

      <Table cols={["Nombre", "Correo", "Usuario", "Materias", "Grupos", ""]} loading={loading} emptyText="Sin docentes registrados">
        {docentes.map((docente, idx) => {
          const assignments = getAssignments(docente.id);
          const subjectIds  = [...new Set(assignments.map((a) => a.materia))];
          const groupIds    = [...new Set(assignments.map((a) => a.grupo))];
          return (
            <TR key={docente.id} idx={idx}>
              <TD>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar label={`${docente.first_name ?? ""} ${docente.last_name ?? ""}`} />
                  <div>
                    <div style={{ fontWeight: 600, color: T.textPrimary, fontSize: 13 }}>{[docente.first_name, docente.last_name].filter(Boolean).join(" ") || docente.username}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>ID #{docente.id}</div>
                  </div>
                </div>
              </TD>
              <TD><span style={{ fontSize: 12, color: T.textSecondary }}>{docente.email || "—"}</span></TD>
              <TD><span style={{ fontFamily: "monospace", fontSize: 12, color: T.cyan }}>{docente.username}</span></TD>
              <TD>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {subjectIds.length > 0
                    ? subjectIds.slice(0, 3).map((sid) => { const mat = materias.find((m) => m.id === sid); return <Pill key={sid}>{mat?.clave ?? `#${sid}`}</Pill>; })
                    : <span style={{ fontSize: 12, color: T.textMuted }}>Sin materias</span>}
                  {subjectIds.length > 3 ? <Pill color="gray">+{subjectIds.length - 3}</Pill> : null}
                </div>
              </TD>
              <TD>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {groupIds.length > 0
                    ? groupIds.slice(0, 3).map((gid) => { const asig = assignments.find((a) => a.grupo === gid); return <Pill color="gray" key={gid}>{groupCode(asig?.grupo_detalle)}</Pill>; })
                    : <span style={{ fontSize: 12, color: T.textMuted }}>Sin grupos</span>}
                  {groupIds.length > 3 ? <Pill color="gray">+{groupIds.length - 3}</Pill> : null}
                </div>
              </TD>
              <TD>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn variant="ghost" size="sm" onClick={() => openDetails(docente)}>Detalles</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => openAddMateria(docente)}>+ Materia</Btn>
                  <Btn variant="danger" size="sm" onClick={() => handleDeleteDocente(docente)}>Eliminar</Btn>
                </div>
              </TD>
            </TR>
          );
        })}
      </Table>

      {detailsModal && (
        <Modal title={`Detalles: ${detailsModal.docente.first_name ?? ""} ${detailsModal.docente.last_name ?? ""}`} onClose={() => setDetailsModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar label={`${detailsModal.docente.first_name ?? ""} ${detailsModal.docente.last_name ?? ""}`} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{detailsModal.docente.first_name} {detailsModal.docente.last_name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{detailsModal.docente.email || "Sin correo"}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>Usuario: {detailsModal.docente.username}</div>
                </div>
              </div>
            </Card>
            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: T.textPrimary, fontFamily: T.fontHeading }}>Materias asignadas</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
                {detailsModal.assignments.length > 0 ? detailsModal.assignments.map((asig) => (
                  <div key={asig.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: T.radiusXs, background: T.cyanDim, border: `1px solid ${T.border}` }}>
                    <div>
                      <div style={{ fontWeight: 700, color: T.cyan, fontSize: 13, fontFamily: "monospace" }}>{asig.materia_detalle?.clave}</div>
                      <div style={{ fontSize: 12, color: T.textSecondary }}>{asig.materia_detalle?.nombre}</div>
                      {asig.grupo_detalle && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Grupo: {groupCode(asig.grupo_detalle)}</div>}
                    </div>
                    <Btn variant="danger" size="sm" onClick={() => handleRemoveMateria(asig.id)}>Remover</Btn>
                  </div>
                )) : <div style={{ fontSize: 12, color: T.textMuted }}>Sin materias asignadas</div>}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {modal?.mode === "add_materia" && (
        <Modal title={`Asignar materia a ${modal.docenteName}`} onClose={() => setModal(null)}>
          <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleAddMateria}>
            <Field label="Materia" required>
              <StyledSelect value={form.materia_id} onChange={(e) => setForm((c) => ({ ...c, materia_id: e.target.value }))}>
                <option value="">Seleccionar materia</option>
                {materias.map((m) => <option key={m.id} value={m.id}>{m.clave} - {m.nombre}</option>)}
              </StyledSelect>
            </Field>
            <Field label="Grupo destino" required>
              <StyledSelect value={form.grupo_id} onChange={(e) => setForm((c) => ({ ...c, grupo_id: e.target.value }))}>
                <option value="">Seleccionar grupo</option>
                {grupos.map((g) => <option key={g.id} value={g.id}>{g.semestre}°{g.nombre} - {g.carrera} ({g.turno})</option>)}
              </StyledSelect>
            </Field>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn type="submit" loading={saving}>Asignar materia</Btn>
            </div>
          </form>
        </Modal>
      )}

      {modal?.mode === "register_docente" && (
        <Modal title="Registrar nuevo docente institucional" onClose={() => setModal(null)}>
          <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleCreateDocente}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Nombre(s)" required>
                <StyledInput value={formDocente.firstName} onChange={(e) => setFormDocente({ ...formDocente, firstName: e.target.value })} placeholder="Ej. Arturo" />
              </Field>
              <Field label="Apellidos" required>
                <StyledInput value={formDocente.lastName} onChange={(e) => setFormDocente({ ...formDocente, lastName: e.target.value })} placeholder="Ej. López" />
              </Field>
            </div>
            <Field label="Correo institucional (usuario de acceso)" required>
              <StyledInput type="email" value={formDocente.email} onChange={(e) => setFormDocente({ ...formDocente, email: e.target.value })} placeholder="ejemplo@cecytem.edu.mx" />
            </Field>
            <Field label="Clave de servidor público (contraseña inicial)" required>
              <StyledInput value={formDocente.claveServidor} onChange={(e) => setFormDocente({ ...formDocente, claveServidor: e.target.value })} placeholder="Clave impresa en gafete institucional" />
              <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>Las credenciales se vincularán para que use el correo completo como inicio de sesión.</p>
            </Field>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn type="submit" loading={saving}>Crear docente</Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ─── GruposSection ──────────────────────────────────────────────────────────────

const getMateriasPorSemestreCarrera = (todasMaterias, semestre, carrera) =>
  todasMaterias.filter((m) => {
    const matchSemestre = !semestre || m.semestre === Number.parseInt(semestre, 10);
    const matchCarrera  = !carrera  || m.carrera === carrera;
    return matchSemestre && matchCarrera;
  });

function GruposSection() {
  const [grupos,       setGrupos]       = React.useState([]);
  const [docentes,     setDocentes]     = React.useState([]);
  const [materias,     setMaterias]     = React.useState([]);
  const [asignaciones, setAsignaciones] = React.useState([]);
  const [alumnos,      setAlumnos]      = React.useState([]);
  const [loading,      setLoading]      = React.useState(true);
  const [saving,       setSaving]       = React.useState(false);
  const [modalOpen,    setModalOpen]    = React.useState(false);
  const [editGroup,    setEditGroup]    = React.useState(null);
  const [detailsGroup, setDetailsGroup] = React.useState(null);
  const [alumnosModal, setAlumnosModal] = React.useState({ open: false, grupo: null, lista: [], loading: false });
  const [fase1,        setFase1]        = React.useState({ semestre: "", carrera: "", grupo_letra: "", turno: "Matutino" });
  const [asignForm,    setAsignForm]    = React.useState([]);
  const [step,         setStep]         = React.useState(0);
  const { toast, show } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    const [gr, doc, mat, asig, al] = await Promise.allSettled([
      api.get("/academico/grupos/"), api.get("/auth/usuarios/?rol=DOCENTE"),
      api.get("/academico/materias/"), api.get("/seguimiento/asignaciones/"),
      api.get("/academico/alumnos/"),
    ]);
    setGrupos(gr.status         === "fulfilled" ? extractList(gr.value.data)   : []);
    setDocentes(doc.status      === "fulfilled" ? extractList(doc.value.data)  : []);
    setMaterias(mat.status      === "fulfilled" ? extractList(mat.value.data)  : []);
    setAsignaciones(asig.status === "fulfilled" ? extractList(asig.value.data) : []);
    setAlumnos(al.status        === "fulfilled" ? extractList(al.value.data)   : []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const getAsignacionesPorGrupo = (grupoId) => asignaciones.filter((a) => a.grupo === grupoId);

  const usedGroupLetras = grupos
    .filter((g) => g.semestre === Number.parseInt(fase1.semestre, 10) && g.carrera === fase1.carrera && (!editGroup || g.id !== editGroup.grupoId))
    .map((g) => String(g.grupo_letra));
  const letrasDisponibles = !fase1.semestre || !fase1.carrera ? [] : ["1","2","3","4"].filter((l) => !usedGroupLetras.includes(l));

  const resetAll = () => { setFase1({ semestre: "", carrera: "", grupo_letra: "", turno: "Matutino" }); setAsignForm([]); setStep(0); setEditGroup(null); };
  const openCreate = () => { resetAll(); setModalOpen(true); };

  const openEditGroup = (grupo) => {
    const asigs = getAsignacionesPorGrupo(grupo.id);
    setFase1({ semestre: String(grupo.semestre || ""), carrera: grupo.carrera || "", grupo_letra: String(grupo.grupo_letra || ""), turno: grupo.turno || "Matutino" });
    const matsFiltradas = getMateriasPorSemestreCarrera(materias, String(grupo.semestre || ""), grupo.carrera || "");
    const rows = matsFiltradas.map((mat) => {
      const asig = asigs.find((a) => a.materia === mat.id);
      return { materia_id: mat.id, materia_clave: mat.clave, materia_nombre: mat.nombre, docente_id: asig?.docente ? String(asig.docente) : "", asig_id: asig?.id ?? null };
    });
    setAsignForm(rows); setEditGroup({ grupoId: grupo.id }); setStep(0); setModalOpen(true);
  };

  const goToFase2 = () => {
    if (!fase1.semestre || !fase1.carrera || !fase1.grupo_letra) { show("Completa semestre, carrera y grupo antes de continuar.", "error"); return; }
    const currentMats = getMateriasPorSemestreCarrera(materias, fase1.semestre, fase1.carrera);
    setAsignForm((prev) => currentMats.map((mat) => {
      const existing = prev.find((r) => r.materia_id === mat.id);
      return existing ?? { materia_id: mat.id, materia_clave: mat.clave, materia_nombre: mat.nombre, docente_id: "", asig_id: null };
    }));
    setStep(1);
  };

  const updateDocenteEnFila = (materiaId, docenteId) => setAsignForm((prev) => prev.map((row) => row.materia_id === materiaId ? { ...row, docente_id: docenteId } : row));

  const parseDRFError = (err) => {
    if (!err.response?.data) return "Error desconocido.";
    const data = err.response.data;
    if (typeof data === "string") return data;
    if (Array.isArray(data)) return data.join(" | ");
    return Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ");
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const grupoRes = await api.post("/academico/grupos/", { semestre: Number.parseInt(fase1.semestre, 10), carrera: fase1.carrera, grupo_letra: String(fase1.grupo_letra), turno: fase1.turno });
      const grupoId = grupoRes.data.id;

      // Filtra filas con docente válido y sin duplicado en BD
      const validas = asignForm.filter((r) => {
        if (!r.docente_id || r.docente_id.trim() === "" || isNaN(Number.parseInt(r.docente_id, 10)) || Number.parseInt(r.docente_id, 10) <= 0) return false;
        const yaExiste = asignaciones.some(
          (a) => a.docente === Number.parseInt(r.docente_id, 10) &&
                 a.materia === r.materia_id &&
                 a.grupo   === grupoId
        );
        return !yaExiste;
      });

      if (validas.length > 0) {
        const results = await Promise.allSettled(
          validas.map((row) => api.post("/seguimiento/asignaciones/", {
            docente: Number.parseInt(row.docente_id, 10),
            materia: row.materia_id,
            grupo:   grupoId,
          }))
        );
        const fallos = results.filter((r) => r.status === "rejected");
        if (fallos.length > 0) {
          const detalle = fallos.map((f) => parseDRFError(f.reason)).join(" | ");
          show(`Grupo creado, pero ${fallos.length} asignación(es) fallaron: ${detalle}`, "error");
        } else {
          show(`Grupo ${fase1.semestre}${fase1.grupo_letra} creado con ${validas.length} asignación(es).`);
        }
      } else {
        show(`Grupo ${fase1.semestre}${fase1.grupo_letra} creado sin asignaciones.`);
      }
      setModalOpen(false); resetAll(); await load();
    } catch (err) { show(parseDRFError(err), "error"); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editGroup?.grupoId) return;
    setSaving(true);
    try {
      await api.put(`/academico/grupos/${editGroup.grupoId}/`, { semestre: Number.parseInt(fase1.semestre, 10), carrera: fase1.carrera, grupo_letra: String(fase1.grupo_letra), turno: fase1.turno });
      const asignActuales = getAsignacionesPorGrupo(editGroup.grupoId);
      const ops = asignForm.map(async (row) => {
        const existing = asignActuales.find((a) => a.materia === row.materia_id);
        const esValida  = row.docente_id && row.docente_id.trim() !== "" && !isNaN(Number.parseInt(row.docente_id, 10));
        if (existing && esValida) {
          if (Number(existing.docente) !== Number.parseInt(row.docente_id, 10))
            await api.patch(`/seguimiento/asignaciones/${existing.id}/`, { docente: Number.parseInt(row.docente_id, 10) });
        } else if (existing && !esValida) {
          await api.delete(`/seguimiento/asignaciones/${existing.id}/`);
        } else if (!existing && esValida) {
          // Verificar que no exista ya en BD antes de crear
          const yaExiste = asignaciones.some(
            (a) => a.docente === Number.parseInt(row.docente_id, 10) &&
                   a.materia === row.materia_id &&
                   a.grupo   === editGroup.grupoId
          );
          if (!yaExiste)
            await api.post("/seguimiento/asignaciones/", { docente: Number.parseInt(row.docente_id, 10), materia: row.materia_id, grupo: editGroup.grupoId });
        }
      });
      const results = await Promise.allSettled(ops);
      const fallos  = results.filter((r) => r.status === "rejected");
      if (fallos.length > 0) {
        const detalle = fallos.map((f) => parseDRFError(f.reason)).join(" | ");
        show(`Grupo actualizado, pero ${fallos.length} cambio(s) fallaron: ${detalle}`, "error");
      } else {
        show("Grupo actualizado correctamente.");
      }
      setModalOpen(false); resetAll(); await load();
    } catch (err) { show(parseDRFError(err), "error"); }
    finally { setSaving(false); }
  };

  const handleViewAlumnos = async (grupo) => {
    setAlumnosModal({ open: true, grupo, lista: [], loading: true });
    try { const res = await api.get(`/academico/alumnos/?grupo=${grupo.id}`); setAlumnosModal((prev) => ({ ...prev, lista: extractList(res.data), loading: false })); }
    catch { show("Error al cargar alumnos.", "error"); setAlumnosModal((prev) => ({ ...prev, loading: false })); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este grupo y sus asignaciones?")) return;
    try { await api.delete(`/academico/grupos/${id}/`); show("Grupo eliminado."); await load(); }
    catch (err) { show(parseDRFError(err), "error"); }
  };

  return (
    <>
      <Toast toast={toast} />
      <SectionTitle title="Grupos" subtitle="Crea grupos y gestiona su matriz académica completa." action={<Btn onClick={openCreate}>+ Nuevo grupo</Btn>} />

      <Table cols={["Clave", "Semestre", "Carrera", "Turno", "Materias asignadas", "Alumnos", ""]} loading={loading} emptyText="Sin grupos registrados">
        {grupos.map((grupo, idx) => {
          const asigs = getAsignacionesPorGrupo(grupo.id);
          return (
            <TR key={`grupo-${grupo.id ?? idx}`} idx={idx}>
              <TD><span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: T.cyan }}>{groupCode(grupo)}</span></TD>
              <TD><Pill>{grupo.semestre}°</Pill></TD>
              <TD><span style={{ fontSize: 12, color: T.textSecondary }}>{carreraLabels[grupo.carrera] ?? grupo.carrera}</span></TD>
              <TD><span style={{ fontSize: 12, color: T.textSecondary }}>{grupo.turno}</span></TD>
              <TD>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {asigs.length > 0 ? asigs.slice(0, 3).map((a) => <Pill key={a.id}>{a.materia_detalle?.clave ?? `#${a.materia}`}</Pill>) : <span style={{ fontSize: 12, color: T.textMuted }}>Sin asignaciones</span>}
                  {asigs.length > 3 && <Pill color="gray">+{asigs.length - 3}</Pill>}
                </div>
              </TD>
              <TD>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Pill color="green">{grupo.total_alumnos ?? 0}</Pill>
                  <Btn variant="ghost" size="sm" onClick={() => handleViewAlumnos(grupo)}>👁️</Btn>
                </div>
              </TD>
              <TD>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn variant="ghost"  size="sm" onClick={() => openEditGroup(grupo)}>Editar</Btn>
                  <Btn variant="ghost"  size="sm" onClick={() => setDetailsGroup(grupo)}>Detalles</Btn>
                  <Btn variant="danger" size="sm" onClick={() => handleDelete(grupo.id)}>Eliminar</Btn>
                </div>
              </TD>
            </TR>
          );
        })}
      </Table>

      {modalOpen && (
        <Modal title={editGroup ? "Editar grupo" : "Nuevo grupo"} onClose={() => { setModalOpen(false); resetAll(); }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            {["Datos del grupo", "Matriz académica"].map((label, i) => (
              <React.Fragment key={label}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, transition: "all 0.2s",
                    background: step === i ? T.accent : step > i ? "rgba(29,185,84,0.18)" : T.cyanDim,
                    color: step === i ? "#fff" : step > i ? T.accent : T.textMuted,
                    border: `1px solid ${step === i ? T.accent : step > i ? T.borderGreen : T.border}`,
                  }}>
                    {step > i ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: step === i ? T.textPrimary : T.textMuted, fontFamily: T.fontBody }}>{label}</span>
                </div>
                {i < 1 && <div style={{ flex: 1, height: 1, background: step > 0 ? T.borderGreen : T.border }} />}
              </React.Fragment>
            ))}
          </div>

          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Semestre" required>
                  <StyledSelect value={fase1.semestre} onChange={(e) => setFase1((c) => ({ ...c, semestre: e.target.value, carrera: "", grupo_letra: "" }))}>
                    <option value="">Seleccionar</option>
                    {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}°</option>)}
                  </StyledSelect>
                </Field>
                <Field label="Carrera" required>
                  <StyledSelect value={fase1.carrera} disabled={!fase1.semestre} onChange={(e) => setFase1((c) => ({ ...c, carrera: e.target.value, grupo_letra: "" }))}>
                    <option value="">Seleccionar</option>
                    {CARRERAS_POR_SEMESTRE(fase1.semestre).map((car) => <option key={car.value} value={car.value}>{car.label}</option>)}
                  </StyledSelect>
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Letra de grupo" required>
                  <StyledSelect value={fase1.grupo_letra} disabled={!fase1.carrera} onChange={(e) => setFase1((c) => ({ ...c, grupo_letra: e.target.value }))}>
                    <option value="">Seleccionar</option>
                    {editGroup && fase1.grupo_letra && !letrasDisponibles.includes(fase1.grupo_letra) && <option value={fase1.grupo_letra}>{fase1.grupo_letra} (actual)</option>}
                    {letrasDisponibles.map((l) => <option key={l} value={l}>{l}</option>)}
                  </StyledSelect>
                </Field>
                <Field label="Turno">
                  <StyledSelect value={fase1.turno} onChange={(e) => setFase1((c) => ({ ...c, turno: e.target.value }))}>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                  </StyledSelect>
                </Field>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn variant="ghost" onClick={() => { setModalOpen(false); resetAll(); }}>Cancelar</Btn>
                <Btn onClick={goToFase2}>Continuar →</Btn>
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: T.radiusSm, background: T.cyanDim, border: `1px solid ${T.border}` }}>
                <div style={{ width: 40, height: 40, borderRadius: T.radiusXs, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(29,185,84,0.15)", border: `1px solid ${T.borderGreen}`, fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: T.accent }}>
                  {fase1.semestre}{fase1.grupo_letra}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{carreraLabels[fase1.carrera] ?? fase1.carrera}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{fase1.semestre}° semestre · {fase1.turno}</div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>Asigna un docente a cada materia. Las filas sin docente no crearán asignación.</p>
              <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {asignForm.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 16px", fontSize: 12, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: T.radiusXs }}>
                    No hay materias para este semestre y carrera. Agrégalas primero en el catálogo.
                  </div>
                ) : asignForm.map((row) => (
                  <div key={row.materia_id} style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: T.radiusXs, background: row.docente_id ? "rgba(29,185,84,0.05)" : "rgba(6,182,212,0.03)", border: `1px solid ${row.docente_id ? T.borderGreen : T.border}`, transition: "all 0.15s" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.cyan }}>{row.materia_clave}</div>
                      <div style={{ fontSize: 11, color: T.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.materia_nombre}</div>
                    </div>
                    <StyledSelect value={row.docente_id ?? ""} onChange={(e) => updateDocenteEnFila(row.materia_id, e.target.value)}>
                      <option value="">— Sin asignar —</option>
                      {docentes.map((d) => <option key={d.id} value={d.id}>{[d.first_name, d.last_name].filter(Boolean).join(" ") || d.username}</option>)}
                    </StyledSelect>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                <Btn variant="ghost" onClick={() => setStep(0)}>← Atrás</Btn>
                <Btn loading={saving} onClick={editGroup ? handleEdit : handleCreate}>{editGroup ? "Guardar cambios" : "Crear grupo"}</Btn>
              </div>
            </div>
          )}
        </Modal>
      )}

      {detailsGroup && (
        <Modal title={`Detalles ${groupCode(detailsGroup)}`} onClose={() => setDetailsGroup(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: T.textPrimary, fontFamily: T.fontHeading }}>Matriz académica</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {getAsignacionesPorGrupo(detailsGroup.id).length > 0 ? getAsignacionesPorGrupo(detailsGroup.id).map((asig) => (
                  <div key={asig.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: T.radiusXs, background: T.cyanDim, border: `1px solid ${T.border}` }}>
                    <div>
                      <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.cyan }}>{asig.materia_detalle?.clave ?? `#${asig.materia}`}</span>
                      <span style={{ marginLeft: 8, fontSize: 12, color: T.textSecondary }}>{asig.materia_detalle?.nombre}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary }}>{asig.docente_detalle ? `${asig.docente_detalle.first_name} ${asig.docente_detalle.last_name}`.trim() : "—"}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{asig.docente_detalle?.email ?? ""}</div>
                    </div>
                  </div>
                )) : <div style={{ fontSize: 12, color: T.textMuted }}>Sin asignaciones registradas.</div>}
              </div>
            </div>
            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: T.textPrimary, fontFamily: T.fontHeading }}>
                Alumnos ({alumnos.filter((a) => a.grupo === detailsGroup.id).length})
              </h4>
              <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {alumnos.filter((a) => a.grupo === detailsGroup.id).map((al) => (
                  <div key={al.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar label={al.nombre_completo ?? String(al.user)} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{al.nombre_completo}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{al.matricula || al.email || `ID ${al.id}`}</div>
                    </div>
                  </div>
                ))}
                {alumnos.filter((a) => a.grupo === detailsGroup.id).length === 0 && <div style={{ fontSize: 12, color: T.textMuted }}>Sin alumnos inscritos.</div>}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {alumnosModal.open && (
        <Modal title={`Alumnos de ${groupCode(alumnosModal.grupo)}`} onClose={() => setAlumnosModal({ open: false, grupo: null, lista: [], loading: false })}>
          {alumnosModal.loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
              <span style={{ fontSize: 13, color: T.textMuted }}>Cargando alumnos...</span>
            </div>
          ) : alumnosModal.lista.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Matrícula", "Nombre", "Correo"].map((h) => <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.cyan, letterSpacing: "0.12em", textTransform: "uppercase" }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {alumnosModal.lista.map((al) => (
                    <tr key={al.id} style={{ borderBottom: `1px solid rgba(6,182,212,0.07)` }}>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: T.textMuted }}>{al.matricula || `ID-${al.id}`}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar label={al.nombre_completo ?? String(al.user)} />
                          <span style={{ color: T.textPrimary }}>{al.nombre_completo || al.user || "—"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: T.textSecondary }}>{al.email || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary, marginBottom: 4 }}>No hay alumnos registrados</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>Este grupo aún no tiene estudiantes inscritos.</div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

// ─── MateriasSection ────────────────────────────────────────────────────────────

function MateriasSection() {
  const [materias, setMaterias] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ nombre: "", clave: "", creditos: "", semestre: "", carrera: "" });
  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get("/academico/materias/"); setMaterias(extractList(res.data)); }
    catch { setMaterias([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ nombre: "", clave: "", creditos: "", semestre: "", carrera: "" });
    setModal({ mode: "create" });
  };

  const openEdit = (m) => {
    setForm({
      nombre:   m.nombre   ?? "",
      clave:    m.clave    ?? "",
      creditos: String(m.creditos ?? ""),
      semestre: m.semestre ? String(m.semestre) : "",
      carrera:  m.carrera  ?? "",
    });
    setModal({ mode: "edit", id: m.id });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { show("El nombre es obligatorio.", "error"); return; }
    if (!form.clave.trim())  { show("La clave es obligatoria.", "error"); return; }
    const creditos = Number.parseInt(form.creditos, 10);
    if (isNaN(creditos) || creditos < 0 || creditos > 20) { show("Los créditos deben estar entre 0 y 20.", "error"); return; }
    const semestre = form.semestre ? Number.parseInt(form.semestre, 10) : null;
    if (semestre !== null && (semestre < 1 || semestre > 6)) { show("El semestre debe ser entre 1 y 6.", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        ...normalizeMateriaPayload(form),
        semestre: semestre,
        carrera:  form.carrera || null,
      };
      if (modal.mode === "create") { await api.post("/academico/materias/", payload); show("Materia creada correctamente."); }
      else { await api.put(`/academico/materias/${modal.id}/`, payload); show("Materia actualizada correctamente."); }
      setModal(null); await load();
    } catch (err) {
      if (err.response?.data) { const msg = Object.entries(err.response.data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | "); show(`Error: ${msg}`, "error"); }
      else show("No se pudo guardar la materia.", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta materia? Esta acción no se puede deshacer.")) return;
    try { await api.delete(`/academico/materias/${id}/`); show("Materia eliminada."); await load(); }
    catch { show("No se pudo eliminar la materia.", "error"); }
  };

  // Valida carreras disponibles según semestre (misma lógica que Grupos)
  const carrerasDisponibles = (semestre) => {
    const s = Number.parseInt(semestre, 10);
    if (!s) return [
      { value: "LOGISTICA",         label: "Logística" },
      { value: "CIENCIA_DATOS",     label: "Ciencia de Datos" },
      { value: "ANIMACION_DIGITAL", label: "Animación Digital" },
    ];
    if (s === 1) return [
      { value: "LOGISTICA",     label: "Logística" },
      { value: "CIENCIA_DATOS", label: "Ciencia de Datos" },
    ];
    if (s === 4 || s === 6) return [
      { value: "LOGISTICA",         label: "Logística" },
      { value: "CIENCIA_DATOS",     label: "Ciencia de Datos" },
      { value: "ANIMACION_DIGITAL", label: "Animación Digital" },
    ];
    return [
      { value: "LOGISTICA",     label: "Logística" },
      { value: "CIENCIA_DATOS", label: "Ciencia de Datos" },
    ];
  };

  return (
    <>
      <Toast toast={toast} />
      <SectionTitle title="Materias" subtitle="Catálogo de materias por semestre y carrera." action={<Btn onClick={openCreate}>+ Nueva materia</Btn>} />
      <Table cols={["Clave", "Nombre", "Semestre", "Carrera", "Créditos", ""]} loading={loading} emptyText="Sin materias registradas">
        {materias.map((materia, idx) => (
          <TR key={materia.id} idx={idx}>
            <TD><span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.cyan }}>{materia.clave}</span></TD>
            <TD><span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{materia.nombre}</span></TD>
            <TD>
              {materia.semestre
                ? <Pill>{materia.semestre}°</Pill>
                : <span style={{ fontSize: 12, color: T.textMuted }}>—</span>}
            </TD>
            <TD>
              {materia.carrera
                ? <span style={{ fontSize: 12, color: T.textSecondary }}>{carreraLabels[materia.carrera] ?? materia.carrera}</span>
                : <span style={{ fontSize: 12, color: T.textMuted }}>—</span>}
            </TD>
            <TD><Pill color="gray">{materia.creditos ?? 0} créditos</Pill></TD>
            <TD>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="ghost"  size="sm" onClick={() => openEdit(materia)}>Editar</Btn>
                <Btn variant="danger" size="sm" onClick={() => handleDelete(materia.id)}>Eliminar</Btn>
              </div>
            </TD>
          </TR>
        ))}
      </Table>

      {modal ? (
        <Modal title={modal.mode === "create" ? "Nueva materia" : "Editar materia"} onClose={() => setModal(null)}>
          <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSave}>
            <Field label="Nombre" required>
              <StyledInput value={form.nombre} onChange={(e) => setForm((c) => ({ ...c, nombre: e.target.value }))} placeholder="Ej. Matemáticas I" disabled={saving} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Clave" required>
                <StyledInput value={form.clave} onChange={(e) => setForm((c) => ({ ...c, clave: e.target.value }))} placeholder="MAT-101" disabled={saving} />
              </Field>
              <Field label="Créditos">
                <StyledInput type="number" value={form.creditos} onChange={(e) => setForm((c) => ({ ...c, creditos: e.target.value }))} placeholder="5" disabled={saving} />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Semestre">
                <StyledSelect
                  value={form.semestre}
                  disabled={saving}
                  onChange={(e) => setForm((c) => ({ ...c, semestre: e.target.value, carrera: "" }))}
                >
                  <option value="">Sin semestre</option>
                  {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}°</option>)}
                </StyledSelect>
              </Field>
              <Field label="Carrera">
                <StyledSelect
                  value={form.carrera}
                  disabled={saving}
                  onChange={(e) => setForm((c) => ({ ...c, carrera: e.target.value }))}
                >
                  <option value="">Sin carrera</option>
                  {carrerasDisponibles(form.semestre).map((car) => (
                    <option key={car.value} value={car.value}>{car.label}</option>
                  ))}
                </StyledSelect>
              </Field>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(null)} disabled={saving}>Cancelar</Btn>
              <Btn type="submit" loading={saving}>{modal.mode === "create" ? "Registrar materia" : "Guardar cambios"}</Btn>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

// ─── DashboardLoader ────────────────────────────────────────────────────────────

function DashboardLoader() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: T.bg, ...BG_DOTS }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, border: `2px solid ${T.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.fontBody }}>Preparando panel...</span>
      </div>
    </div>
  );
}

// ─── AdminDashboard (default export) ───────────────────────────────────────────

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [checking,    setChecking]    = useState(true);
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [section,     setSection]     = useState("alumnos");
  const [stats,       setStats]       = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw || !user) { setIsAdmin(false); setChecking(false); return; }
    try {
      const parsed = JSON.parse(raw);
      setIsAdmin(parsed?.rol === "ADMIN" && user?.rol === "ADMIN");
    } catch { setIsAdmin(false); }
    finally { setChecking(false); }
  }, [loading, user]);

  useEffect(() => {
    if (checking || !isAdmin) return;
    let cancelled = false;
    const fetchStats = async () => {
      const [a, d, g, m] = await Promise.allSettled([
        api.get("/academico/alumnos/"), api.get("/auth/usuarios/?rol=DOCENTE"),
        api.get("/academico/grupos/"), api.get("/academico/materias/"),
      ]);
      if (cancelled) return;
      setStats({
        alumnos:  a.status === "fulfilled" ? extractList(a.value.data).length : 0,
        docentes: d.status === "fulfilled" ? extractList(d.value.data).length : 0,
        grupos:   g.status === "fulfilled" ? extractList(g.value.data).length : 0,
        materias: m.status === "fulfilled" ? extractList(m.value.data).length : 0,
      });
    };
    fetchStats();
    return () => { cancelled = true; };
  }, [checking, isAdmin]);

  if (checking)          return <DashboardLoader />;
  if (!user || !isAdmin) return null;

  const currentSection = SECTIONS.find((s) => s.id === section);

  const renderSection = () => {
    switch (section) {
      case "alumnos":  return <AlumnosSection />;
      case "docentes": return <DocentesSection />;
      case "grupos":   return <GruposSection />;
      case "materias": return <MateriasSection />;
      default:         return null;
    }
  };

  return (
    <>
      {/* Global spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>

      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.fontBody, ...BG_DOTS }}>
        {/* Syne font */}
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

        <Sidebar active={section} onSelect={setSection} stats={stats} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

        <div style={{ minHeight: "100vh", paddingLeft: 272 }}>
          {/* Header */}
          <header
            style={{
              position: "sticky", top: 0, zIndex: 30,
              borderBottom: `1px solid ${T.border}`,
              background: "rgba(5,18,32,0.88)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div style={{ padding: "16px 32px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Abrir menú"
                    style={{
                      width: 40, height: 40, borderRadius: T.radiusSm,
                      border: `1px solid ${T.border}`, background: T.cyanDim,
                      color: T.textPrimary, cursor: "pointer", fontSize: 16,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    ☰
                  </button>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.textPrimary, fontFamily: T.fontHeading }}>
                      Panel de administración
                    </h1>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: T.textMuted, fontFamily: T.fontBody }}>
                      {currentSection?.label} · {currentSection?.desc}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, fontFamily: T.fontBody }}>{user.first_name || user.username}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontBody }}>Sesión administrativa</div>
                  </div>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: T.radiusSm,
                      background: "linear-gradient(135deg, rgba(29,185,84,0.20) 0%, rgba(6,182,212,0.12) 100%)",
                      border: `1px solid ${T.borderGreen}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700, color: T.accent, fontFamily: T.fontHeading,
                    }}
                  >
                    {(user.first_name?.[0] ?? user.username?.[0] ?? "A").toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
                {SECTIONS.map((item) => (
                  <StatCard
                    key={item.id}
                    label={item.label}
                    value={stats[item.id]}
                    icon={item.icon}
                    active={section === item.id}
                    onClick={() => setSection(item.id)}
                  />
                ))}
              </div>
            </div>
          </header>

          {/* Main content */}
          <main style={{ padding: "28px 32px" }}>
            {renderSection()}
          </main>
        </div>
      </div>
    </>
  );
}