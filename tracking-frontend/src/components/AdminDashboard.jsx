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
  const [alumnos, setAlumnos]   = useState([]);
  const [grupos,  setGrupos]    = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal,   setModal]     = useState(null);
  const [form,    setForm]      = useState({ grupo: "", semestre: "", turno: "" });
  const [saving,  setSaving]    = useState(false);
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
      id:       alumno.id,
      userId:   alumno.user,
      matricula: alumno.matricula ?? "",
      nombre:   alumno.nombre_completo ?? "",
      email:    alumno.email ?? "",
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

  return (
    <>
      <Toast toast={toast} />
      <SectionTitle title="Alumnos" subtitle="Consulta el padron y reasigna grupos." />
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
    </>
  );
}

// ─── DocentesSection ───────────────────────────────────────────────────────────

function DocentesSection() {
  const [docentes,     setDocentes]     = useState([]);
  const [materias,     setMaterias]     = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading,      setLoading]      = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [docentesResult, materiasResult, asignacionesResult] = await Promise.allSettled([
      api.get("/auth/usuarios/?rol=DOCENTE"),
      api.get("/academico/materias/"),
      api.get("/seguimiento/asignaciones/"),
    ]);
    setDocentes(docentesResult.status     === "fulfilled" ? extractList(docentesResult.value.data)     : []);
    setMaterias(materiasResult.status     === "fulfilled" ? extractList(materiasResult.value.data)     : []);
    setAsignaciones(asignacionesResult.status === "fulfilled" ? extractList(asignacionesResult.value.data) : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getAssignments = (docenteId) => asignaciones.filter((a) => a.docente === docenteId);

  return (
    <>
      <SectionTitle title="Docentes" subtitle="Listado sincronizado con usuarios y asignaciones activas." />
      <Table cols={["Nombre", "Correo", "Usuario", "Materias", "Grupos"]} loading={loading} emptyText="Sin docentes registrados">
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
            </TR>
          );
        })}
      </Table>
    </>
  );
}

// ─── GruposSection ─────────────────────────────────────────────────────────────

function GruposSection() {
  const [grupos,       setGrupos]       = useState([]);
  const [docentes,     setDocentes]     = useState([]);
  const [materias,     setMaterias]     = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [alumnos,      setAlumnos]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editGroup,    setEditGroup]    = useState(null);   // null = create mode
  const [detailsGroup, setDetailsGroup] = useState(null);
  const [form, setForm] = useState({ semestre: "", carrera: "", grupo_letra: "", turno: "Matutino", docente_id: "", materia_id: "" });
  const { toast, show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const [gr, doc, mat, asig, al] = await Promise.allSettled([
      api.get("/academico/grupos/"),
      api.get("/auth/usuarios/?rol=DOCENTE"),
      api.get("/academico/materias/"),
      api.get("/seguimiento/asignaciones/"),
      api.get("/academico/alumnos/"),
    ]);
    setGrupos(gr.status       === "fulfilled" ? extractList(gr.value.data)   : []);
    setDocentes(doc.status    === "fulfilled" ? extractList(doc.value.data)  : []);
    setMaterias(mat.status    === "fulfilled" ? extractList(mat.value.data)  : []);
    setAsignaciones(asig.status === "fulfilled" ? extractList(asig.value.data) : []);
    setAlumnos(al.status      === "fulfilled" ? extractList(al.value.data)   : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => setForm({ semestre: "", carrera: "", grupo_letra: "", turno: "Matutino", docente_id: "", materia_id: "" });

  const getAsignacion = (grupoId) => asignaciones.find((a) => a.grupo === grupoId);

  const usedGroupLetters = grupos
    .filter((g) => g.semestre === Number.parseInt(form.semestre, 10) && g.carrera === form.carrera)
    .map((g) => String(g.grupo_letra));

  const gruposDisponibles = !form.semestre || !form.carrera
    ? []
    : ["1", "2", "3", "4"].filter((l) => !usedGroupLetters.includes(l));

  const openCreate = () => {
    resetForm();
    setEditGroup(null);
    setModalOpen(true);
  };

  const openEditGroup = (grupo) => {
    const asig = getAsignacion(grupo.id);
    setForm({
      semestre:   String(grupo.semestre || ""),
      carrera:    grupo.carrera || "",
      grupo_letra: String(grupo.grupo_letra || ""),
      turno:      grupo.turno || "Matutino",
      docente_id: asig?.docente ? String(asig.docente) : "",
      materia_id: asig?.materia ? String(asig.materia) : "",
    });
    setEditGroup({ grupoId: grupo.id, asigId: asig?.id ?? null });
    setModalOpen(true);
  };

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.semestre || !form.carrera || !form.grupo_letra || !form.docente_id || !form.materia_id) {
      show("Completa todos los campos obligatorios.", "error");
      return;
    }
    setSaving(true);
    try {
      await api.post("/academico/grupos/", {
        semestre:    Number.parseInt(form.semestre, 10),
        carrera:     form.carrera,
        grupo_letra: String(form.grupo_letra),
        turno:       form.turno,
        docente_id:  Number.parseInt(form.docente_id, 10),
        materia_id:  Number.parseInt(form.materia_id, 10),
      });
      show("Grupo creado correctamente.");
      setModalOpen(false);
      resetForm();
      await load();
    } catch (err) {
      if (err.response?.data) {
        const msg = Object.entries(err.response.data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        show(`Error: ${msg}`, "error");
      } else {
        show("No se pudo crear el grupo.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editGroup?.grupoId) return;
    if (!form.semestre || !form.carrera || !form.grupo_letra) {
      show("Completa los campos obligatorios.", "error");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/academico/grupos/${editGroup.grupoId}/`, {
        semestre:    Number.parseInt(form.semestre, 10),
        carrera:     form.carrera,
        grupo_letra: String(form.grupo_letra),
        turno:       form.turno,
      });
      const payloadAsig = {
        docente: form.docente_id ? Number.parseInt(form.docente_id, 10) : null,
        materia: form.materia_id ? Number.parseInt(form.materia_id, 10) : null,
        grupo:   editGroup.grupoId,
      };
      if (editGroup.asigId) {
        await api.put(`/seguimiento/asignaciones/${editGroup.asigId}/`, payloadAsig);
      } else if (payloadAsig.docente && payloadAsig.materia) {
        await api.post("/seguimiento/asignaciones/", payloadAsig);
      }
      show("Grupo actualizado correctamente.");
      setModalOpen(false);
      setEditGroup(null);
      resetForm();
      await load();
    } catch {
      show("No se pudo actualizar el grupo.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este grupo?")) return;
    try {
      await api.delete(`/academico/grupos/${id}/`);
      show("Grupo eliminado.");
      await load();
    } catch {
      show("No se pudo eliminar el grupo.", "error");
    }
  };

  // Shared form fields JSX (used by both create and edit modals)
  const renderFormFields = () => (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Semestre" required>
          <select className={inputCls} value={form.semestre} onChange={(e) => setForm((c) => ({ ...c, semestre: e.target.value, carrera: "", grupo_letra: "" }))}>
            <option value="">Seleccionar</option>
            {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}°</option>)}
          </select>
        </Field>
        <Field label="Carrera" required>
          <select className={inputCls} value={form.carrera} disabled={!form.semestre} onChange={(e) => setForm((c) => ({ ...c, carrera: e.target.value, grupo_letra: "" }))}>
            <option value="">Seleccionar</option>
            {CARRERAS_POR_SEMESTRE(form.semestre).map((car) => <option key={car.value} value={car.value}>{car.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Grupo" required>
          <select className={inputCls} value={form.grupo_letra} disabled={!form.carrera} onChange={(e) => setForm((c) => ({ ...c, grupo_letra: e.target.value }))}>
            <option value="">Seleccionar</option>
            {gruposDisponibles.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Turno">
          <select className={inputCls} value={form.turno} onChange={(e) => setForm((c) => ({ ...c, turno: e.target.value }))}>
            <option value="Matutino">Matutino</option>
            <option value="Vespertino">Vespertino</option>
          </select>
        </Field>
      </div>
      <Field label="Docente" required>
        <select className={inputCls} value={form.docente_id} onChange={(e) => setForm((c) => ({ ...c, docente_id: e.target.value }))}>
          <option value="">Seleccionar docente</option>
          {docentes.map((d) => <option key={d.id} value={d.id}>{[d.first_name, d.last_name].filter(Boolean).join(" ") || d.username}</option>)}
        </select>
      </Field>
      <Field label="Materia" required>
        <select className={inputCls} value={form.materia_id} onChange={(e) => setForm((c) => ({ ...c, materia_id: e.target.value }))}>
          <option value="">Seleccionar materia</option>
          {materias.map((m) => <option key={m.id} value={m.id}>{m.clave} - {m.nombre}</option>)}
        </select>
      </Field>
    </>
  );

  return (
    <>
      <Toast toast={toast} />
      <SectionTitle
        title="Grupos"
        subtitle="Crea grupos nuevos y consulta su asignacion."
        action={<Btn onClick={openCreate}>+ Nuevo grupo</Btn>}
      />
      <Table cols={["Clave","Semestre","Carrera","Turno","Docente","Materia","Alumnos",""]} loading={loading} emptyText="Sin grupos registrados">
        {grupos.map((grupo, idx) => {
          const asignacion = getAsignacion(grupo.id);
          const docente    = asignacion?.docente_detalle;
          const materia    = asignacion?.materia_detalle;
          return (
            <TR key={`grupo-${grupo.id ?? idx}`} idx={idx}>
              <TD><span className="font-mono text-sm font-semibold text-violet-200">{groupCode(grupo)}</span></TD>
              <TD><Pill>{grupo.semestre}°</Pill></TD>
              <TD><span className="text-xs text-gray-300">{carreraLabels[grupo.carrera] ?? grupo.carrera}</span></TD>
              <TD><span className="text-xs text-gray-400">{grupo.turno}</span></TD>
              <TD><span className="text-xs text-gray-300">{docente ? `${docente.first_name} ${docente.last_name}`.trim() : "—"}</span></TD>
              <TD><span className="font-mono text-xs text-gray-400">{materia?.clave ?? "—"}</span></TD>
              <TD><Pill color="emerald">{grupo.total_alumnos ?? 0}</Pill></TD>
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

      {/* Create / Edit modal */}
      {modalOpen ? (
        <Modal
          title={editGroup ? "Editar grupo" : "Nuevo grupo"}
          onClose={() => { setModalOpen(false); setEditGroup(null); resetForm(); }}
        >
          <form className="space-y-4" onSubmit={editGroup ? handleEdit : handleCreate}>
            {renderFormFields()}
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Btn variant="ghost" onClick={() => { setModalOpen(false); setEditGroup(null); resetForm(); }}>Cancelar</Btn>
              <Btn variant="primary" type="submit" loading={saving}>
                {editGroup ? "Guardar cambios" : "Crear grupo"}
              </Btn>
            </div>
          </form>
        </Modal>
      ) : null}

      {/* Details modal */}
      {detailsGroup ? (
        <Modal title={`Detalles ${groupCode(detailsGroup)}`} onClose={() => setDetailsGroup(null)}>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-100">
                Alumnos ({alumnos.filter((a) => a.grupo === detailsGroup.id).length})
              </h4>
              <div className="mt-3 max-h-80 overflow-auto space-y-3">
                {alumnos.filter((a) => a.grupo === detailsGroup.id).map((al) => (
                  <div key={al.id} className="flex items-center gap-3">
                    <Avatar label={al.nombre_completo ?? String(al.user)} />
                    <div>
                      <div className="font-medium text-gray-100">{al.nombre_completo}</div>
                      <div className="text-xs text-gray-500">{al.matricula || al.email || `ID ${al.id}`}</div>
                    </div>
                  </div>
                ))}
                {alumnos.filter((a) => a.grupo === detailsGroup.id).length === 0
                  ? <div className="text-xs text-gray-500">Sin alumnos inscritos</div>
                  : null}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold text-gray-200">Materia asignada</h4>
                <div className="mt-2">
                  {(() => {
                    const asig = getAsignacion(detailsGroup.id);
                    const mat  = asig?.materia_detalle;
                    return mat ? (
                      <div>
                        <div className="font-medium text-gray-100">{mat.clave} · {mat.nombre}</div>
                        <div className="text-xs text-gray-500">{mat.creditos ?? 0} créditos</div>
                      </div>
                    ) : <div className="text-xs text-gray-500">No hay materia asignada</div>;
                  })()}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-200">Docente</h4>
                <div className="mt-2">
                  {(() => {
                    const asig = getAsignacion(detailsGroup.id);
                    const doc  = asig?.docente_detalle;
                    return doc ? (
                      <div>
                        <div className="font-medium text-gray-100">{[doc.first_name, doc.last_name].filter(Boolean).join(" ")}</div>
                        <div className="text-xs text-gray-500">{doc.email || doc.username}</div>
                      </div>
                    ) : <div className="text-xs text-gray-500">No hay docente asignado</div>;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

// ─── MateriasSection ───────────────────────────────────────────────────────────

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
    } catch {
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
    setForm({ nombre: materia.nombre ?? "", clave: materia.clave ?? "", creditos: materia.creditos ?? "" });
    setModal({ mode: "edit", id: materia.id });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.clave.trim()) {
      show("Nombre y clave son obligatorios.", "error");
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
      } else {
        await api.put(`/academico/materias/${modal.id}/`, payload);
      }
      show("Materia guardada correctamente.");
      setModal(null);
      await load();
    } catch {
      show("No se pudo guardar la materia.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta materia?")) return;
    try {
      await api.delete(`/academico/materias/${id}/`);
      show("Materia eliminada.");
      await load();
    } catch {
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
              <input className={inputCls} value={form.nombre} placeholder="Ej. Matematicas I" onChange={(e) => setForm((c) => ({ ...c, nombre: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Clave" required>
                <input className={inputCls} value={form.clave} placeholder="MAT-101" onChange={(e) => setForm((c) => ({ ...c, clave: e.target.value }))} />
              </Field>
              <Field label="Creditos">
                <input className={inputCls} type="number" min={0} max={20} value={form.creditos} placeholder="5" onChange={(e) => setForm((c) => ({ ...c, creditos: e.target.value }))} />
              </Field>
            </div>
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
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