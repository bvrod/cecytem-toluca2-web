// src/components/Computo/KioskoAlumno.jsx
import { useState, useEffect } from "react";

const ESTADOS = {
  LIBRE: "LIBRE",
  OCUPADO: "OCUPADO",
  MANTENIMIENTO: "MANTENIMIENTO",
};

// Misma clave/prefijo que usa PanelEncargado.jsx, para que ambos
// componentes lean y escriban el mismo dato en localStorage.
const PREFIJO_CLAVE = "salaComputo:";

// Mismo catálogo de tipos de incidencia que usa el Panel del Encargado
// (tipoIncidenciaConfig). Si agregas un tipo aquí, agrégalo también allá.
const TIPOS_INCIDENCIA = [
  { value: "SIN_INTERNET",  label: "Sin internet / no hay conexión" },
  { value: "FALTA_MOUSE",   label: "Falta el mouse" },
  { value: "FALTA_TECLADO", label: "Falta el teclado" },
  { value: "NO_ENCIENDE",   label: "El equipo no enciende" },
  { value: "PANTALLA",      label: "Problema con la pantalla" },
  { value: "AUDIO",         label: "No tiene audio / bocinas" },
  { value: "SUCIO",         label: "El equipo está sucio" },
  { value: "OTRO",          label: "Otro" },
];

function horaActual() {
  return new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function fechaActualISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function cargarDato(clave) {
  try {
    const valor = window.localStorage.getItem(PREFIJO_CLAVE + clave);
    return valor ? JSON.parse(valor) : null;
  } catch (e) {
    console.error(`Error leyendo "${clave}":`, e);
    return null;
  }
}

function guardarDato(clave, valor) {
  try {
    window.localStorage.setItem(PREFIJO_CLAVE + clave, JSON.stringify(valor));
    return true;
  } catch (e) {
    console.error(`Error guardando "${clave}":`, e);
    return false;
  }
}

// ---------------------- Panel de incidencias (modal) ----------------------

function PanelIncidencias({ pcId, matricula, onClose, onEnviada }) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const [enviada, setEnviada] = useState(false);

  const requiereDescripcion = tipoSeleccionado === "OTRO";

  const handleEnviar = () => {
    if (!tipoSeleccionado) {
      setError("Selecciona el tipo de problema.");
      return;
    }
    if (requiereDescripcion && !descripcion.trim()) {
      setError("Describe brevemente el problema.");
      return;
    }
    setError("");

    const incidencias = cargarDato("incidencias") ?? [];

    const nuevaIncidencia = {
      id: Date.now(),
      pcId: pcId,
      alumno: matricula.trim() || "Anónimo",
      tipo: tipoSeleccionado,
      descripcion: descripcion.trim() || TIPOS_INCIDENCIA.find((t) => t.value === tipoSeleccionado)?.label || "",
      fecha: fechaActualISO(),
      hora: horaActual(),
      estado: "pendiente",
    };

    const ok = guardarDato("incidencias", [nuevaIncidencia, ...incidencias]);

    if (!ok) {
      setError("No se pudo enviar el reporte. Intenta de nuevo.");
      return;
    }

    setEnviada(true);
    onEnviada?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 p-6 flex flex-col gap-5">
        {enviada ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Reporte enviado</p>
              <p className="text-slate-400 text-sm mt-1">
                El encargado de sala revisará tu reporte sobre {pcId}.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-base">Reportar incidencia</h3>
                <p className="text-slate-500 text-xs mt-0.5">Equipo: <span className="text-cyan-300 font-semibold">{pcId}</span></p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-slate-300 text-sm font-medium">¿Qué problema tiene el equipo?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TIPOS_INCIDENCIA.map((tipo) => {
                  const activo = tipoSeleccionado === tipo.value;
                  return (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() => {
                        setTipoSeleccionado(tipo.value);
                        if (error) setError("");
                      }}
                      className={`text-left text-sm px-3 py-2.5 rounded-lg border transition-colors ${
                        activo
                          ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-200"
                          : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      {tipo.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="descripcion" className="text-slate-300 text-sm font-medium">
                Describe el problema {requiereDescripcion ? "" : "(opcional)"}
              </label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value);
                  if (error) setError("");
                }}
                rows={3}
                placeholder={
                  requiereDescripcion
                    ? "Cuéntanos qué pasó con el equipo..."
                    : "Puedes agregar más detalles si quieres..."
                }
                className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm border border-slate-600 transition-colors outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500/60 resize-none"
              />
            </div>

            {error && <p className="text-rose-400 text-xs">{error}</p>}

            <button
              onClick={handleEnviar}
              className="w-full bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold py-3 rounded-lg text-sm tracking-wide transition-colors shadow-lg shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Enviar reporte
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------- Componente principal ----------------------

export default function KioskoAlumno() {
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [pcSeleccionada, setPcSeleccionada] = useState("");
  const [computadorasLibres, setComputadorasLibres] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [horaRegistro, setHoraRegistro] = useState(null);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [mostrarIncidencias, setMostrarIncidencias] = useState(false);

  // El administrador define las computadoras y sus números/IDs desde el
  // Panel del Encargado (botón "Agregar computadora"). Aquí solo leemos esa
  // lista y mostramos las que están LIBRES para que el alumno elija la suya.
  const cargarComputadorasLibres = () => {
    const computadoras = cargarDato("computadoras") ?? [];
    setComputadorasLibres(computadoras.filter((pc) => pc.estado === ESTADOS.LIBRE));
  };

  useEffect(() => {
    cargarComputadorasLibres();

    // Si otro alumno (en otra pestaña) toma una PC mientras este formulario
    // está abierto, la lista se actualiza sola para no mostrar opciones que
    // ya no están disponibles.
    const alCambiarStorage = (e) => {
      if (e.key === PREFIJO_CLAVE + "computadoras") {
        cargarComputadorasLibres();
      }
    };
    window.addEventListener("storage", alCambiarStorage);
    return () => window.removeEventListener("storage", alCambiarStorage);
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!pcSeleccionada) newErrors.pc = "Selecciona la computadora en la que estás.";
    if (!matricula.trim()) newErrors.matricula = "El usuario o matrícula es obligatorio.";
    if (!password.trim()) newErrors.password = "La contraseña es obligatoria.";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setErrorEnvio("");

    const hora = horaActual();
    const fecha = fechaActualISO();

    const computadoras = cargarDato("computadoras") ?? [];

    // Verificamos que, justo antes de enviar, la PC elegida siga libre.
    // Esto evita que dos alumnos tomen la misma PC si ambos llenaron el
    // formulario casi al mismo tiempo.
    const pcActual = computadoras.find((pc) => pc.id === pcSeleccionada);
    if (pcActual && pcActual.estado !== ESTADOS.LIBRE) {
      setErrorEnvio("Esa computadora ya fue tomada por otro alumno. Selecciona otra.");
      cargarComputadorasLibres();
      return;
    }

    const actualizado = computadoras.map((pc) =>
      pc.id === pcSeleccionada
        ? { ...pc, estado: ESTADOS.OCUPADO, alumno: matricula.trim(), horaInicio: hora, fecha }
        : pc
    );

    const ok = guardarDato("computadoras", actualizado);

    if (!ok) {
      setErrorEnvio("No se pudo registrar el acceso. Intenta de nuevo.");
      return;
    }

    setHoraRegistro(hora);
    setSubmitted(true);
  };

  const handleReset = () => {
    // Liberar el equipo en el storage compartido: lo marcamos como LIBRE
    // y registramos la sesión completa (entrada/salida) en el historial,
    // exactamente como hace el botón "Liberar equipo" del Panel del Encargado.
    const computadoras = cargarDato("computadoras") ?? [];
    const pcActual = computadoras.find((pc) => pc.id === pcSeleccionada);

    if (pcActual?.alumno) {
      const historial = cargarDato("historial") ?? [];
      const registro = {
        id: Date.now(),
        pcId: pcActual.id,
        alumno: pcActual.alumno,
        fecha: pcActual.fecha || fechaActualISO(),
        horaInicio: pcActual.horaInicio,
        horaFin: horaActual(),
      };
      guardarDato("historial", [registro, ...historial]);
    }

    const actualizado = computadoras.map((pc) =>
      pc.id === pcSeleccionada
        ? { ...pc, estado: ESTADOS.LIBRE, alumno: null, horaInicio: null, fecha: null }
        : pc
    );
    guardarDato("computadoras", actualizado);
    cargarComputadorasLibres();

    setMatricula("");
    setPassword("");
    setPcSeleccionada("");
    setErrors({});
    setErrorEnvio("");
    setHoraRegistro(null);
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-10">
      {/* Fondo con patrón sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/30 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">

        {/* Encabezado institucional */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-12 bg-cyan-500/50" />
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">Sistema Escolar</span>
            <div className="h-px w-12 bg-cyan-500/50" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CECyTEM Toluca II</h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Registro · Sala de Cómputo</p>
        </div>

        {/* Selector de computadora (solo antes de registrarse) */}
        {!submitted && (
          <div className="w-full flex flex-col gap-1.5">
            <label htmlFor="pc" className="text-slate-300 text-sm font-medium px-1">
              ¿En qué computadora estás sentado/a?
            </label>
            <select
              id="pc"
              value={pcSeleccionada}
              onChange={(e) => {
                setPcSeleccionada(e.target.value);
                if (errors.pc) setErrors((prev) => ({ ...prev, pc: "" }));
              }}
              className={`w-full bg-slate-800 text-white rounded-lg px-4 py-3 text-sm border transition-colors outline-none focus:ring-2 focus:ring-cyan-500/60
                ${errors.pc ? "border-rose-500 focus:ring-rose-500/40" : "border-slate-600 focus:border-cyan-500/60"}`}
            >
              <option value="" disabled>
                {computadorasLibres.length === 0 ? "No hay computadoras libres" : "Selecciona tu computadora..."}
              </option>
              {computadorasLibres.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.id}
                </option>
              ))}
            </select>
            {errors.pc && <p className="text-rose-400 text-xs px-1">{errors.pc}</p>}
            {computadorasLibres.length === 0 && (
              <p className="text-amber-400/80 text-xs px-1">
                Todas las computadoras están ocupadas o en mantenimiento. Avisa al encargado de sala.
              </p>
            )}
          </div>
        )}

        {/* Banner del equipo, una vez registrado */}
        {submitted && (
          <div className="w-full flex items-center justify-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-5 py-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)] shrink-0" />
            <span className="text-slate-300 text-sm font-medium">
              Equipo asignado:&nbsp;
              <span className="text-cyan-300 font-bold tracking-widest">{pcSeleccionada}</span>
            </span>
          </div>
        )}

        {/* Tarjeta del formulario */}
        <div className="w-full bg-slate-900/80 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-sm p-8">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Acceso registrado</p>
                <p className="text-slate-400 text-sm mt-1">
                  Bienvenido/a,&nbsp;
                  <span className="text-cyan-300 font-medium">{matricula}</span>
                </p>
                <p className="text-slate-500 text-xs mt-1">Estación: {pcSeleccionada}</p>
                {horaRegistro && (
                  <p className="text-slate-500 text-xs mt-1 font-mono">
                    Hora de registro: <span className="text-emerald-300">{horaRegistro}</span>
                  </p>
                )}
              </div>

              {/* Botón para reportar una incidencia con el equipo */}
              <button
                onClick={() => setMostrarIncidencias(true)}
                className="mt-1 w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 hover:border-amber-400/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M12 9v3.75m0 3.75h.008M10.34 3.59L1.82 18a1.5 1.5 0 001.3 2.25h17.76a1.5 1.5 0 001.3-2.25L13.66 3.59a1.5 1.5 0 00-2.6 0z" />
                </svg>
                Reportar problema con el equipo
              </button>

              <button
                onClick={handleReset}
                className="px-5 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors"
              >
                Cerrar sesión / Nuevo registro
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <h2 className="text-white font-semibold text-base text-center mb-1">
                Ingresa tus datos para continuar
              </h2>

              {/* Campo matrícula */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="matricula" className="text-slate-300 text-sm font-medium">
                  Usuario o Matrícula
                </label>
                <input
                  id="matricula"
                  type="text"
                  autoComplete="username"
                  value={matricula}
                  onChange={(e) => {
                    setMatricula(e.target.value);
                    if (errors.matricula) setErrors((prev) => ({ ...prev, matricula: "" }));
                  }}
                  placeholder="Ej. 2210034 o nombre.apellido"
                  className={`w-full bg-slate-800 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm border transition-colors outline-none focus:ring-2 focus:ring-cyan-500/60
                    ${errors.matricula ? "border-rose-500 focus:ring-rose-500/40" : "border-slate-600 focus:border-cyan-500/60"}`}
                />
                {errors.matricula && (
                  <p className="text-rose-400 text-xs">{errors.matricula}</p>
                )}
              </div>

              {/* Campo contraseña */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-slate-300 text-sm font-medium">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  placeholder="••••••••"
                  className={`w-full bg-slate-800 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm border transition-colors outline-none focus:ring-2 focus:ring-cyan-500/60
                    ${errors.password ? "border-rose-500 focus:ring-rose-500/40" : "border-slate-600 focus:border-cyan-500/60"}`}
                />
                {errors.password && (
                  <p className="text-rose-400 text-xs">{errors.password}</p>
                )}
              </div>

              {errorEnvio && (
                <p className="text-rose-400 text-xs text-center">{errorEnvio}</p>
              )}

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={computadorasLibres.length === 0}
                className="mt-1 w-full bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 rounded-lg text-sm tracking-wide transition-colors shadow-lg shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Registrar Acceso
              </button>

              {/* Acceso directo al panel de incidencias sin necesidad de iniciar sesión */}
              <button
                type="button"
                onClick={() => {
                  if (!pcSeleccionada) {
                    setErrors((prev) => ({ ...prev, pc: "Selecciona primero tu computadora para reportar el problema." }));
                    return;
                  }
                  setMostrarIncidencias(true);
                }}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-500 hover:text-amber-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M12 9v3.75m0 3.75h.008M10.34 3.59L1.82 18a1.5 1.5 0 001.3 2.25h17.76a1.5 1.5 0 001.3-2.25L13.66 3.59a1.5 1.5 0 00-2.6 0z" />
                </svg>
                ¿El equipo tiene un problema? Repórtalo aquí
              </button>
            </form>
          )}
        </div>

        {/* Pie */}
        <p className="text-slate-600 text-xs text-center">
          CECyTEM · Sistema de Control de Sala de Cómputo
        </p>
      </div>

      {/* Modal de incidencias */}
      {mostrarIncidencias && (
        <PanelIncidencias
          pcId={pcSeleccionada}
          matricula={matricula}
          onClose={() => setMostrarIncidencias(false)}
          onEnviada={() => {}}
        />
      )}
    </div>
  );
}