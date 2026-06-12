// src/components/Computo/PanelEncargado.jsx
import { useState } from "react";

const ESTADOS = {
  LIBRE: "LIBRE",
  OCUPADO: "OCUPADO",
  MANTENIMIENTO: "MANTENIMIENTO",
};

const computadorasIniciales = [
  { id: "PC-01", estado: ESTADOS.OCUPADO,      alumno: "García López, Ana K." },
  { id: "PC-02", estado: ESTADOS.LIBRE,         alumno: null },
  { id: "PC-03", estado: ESTADOS.OCUPADO,       alumno: "Hernández Ruiz, Luis M." },
  { id: "PC-04", estado: ESTADOS.MANTENIMIENTO, alumno: null },
  { id: "PC-05", estado: ESTADOS.LIBRE,         alumno: null },
  { id: "PC-06", estado: ESTADOS.OCUPADO,       alumno: "Torres Vega, Sofía P." },
  { id: "PC-07", estado: ESTADOS.LIBRE,         alumno: null },
  { id: "PC-08", estado: ESTADOS.MANTENIMIENTO, alumno: null },
  { id: "PC-09", estado: ESTADOS.OCUPADO,       alumno: "Morales Cruz, Diego A." },
  { id: "PC-10", estado: ESTADOS.LIBRE,         alumno: null },
  { id: "PC-11", estado: ESTADOS.LIBRE,         alumno: null },
  { id: "PC-12", estado: ESTADOS.OCUPADO,       alumno: "Ramírez Soto, Valeria J." },
];

const estadoConfig = {
  [ESTADOS.LIBRE]: {
    bg: "bg-emerald-950/60",
    border: "border-emerald-600/50",
    badge: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    dot: "bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.55)]",
    label: "Libre",
  },
  [ESTADOS.OCUPADO]: {
    bg: "bg-rose-950/60",
    border: "border-rose-600/50",
    badge: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    dot: "bg-rose-400 shadow-[0_0_6px_2px_rgba(251,113,133,0.55)]",
    label: "Ocupado",
  },
  [ESTADOS.MANTENIMIENTO]: {
    bg: "bg-amber-950/60",
    border: "border-amber-600/50",
    badge: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    dot: "bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.55)]",
    label: "Mantenimiento",
  },
};

function StatBadge({ count, label, color }) {
  return (
    <div className={`flex flex-col items-center px-5 py-3 rounded-xl border ${color}`}>
      <span className="text-2xl font-bold leading-none">{count}</span>
      <span className="text-xs mt-1 font-medium uppercase tracking-wide opacity-80">{label}</span>
    </div>
  );
}

export default function PanelEncargado() {
  const [computadoras, setComputadoras] = useState(computadorasIniciales);

  const liberar = (id) => {
    setComputadoras((prev) =>
      prev.map((pc) =>
        pc.id === id ? { ...pc, estado: ESTADOS.LIBRE, alumno: null } : pc
      )
    );
    console.log(`🖥️ Equipo ${id} liberado a las ${new Date().toLocaleTimeString()}`);
  };

  const conteo = {
    libres: computadoras.filter((pc) => pc.estado === ESTADOS.LIBRE).length,
    ocupadas: computadoras.filter((pc) => pc.estado === ESTADOS.OCUPADO).length,
    mantenimiento: computadoras.filter((pc) => pc.estado === ESTADOS.MANTENIMIENTO).length,
  };

  const ahora = new Date().toLocaleString("es-MX", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Fondo degradado sutil */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* Encabezado */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-px w-8 bg-cyan-500/60" />
              <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase">CECyTEM Toluca II</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de Control</h1>
            <p className="text-slate-400 text-sm mt-0.5">Sala de Cómputo · Monitoreo en tiempo real</p>
          </div>
          <p className="text-slate-500 text-xs font-mono capitalize">{ahora}</p>
        </header>

        {/* Estadísticas */}
        <div className="flex flex-wrap gap-3">
          <StatBadge
            count={conteo.libres}
            label="Libres"
            color="bg-emerald-950/40 border-emerald-700/50 text-emerald-300"
          />
          <StatBadge
            count={conteo.ocupadas}
            label="Ocupados"
            color="bg-rose-950/40 border-rose-700/50 text-rose-300"
          />
          <StatBadge
            count={conteo.mantenimiento}
            label="Mantenimiento"
            color="bg-amber-950/40 border-amber-700/50 text-amber-300"
          />
          <StatBadge
            count={computadoras.length}
            label="Total"
            color="bg-slate-800/60 border-slate-600/50 text-slate-300"
          />
        </div>

        {/* Separador con leyenda */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-800" />
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {Object.values(ESTADOS).map((estado) => {
              const cfg = estadoConfig[estado];
              return (
                <span key={estado} className="flex items-center gap-1.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              );
            })}
          </div>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* Grid de computadoras */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {computadoras.map((pc) => {
            const cfg = estadoConfig[pc.estado];
            return (
              <div
                key={pc.id}
                className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300`}
              >
                {/* Cabecera tarjeta */}
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-sm tracking-wide">{pc.id}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>

                {/* Icono de monitor */}
                <div className="flex justify-center py-1">
                  <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                {/* Info según estado */}
                <div className="min-h-[2.5rem] flex flex-col justify-center">
                  {pc.estado === ESTADOS.OCUPADO && pc.alumno && (
                    <p className="text-rose-200/80 text-xs text-center leading-snug font-medium line-clamp-2">
                      {pc.alumno}
                    </p>
                  )}
                  {pc.estado === ESTADOS.LIBRE && (
                    <p className="text-emerald-400/60 text-xs text-center">Disponible</p>
                  )}
                  {pc.estado === ESTADOS.MANTENIMIENTO && (
                    <p className="text-amber-400/60 text-xs text-center">Fuera de servicio</p>
                  )}
                </div>

                {/* Botón liberar (solo OCUPADO) */}
                {pc.estado === ESTADOS.OCUPADO && (
                  <button
                    onClick={() => liberar(pc.id)}
                    className="mt-auto w-full text-xs font-semibold py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 active:bg-rose-500/50 text-rose-300 border border-rose-500/30 hover:border-rose-400/60 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  >
                    Liberar equipo
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Pie de página */}
        <footer className="text-center text-slate-700 text-xs mt-4 pb-2">
          CECyTEM · Panel de Encargado · Sistema de Sala de Cómputo
        </footer>
      </div>
    </div>
  );
}