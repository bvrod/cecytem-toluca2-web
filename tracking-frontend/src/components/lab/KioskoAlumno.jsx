// src/components/lab/KioskoAlumno.jsx
import { useState, useEffect } from "react";

// Mascota institucional — ajusta la ruta según tu proyecto
import CecytoMascota from "../../imagenes/Cecyto Lab.png";

// ── Ajusta esta URL a la misma que usa tu instancia de axios (api.js) ──────────
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ESTADOS = {
  LIBRE: "LIBRE",
  OCUPADO: "OCUPADO",
  MANTENIMIENTO: "MANTENIMIENTO",
};

const PREFIJO_CLAVE = "salaComputo:";

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

// ── CSS en JS (misma técnica que App.jsx) ─────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;800;900&family=DM+Sans:wght@300;400;500&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* La mascota cae desde arriba y queda asomada */
  @keyframes mascotaDrop {
    0%   { opacity: 0; transform: translateY(-40px); }
    60%  { opacity: 1; transform: translateY(42px); }
    80%  { transform: translateY(34px); }
    100% { opacity: 1; transform: translateY(38px); }
  }

  /* Respiración suave — la mascota "vive" */
  @keyframes mascotaBreathe {
    0%, 100% { transform: translateY(38px) scale(1);    }
    50%       { transform: translateY(34px) scale(1.01); }
  }

  @keyframes glowPulse {
    0%, 100% { opacity: 0.75; }
    50%      { opacity: 1; }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }

  .kiosko-page * { box-sizing: border-box; }
  .kiosko-page   { font-family: 'DM Sans', sans-serif; }

  .card-enter   { animation: fadeUp 0.55s ease both; }
  .card-enter-1 { animation: fadeUp 0.55s 0.10s ease both; }
  .card-enter-2 { animation: fadeUp 0.55s 0.20s ease both; }
  .card-enter-3 { animation: fadeUp 0.55s 0.30s ease both; }
  .card-enter-4 { animation: fadeUp 0.55s 0.40s ease both; }

  /* Drop primero, luego respira para siempre */
  .mascota-anim {
    animation:
      mascotaDrop    0.70s 0.20s cubic-bezier(0.25, 1, 0.5, 1) both,
      mascotaBreathe 3.50s 0.90s ease-in-out infinite;
  }

  .glow-bg     { animation: glowPulse 5.0s ease-in-out infinite; }
  .glow-mascot { animation: glowPulse 5.0s 1.5s ease-in-out infinite; }

  .kiosko-input {
    width: 100%;
    background: rgba(5,20,30,0.70);
    border: 1px solid rgba(6,182,212,0.20);
    border-radius: 12px;
    padding: 12px 16px;
    color: #e5e7eb;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 400;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .kiosko-input::placeholder { color: #6b7280; }
  .kiosko-input:focus {
    border-color: #06b6d4;
    box-shadow: 0 0 0 3px rgba(6,182,212,0.16);
  }
  .kiosko-input.error {
    border-color: #ef4444;
  }
  .kiosko-input:focus.error {
    box-shadow: 0 0 0 3px rgba(239,68,68,0.18);
  }
  .kiosko-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .kiosko-btn-primary {
    width: 100%;
    background: #06b6d4;
    border: none;
    border-radius: 12px;
    padding: 13px 0;
    color: #0f172a;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 15px;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: background 0.18s, transform 0.10s, box-shadow 0.18s;
    box-shadow: 0 4px 18px rgba(6,182,212,0.35);
  }
  .kiosko-btn-primary:hover:not(:disabled) {
    background: #0891b2;
    box-shadow: 0 6px 24px rgba(6,182,212,0.45);
  }
  .kiosko-btn-primary:active:not(:disabled) { transform: scale(0.96); }
  .kiosko-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .error-shake { animation: shake 0.42s ease; }

  .divider-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(6,182,212,0.22), transparent);
    margin: 4px 0 20px;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function horaActual() {
  return new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}
function fechaActualISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function cargarDato(clave) {
  try {
    const v = window.localStorage.getItem(PREFIJO_CLAVE + clave);
    return v ? JSON.parse(v) : null;
  } catch(e) { return null; }
}
function guardarDato(clave, valor) {
  try {
    window.localStorage.setItem(PREFIJO_CLAVE + clave, JSON.stringify(valor));
    return true;
  } catch(e) { return false; }
}

// ── Autenticación contra SIGART ───────────────────────────────────────────────
const LOGIN_ENDPOINT = `${API_BASE_URL}/api/auth/login/`;
async function autenticarAlumno(username, password) {
  try {
    const res = await fetch(LOGIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.status === 401 || res.status === 400)
      return { ok: false, mensaje: "Usuario o contraseña incorrectos. Verifica tus datos." };
    if (!res.ok)
      return { ok: false, mensaje: "Error al conectar con el servidor. Intenta de nuevo." };

    const data = await res.json();
    let payload = {};
    try {
      const base64 = data.access.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");
      payload = JSON.parse(atob(base64));
    } catch { /* sigue */ }

    const rol = (payload.rol ?? payload.role ?? payload.tipo ?? "").toUpperCase();
    if (rol && rol !== "ALUMNO")
      return { ok: false, mensaje: "Solo los alumnos pueden registrarse en la sala de cómputo." };

    const nombre =
      [payload.first_name, payload.last_name].filter(Boolean).join(" ") ||
      payload.username || username;

    return { ok: true, nombre, username: payload.username ?? username, accessToken: data.access };
  } catch {
    return { ok: false, mensaje: "No se pudo conectar con el servidor. Verifica la red." };
  }
}

// ── Modal de incidencias ──────────────────────────────────────────────────────
function PanelIncidencias({ pcId, matricula, onClose }) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [descripcion, setDescripcion]           = useState("");
  const [error, setError]                       = useState("");
  const [enviada, setEnviada]                   = useState(false);

  const requiereDescripcion = tipoSeleccionado === "OTRO";

  const handleEnviar = () => {
    if (!tipoSeleccionado) { setError("Selecciona el tipo de problema."); return; }
    if (requiereDescripcion && !descripcion.trim()) { setError("Describe brevemente el problema."); return; }
    setError("");

    const incidencias = cargarDato("incidencias") ?? [];
    const nueva = {
      id: Date.now(), pcId, alumno: matricula.trim() || "Anónimo",
      tipo: tipoSeleccionado,
      descripcion: descripcion.trim() ||
        TIPOS_INCIDENCIA.find(t => t.value === tipoSeleccionado)?.label || "",
      fecha: fechaActualISO(), hora: horaActual(), estado: "pendiente",
    };

    if (!guardarDato("incidencias", [nueva, ...incidencias])) {
      setError("No se pudo enviar el reporte. Intenta de nuevo."); return;
    }
    setEnviada(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
      <div
        style={{
          background: "rgba(5,18,32,0.92)",
          border: "1px solid rgba(6,182,212,0.22)",
          borderRadius: "20px",
          boxShadow: "0 25px 80px rgba(2,10,20,0.65)",
          backdropFilter: "blur(20px)",
        }}
        className="w-full max-w-md p-6 flex flex-col gap-5"
      >
        {enviada ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.35)" }}>
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Reporte enviado</p>
              <p className="text-slate-400 text-sm mt-1">
                El encargado de sala revisará tu reporte sobre <span className="text-cyan-300 font-semibold">{pcId}</span>.
              </p>
            </div>
            <button onClick={onClose}
              style={{ background:"rgba(30,41,59,0.8)", border:"1px solid rgba(71,85,105,0.6)", borderRadius:"10px" }}
              className="mt-2 px-5 py-2 text-sm text-slate-300 hover:text-white transition-colors">
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Reportar incidencia</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Equipo: <span className="text-cyan-300 font-semibold">{pcId}</span>
                </p>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors" aria-label="Cerrar">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-slate-300 text-sm font-medium">¿Qué problema tiene el equipo?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TIPOS_INCIDENCIA.map(tipo => (
                  <button key={tipo.value} type="button"
                    onClick={() => { setTipoSeleccionado(tipo.value); if(error) setError(""); }}
                    style={{
                      background: tipoSeleccionado === tipo.value
                        ? "rgba(6,182,212,0.12)" : "rgba(15,23,42,0.6)",
                      border: `1px solid ${tipoSeleccionado === tipo.value
                        ? "rgba(6,182,212,0.45)" : "rgba(71,85,105,0.6)"}`,
                      borderRadius:"10px",
                    }}
                    className={`text-left text-sm px-3 py-2.5 transition-colors ${
                      tipoSeleccionado === tipo.value ? "text-cyan-200" : "text-slate-300 hover:text-white"
                    }`}>
                    {tipo.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">
                Describe el problema {requiereDescripcion ? "" : "(opcional)"}
              </label>
              <textarea value={descripcion}
                onChange={e => { setDescripcion(e.target.value); if(error) setError(""); }}
                rows={3}
                placeholder={requiereDescripcion ? "Cuéntanos qué pasó..." : "Puedes agregar más detalles..."}
                className="kiosko-input resize-none" />
            </div>

            {error && <p className="text-rose-400 text-xs">{error}</p>}

            <button onClick={handleEnviar} className="kiosko-btn-primary">
              Enviar reporte
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function KioskoAlumno() {
  const [matricula,          setMatricula]          = useState("");
  const [password,           setPassword]           = useState("");
  const [pcSeleccionada,     setPcSeleccionada]     = useState("");
  const [computadorasLibres, setComputadorasLibres] = useState([]);
  const [errors,             setErrors]             = useState({});
  const [submitted,          setSubmitted]          = useState(false);
  const [horaRegistro,       setHoraRegistro]       = useState(null);
  const [errorEnvio,         setErrorEnvio]         = useState("");
  const [mostrarIncidencias, setMostrarIncidencias] = useState(false);
  const [nombreReal,         setNombreReal]         = useState("");
  const [autenticando,       setAutenticando]       = useState(false);
  const [shakeKey,           setShakeKey]           = useState(0);

  const cargarComputadorasLibres = () => {
    const pcs = cargarDato("computadoras") ?? [];
    setComputadorasLibres(pcs.filter(pc => pc.estado === ESTADOS.LIBRE));
  };

  useEffect(() => {
    cargarComputadorasLibres();
    const onChange = e => {
      if (e.key === PREFIJO_CLAVE + "computadoras") cargarComputadorasLibres();
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);

  const validate = () => {
    const e = {};
    if (!pcSeleccionada)      e.pc       = "Selecciona la computadora en la que estás.";
    if (!matricula.trim())    e.matricula = "El usuario o matrícula es obligatorio.";
    if (!password.trim())     e.password  = "La contraseña es obligatoria.";
    return e;
  };

  const handleSubmit = async ev => {
    ev.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length) { setErrors(ve); return; }
    setErrors({}); setErrorEnvio(""); setAutenticando(true);

    const auth = await autenticarAlumno(matricula.trim(), password);
    if (!auth.ok) {
      setErrorEnvio(auth.mensaje);
      setShakeKey(k => k + 1);
      setAutenticando(false); return;
    }

    const hora = horaActual();
    const fecha = fechaActualISO();
    const pcs = cargarDato("computadoras") ?? [];
    const pcActual = pcs.find(pc => pc.id === pcSeleccionada);

    if (pcActual && pcActual.estado !== ESTADOS.LIBRE) {
      setErrorEnvio("Esa computadora ya fue tomada. Selecciona otra.");
      cargarComputadorasLibres(); setAutenticando(false); return;
    }

    const nombreAlumno = auth.nombre || matricula.trim();
    const actualizado  = pcs.map(pc =>
      pc.id === pcSeleccionada
        ? { ...pc, estado: ESTADOS.OCUPADO, alumno: nombreAlumno, horaInicio: hora, fecha }
        : pc
    );

    if (!guardarDato("computadoras", actualizado)) {
      setErrorEnvio("No se pudo registrar el acceso. Intenta de nuevo.");
      setAutenticando(false); return;
    }

    setNombreReal(nombreAlumno);
    setHoraRegistro(hora);
    setSubmitted(true);
    setAutenticando(false);
  };

  const handleReset = () => {
    const pcs = cargarDato("computadoras") ?? [];
    const pcActual = pcs.find(pc => pc.id === pcSeleccionada);
    if (pcActual?.alumno) {
      const historial = cargarDato("historial") ?? [];
      guardarDato("historial", [{
        id: Date.now(), pcId: pcActual.id, alumno: pcActual.alumno,
        fecha: pcActual.fecha || fechaActualISO(),
        horaInicio: pcActual.horaInicio, horaFin: horaActual(),
      }, ...historial]);
    }
    const actualizado = pcs.map(pc =>
      pc.id === pcSeleccionada
        ? { ...pc, estado: ESTADOS.LIBRE, alumno: null, horaInicio: null, fecha: null }
        : pc
    );
    guardarDato("computadoras", actualizado);
    cargarComputadorasLibres();
    setMatricula(""); setPassword(""); setPcSeleccionada("");
    setErrors({}); setErrorEnvio(""); setHoraRegistro(null);
    setSubmitted(false); setNombreReal("");
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>

      <div
        className="kiosko-page"
        style={{
          minHeight: "100vh",
          background: "#082030",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Fondo: patrón de puntos ──────────────────────────────────────── */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(6,182,212,0.18) 1.5px, transparent 1.5px)",
          backgroundSize: "26px 26px",
        }} />

        {/* ── Glow principal ───────────────────────────────────────────────── */}
        <div className="glow-bg" style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: "radial-gradient(ellipse 75% 55% at 50% 60%, rgba(6,182,212,0.28) 0%, rgba(8,145,178,0.10) 45%, transparent 72%)",
          filter: "blur(45px)",
        }} />

        {/* ── Spotlight sobre la mascota ───────────────────────────────────── */}
        <div className="glow-mascot" style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: "radial-gradient(ellipse 40% 30% at 50% 30%, rgba(6,182,212,0.38) 0%, rgba(8,145,178,0.12) 50%, transparent 75%)",
          filter: "blur(30px)",
        }} />

        {/* ── Contenedor centrado ──────────────────────────────────────────── */}
        <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: "420px" }}>

          {/* ── Mascota asomándose (PEEK-A-BOO) ─────────────────────────────
               Está posicionada ENCIMA de la tarjeta pero z-index bajo (3)
               para quedar visualmente detrás del borde superior de la card.
               La card tiene z-index 4 y overflow visible.             ── */}
          {/* ── Mascota asomándose CON LAPTOP (Ajuste para mejor escala) ── */}
            <div
              style={{
              position: 'absolute',
              top: '-120px',          // Un poco más arriba para dar espacio visual
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',          // Que el contenedor ocupe el ancho disponible
              maxWidth: '140px',      // Pero que no sea gigante
              height: '140px',        // Altura contenida para que no tape tanto
              overflow: 'visible',    // Permitimos que la imagen "respire" fuera del contenedor si es necesario
              zIndex: 0,
              pointerEvents: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end', // Alinea la mascota hacia la base del contenedor
        }}
      >
        <img
          src={CecytoMascota}
          alt="Mascota CECyTEM"
          className="mascota-anim"
          style={{
          width: '85%',         // Reduce un poco el tamaño para que no sobresalga tanto
          height: 'auto',
          objectFit: 'contain',
       }}
    />
        </div>

          {/* ── Tarjeta principal (z-index 4 > mascota) ─────────────────────── */}
          <div
            key={shakeKey > 0 ? `shake-${shakeKey}` : "card"}
            className={shakeKey > 0 ? "error-shake" : ""}
            style={{
              position: "relative",
              zIndex: 4,
              background: "rgba(5,18,32,0.82)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(6,182,212,0.20)",
              borderRadius: "20px",
              // paddingTop grande para dar espacio visual a la mascota asomada
              padding: "52px 36px 36px",
              boxShadow:
                "0 25px 80px rgba(2,10,20,0.60), 0 0 0 1px rgba(6,182,212,0.08) inset",
            }}
          >
            {/* Franja cyan en la parte superior de la card */}
            <div style={{
              position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
              width: "60px", height: "3px",
              background: "linear-gradient(90deg, #06b6d4, #0891b2)",
              borderRadius: "0 0 4px 4px",
            }} />

            {/* Encabezado */}
            <div className="card-enter" style={{ textAlign: "center", marginBottom: "24px" }}>
              <p style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: "22px",
                color: "#e5e7eb", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2,
              }}>
                CECyTEM<span style={{ color: "#06b6d4" }}> Toluca II</span>
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: "13px",
                color: "#9aa5b7", margin: "6px 0 0", letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}>
                Registro · Sala de Cómputo
              </p>
            </div>

            <div className="divider-line" />

            {/* ── ESTADO: registrado ──────────────────────────────────────── */}
            {submitted ? (
              <div className="flex flex-col items-center gap-4 py-2 text-center">
                {/* Banner equipo asignado */}
                <div style={{
                  width: "100%", display:"flex", alignItems:"center", justifyContent:"center",
                  gap:"10px", background:"rgba(15,23,42,0.55)",
                  border:"1px solid rgba(71,85,105,0.5)", borderRadius:"12px",
                  padding:"10px 16px",
                }}>
                  <span style={{
                    width:"10px", height:"10px", borderRadius:"50%",
                    background:"#34d399",
                    boxShadow:"0 0 8px 2px rgba(52,211,153,0.50)",
                    flexShrink:0,
                  }} />
                  <span style={{ color:"#cbd5e1", fontSize:"14px", fontWeight:500 }}>
                    Equipo asignado:&nbsp;
                    <span style={{ color:"#67e8f9", fontWeight:700, letterSpacing:"0.1em" }}>
                      {pcSeleccionada}
                    </span>
                  </span>
                </div>

                {/* Check icon */}
                <div style={{
                  width:"56px", height:"56px", borderRadius:"50%",
                  background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.35)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div>
                  <p style={{ color:"#f1f5f9", fontWeight:600, fontSize:"17px" }}>Acceso registrado</p>
                  <p style={{ color:"#94a3b8", fontSize:"13px", marginTop:"4px" }}>
                    Bienvenido/a,&nbsp;
                    <span style={{ color:"#67e8f9", fontWeight:500 }}>{nombreReal || matricula}</span>
                  </p>
                  {horaRegistro && (
                    <p style={{ color:"#64748b", fontSize:"12px", fontFamily:"monospace", marginTop:"4px" }}>
                      Hora de registro:&nbsp;
                      <span style={{ color:"#6ee7b7" }}>{horaRegistro}</span>
                    </p>
                  )}
                </div>

                {/* Botón reportar incidencia */}
                <button
                  onClick={() => setMostrarIncidencias(true)}
                  style={{
                    width:"100%", display:"flex", alignItems:"center", justifyContent:"center",
                    gap:"8px", padding:"10px 0", fontSize:"14px", fontWeight:600,
                    background:"rgba(245,158,11,0.10)", border:"1px solid rgba(245,158,11,0.28)",
                    borderRadius:"10px", color:"#fcd34d", cursor:"pointer",
                    transition:"background 0.18s, border-color 0.18s",
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background="rgba(245,158,11,0.18)";
                    e.currentTarget.style.borderColor="rgba(245,158,11,0.50)";
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background="rgba(245,158,11,0.10)";
                    e.currentTarget.style.borderColor="rgba(245,158,11,0.28)";
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M12 9v3.75m0 3.75h.008M10.34 3.59L1.82 18a1.5 1.5 0 001.3 2.25h17.76a1.5 1.5 0 001.3-2.25L13.66 3.59a1.5 1.5 0 00-2.6 0z" />
                  </svg>
                  Reportar problema con el equipo
                </button>

                {/* Cerrar sesión */}
                <button onClick={handleReset} style={{
                  padding:"8px 20px", fontSize:"13px",
                  background:"rgba(30,41,59,0.8)", border:"1px solid rgba(71,85,105,0.55)",
                  borderRadius:"10px", color:"#94a3b8", cursor:"pointer",
                  transition:"background 0.18s, color 0.18s",
                }}
                  onMouseOver={e => { e.currentTarget.style.background="rgba(51,65,85,0.8)"; e.currentTarget.style.color="#e2e8f0"; }}
                  onMouseOut={e  => { e.currentTarget.style.background="rgba(30,41,59,0.8)"; e.currentTarget.style.color="#94a3b8"; }}>
                  Cerrar sesión / Nuevo registro
                </button>
              </div>

            ) : (
              /* ── ESTADO: formulario de registro ────────────────────────── */
              <form onSubmit={handleSubmit} noValidate style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

                {/* Selector de PC */}
                <div className="card-enter" style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                  <label style={{
                    fontFamily:"'DM Sans', sans-serif", fontSize:"12px", fontWeight:500,
                    color:"#9aa5b7", letterSpacing:"0.06em", textTransform:"uppercase",
                  }}>
                    ¿En qué computadora estás sentado/a?
                  </label>
                  <select
                    value={pcSeleccionada}
                    onChange={e => { setPcSeleccionada(e.target.value); if(errors.pc) setErrors(p=>({...p,pc:""})); }}
                    className={`kiosko-input ${errors.pc ? "error" : ""}`}
                  >
                    <option value="" disabled>
                      {computadorasLibres.length === 0 ? "No hay computadoras libres" : "Selecciona tu computadora..."}
                    </option>
                    {computadorasLibres.map(pc => (
                      <option key={pc.id} value={pc.id}>{pc.id}</option>
                    ))}
                  </select>
                  {errors.pc && <p style={{ color:"#f87171", fontSize:"12px" }}>{errors.pc}</p>}
                  {computadorasLibres.length === 0 && (
                    <p style={{ color:"rgba(251,191,36,0.75)", fontSize:"12px" }}>
                      Todas las computadoras están ocupadas. Avisa al encargado de sala.
                    </p>
                  )}
                </div>

                {/* Matrícula */}
                <div className="card-enter-1" style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                  <label htmlFor="matricula" style={{
                    fontFamily:"'DM Sans', sans-serif", fontSize:"12px", fontWeight:500,
                    color:"#9aa5b7", letterSpacing:"0.06em", textTransform:"uppercase",
                  }}>
                    Usuario o Matrícula
                  </label>
                  <input
                    id="matricula" type="text" autoComplete="username"
                    value={matricula}
                    onChange={e => { setMatricula(e.target.value); if(errors.matricula) setErrors(p=>({...p,matricula:""})); }}
                    placeholder="Ej. 2210034 o nombre.apellido"
                    className={`kiosko-input ${errors.matricula ? "error" : ""}`}
                    disabled={autenticando}
                  />
                  {errors.matricula && <p style={{ color:"#f87171", fontSize:"12px" }}>{errors.matricula}</p>}
                </div>

                {/* Contraseña */}
                <div className="card-enter-2" style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                  <label htmlFor="password" style={{
                    fontFamily:"'DM Sans', sans-serif", fontSize:"12px", fontWeight:500,
                    color:"#9aa5b7", letterSpacing:"0.06em", textTransform:"uppercase",
                  }}>
                    Contraseña
                  </label>
                  <input
                    id="password" type="password" autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); if(errors.password) setErrors(p=>({...p,password:""})); }}
                    placeholder="••••••••"
                    className={`kiosko-input ${errors.password ? "error" : ""}`}
                    disabled={autenticando}
                  />
                  {errors.password && <p style={{ color:"#f87171", fontSize:"12px" }}>{errors.password}</p>}
                </div>

                {/* Error de autenticación */}
                {errorEnvio && (
                  <div style={{
                    background:"rgba(220,38,38,0.10)", border:"1px solid rgba(220,38,38,0.25)",
                    borderRadius:"10px", padding:"10px 14px",
                    display:"flex", alignItems:"center", gap:"8px",
                  }}>
                    <span style={{ fontSize:"15px" }}>⚠️</span>
                    <span style={{ color:"#fca5a5", fontSize:"13px" }}>{errorEnvio}</span>
                  </div>
                )}

                {/* Submit */}
                <div className="card-enter-3" style={{ marginTop:"4px" }}>
                  <button
                    type="submit"
                    disabled={computadorasLibres.length === 0 || autenticando}
                    className="kiosko-btn-primary"
                  >
                    {autenticando ? (
                      <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                        <svg style={{ width:"16px", height:"16px", animation:"spin 0.8s linear infinite" }}
                          fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity:0.25 }} />
                          <path fill="currentColor" style={{ opacity:0.75 }} d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Verificando con SIGART...
                      </span>
                    ) : "Registrar Acceso"}
                  </button>
                </div>

                {/* Link rápido para reportar sin iniciar sesión */}
                <button
                  type="button"
                  className="card-enter-4"
                  onClick={() => {
                    if (!pcSeleccionada) {
                      setErrors(p => ({ ...p, pc: "Selecciona primero tu computadora para reportar." }));
                      return;
                    }
                    setMostrarIncidencias(true);
                  }}
                  style={{
                    background:"none", border:"none", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
                    fontSize:"12px", fontWeight:500, color:"#4b5563",
                    transition:"color 0.18s",
                  }}
                  onMouseOver={e => e.currentTarget.style.color="#fcd34d"}
                  onMouseOut={e  => e.currentTarget.style.color="#4b5563"}
                >
                  <svg style={{ width:"14px", height:"14px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M12 9v3.75m0 3.75h.008M10.34 3.59L1.82 18a1.5 1.5 0 001.3 2.25h17.76a1.5 1.5 0 001.3-2.25L13.66 3.59a1.5 1.5 0 00-2.6 0z" />
                  </svg>
                  ¿El equipo tiene un problema? Repórtalo aquí
                </button>
              </form>
            )}
          </div>

          {/* Pie */}
          <p style={{
            color:"#334155", fontSize:"11px", textAlign:"center",
            marginTop:"20px", fontFamily:"'DM Sans', sans-serif", letterSpacing:"0.03em",
          }}>
            CECyTEM · Sistema de Control de Sala de Cómputo
          </p>
        </div>
      </div>

      {/* Modal de incidencias */}
      {mostrarIncidencias && (
        <PanelIncidencias
          pcId={pcSeleccionada}
          matricula={matricula}
          onClose={() => setMostrarIncidencias(false)}
        />
      )}
    </>
  );
}