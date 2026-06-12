// src/components/Computo/KioskoAlumno.jsx
import { useState } from "react";

const PC_STATION = "PC-01"; // Cambiar por computadora según corresponda

export default function KioskoAlumno() {
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors = {};
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
    console.log("📋 Registro de acceso enviado:", {
      estacion: PC_STATION,
      matricula: matricula.trim(),
      timestamp: new Date().toISOString(),
    });
    setSubmitted(true);
  };

  const handleReset = () => {
    setMatricula("");
    setPassword("");
    setErrors({});
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

        {/* Banner de estación fija */}
        <div className="w-full flex items-center justify-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-5 py-3">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)] shrink-0" />
          <span className="text-slate-300 text-sm font-medium">
            Equipo asignado:&nbsp;
            <span className="text-cyan-300 font-bold tracking-widest">{PC_STATION}</span>
          </span>
        </div>

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
                <p className="text-slate-500 text-xs mt-1">Estación: {PC_STATION}</p>
              </div>
              <button
                onClick={handleReset}
                className="mt-2 px-5 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors"
              >
                Nuevo registro
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

              {/* Botón de envío */}
              <button
                type="submit"
                className="mt-1 w-full bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold py-3 rounded-lg text-sm tracking-wide transition-colors shadow-lg shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Registrar Acceso
              </button>
            </form>
          )}
        </div>

        {/* Pie */}
        <p className="text-slate-600 text-xs text-center">
          CECyTEM · Sistema de Control de Sala de Cómputo
        </p>
      </div>
    </div>
  );
}