// src/components/lab/LabRouter.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Puerta de entrada única para la Sala de Cómputo.
// • Si el usuario es ADMIN  → muestra PanelEncargado
// • Si el usuario es ALUMNO → autentica contra SIGART y muestra KioskoAlumno
//
// CREDENCIALES DE ADMIN (hardcodeadas — cámbialo cuando tengas backend):
//   usuario  : "encargado"
//   password : "cecytem2024"
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";

// ── Ajusta estas rutas a donde viven tus componentes ──────────────────────────
import KioskoAlumno   from "./KioskoAlumno";
import PanelEncargado from "./PanelEncargado";

// ── Credenciales del super-usuario (encargado / admin) ────────────────────────
// Cambia estos valores o múltiplalos si necesitas varios encargados.
const ADMINS = [
  { username: "encargado", password: "cecytem2024", nombre: "Encargado de Sala" },
  { username: "admin",     password: "admin1234",   nombre: "Administrador"      },
];

// ── Backend SIGART (para alumnos) ─────────────────────────────────────────────
const API_BASE_URL    = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const LOGIN_ENDPOINT  = `${API_BASE_URL}/api/auth/login/`;

// ── Roles ─────────────────────────────────────────────────────────────────────
const ROL = { ALUMNO: "ALUMNO", ADMIN: "ADMIN" };

// ── Estilos CSS inyectados ────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  @keyframes lr-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes lr-shake {
    0%,100% { transform: translateX(0);   }
    20%      { transform: translateX(-7px);}
    40%      { transform: translateX(7px); }
    60%      { transform: translateX(-4px);}
    80%      { transform: translateX(4px); }
  }
  @keyframes lr-glow {
    0%,100% { opacity: .7; }
    50%     { opacity: 1;  }
  }
  @keyframes lr-spin {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(360deg); }
  }
  @keyframes lr-scan {
    0%   { top: 0%; }
    100% { top: 100%; }
  }

  .lr-root * { box-sizing: border-box; }
  .lr-root   { font-family: 'DM Sans', sans-serif; }

  .lr-fadeUp   { animation: lr-fadeUp 0.55s ease both; }
  .lr-fadeUp-1 { animation: lr-fadeUp 0.55s 0.08s ease both; }
  .lr-fadeUp-2 { animation: lr-fadeUp 0.55s 0.16s ease both; }
  .lr-fadeUp-3 { animation: lr-fadeUp 0.55s 0.24s ease both; }
  .lr-fadeUp-4 { animation: lr-fadeUp 0.55s 0.32s ease both; }

  .lr-shake { animation: lr-shake 0.42s ease; }
  .lr-glow  { animation: lr-glow  4.0s ease-in-out infinite; }

  .lr-input {
    width: 100%;
    background: rgba(5,20,30,0.72);
    border: 1px solid rgba(6,182,212,0.20);
    border-radius: 12px;
    padding: 12px 16px;
    color: #e5e7eb;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    -webkit-autofill: off;
  }
  .lr-input::placeholder { color: #4b5563; }
  .lr-input:focus {
    border-color: #06b6d4;
    box-shadow: 0 0 0 3px rgba(6,182,212,0.15);
  }
  .lr-input.lr-err { border-color: #ef4444; }
  .lr-input:disabled { opacity: .45; cursor: not-allowed; }

  .lr-btn {
    width: 100%;
    background: #06b6d4;
    border: none;
    border-radius: 12px;
    padding: 13px 0;
    color: #0f172a;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 15px;
    letter-spacing: .03em;
    cursor: pointer;
    transition: background .18s, transform .10s, box-shadow .18s;
    box-shadow: 0 4px 18px rgba(6,182,212,.35);
  }
  .lr-btn:hover:not(:disabled) {
    background: #0891b2;
    box-shadow: 0 6px 24px rgba(6,182,212,.45);
  }
  .lr-btn:active:not(:disabled) { transform: scale(.96); }
  .lr-btn:disabled { opacity: .45; cursor: not-allowed; }

  /* Selector de rol — pills */
  .lr-pill {
    flex: 1;
    padding: 9px 0;
    border-radius: 10px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: .04em;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background .18s, border-color .18s, color .18s;
    text-align: center;
  }
  .lr-pill-active {
    background: rgba(6,182,212,.15);
    border-color: rgba(6,182,212,.45);
    color: #67e8f9;
  }
  .lr-pill-inactive {
    background: rgba(15,23,42,.50);
    border-color: rgba(71,85,105,.40);
    color: #64748b;
  }
  .lr-pill-inactive:hover { color: #94a3b8; border-color: rgba(71,85,105,.65); }

  /* Línea decorativa */
  .lr-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(6,182,212,.22), transparent);
    margin: 4px 0 18px;
  }

  /* Badge de rol activo */
  .lr-role-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  .lr-role-alumno {
    background: rgba(6,182,212,.10);
    border: 1px solid rgba(6,182,212,.30);
    color: #67e8f9;
  }
  .lr-role-admin {
    background: rgba(139,92,246,.12);
    border: 1px solid rgba(139,92,246,.35);
    color: #c4b5fd;
  }

  /* Scan line del admin */
  .lr-scanline {
    position: absolute;
    left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(139,92,246,.6), transparent);
    pointer-events: none;
    animation: lr-scan 2.4s linear infinite;
  }
`;

// ── Utilidad: autenticar contra SIGART ────────────────────────────────────────
async function loginSigart(username, password) {
  try {
    const res = await fetch(LOGIN_ENDPOINT, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ username, password }),
    });
    if (res.status === 401 || res.status === 400)
      return { ok: false, msg: "Usuario o contraseña incorrectos." };
    if (!res.ok)
      return { ok: false, msg: "Error de servidor. Intenta de nuevo." };

    const data = await res.json();
    let payload = {};
    try {
      const b64 = data.access.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");
      payload = JSON.parse(atob(b64));
    } catch { /* no-op */ }

    const rol = (payload.rol ?? payload.role ?? payload.tipo ?? "").toUpperCase();
    if (rol && rol !== "ALUMNO")
      return { ok: false, msg: "Solo los alumnos usan este acceso." };

    const nombre =
      [payload.first_name, payload.last_name].filter(Boolean).join(" ") ||
      payload.username || username;

    return { ok: true, nombre, username: payload.username ?? username, token: data.access };
  } catch {
    return { ok: false, msg: "No se pudo conectar. Verifica la red." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LoginGate — pantalla de inicio de sesión unificada
// ─────────────────────────────────────────────────────────────────────────────
function LoginGate({ onSuccess }) {
  const [rolSeleccionado, setRolSeleccionado] = useState(ROL.ALUMNO);
  const [username,  setUsername]  = useState("");
  const [password,  setPassword]  = useState("");
  const [errors,    setErrors]    = useState({});
  const [apiError,  setApiError]  = useState("");
  const [cargando,  setCargando]  = useState(false);
  const [shakeKey,  setShakeKey]  = useState(0);

  // Limpiar campos al cambiar de rol
  useEffect(() => {
    setUsername(""); setPassword("");
    setErrors({}); setApiError("");
  }, [rolSeleccionado]);

  const esAdmin = rolSeleccionado === ROL.ADMIN;

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "Campo obligatorio.";
    if (!password.trim()) e.password = "Campo obligatorio.";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length) { setErrors(ve); return; }
    setErrors({}); setApiError(""); setCargando(true);

    if (esAdmin) {
      // ── Verificar contra lista local de admins ──────────────────────────
      await new Promise(r => setTimeout(r, 420)); // pequeño delay visual
      const match = ADMINS.find(
        a => a.username === username.trim() && a.password === password
      );
      if (!match) {
        setApiError("Credenciales de encargado incorrectas.");
        setShakeKey(k => k + 1);
        setCargando(false); return;
      }
      onSuccess({ rol: ROL.ADMIN, nombre: match.nombre, username: match.username });
    } else {
      // ── Verificar contra SIGART ─────────────────────────────────────────
      const res = await loginSigart(username.trim(), password);
      if (!res.ok) {
        setApiError(res.msg);
        setShakeKey(k => k + 1);
        setCargando(false); return;
      }
      onSuccess({ rol: ROL.ALUMNO, nombre: res.nombre, username: res.username, token: res.token });
    }
    setCargando(false);
  };

  return (
    <>
      <style>{STYLES}</style>

      <div
        className="lr-root"
        style={{
          minHeight: "100vh",
          background: "#07111c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Fondo de puntos */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "radial-gradient(rgba(6,182,212,0.14) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }} />

        {/* Glow central */}
        <div className="lr-glow" style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
          background: esAdmin
            ? "radial-gradient(ellipse 65% 50% at 50% 58%, rgba(139,92,246,0.22) 0%, transparent 70%)"
            : "radial-gradient(ellipse 65% 50% at 50% 58%, rgba(6,182,212,0.22) 0%, transparent 70%)",
          filter: "blur(40px)",
          transition: "background 0.6s ease",
        }} />

        {/* Tarjeta */}
        <div
          key={`shake-${shakeKey}`}
          className={shakeKey > 0 ? "lr-shake" : ""}
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: "400px",
            background: "rgba(5,16,28,0.84)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            border: `1px solid ${esAdmin ? "rgba(139,92,246,0.24)" : "rgba(6,182,212,0.20)"}`,
            borderRadius: "22px",
            padding: "36px 32px 32px",
            boxShadow: "0 28px 80px rgba(2,8,18,0.65)",
            overflow: "hidden",
            transition: "border-color 0.4s ease",
          }}
        >
          {/* Scan line (solo admin) */}
          {esAdmin && <div className="lr-scanline" />}

          {/* Franja superior */}
          <div style={{
            position: "absolute", top: 0, left: "50%",
            transform: "translateX(-50%)",
            width: "64px", height: "3px",
            background: esAdmin
              ? "linear-gradient(90deg,#7c3aed,#8b5cf6)"
              : "linear-gradient(90deg,#06b6d4,#0891b2)",
            borderRadius: "0 0 4px 4px",
            transition: "background 0.4s ease",
          }} />

          {/* Header */}
          <div className="lr-fadeUp" style={{ textAlign: "center", marginBottom: "22px" }}>
            <p style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 900,
              fontSize: "21px",
              color: "#e5e7eb",
              margin: 0,
              letterSpacing: "-0.02em",
            }}>
              CECyTEM<span style={{ color: esAdmin ? "#a78bfa" : "#06b6d4" }}> Toluca II</span>
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 300,
              fontSize: "11.5px",
              color: "#6b7280",
              margin: "5px 0 0",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              Sala de Cómputo · Acceso
            </p>
          </div>

          {/* Selector de rol */}
          <div className="lr-fadeUp-1" style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <button
              type="button"
              onClick={() => setRolSeleccionado(ROL.ALUMNO)}
              className={`lr-pill ${rolSeleccionado === ROL.ALUMNO ? "lr-pill-active" : "lr-pill-inactive"}`}
            >
              🎓 Alumno
            </button>
            <button
              type="button"
              onClick={() => setRolSeleccionado(ROL.ADMIN)}
              className={`lr-pill ${rolSeleccionado === ROL.ADMIN ? "lr-pill-active" : "lr-pill-inactive"}`}
              style={rolSeleccionado === ROL.ADMIN ? {
                background: "rgba(139,92,246,.15)",
                borderColor: "rgba(139,92,246,.45)",
                color: "#c4b5fd",
              } : {}}
            >
              🛡️ Encargado
            </button>
          </div>

          <div className="lr-divider" />

          {/* Badge de contexto */}
          <div className="lr-fadeUp-1" style={{ marginBottom: "18px" }}>
            <span className={`lr-role-badge ${esAdmin ? "lr-role-admin" : "lr-role-alumno"}`}>
              <span style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: esAdmin ? "#a78bfa" : "#06b6d4",
                boxShadow: `0 0 6px 2px ${esAdmin ? "rgba(139,92,246,0.5)" : "rgba(6,182,212,0.5)"}`,
              }} />
              {esAdmin ? "Acceso de encargado" : "Acceso de alumno · SIGART"}
            </span>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Usuario */}
            <div className="lr-fadeUp-2" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{
                fontSize: "11px", fontWeight: 500, color: "#6b7280",
                letterSpacing: "0.07em", textTransform: "uppercase",
              }}>
                {esAdmin ? "Usuario de encargado" : "Matrícula o usuario"}
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => { setUsername(e.target.value); setErrors(p => ({...p, username:""})); setApiError(""); }}
                placeholder={esAdmin ? "encargado" : "Ej. 2210034"}
                className={`lr-input ${errors.username ? "lr-err" : ""}`}
                disabled={cargando}
              />
              {errors.username && (
                <span style={{ color: "#f87171", fontSize: "11px" }}>{errors.username}</span>
              )}
            </div>

            {/* Contraseña */}
            <div className="lr-fadeUp-3" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{
                fontSize: "11px", fontWeight: 500, color: "#6b7280",
                letterSpacing: "0.07em", textTransform: "uppercase",
              }}>
                Contraseña
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({...p, password:""})); setApiError(""); }}
                placeholder="••••••••"
                className={`lr-input ${errors.password ? "lr-err" : ""}`}
                disabled={cargando}
              />
              {errors.password && (
                <span style={{ color: "#f87171", fontSize: "11px" }}>{errors.password}</span>
              )}
            </div>

            {/* Error de API */}
            {apiError && (
              <div style={{
                background: "rgba(220,38,38,0.09)",
                border: "1px solid rgba(220,38,38,0.24)",
                borderRadius: "10px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <span style={{ fontSize: "14px" }}>⚠️</span>
                <span style={{ color: "#fca5a5", fontSize: "13px" }}>{apiError}</span>
              </div>
            )}

            {/* Botón */}
            <div className="lr-fadeUp-4" style={{ marginTop: "4px" }}>
              <button type="submit" disabled={cargando} className="lr-btn"
                style={esAdmin ? {
                  background: "#7c3aed",
                  boxShadow: "0 4px 18px rgba(124,58,237,.35)",
                } : {}}
              >
                {cargando ? (
                  <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                    <svg style={{ width:"16px", height:"16px", animation:"lr-spin 0.8s linear infinite" }}
                      fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity:.25 }} />
                      <path fill="currentColor" style={{ opacity:.75 }} d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {esAdmin ? "Verificando acceso..." : "Autenticando con SIGART..."}
                  </span>
                ) : (
                  esAdmin ? "Entrar al panel" : "Registrar acceso"
                )}
              </button>
            </div>
          </form>

          {/* Pie */}
          <p style={{
            marginTop: "22px",
            textAlign: "center",
            fontSize: "11px",
            color: "#1e293b",
            letterSpacing: "0.03em",
          }}>
            CECyTEM · Sistema de Control de Sala de Cómputo
          </p>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LabRouter — componente raíz que orquesta todo
// ─────────────────────────────────────────────────────────────────────────────
export default function LabRouter() {
  // sesión guardada en sessionStorage (se borra al cerrar la pestaña)
  const [sesion, setSesion] = useState(() => {
    try {
      const raw = window.sessionStorage.getItem("labSesion");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const guardarSesion = (datos) => {
    try { window.sessionStorage.setItem("labSesion", JSON.stringify(datos)); } catch {}
    setSesion(datos);
  };

  const cerrarSesion = () => {
    try { window.sessionStorage.removeItem("labSesion"); } catch {}
    setSesion(null);
  };

  // ── Sin sesión → Login ────────────────────────────────────────────────────
  if (!sesion) {
    return <LoginGate onSuccess={guardarSesion} />;
  }

  // ── Sesión de ADMIN → Panel del encargado ─────────────────────────────────
  if (sesion.rol === ROL.ADMIN) {
    return (
      <div style={{ position: "relative" }}>
        {/* Botón flotante de cierre de sesión */}
        <button
          onClick={cerrarSesion}
          title="Cerrar sesión de encargado"
          style={{
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 14px",
            borderRadius: "10px",
            background: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(139,92,246,0.35)",
            color: "#c4b5fd",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(2,8,18,0.40)",
            transition: "background .18s, border-color .18s",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = "rgba(124,58,237,0.18)";
            e.currentTarget.style.borderColor = "rgba(139,92,246,0.60)";
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = "rgba(15,23,42,0.85)";
            e.currentTarget.style.borderColor = "rgba(139,92,246,0.35)";
          }}
        >
          <svg style={{ width:"13px", height:"13px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Salir · {sesion.nombre}
        </button>

        <PanelEncargado />
      </div>
    );
  }

  // ── Sesión de ALUMNO → Kiosko ─────────────────────────────────────────────
  return (
    <div style={{ position: "relative" }}>
      {/* Botón flotante de cierre de sesión del alumno (opcional, discreto) */}
      <button
        onClick={cerrarSesion}
        title="Volver a la pantalla de inicio"
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 9999,
          padding: "6px 12px",
          borderRadius: "10px",
          background: "rgba(5,20,30,0.75)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(6,182,212,0.20)",
          color: "#334155",
          fontSize: "11px",
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          transition: "color .18s, border-color .18s",
        }}
        onMouseOver={e => { e.currentTarget.style.color="#64748b"; e.currentTarget.style.borderColor="rgba(6,182,212,0.40)"; }}
        onMouseOut={e  => { e.currentTarget.style.color="#334155"; e.currentTarget.style.borderColor="rgba(6,182,212,0.20)"; }}
      >
        ← Cambiar sesión
      </button>

      <KioskoAlumno sesionAlumno={sesion} />
    </div>
  );
}