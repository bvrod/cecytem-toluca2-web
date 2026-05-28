import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  bg: "#07030f",
  surface: "rgba(15,7,28,0.9)",
  border: "rgba(99,40,180,0.22)",
  borderStrong: "rgba(139,92,246,0.35)",
};

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 transition focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400/40";

const carreraLabels = {
  LOGISTICA: "Logistica",
  CIENCIA_DATOS: "Ciencia de Datos",
  ANIMACION_DIGITAL: "Animacion Digital",
};

const SECTIONS = [
  { id: "alumnos",  label: "Alumnos",  desc: "Consulta y grupos",  icon: "A" },
  { id: "docentes", label: "Docentes", desc: "Plantilla activa",   icon: "D" },
  { id: "grupos",   label: "Grupos",   desc: "Oferta academica",   icon: "G" },
  { id: "materias", label: "Materias", desc: "Catalogo base",      icon: "M" },
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
    { value: "LOGISTICA",     label: "Tecnico en Logistica" },
    { value: "CIENCIA_DATOS", label: "Tecnico en Ciencia de Datos" },
  ];
  if (n === 4 || n === 6) {
    return [...base, { value: "ANIMACION_DIGITAL", label: "Tecnico en Animacion Digital" }];
  }
  return base;
};

// ─── UI Primitives ─────────────────────────────────────────────────────────────

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 18px 40px rgba(0,0,0,0.25)" }}
    >
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", type = "button", size = "md", loading = false, disabled = false }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50";
  const sizes   = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm" };
  const variants = {
    primary: "bg-gradient-to-r from-violet-700 to-violet-500 text-white hover:brightness-110",
    ghost:   "border border-white/10 bg-white/[0.03] text-gray-200 hover:bg-white/[0.06]",
    danger:  "border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
      {children}
    </button>
  );
}

function Pill({ children, color = "violet" }) {
  const colors = {
    violet:  "border-violet-500/20 bg-violet-500/10 text-violet-200",
    gray:    "border-white/10 bg-white/[0.04] text-gray-300",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

function Avatar({ label = "?" }) {
  const initials = String(label || "").trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-xs font-bold text-violet-200">
      {initials || "?"}
    </span>
  );
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-gray-100">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <Card className="p-4 transition hover:border-violet-400/30">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-sm font-bold text-violet-200">
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-100">{value ?? "—"}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </Card>
  );
}

function Table({ cols, children, loading, emptyText = "Sin registros" }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${C.border}`, background: C.surface }}>
      <table className="min-w-[680px] w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-white/5 bg-violet-500/10">
            {cols.map((col) => (
              <th key={col} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200 sm:px-5 sm:text-xs">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={cols.length} className="px-5 py-14 text-center">
                <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                  Cargando datos...
                </div>
              </td>
            </tr>
          ) : hasRows ? (
            children
          ) : (
            <tr>
              <td colSpan={cols.length} className="px-5 py-14 text-center text-xs text-gray-500">{emptyText}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TR({ children, idx }) {
  return (
    <tr className="border-t border-white/5 transition hover:bg-violet-500/5" style={{ background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
      {children}
    </tr>
  );
}

function TD({ children }) {
  return <td className="px-4 py-3 align-top text-gray-300 sm:px-5 sm:py-3.5">{children}</td>;
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar modal" />
      <div
        className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl p-5 sm:p-6"
        style={{ background: "rgba(10,3,22,0.98)", border: `1px solid ${C.borderStrong}`, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-base font-bold text-gray-100">{title}</h3>
          <button type="button" className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-gray-300 hover:bg-white/[0.08]" onClick={onClose} aria-label="Cerrar">
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
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
        {label}{required ? <span className="ml-1 text-red-300">*</span> : null}
      </label>
      {children}
    </div>
  );
}

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
    success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-100",
    error:   "border-red-500/30 bg-red-500/15 text-red-100",
  };
  return (
    <div className={`fixed bottom-5 right-5 z-[60] rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${palette[toast.type]}`}>
      {toast.msg}
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ active, onSelect, stats, mobileOpen, onClose, user }) {
  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden ${mobileOpen ? "block" : "hidden"}`}
        onClick={onClose}
        aria-label="Cerrar menu lateral"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col border-r border-white/10 bg-[#080312]/95 backdrop-blur-xl transition-transform duration-200 lg:w-72 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-700 to-violet-500 text-sm font-bold text-white">C</div>
            <div>
              <div className="text-sm font-bold text-gray-100">CECyTEM</div>
              <div className="text-[11px] text-gray-500">Panel administrativo</div>
            </div>
          </div>
          <button type="button" className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-gray-300 lg:hidden" onClick={onClose} aria-label="Cerrar panel">
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
          {SECTIONS.map((section) => {
            const isActive = section.id === active;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => { onSelect(section.id); onClose(); }}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                  isActive ? "border-violet-400/30 bg-violet-500/15" : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-sm font-bold text-violet-200">{section.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm font-semibold ${isActive ? "text-violet-100" : "text-gray-200"}`}>{section.label}</div>
                    <div className="truncate text-[11px] text-gray-500">{section.desc}</div>
                  </div>
                  <span className="text-xs font-mono text-gray-500">{stats[section.id] ?? "—"}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/5 px-5 py-4">
          <div className="text-xs font-semibold text-gray-200">{user?.first_name || user?.username}</div>
          <div className="text-[11px] text-gray-500">Administrador</div>
        </div>
      </aside>
    </>
  );
}

// ─── AlumnosSection ────────────────────────────────────────────────────────────

function AlumnosSection() {
  const [alumnos, setAlumnos]           = useState([]);
  const [grupos,  setGrupos]            = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal,   setModal]              = useState(null);
  const [form,    setForm]              = useState({ grupo: "", semestre: "", turno: "" });
  const [saving,  setSaving]            = useState(false);
  const [alumnoModalOpen, setAlumnoModalOpen] = useState(false);
  const [formAlumno, setFormAlumno]     = useState({
    firstName: "",
    lastName: "",
    numeroControl: "",
    curp: "",
    carrera: "",
    semestre: "",
    grupo: "",
    turno: "Matutino",
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
    setModal({
      id:        alumno.id,
      userId:    alumno.user,
      matricula: alumno.matricula ?? "",
      nombre:    alumno.nombre_completo ?? "",
      email:     alumno.email ?? "",
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!modal?.userId || !form.grupo) {
      show("Selecciona un grupo valido para continuar.", "error");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/academico/alumnos/${modal.id}/`, {
        user:  modal.userId,
        grupo: Number.parseInt(form.grupo, 10),
      });
      show("Alumno actualizado correctamente.");
      setModal(null);
      await load();
    } catch {
      show("No se pudo actualizar el alumno.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este alumno?")) return;
    try {
      await api.delete(`/academico/alumnos/${id}/`);
      show("Alumno eliminado.");
      await load();
    } catch {
      show("No se pudo eliminar el alumno.", "error");
    }
  };

// ─── Crear nuevo alumno ──────────────────────────────────────────────────────

const handleSaveAlumno = async (e) => {
    e.preventDefault();

    // Validar campos requeridos
    if (
      !formAlumno.firstName.trim() ||
      !formAlumno.lastName.trim() ||
      !formAlumno.numeroControl.trim() ||
      !formAlumno.curp.trim() ||
      !formAlumno.carrera ||
      !formAlumno.semestre ||
      !formAlumno.grupo
    ) {
      show("Por favor completa todos los campos requeridos.", "error");
      return;
    }

    setSaving(true);
    try {
      // 1️⃣ PASO CORREGIDO: Apuntamos al endpoint real en la app de autenticación
      const userResponse = await api.post("/auth/usuarios/", {
        username:     formAlumno.numeroControl.trim(),
        first_name:   formAlumno.firstName.trim(),
        last_name:    formAlumno.lastName.trim(),
        email:        `${formAlumno.numeroControl.trim()}@cecytem.edu.mx`,
        password:     formAlumno.curp.trim(),
        rol:          "ALUMNO",
      });

      // Extraemos el UUID que Django generó para el usuario base
      const userUuid = userResponse.data.id; 

      if (!userUuid) {
        throw new Error("El servidor creó el usuario pero no devolvió un ID (UUID) válido.");
      }

      // 2️⃣ PASO: Creamos el perfil del alumno en la app académica ligándole el UUID
      await api.post("/academico/alumnos/", {
        user:         userUuid, 
        curp:         formAlumno.curp.trim(),
        carrera:      formAlumno.carrera,
        semestre:     Number.parseInt(formAlumno.semestre, 10),
        grupo:        Number.parseInt(formAlumno.grupo, 10),
        turno:        formAlumno.turno,
      });

      show(`Alumno ${formAlumno.firstName} ${formAlumno.lastName} creado e inscrito exitosamente.`);
      setAlumnoModalOpen(false);
      setFormAlumno({
        firstName: "",
        lastName: "",
        numeroControl: "",
        curp: "",
        carrera: "",
        semestre: "",
        grupo: "",
        turno: "Matutino",
      });
      await load();

    } catch (err) {
      console.error("--- ERROR EN EL PROCESO DE REGISTRO ---");
      if (err.response) {
        console.log("STATUS CODE:", err.response.status);
        console.dir(err.response.data);
        alert("DJANGO RECHAZÓ LA OPERACIÓN POR:\n" + JSON.stringify(err.response.data, null, 2));
      } else {
        console.log("Error general:", err.message);
        alert("Ocurrió un error: " + err.message);
      }
    } finally {
      setSaving(false);
    }
  };
  // Filtrar grupos por carrera, semestre y turno para el formulario de alta
  const gruposFiltrados = grupos.filter((g) => {
    if (!g) return false;

    // 1. Normalizar Carrera: Elimina acentos, espacios y guiones bajos
    const carreraFormulario = (formAlumno.carrera || "").replace(/_/g, "").replace(/\s+/g, "").trim().toUpperCase();
    const carreraBackend = (g.carrera || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/_/g, "").replace(/\s+/g, "").trim().toUpperCase();
    
    // Soporte para coincidencias parciales (ej. LOGISTICA o CIENCIADATOS)
    const carreraMatch = !formAlumno.carrera || carreraBackend.includes(carreraFormulario) || carreraFormulario.includes(carreraBackend);

    // 2. Normalizar Semestre: Comparación numérica limpia
    const semestreMatch = !formAlumno.semestre || Number(g.semestre) === Number(formAlumno.semestre);

    // 3. Normalizar Turno: Comparación en minúsculas sin espacios
    const turnoMatch = !formAlumno.turno || String(g.turno || "").trim().toLowerCase() === String(formAlumno.turno).trim().toLowerCase();

    return carreraMatch && semestreMatch && turnoMatch;
  });

  return (
    <>
      <Toast toast={toast} />
      <div className="mb-6 flex items-center justify-between">
        <SectionTitle title="Alumnos" subtitle="Consulta el padron y reasigna grupos." />
        <Btn variant="primary" onClick={() => setAlumnoModalOpen(true)}>+ Nuevo Alumno</Btn>
      </div>

      <Table cols={["Matricula", "Nombre", "Correo", "Grupo", "Semestre", "Turno", ""]} loading={loading} emptyText="Sin alumnos registrados">
        {alumnos.map((alumno, idx) => {
          const grupo = grupos.find((g) => g.id === alumno.grupo);
          return (
            <TR key={alumno.id} idx={idx}>
              <TD><span className="font-mono text-xs text-violet-200">{alumno.matricula ?? "—"}</span></TD>
              <TD>
                <div className="flex items-center gap-3">
                  <Avatar label={alumno.nombre_completo ?? ""} />
                  <div>
                    <div className="font-medium text-gray-100">{alumno.nombre_completo}</div>
                    <div className="text-xs text-gray-500">{alumno.user ? `Usuario #${alumno.user}` : "Sin usuario"}</div>
                  </div>
                </div>
              </TD>
              <TD><span className="text-xs text-gray-400">{alumno.email || "—"}</span></TD>
              <TD><Pill>{groupLabel(grupo)}</Pill></TD>
              <TD><span className="text-xs text-gray-400">{grupo?.semestre ? `${grupo.semestre}°` : "—"}</span></TD>
              <TD><span className="text-xs text-gray-400">{grupo?.turno ?? "—"}</span></TD>
              <TD>
                <div className="flex flex-wrap gap-2">
                  <Btn variant="ghost"  size="sm" onClick={() => openEdit(alumno)}>Editar grupo</Btn>
                  <Btn variant="danger" size="sm" onClick={() => handleDelete(alumno.id)}>Eliminar</Btn>
                </div>
              </TD>
            </TR>
          );
        })}
      </Table>

      {/* ─── MODAL: ACTUALIZAR GRUPO DE ALUMNO EXISTENTE ─── */}
      {modal ? (
        <Modal title="Actualizar alumno" onClose={() => setModal(null)}>
          <form className="space-y-4" onSubmit={handleSave}>
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <Avatar label={modal.nombre} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-100">{modal.nombre}</div>
                  <div className="truncate text-xs text-gray-500">{modal.matricula || "Sin matricula"} · {modal.email || "Sin correo"}</div>
                </div>
              </div>
            </Card>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Semestre">
                <select className={inputCls} value={form.semestre} onChange={(e) => setForm((c) => ({ ...c, semestre: e.target.value, grupo: "" }))}>
                  <option value="">Todos</option>
                  {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}°</option>)}
                </select>
              </Field>
              <Field label="Turno">
                <select className={inputCls} value={form.turno} onChange={(e) => setForm((c) => ({ ...c, turno: e.target.value, grupo: "" }))}>
                  <option value="">Todos</option>
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                </select>
              </Field>
            </div>
            <Field label="Grupo" required>
              <select className={inputCls} value={form.grupo} onChange={(e) => setForm((c) => ({ ...c, grupo: e.target.value }))}>
                <option value="">Seleccionar grupo</option>
                {filteredGrupos.map((g) => (
                  <option key={g.id} value={g.id}>{groupLabel(g)} ({g.turno})</option>
                ))}
              </select>
            </Field>
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn variant="primary" type="submit" loading={saving}>Guardar cambios</Btn>
            </div>
          </form>
        </Modal>
      ) : null}

      {/* ─── MODAL: REGISTRAR NUEVO ALUMNO ─── */}
      {alumnoModalOpen ? (
        <Modal title="Registrar Nuevo Alumno" onClose={() => setAlumnoModalOpen(false)}>
          <form className="space-y-4" onSubmit={handleSaveAlumno}>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Nombre(s)" required>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Ej. Luis Rodrigo"
                  value={formAlumno.firstName}
                  onChange={(e) => setFormAlumno(c => ({ ...c, firstName: e.target.value }))}
                />
              </Field>
              <Field label="Apellidos" required>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Ej. Briseño"
                  value={formAlumno.lastName}
                  onChange={(e) => setFormAlumno(c => ({ ...c, lastName: e.target.value }))}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Número de Control (Usuario)" required>
                <input
                  type="text"
                  className={`${inputCls} font-mono`}
                  placeholder="Ej. 231502..."
                  value={formAlumno.numeroControl}
                  onChange={(e) => setFormAlumno(c => ({ ...c, numeroControl: e.target.value }))}
                />
              </Field>
              <Field label="CURP (Contraseña)" required>
                <input
                  type="text"
                  className={`${inputCls} font-mono uppercase`}
                  placeholder="18 caracteres"
                  maxLength={18}
                  value={formAlumno.curp}
                  onChange={(e) => setFormAlumno(c => ({ ...c, curp: e.target.value }))}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Carrera" required>
                <select
                  className={inputCls}
                  value={formAlumno.carrera}
                  onChange={(e) => setFormAlumno(c => ({ ...c, carrera: e.target.value, grupo: "" }))}
                >
                  <option value="">Seleccionar carrera</option>
                  <option value="LOGISTICA">Técnico en Logística</option>
                  <option value="CIENCIA_DATOS">Técnico en Ciencia de Datos</option>
                </select>
              </Field>
              <Field label="Semestre" required>
                <select
                  className={inputCls}
                  value={formAlumno.semestre}
                  onChange={(e) => setFormAlumno(c => ({ ...c, semestre: e.target.value, grupo: "" }))}
                >
                  <option value="">Seleccionar semestre</option>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n}° Semestre</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Turno" required>
                <select
                  className={inputCls}
                  value={formAlumno.turno}
                  onChange={(e) => setFormAlumno(c => ({ ...c, turno: e.target.value, grupo: "" }))}
                >
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                </select>
              </Field>
              <Field label="Grupo Destino" required>
                <select
                  className={inputCls}
                  value={formAlumno.grupo}
                  onChange={(e) => setFormAlumno(c => ({ ...c, grupo: e.target.value }))}
                >
                  {!formAlumno.carrera || !formAlumno.semestre ? (
                    <option value="">Por favor selecciona Carrera y Semestre primero</option>
                  ) : gruposFiltrados.length === 0 ? (
                    <option value="">No hay grupos que coincidan ({formAlumno.turno})</option>
                  ) : (
                    <option value="">Seleccionar grupo ({gruposFiltrados.length} disponible/s)</option>
                  )}
                  
                  {gruposFiltrados.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.semestre}0{g.grupo_letra || "2"} - {carreraLabels[g.carrera] || g.carrera} ({g.turno})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="rounded-lg bg-violet-950/40 p-3 border border-violet-800/30 text-xs text-violet-300">
              💡 <strong>Credenciales automáticas:</strong> El alumno iniciará sesión con su <strong>Número de Control</strong> y su contraseña será su <strong>CURP</strong>. Se autogenerará su correo institucional.
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Btn variant="ghost" onClick={() => setAlumnoModalOpen(false)}>Cancelar</Btn>
              <Btn variant="primary" type="submit" loading={saving}>Crear e Inscribir Alumno</Btn>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

// ─── DocentesSection (CON CREACIÓN DE USUARIOS DOCENTES) ───────────────────────

function DocentesSection() {
  const [docentes,     setDocentes]     = useState([]);
  const [materias,     setMaterias]     = useState([]);
  const [grupos,       setGrupos]       = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null); // Modos: "add_materia", "register_docente"
  const [detailsModal, setDetailsModal] = useState(null);
  const [saving,       setSaving]       = useState(false);
  
  // Estado para el formulario de asignación
  const [form, setForm] = useState({ materia_id: "", grupo_id: "" });
  
  // 💡 NUEVO: Estado para el formulario de registro de docentes
  const [formDocente, setFormDocente] = useState({
    firstName: "",
    lastName: "",
    email: "",
    claveServidor: ""
  });

  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [docentesResult, materiasResult, gruposResult, asignacionesResult] = await Promise.allSettled([
        api.get("/auth/usuarios/?rol=DOCENTE"),
        api.get("/academico/materias/"),
        api.get("/academico/grupos/"),
        api.get("/seguimiento/asignaciones/"),
      ]);
      setDocentes(docentesResult.status === "fulfilled" ? extractList(docentesResult.value.data) : []);
      setMaterias(materiasResult.status === "fulfilled" ? extractList(materiasResult.value.data) : []);
      setGrupos(gruposResult.status === "fulfilled" ? extractList(gruposResult.value.data) : []);
      setAsignaciones(asignacionesResult.status === "fulfilled" ? extractList(asignacionesResult.value.data) : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getAssignments = (docenteId) => asignaciones.filter((a) => a.docente === docenteId);

  const openDetails = (docente) => {
    const assignments = getAssignments(docente.id);
    setDetailsModal({ docente, assignments });
  };

  const openAddMateria = (docente) => {
    setModal({
      mode: "add_materia",
      docenteId: docente.id,
      docenteName: `${docente.first_name ?? ""} ${docente.last_name ?? ""}`.trim() || docente.username,
    });
    setForm({ materia_id: "", grupo_id: "" });
  };

  // 💡 NUEVO: Abrir modal de registro de docente limpio
  const openRegisterDocente = () => {
    setModal({ mode: "register_docente" });
    setFormDocente({ firstName: "", lastName: "", email: "", claveServidor: "" });
  };

  // 💡 NUEVO: Función para enviar el registro del maestro a Django
  const handleCreateDocente = async (e) => {
    e.preventDefault();
    
    if (!formDocente.firstName.trim() || !formDocente.lastName.trim() || !formDocente.email.trim() || !formDocente.claveServidor.trim()) {
      show("Por favor completa todos los campos del docente.", "error");
      return;
    }

    setSaving(true);
    try {
      // Petición a tu endpoint de autenticación configurado previamente
      await api.post("/auth/usuarios/", {
        username:   formDocente.email.trim(),          // 🔐 Su usuario de acceso será su correo
        email:      formDocente.email.trim(),
        first_name: formDocente.firstName.trim(),
        last_name:  formDocente.lastName.trim(),
        password:   formDocente.claveServidor.trim(),  // 🔐 Su contraseña será su Clave de Servidor Público
        rol:        "DOCENTE",                         // Flag para lógica de negocio o serializador
      });

      show(`Docente ${formDocente.firstName} creado con éxito de forma sincronizada.`);
      setModal(null);
      await load(); // Recargar tabla
    } catch (err) {
      console.error("--- ERROR AL REGISTRAR DOCENTE ---", err);
      if (err.response) {
        alert("DJANGO RECHAZÓ EL REGISTRO POR:\n" + JSON.stringify(err.response.data, null, 2));
      } else {
        show("No se pudo registrar al docente. Error de conexión.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddMateria = async (e) => {
    e.preventDefault();
    if (!form.materia_id || !form.grupo_id) {
      show("Selecciona la materia y el grupo destino.", "error");
      return;
    }
    setSaving(true);
    try {
      const existingAsig = asignaciones.find(
        (a) => a.docente === modal.docenteId && 
               a.materia === Number.parseInt(form.materia_id, 10) &&
               a.grupo === Number.parseInt(form.grupo_id, 10)
      );
      if (existingAsig) {
        show("Este docente ya tiene asignada esta materia en el grupo seleccionado.", "error");
        setSaving(false);
        return;
      }
      await api.post("/seguimiento/asignaciones/", {
        docente: modal.docenteId,
        materia: Number.parseInt(form.materia_id, 10),
        grupo:   Number.parseInt(form.grupo_id, 10),
      });
      show("Materia y grupo asignados al docente correctamente.");
      setModal(null);
      setForm({ materia_id: "", grupo_id: "" });
      await load();
    } catch (err) {
      if (err.response) {
        alert("DJANGO RECHAZÓ LA ASIGNACIÓN POR:\n" + JSON.stringify(err.response.data, null, 2));
      } else {
        show("No se pudo asignar la materia. Error de conexión.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMateria = async (asignacionId) => {
    if (!window.confirm("¿Remover esta asignación de materia?")) return;
    try {
      await api.delete(`/seguimiento/asignaciones/${asignacionId}/`);
      show("Materia removida del docente.");
      await load();
      if (detailsModal) {
        const docenteUpdated = docentes.find((d) => d.id === detailsModal.docente.id);
        if (docenteUpdated) openDetails(docenteUpdated);
      }
    } catch {
      show("No se pudo remover la materia.", "error");
    }
  };

  return (
    <>
      <Toast toast={toast} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <SectionTitle title="Docentes" subtitle="Listado sincronizado con usuarios y asignaciones activas." />
        {/* 💡 NUEVO: Botón para detonar el modal de registro */}
        <Btn variant="primary" onClick={openRegisterDocente}>+ Registrar Docente</Btn>
      </div>

      <Table cols={["Nombre", "Correo", "Usuario (Correo)", "Materias", "Grupos", ""]} loading={loading} emptyText="Sin docentes registrados">
        {docentes.map((docente, idx) => {
          const assignments = getAssignments(docente.id);
          const subjectIds  = [...new Set(assignments.map((a) => a.materia))];
          const groupIds    = [...new Set(assignments.map((a) => a.grupo))];
          return (
            <TR key={docente.id} idx={idx}>
              <TD>
                <div className="flex items-center gap-3">
                  <Avatar label={`${docente.first_name ?? ""} ${docente.last_name ?? ""}`} />
                  <div>
                    <div className="font-medium text-gray-100">
                      {[docente.first_name, docente.last_name].filter(Boolean).join(" ") || docente.username}
                    </div>
                    <div className="text-xs text-gray-500">ID #{docente.id}</div>
                  </div>
                </div>
              </TD>
              <TD><span className="text-xs text-gray-400">{docente.email || "—"}</span></TD>
              <TD><span className="font-mono text-xs text-violet-200">{docente.username}</span></TD>
              <TD>
                <div className="flex flex-wrap gap-1.5">
                  {subjectIds.length > 0 ? (
                    subjectIds.slice(0, 3).map((sid) => {
                      const mat = materias.find((m) => m.id === sid);
                      return <Pill key={sid}>{mat?.clave ?? `#${sid}`}</Pill>;
                    })
                  ) : <span className="text-xs text-gray-500">Sin materias</span>}
                  {subjectIds.length > 3 ? <Pill color="gray">+{subjectIds.length - 3}</Pill> : null}
                </div>
              </TD>
              <TD>
                <div className="flex flex-wrap gap-1.5">
                  {groupIds.length > 0 ? (
                    groupIds.slice(0, 3).map((gid) => {
                      const asig = assignments.find((a) => a.grupo === gid);
                      return <Pill color="gray" key={gid}>{groupCode(asig?.grupo_detalle)}</Pill>;
                    })
                  ) : <span className="text-xs text-gray-500">Sin grupos</span>}
                  {groupIds.length > 3 ? <Pill color="gray">+{groupIds.length - 3}</Pill> : null}
                </div>
              </TD>
              <TD>
                <div className="flex flex-wrap gap-2">
                  <Btn variant="ghost" size="sm" onClick={() => openDetails(docente)}>Detalles</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => openAddMateria(docente)}>+ Materia</Btn>
                </div>
              </TD>
            </TR>
          );
        })}
      </Table>

      {/* Modal Detalles */}
      {detailsModal ? (
        <Modal title={`Detalles: ${detailsModal.docente.first_name ?? ""} ${detailsModal.docente.last_name ?? ""}`} onClose={() => setDetailsModal(null)}>
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <Avatar label={`${detailsModal.docente.first_name ?? ""} ${detailsModal.docente.last_name ?? ""}`} />
                <div>
                  <div className="text-sm font-semibold text-gray-100">
                    {detailsModal.docente.first_name} {detailsModal.docente.last_name}
                  </div>
                  <div className="text-xs text-gray-500">{detailsModal.docente.email || "Sin correo"}</div>
                  <div className="text-xs text-gray-500">Usuario: {detailsModal.docente.username}</div>
                </div>
              </div>
            </Card>

            <div>
              <h4 className="text-sm font-semibold text-gray-100 mb-3">Materias asignadas</h4>
              <div className="space-y-2 max-h-96 overflow-auto">
                {detailsModal.assignments.length > 0 ? (
                  detailsModal.assignments.map((asig) => (
                    <div key={asig.id} className="flex items-center justify-between p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                      <div>
                        <div className="font-medium text-gray-100 text-sm">{asig.materia_detalle?.clave}</div>
                        <div className="text-xs text-gray-500">{asig.materia_detalle?.nombre}</div>
                        {asig.grupo_detalle && (
                          <div className="text-xs text-gray-400 mt-1">Grupo: {groupCode(asig.grupo_detalle)}</div>
                        )}
                      </div>
                      <Btn variant="danger" size="sm" onClick={() => handleRemoveMateria(asig.id)}>Remover</Btn>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500">Sin materias asignadas</div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Modal Agregar Materia */}
      {modal?.mode === "add_materia" ? (
        <Modal title={`Asignar materia a ${modal.docenteName}`} onClose={() => setModal(null)}>
          <form className="space-y-4" onSubmit={handleAddMateria}>
            <Field label="Materia" required>
              <select className={inputCls} value={form.materia_id} onChange={(e) => setForm((c) => ({ ...c, materia_id: e.target.value }))}>
                <option value="">Seleccionar materia</option>
                {materias.map((m) => <option key={m.id} value={m.id}>{m.clave} - {m.nombre}</option>)}
              </select>
            </Field>

            <Field label="Grupo Destino" required>
              <select className={inputCls} value={form.grupo_id} onChange={(e) => setForm((c) => ({ ...c, grupo_id: e.target.value }))}>
                <option value="">Seleccionar grupo académico</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.semestre}°{g.nombre} - {g.carrera} ({g.turno})
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn variant="primary" type="submit" loading={saving}>Asignar materia</Btn>
            </div>
          </form>
        </Modal>
      ) : null}

      {/* 💡 NUEVO MODAL: Formulario de Registro para Docentes */}
      {modal?.mode === "register_docente" ? (
        <Modal title="Registrar Nuevo Docente Institucional" onClose={() => setModal(null)}>
          <form className="space-y-4" onSubmit={handleCreateDocente}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nombre(s) *" required>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Ej. Arturo"
                  value={formDocente.firstName}
                  onChange={(e) => setFormDocente({ ...formDocente, firstName: e.target.value })}
                />
              </Field>
              <Field label="Apellidos *" required>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Ej. López"
                  value={formDocente.lastName}
                  onChange={(e) => setFormDocente({ ...formDocente, lastName: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Correo Institucional (Usuario de Acceso) *" required>
              <input
                type="email"
                className={inputCls}
                placeholder="ejemplo@cecytem.edu.mx"
                value={formDocente.email}
                onChange={(e) => setFormDocente({ ...formDocente, email: e.target.value })}
              />
            </Field>

            <Field label="Clave de Servidor Público (Contraseña Inicial) *" required>
              <input
                type="text"
                className={inputCls}
                placeholder="Clave impresa en el gafete institucional"
                value={formDocente.claveServidor}
                onChange={(e) => setFormDocente({ ...formDocente, claveServidor: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Nota: Las credenciales se vincularán para que use el correo completo como inicio de sesión.
              </p>
            </Field>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn variant="primary" type="submit" loading={saving}>Crear Docente</Btn>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

// ─── GruposSection ─────────────────────────────────────────────────────────────

// ─── GruposSection (REDISEÑADO) ────────────────────────────────────────────────
// Reemplaza la función GruposSection completa en AdminDashboard.jsx

// Helpers necesarios (ya existen en AdminDashboard.jsx, no duplicar):
// extractList, groupCode, groupLabel, carreraLabels, CARRERAS_POR_SEMESTRE
// Card, Btn, Pill, Avatar, Modal, Field, Table, TR, TD, SectionTitle, Toast,
// useToast, inputCls, C

// Mapa de materias por semestre y carrera.
// Ajusta los IDs y nombres según tu base de datos real.
// Esta función filtra del catálogo de materias por semestre/carrera si tu API
// ya las devuelve filtradas; de lo contrario usa el catálogo completo.
const getMateriasPorSemestreCarrera = (todasMaterias, semestre, carrera) => {
  // Si tu API no filtra por semestre/carrera, devuelve todas.
  // Puedes agregar lógica de filtrado aquí cuando tu backend lo soporte.
  return todasMaterias;
};

function GruposSection() {
  const [grupos,       setGrupos]       = React.useState([]);
  const [docentes,     setDocentes]     = React.useState([]);
  const [materias,     setMaterias]     = React.useState([]);
  const [asignaciones, setAsignaciones] = React.useState([]);
  const [alumnos,      setAlumnos]      = React.useState([]);
  const [loading,      setLoading]      = React.useState(true);
  const [saving,       setSaving]       = React.useState(false);

  // Modal state
  const [modalOpen,     setModalOpen]     = React.useState(false);
  const [editGroup,     setEditGroup]     = React.useState(null); // null = crear, obj = editar
  const [detailsGroup,  setDetailsGroup]  = React.useState(null);
  const [alumnosModal,  setAlumnosModal]  = React.useState({ open: false, grupo: null, lista: [], loading: false });

  // Fase 1: datos básicos del grupo
  const [fase1, setFase1] = React.useState({
    semestre: "", carrera: "", grupo_letra: "", turno: "Matutino",
  });

  // Fase 2: array de { materia_id, docente_id } — una fila por materia
  const [asignForm, setAsignForm] = React.useState([]);

  // Paso activo del modal (0 = fase1, 1 = fase2)
  const [step, setStep] = React.useState(0);

  const { toast, show } = useToast();

  // ─── Carga de datos ─────────────────────────────────────────────────────────

  const load = React.useCallback(async () => {
    setLoading(true);
    const [gr, doc, mat, asig, al] = await Promise.allSettled([
      api.get("/academico/grupos/"),
      api.get("/auth/usuarios/?rol=DOCENTE"),
      api.get("/academico/materias/"),
      api.get("/seguimiento/asignaciones/"),
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

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getAsignacion = (grupoId) => asignaciones.find((a) => a.grupo === grupoId);

  const getAsignacionesPorGrupo = (grupoId) =>
    asignaciones.filter((a) => a.grupo === grupoId);

  const usedGroupLetras = grupos
    .filter(
      (g) =>
        g.semestre === Number.parseInt(fase1.semestre, 10) &&
        g.carrera  === fase1.carrera &&
        // Al editar, excluir la letra actual del grupo que estamos editando
        (!editGroup || g.id !== editGroup.grupoId)
    )
    .map((g) => String(g.grupo_letra));

  const letrasDisponibles = !fase1.semestre || !fase1.carrera
    ? []
    : ["1", "2", "3", "4"].filter((l) => !usedGroupLetras.includes(l));

  const materiasFiltradas = getMateriasPorSemestreCarrera(
    materias, fase1.semestre, fase1.carrera
  );

  // ─── Reset / Open modals ────────────────────────────────────────────────────

  const resetAll = () => {
    setFase1({ semestre: "", carrera: "", grupo_letra: "", turno: "Matutino" });
    setAsignForm([]);
    setStep(0);
    setEditGroup(null);
  };

  const openCreate = () => {
    resetAll();
    setModalOpen(true);
  };

  const openEditGroup = (grupo) => {
    const asigs = getAsignacionesPorGrupo(grupo.id);

    setFase1({
      semestre:    String(grupo.semestre || ""),
      carrera:     grupo.carrera || "",
      grupo_letra: String(grupo.grupo_letra || ""),
      turno:       grupo.turno || "Matutino",
    });

    // Precarga la fase 2 con las asignaciones existentes
    const rows = materias.map((mat) => {
      const asig = asigs.find((a) => a.materia === mat.id);
      return {
        materia_id:   mat.id,
        materia_clave: mat.clave,
        materia_nombre: mat.nombre,
        docente_id:   asig?.docente ? String(asig.docente) : "",
        asig_id:      asig?.id ?? null, // Para UPDATE
      };
    });

    setAsignForm(rows);
    setEditGroup({ grupoId: grupo.id });
    setStep(0);
    setModalOpen(true);
  };

  // Cuando avanza de Fase 1 → Fase 2, construye/actualiza filas
  const goToFase2 = () => {
    if (!fase1.semestre || !fase1.carrera || !fase1.grupo_letra) {
      show("Completa semestre, carrera y grupo antes de continuar.", "error");
      return;
    }

    // Si estamos editando, las filas ya vienen precargadas; solo actualizamos
    // la lista si la carrera/semestre cambió
    const currentMats = getMateriasPorSemestreCarrera(
      materias, fase1.semestre, fase1.carrera
    );

    setAsignForm((prev) =>
      currentMats.map((mat) => {
        const existing = prev.find((r) => r.materia_id === mat.id);
        return existing ?? {
          materia_id:     mat.id,
          materia_clave:  mat.clave,
          materia_nombre: mat.nombre,
          docente_id:     "",
          asig_id:        null,
        };
      })
    );

    setStep(1);
  };

  const updateDocenteEnFila = (materiaId, docenteId) => {
    setAsignForm((prev) =>
      prev.map((row) =>
        row.materia_id === materiaId ? { ...row, docente_id: docenteId } : row
      )
    );
  };

  // ─── Parseo de errores DRF ───────────────────────────────────────────────────

  const parseDRFError = (err) => {
    if (!err.response?.data) return "Error desconocido al guardar.";
    const data = err.response.data;
    if (typeof data === "string") return data;
    if (Array.isArray(data))     return data.join(" | ");
    return Object.entries(data)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join(" | ");
  };

  // ─── Crear grupo ─────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    setSaving(true);
    try {
      // 1. Crear el grupo
      const grupoRes = await api.post("/academico/grupos/", {
        semestre:    Number.parseInt(fase1.semestre, 10),
        carrera:     fase1.carrera,
        grupo_letra: String(fase1.grupo_letra),
        turno:       fase1.turno,
      });
      const grupoId = grupoRes.data.id;

      // 2. Limpiar y validar asignaciones: filter out empty/invalid docente_id
      const asignacionesValidas = asignForm.filter((r) => {
        // Validar que docente_id sea una cadena no-vacía y convertible a número
        if (!r.docente_id || typeof r.docente_id !== "string" || r.docente_id.trim() === "") {
          return false;
        }
        const docenteNum = Number.parseInt(r.docente_id, 10);
        return !isNaN(docenteNum) && docenteNum > 0;
      });

      // 3. Crear las asignaciones válidas
      if (asignacionesValidas.length > 0) {
        const resultados = await Promise.allSettled(
          asignacionesValidas.map((row) =>
            api.post("/seguimiento/asignaciones/", {
              docente: Number.parseInt(row.docente_id, 10),
              materia: row.materia_id,
              grupo:   grupoId,
            })
          )
        );

        // Revisar si hubo fallos individuales
        const fallos = resultados.filter((r) => r.status === "rejected");
        if (fallos.length > 0) {
          console.error("Fallos al crear asignaciones:", fallos);
          show(`Grupo creado, pero ${fallos.length} asignación(es) fallaron. Verifica en Editar.`, "error");
        } else {
          show(`Grupo ${fase1.semestre}${fase1.grupo_letra} creado con ${asignacionesValidas.length} asignación(es).`);
        }
      } else {
        show(`Grupo ${fase1.semestre}${fase1.grupo_letra} creado sin asignaciones.`);
      }

      setModalOpen(false);
      resetAll();
      await load();
    } catch (err) {
      console.error("Error creating group:", err);
      show(parseDRFError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  // ─── Editar grupo ────────────────────────────────────────────────────────────

  const handleEdit = async () => {
    if (!editGroup?.grupoId) return;
    setSaving(true);
    try {
      // 1. Actualizar datos básicos del grupo
      await api.put(`/academico/grupos/${editGroup.grupoId}/`, {
        semestre:    Number.parseInt(fase1.semestre, 10),
        carrera:     fase1.carrera,
        grupo_letra: String(fase1.grupo_letra),
        turno:       fase1.turno,
      });

      // 2. Gestionar asignaciones: UPDATE las existentes, CREATE las nuevas, DELETE las removidas
      const asignActuales = getAsignacionesPorGrupo(editGroup.grupoId);

      // Limpiar y validar asignaciones
      const asignacionesValidas = asignForm.filter((r) => {
        if (!r.docente_id || typeof r.docente_id !== "string" || r.docente_id.trim() === "") {
          return false;
        }
        const docenteNum = Number.parseInt(r.docente_id, 10);
        return !isNaN(docenteNum) && docenteNum > 0;
      });

      const operaciones = asignForm.map(async (row) => {
        const asigExistente = asignActuales.find((a) => a.materia === row.materia_id);
        const esValida =
          row.docente_id &&
          typeof row.docente_id === "string" &&
          row.docente_id.trim() !== "" &&
          !isNaN(Number.parseInt(row.docente_id, 10));

        if (asigExistente && esValida) {
          // Actualizar si el docente cambió
          const docenteActual = Number.parseInt(row.docente_id, 10);
          if (Number(asigExistente.docente) !== docenteActual) {
            await api.patch(`/seguimiento/asignaciones/${asigExistente.id}/`, {
              docente: docenteActual,
            });
          }
        } else if (asigExistente && !esValida) {
          // Eliminar si se removió el docente
          await api.delete(`/seguimiento/asignaciones/${asigExistente.id}/`);
        } else if (!asigExistente && esValida) {
          // Crear nueva asignación
          await api.post("/seguimiento/asignaciones/", {
            docente: Number.parseInt(row.docente_id, 10),
            materia: row.materia_id,
            grupo:   editGroup.grupoId,
          });
        }
        // Si no había y sigue sin docente: no hacer nada
      });

      const resultados = await Promise.allSettled(operaciones);
      const fallos = resultados.filter((r) => r.status === "rejected");

      if (fallos.length > 0) {
        console.error("Fallos al actualizar asignaciones:", fallos);
        show(`Grupo actualizado, pero ${fallos.length} cambio(s) en asignaciones fallaron.`, "error");
      } else {
        show("Grupo actualizado correctamente.");
      }

      setModalOpen(false);
      resetAll();
      await load();
    } catch (err) {
      console.error("Error updating group:", err);
      show(parseDRFError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  // ─── Ver alumnos del grupo ───────────────────────────────────────────────────

  const handleViewAlumnos = async (grupo) => {
    setAlumnosModal({
      open: true,
      grupo,
      lista: [],
      loading: true,
    });
    try {
      // Cargar alumnos inscritos en este grupo
      const res = await api.get(`/academico/alumnos/?grupo=${grupo.id}`);
      const lista = extractList(res.data);
      setAlumnosModal((prev) => ({ ...prev, lista, loading: false }));
    } catch (err) {
      console.error("Error cargando alumnos:", err);
      show("Error al cargar alumnos del grupo.", "error");
      setAlumnosModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // ─── Eliminar grupo ──────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este grupo? Se eliminarán también sus asignaciones.")) return;
    try {
      await api.delete(`/academico/grupos/${id}/`);
      show("Grupo eliminado.");
      await load();
    } catch (err) {
      show(parseDRFError(err), "error");
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Toast toast={toast} />
      <SectionTitle
        title="Grupos"
        subtitle="Crea grupos y gestiona su matriz académica completa."
        action={<Btn onClick={openCreate}>+ Nuevo grupo</Btn>}
      />

      {/* ── Tabla de grupos ── */}
      <Table
        cols={["Clave", "Semestre", "Carrera", "Turno", "Materias asignadas", "Alumnos", ""]}
        loading={loading}
        emptyText="Sin grupos registrados"
      >
        {grupos.map((grupo, idx) => {
          const asigs = getAsignacionesPorGrupo(grupo.id);
          return (
            <TR key={`grupo-${grupo.id ?? idx}`} idx={idx}>
              <TD>
                <span className="font-mono text-sm font-semibold text-violet-200">
                  {groupCode(grupo)}
                </span>
              </TD>
              <TD><Pill>{grupo.semestre}°</Pill></TD>
              <TD>
                <span className="text-xs text-gray-300">
                  {carreraLabels[grupo.carrera] ?? grupo.carrera}
                </span>
              </TD>
              <TD><span className="text-xs text-gray-400">{grupo.turno}</span></TD>
              <TD>
                <div className="flex flex-wrap gap-1.5">
                  {asigs.length > 0 ? (
                    asigs.slice(0, 3).map((a) => (
                      <Pill key={a.id} color="violet">
                        {a.materia_detalle?.clave ?? `#${a.materia}`}
                      </Pill>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Sin asignaciones</span>
                  )}
                  {asigs.length > 3 && (
                    <Pill color="gray">+{asigs.length - 3}</Pill>
                  )}
                </div>
              </TD>
              <TD>
                <div className="flex items-center gap-2">
                  <Pill color="emerald">{grupo.total_alumnos ?? 0}</Pill>
                  <Btn
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewAlumnos(grupo)}
                    title="Ver lista de alumnos"
                  >
                    👁️
                  </Btn>
                </div>
              </TD>
              <TD>
                <div className="flex flex-wrap gap-2">
                  <Btn variant="ghost"  size="sm" onClick={() => openEditGroup(grupo)}>Editar</Btn>
                  <Btn variant="ghost"  size="sm" onClick={() => setDetailsGroup(grupo)}>Detalles</Btn>
                  <Btn variant="danger" size="sm" onClick={() => handleDelete(grupo.id)}>Eliminar</Btn>
                </div>
              </TD>
            </TR>
          );
        })}
      </Table>

      {/* ══ Modal Crear / Editar ══ */}
      {modalOpen && (
        <Modal
          title={editGroup ? "Editar grupo" : "Nuevo grupo"}
          onClose={() => { setModalOpen(false); resetAll(); }}
        >
          {/* Indicador de pasos */}
          <div className="mb-5 flex items-center gap-3">
            {["Datos del grupo", "Matriz académica"].map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition ${
                      step === i
                        ? "bg-violet-500 text-white"
                        : step > i
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/[0.06] text-gray-500"
                    }`}
                  >
                    {step > i ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium transition ${
                      step === i ? "text-gray-100" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < 1 && (
                  <div
                    className={`h-px flex-1 transition ${
                      step > 0 ? "bg-violet-500/40" : "bg-white/[0.06]"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ── Paso 0: Datos básicos ── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Semestre" required>
                  <select
                    className={inputCls}
                    value={fase1.semestre}
                    onChange={(e) =>
                      setFase1((c) => ({
                        ...c, semestre: e.target.value, carrera: "", grupo_letra: "",
                      }))
                    }
                  >
                    <option value="">Seleccionar</option>
                    {[1,2,3,4,5,6].map((n) => (
                      <option key={n} value={n}>{n}°</option>
                    ))}
                  </select>
                </Field>
                <Field label="Carrera" required>
                  <select
                    className={inputCls}
                    value={fase1.carrera}
                    disabled={!fase1.semestre}
                    onChange={(e) =>
                      setFase1((c) => ({ ...c, carrera: e.target.value, grupo_letra: "" }))
                    }
                  >
                    <option value="">Seleccionar</option>
                    {CARRERAS_POR_SEMESTRE(fase1.semestre).map((car) => (
                      <option key={car.value} value={car.value}>{car.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Letra de grupo" required>
                  <select
                    className={inputCls}
                    value={fase1.grupo_letra}
                    disabled={!fase1.carrera}
                    onChange={(e) =>
                      setFase1((c) => ({ ...c, grupo_letra: e.target.value }))
                    }
                  >
                    <option value="">Seleccionar</option>
                    {editGroup && fase1.grupo_letra &&
                     !letrasDisponibles.includes(fase1.grupo_letra) && (
                      <option value={fase1.grupo_letra}>{fase1.grupo_letra} (actual)</option>
                    )}
                    {letrasDisponibles.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Turno">
                  <select
                    className={inputCls}
                    value={fase1.turno}
                    onChange={(e) => setFase1((c) => ({ ...c, turno: e.target.value }))}
                  >
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                  </select>
                </Field>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Btn variant="ghost" onClick={() => { setModalOpen(false); resetAll(); }}>
                  Cancelar
                </Btn>
                <Btn variant="primary" onClick={goToFase2}>
                  Continuar →
                </Btn>
              </div>
            </div>
          )}

          {/* ── Paso 1: Matriz académica ── */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Resumen del grupo */}
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: "rgba(139,92,246,0.08)",
                  border: "1px solid rgba(139,92,246,0.18)",
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 font-mono text-lg font-bold text-violet-200">
                  {fase1.semestre}{fase1.grupo_letra}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-100">
                    {carreraLabels[fase1.carrera] ?? fase1.carrera}
                  </div>
                  <div className="text-xs text-gray-500">
                    {fase1.semestre}° semestre · {fase1.turno}
                  </div>
                </div>
              </div>

              {/* Tabla de asignaciones */}
              <div>
                <p className="mb-3 text-xs text-gray-500">
                  Asigna un docente a cada materia. Las filas sin docente no crearán asignación.
                </p>
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {asignForm.length === 0 ? (
                    <div className="rounded-xl border border-white/5 px-4 py-8 text-center text-xs text-gray-500">
                      No hay materias en el catálogo. Agrégalas primero en la sección de Materias.
                    </div>
                  ) : (
                    asignForm.map((row) => (
                      <div
                        key={row.materia_id}
                        className="grid grid-cols-[1fr_1.4fr] items-center gap-3 rounded-xl px-3 py-2.5 transition"
                        style={{
                          background: row.docente_id
                            ? "rgba(139,92,246,0.06)"
                            : "rgba(255,255,255,0.02)",
                          border: row.docente_id
                            ? "1px solid rgba(139,92,246,0.15)"
                            : "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        {/* Materia */}
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-semibold text-violet-300">
                            {row.materia_clave}
                          </div>
                          <div className="truncate text-xs text-gray-400">
                            {row.materia_nombre}
                          </div>
                        </div>
                        {/* Select docente */}
                        <select
                          className={inputCls}
                          value={row.docente_id ?? ""}
                          onChange={(e) =>
                            updateDocenteEnFila(row.materia_id, e.target.value)
                          }
                        >
                          <option value="">— Sin asignar —</option>
                          {docentes.map((d) => (
                            <option key={d.id} value={d.id}>
                              {[d.first_name, d.last_name].filter(Boolean).join(" ") ||
                                d.username}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                <Btn variant="ghost" onClick={() => setStep(0)}>← Atrás</Btn>
                <Btn
                  variant="primary"
                  loading={saving}
                  onClick={editGroup ? handleEdit : handleCreate}
                >
                  {editGroup ? "Guardar cambios" : "Crear grupo"}
                </Btn>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ══ Modal Detalles ══ */}
      {detailsGroup && (
        <Modal
          title={`Detalles ${groupCode(detailsGroup)}`}
          onClose={() => setDetailsGroup(null)}
        >
          <div className="space-y-5">
            {/* Asignaciones del grupo */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-100">
                Matriz académica
              </h4>
              <div className="space-y-2">
                {getAsignacionesPorGrupo(detailsGroup.id).length > 0 ? (
                  getAsignacionesPorGrupo(detailsGroup.id).map((asig) => (
                    <div
                      key={asig.id}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5"
                      style={{
                        background: "rgba(139,92,246,0.06)",
                        border: "1px solid rgba(139,92,246,0.12)",
                      }}
                    >
                      <div>
                        <span className="font-mono text-xs font-semibold text-violet-300">
                          {asig.materia_detalle?.clave ?? `#${asig.materia}`}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          {asig.materia_detalle?.nombre}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-200">
                          {asig.docente_detalle
                            ? `${asig.docente_detalle.first_name} ${asig.docente_detalle.last_name}`.trim()
                            : "—"}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {asig.docente_detalle?.email ?? ""}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500">Sin asignaciones registradas.</div>
                )}
              </div>
            </div>

            {/* Alumnos */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-100">
                Alumnos ({alumnos.filter((a) => a.grupo === detailsGroup.id).length})
              </h4>
              <div className="max-h-60 space-y-2.5 overflow-auto">
                {alumnos
                  .filter((a) => a.grupo === detailsGroup.id)
                  .map((al) => (
                    <div key={al.id} className="flex items-center gap-3">
                      <Avatar label={al.nombre_completo ?? String(al.user)} />
                      <div>
                        <div className="text-sm font-medium text-gray-100">
                          {al.nombre_completo}
                        </div>
                        <div className="text-xs text-gray-500">
                          {al.matricula || al.email || `ID ${al.id}`}
                        </div>
                      </div>
                    </div>
                  ))}
                {alumnos.filter((a) => a.grupo === detailsGroup.id).length === 0 && (
                  <div className="text-xs text-gray-500">Sin alumnos inscritos.</div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      

      {/* ══ Modal Alumnos del Grupo ══ */}
      {alumnosModal.open && (
        <Modal
          title={`Alumnos de ${groupCode(alumnosModal.grupo)}`}
          onClose={() => setAlumnosModal({ open: false, grupo: null, lista: [], loading: false })}
        >
          {alumnosModal.loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-400">Cargando alumnos...</div>
            </div>
          ) : alumnosModal.lista.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-2 text-left font-medium text-gray-300">Matrícula</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-300">Nombre</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-300">Correo</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosModal.lista.map((al) => (
                    <tr key={al.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-400">
                          {al.matricula || `ID-${al.id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar label={al.nombre_completo ?? String(al.user)} />
                          <span className="text-gray-200">{al.nombre_completo || al.user || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">{al.email || "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-sm font-medium text-gray-300 mb-2">No hay alumnos registrados</div>
              <div className="text-xs text-gray-500">Este grupo aún no tiene estudiantes inscritos.</div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
// ─── MateriasSection (MEJORADO) ────────────────────────────────────────────────

function MateriasSection() {
  const [materias, setMaterias] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ nombre: "", clave: "", creditos: "" });
  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/academico/materias/");
      setMaterias(extractList(res.data));
    } catch (err) {
      console.error("Error loading materias:", err);
      setMaterias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ nombre: "", clave: "", creditos: "" });
    setModal({ mode: "create" });
  };

  const openEdit = (materia) => {
    setForm({
      nombre: materia.nombre ?? "",
      clave: materia.clave ?? "",
      creditos: String(materia.creditos ?? ""),
    });
    setModal({ mode: "edit", id: materia.id });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!form.nombre.trim()) {
      show("El nombre de la materia es obligatorio.", "error");
      return;
    }
    if (!form.clave.trim()) {
      show("La clave de la materia es obligatoria.", "error");
      return;
    }
    
    // Validar creditos
    const creditos = Number.parseInt(form.creditos, 10);
    if (isNaN(creditos) || creditos < 0 || creditos > 20) {
      show("Los créditos deben estar entre 0 y 20.", "error");
      return;
    }

    if (modal.mode === "edit" && !modal.id) {
      show("ID de materia no definido.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = normalizeMateriaPayload(form);
      
      if (modal.mode === "create") {
        await api.post("/academico/materias/", payload);
        show("Materia creada correctamente.");
      } else {
        await api.put(`/academico/materias/${modal.id}/`, payload);
        show("Materia actualizada correctamente.");
      }
      
      setModal(null);
      setForm({ nombre: "", clave: "", creditos: "" });
      await load();
    } catch (err) {
      console.error("Error saving materia:", err);
      if (err.response?.data) {
        const msg = Object.entries(err.response.data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        show(`Error: ${msg}`, "error");
      } else {
        show("No se pudo guardar la materia.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta materia? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`/academico/materias/${id}/`);
      show("Materia eliminada correctamente.");
      await load();
    } catch (err) {
      console.error("Error deleting materia:", err);
      show("No se pudo eliminar la materia.", "error");
    }
  };

  return (
    <>
      <Toast toast={toast} />
      <SectionTitle title="Materias" subtitle="Catalogo de materias." action={<Btn onClick={openCreate}>+ Nueva materia</Btn>} />
      <Table cols={["Clave", "Nombre", "Creditos", ""]} loading={loading} emptyText="Sin materias registradas">
        {materias.map((materia, idx) => (
          <TR key={materia.id} idx={idx}>
            <TD><span className="font-mono text-xs font-semibold text-violet-200">{materia.clave}</span></TD>
            <TD><span className="text-sm font-medium text-gray-100">{materia.nombre}</span></TD>
            <TD><Pill color="gray">{materia.creditos ?? 0} creditos</Pill></TD>
            <TD>
              <div className="flex flex-wrap gap-2">
                <Btn variant="ghost"  size="sm" onClick={() => openEdit(materia)}>Editar</Btn>
                <Btn variant="danger" size="sm" onClick={() => handleDelete(materia.id)}>Eliminar</Btn>
              </div>
            </TD>
          </TR>
        ))}
      </Table>

      {modal ? (
        <Modal title={modal.mode === "create" ? "Nueva materia" : "Editar materia"} onClose={() => setModal(null)}>
          <form className="space-y-4" onSubmit={handleSave}>
            <Field label="Nombre" required>
              <input
                className={inputCls}
                value={form.nombre}
                placeholder="Ej. Matematicas I"
                onChange={(e) => setForm((c) => ({ ...c, nombre: e.target.value }))}
                disabled={saving}
              />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Clave" required>
                <input
                  className={inputCls}
                  value={form.clave}
                  placeholder="MAT-101"
                  onChange={(e) => setForm((c) => ({ ...c, clave: e.target.value }))}
                  disabled={saving}
                />
              </Field>
              <Field label="Creditos">
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  max={20}
                  value={form.creditos}
                  placeholder="5"
                  onChange={(e) => setForm((c) => ({ ...c, creditos: e.target.value }))}
                  disabled={saving}
                />
              </Field>
            </div>
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Btn variant="ghost" onClick={() => setModal(null)} disabled={saving}>Cancelar</Btn>
              <Btn variant="primary" type="submit" loading={saving}>
                {modal.mode === "create" ? "Registrar materia" : "Guardar cambios"}
              </Btn>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

// ─── DashboardLoader ───────────────────────────────────────────────────────────

function DashboardLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: C.bg }}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
        <span className="text-xs text-gray-500">Preparando panel...</span>
      </div>
    </div>
  );
}

// ─── AdminDashboard (default export) ──────────────────────────────────────────

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
    } catch {
      setIsAdmin(false);
    } finally {
      setChecking(false);
    }
  }, [loading, user]);

  useEffect(() => {
    if (checking || !isAdmin) return;
    let cancelled = false;
    const fetchStats = async () => {
      const [a, d, g, m] = await Promise.allSettled([
        api.get("/academico/alumnos/"),
        api.get("/auth/usuarios/?rol=DOCENTE"),
        api.get("/academico/grupos/"),
        api.get("/academico/materias/"),
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
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <Sidebar active={section} onSelect={setSection} stats={stats} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#07030f]/85 backdrop-blur-xl">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-gray-100 lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir menu"
                >
                  ☰
                </button>
                <div>
                  <h1 className="text-lg font-bold text-gray-100">Panel de Administracion</h1>
                  <p className="mt-1 text-xs text-gray-500">{currentSection?.label} · {currentSection?.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-semibold text-gray-100">{user.first_name || user.username}</div>
                  <div className="text-[11px] text-gray-500">Sesion administrativa</div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-sm font-bold text-violet-100">
                  {(user.first_name?.[0] ?? user.username?.[0] ?? "A").toUpperCase()}
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {SECTIONS.map((item) => (
                <button key={item.id} type="button" onClick={() => setSection(item.id)} className={`text-left transition ${section === item.id ? "opacity-100" : "opacity-70 hover:opacity-100"}`}>
                  <StatCard label={item.label} value={stats[item.id]} icon={item.icon} />
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
