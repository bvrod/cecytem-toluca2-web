// src/components/Computo/PanelEncargado.jsx
import { useState, useEffect } from "react";

const ESTADOS = {
  LIBRE: "LIBRE",
  OCUPADO: "OCUPADO",
  MANTENIMIENTO: "MANTENIMIENTO",
};

// Distribución inicial de la sala: 36 equipos, todos libres y sin datos falsos.
// Una vez que exista información guardada (storage compartido), esta lista ya no se usa.
const computadorasIniciales = Array.from({ length: 36 }, (_, i) => ({
  id: `PC-${String(i + 1).padStart(2, "0")}`,
  estado: ESTADOS.LIBRE,
  alumno: null,
  horaInicio: null,
  fecha: null,
}));

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

const tipoIncidenciaConfig = {
  SIN_INTERNET:  { label: "Sin internet",         color: "bg-sky-500/15 text-sky-300 border border-sky-500/30" },
  FALTA_MOUSE:   { label: "Falta mouse",          color: "bg-violet-500/15 text-violet-300 border border-violet-500/30" },
  FALTA_TECLADO: { label: "Falta teclado",        color: "bg-violet-500/15 text-violet-300 border border-violet-500/30" },
  NO_ENCIENDE:   { label: "No enciende",          color: "bg-rose-500/15 text-rose-300 border border-rose-500/30" },
  PANTALLA:      { label: "Problema de pantalla", color: "bg-rose-500/15 text-rose-300 border border-rose-500/30" },
  AUDIO:         { label: "Sin audio",            color: "bg-amber-500/15 text-amber-300 border border-amber-500/30" },
  SUCIO:         { label: "Equipo sucio",         color: "bg-lime-500/15 text-lime-300 border border-lime-500/30" },
  OTRO:          { label: "Otro",                 color: "bg-slate-500/15 text-slate-300 border border-slate-500/30" },
};

// ---------------------- Utilidades de fecha/hora ----------------------

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

function aMinutos(horaTexto) {
  if (!horaTexto) return null;
  // Acepta tanto "07:14" (24h) como "07:14 a.m." / "07:14 p.m." (12h, es-MX).
  const match = horaTexto.trim().match(/^(\d{1,2}):(\d{2})\s*([ap]\.?\s?m\.?)?$/i);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const sufijo = match[3]?.toLowerCase().replace(/\./g, "").replace(/\s/g, "");

  if (sufijo === "pm" && h < 12) h += 12;
  if (sufijo === "am" && h === 12) h = 0;

  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function duracion(inicio, fin) {
  const inicioMin = aMinutos(inicio);
  const finMin = aMinutos(fin);
  if (inicioMin === null || finMin === null) return "—";
  let diff = finMin - inicioMin;
  if (diff < 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function fechaLegible(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
}

// ---------------------- Almacenamiento compartido ----------------------
// La misma información (computadoras, incidencias, historial) se comparte
// con el Kiosko del alumno mediante localStorage del navegador, para que
// las horas de registro queden enlazadas entre ambas pantallas.
// Nota: localStorage solo sincroniza entre pestañas/ventanas del MISMO
// navegador y MISMO origen (dominio). Si el Kiosko y el Panel se abren en
// dispositivos distintos, esto no sincronizará entre sí; en ese caso se
// necesitaría un backend real (API + base de datos) en vez de localStorage.

const PREFIJO_CLAVE = "salaComputo:";

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

// ---------------------- Componentes auxiliares ----------------------

function StatBadge({ count, label, color }) {
  return (
    <div className={`flex flex-col items-center px-5 py-3 rounded-xl border ${color}`}>
      <span className="text-2xl font-bold leading-none">{count}</span>
      <span className="text-xs mt-1 font-medium uppercase tracking-wide opacity-80">{label}</span>
    </div>
  );
}

function IconoGrid() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );
}

function IconoAlerta() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M12 9v3.75m0 3.75h.008M10.34 3.59L1.82 18a1.5 1.5 0 001.3 2.25h17.76a1.5 1.5 0 001.3-2.25L13.66 3.59a1.5 1.5 0 00-2.6 0z" />
    </svg>
  );
}

function IconoReloj() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M12 7v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconoRefresh() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function IconoMas() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function IconoBasura() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

// ---------------------- Componente principal ----------------------

export default function PanelEncargado() {
  const [computadoras, setComputadoras] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [vista, setVista] = useState("panel");
  const [filtroIncidencias, setFiltroIncidencias] = useState("pendientes");
  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargarTodo = () => {
    setCargando(true);

    let comps = cargarDato("computadoras");
    if (!comps) {
      comps = computadorasIniciales;
      guardarDato("computadoras", comps);
    }

    let incs = cargarDato("incidencias");
    if (!incs) {
      incs = [];
      guardarDato("incidencias", incs);
    }

    let hist = cargarDato("historial");
    if (!hist) {
      hist = [];
      guardarDato("historial", hist);
    }

    setComputadoras(comps);
    setIncidencias(incs);
    setHistorial(hist);
    setCargando(false);
  };

  useEffect(() => {
    cargarTodo();

    // Si el Kiosko (en otra pestaña del mismo navegador) actualiza
    // localStorage, refrescamos el panel automáticamente.
    const alCambiarStorage = (e) => {
      if (e.key && e.key.startsWith(PREFIJO_CLAVE)) {
        cargarTodo();
      }
    };
    window.addEventListener("storage", alCambiarStorage);
    return () => window.removeEventListener("storage", alCambiarStorage);
  }, []);

  const liberar = (id) => {
    const pc = computadoras.find((p) => p.id === id);

    let nuevoHistorial = historial;
    if (pc?.alumno) {
      const registro = {
        id: Date.now(),
        pcId: pc.id,
        alumno: pc.alumno,
        fecha: pc.fecha || fechaActualISO(),
        horaInicio: pc.horaInicio,
        horaFin: horaActual(),
      };
      nuevoHistorial = [registro, ...historial];
    }

    const nuevasComputadoras = computadoras.map((p) =>
      p.id === id ? { ...p, estado: ESTADOS.LIBRE, alumno: null, horaInicio: null, fecha: null } : p
    );

    setComputadoras(nuevasComputadoras);
    setHistorial(nuevoHistorial);
    guardarDato("computadoras", nuevasComputadoras);
    if (nuevoHistorial !== historial) guardarDato("historial", nuevoHistorial);
  };

  const enviarAMantenimiento = (id) => {
    const nuevasComputadoras = computadoras.map((p) =>
      p.id === id ? { ...p, estado: ESTADOS.MANTENIMIENTO, alumno: null, horaInicio: null, fecha: null } : p
    );
    setComputadoras(nuevasComputadoras);
    guardarDato("computadoras", nuevasComputadoras);
  };

  const reactivarEquipo = (id) => {
    const nuevasComputadoras = computadoras.map((p) =>
      p.id === id ? { ...p, estado: ESTADOS.LIBRE } : p
    );
    setComputadoras(nuevasComputadoras);
    guardarDato("computadoras", nuevasComputadoras);
  };

  const agregarComputadora = () => {
    const numeros = computadoras
      .map((p) => parseInt(p.id.replace("PC-", ""), 10))
      .filter((n) => !isNaN(n));
    const siguiente = (numeros.length ? Math.max(...numeros) : 0) + 1;
    const nuevoId = `PC-${String(siguiente).padStart(2, "0")}`;

    const nuevaComputadora = {
      id: nuevoId,
      estado: ESTADOS.LIBRE,
      alumno: null,
      horaInicio: null,
      fecha: null,
    };

    const nuevasComputadoras = [...computadoras, nuevaComputadora];
    setComputadoras(nuevasComputadoras);
    guardarDato("computadoras", nuevasComputadoras);
  };

  const eliminarComputadora = (id) => {
    const pc = computadoras.find((p) => p.id === id);
    if (!pc) return;

    const confirmar = window.confirm(
      pc.estado === ESTADOS.OCUPADO
        ? `${id} está ocupado por ${pc.alumno}. ¿Eliminar este equipo de todas formas? Se guardará su sesión en el historial.`
        : `¿Eliminar el equipo ${id}? Esta acción no se puede deshacer.`
    );
    if (!confirmar) return;

    let nuevoHistorial = historial;
    if (pc.estado === ESTADOS.OCUPADO && pc.alumno) {
      const registro = {
        id: Date.now(),
        pcId: pc.id,
        alumno: pc.alumno,
        fecha: pc.fecha || fechaActualISO(),
        horaInicio: pc.horaInicio,
        horaFin: horaActual(),
      };
      nuevoHistorial = [registro, ...historial];
      setHistorial(nuevoHistorial);
      guardarDato("historial", nuevoHistorial);
    }

    const nuevasComputadoras = computadoras.filter((p) => p.id !== id);
    setComputadoras(nuevasComputadoras);
    guardarDato("computadoras", nuevasComputadoras);
  };

  const toggleIncidencia = (id) => {
    const nuevasIncidencias = incidencias.map((inc) =>
      inc.id === id
        ? { ...inc, estado: inc.estado === "pendiente" ? "resuelto" : "pendiente" }
        : inc
    );
    setIncidencias(nuevasIncidencias);
    guardarDato("incidencias", nuevasIncidencias);
  };

  const conteo = {
    libres: computadoras.filter((pc) => pc.estado === ESTADOS.LIBRE).length,
    ocupadas: computadoras.filter((pc) => pc.estado === ESTADOS.OCUPADO).length,
    mantenimiento: computadoras.filter((pc) => pc.estado === ESTADOS.MANTENIMIENTO).length,
  };

  const incidenciasPendientes = incidencias.filter((i) => i.estado === "pendiente").length;

  const incidenciasFiltradas = [...incidencias]
    .sort((a, b) => (a.estado === b.estado ? 0 : a.estado === "pendiente" ? -1 : 1))
    .filter((inc) => {
      if (filtroIncidencias === "pendientes") return inc.estado === "pendiente";
      if (filtroIncidencias === "resueltas") return inc.estado === "resuelto";
      return true;
    });

  const historialFiltrado = historial.filter((s) => {
    const q = busquedaHistorial.trim().toLowerCase();
    if (!q) return true;
    return (s.alumno ?? "").toLowerCase().includes(q) || (s.pcId ?? "").toLowerCase().includes(q);
  });

  const ahora = new Date().toLocaleString("es-MX", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const pestañas = [
    { key: "panel", label: "Panel general", icono: <IconoGrid /> },
    { key: "incidencias", label: "Incidencias", icono: <IconoAlerta />, contador: incidenciasPendientes },
    { key: "historial", label: "Historial de sesiones", icono: <IconoReloj /> },
  ];

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
          <div className="flex items-center gap-3">
            <p className="text-slate-500 text-xs font-mono capitalize">{ahora}</p>
            <button
              onClick={cargarTodo}
              title="Actualizar datos"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
            >
              <IconoRefresh />
              Actualizar
            </button>
          </div>
        </header>

        {cargando ? (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
            Cargando información de la sala...
          </div>
        ) : (
          <>
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
                count={incidenciasPendientes}
                label="Incidencias"
                color="bg-violet-950/40 border-violet-700/50 text-violet-300"
              />
              <StatBadge
                count={computadoras.length}
                label="Total"
                color="bg-slate-800/60 border-slate-600/50 text-slate-300"
              />
            </div>

            {/* Navegación de secciones */}
            <nav className="flex gap-1 border-b border-slate-800 overflow-x-auto">
              {pestañas.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setVista(tab.key)}
                  className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 -mb-px border-b-2 whitespace-nowrap transition-colors ${
                    vista === tab.key
                      ? "border-cyan-400 text-white"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab.icono}
                  {tab.label}
                  {typeof tab.contador === "number" && tab.contador > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30">
                      {tab.contador}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* ---------------------- VISTA: PANEL GENERAL ---------------------- */}
            {vista === "panel" && (
              <>
                {/* Leyenda + acción de agregar equipo */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
                  <div className="h-px flex-1 bg-slate-800 hidden sm:block" />
                  <button
                    onClick={agregarComputadora}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  >
                    <IconoMas />
                    Agregar computadora
                  </button>
                </div>

                {/* Grid de computadoras */}
                {computadoras.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-16 border border-dashed border-slate-800 rounded-2xl">
                    No hay computadoras registradas. Usa "Agregar computadora" para empezar.
                  </div>
                ) : (
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
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </span>
                              <button
                                onClick={() => eliminarComputadora(pc.id)}
                                title={`Eliminar ${pc.id}`}
                                className="text-slate-500 hover:text-rose-400 transition-colors p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                              >
                                <IconoBasura />
                              </button>
                            </div>
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
                              <>
                                <p className="text-rose-200/80 text-xs text-center leading-snug font-medium line-clamp-2">
                                  {pc.alumno}
                                </p>
                                {pc.horaInicio && (
                                  <p className="text-rose-400/50 text-[11px] text-center mt-0.5 font-mono">
                                    Registrado a las {pc.horaInicio}
                                  </p>
                                )}
                              </>
                            )}
                            {pc.estado === ESTADOS.LIBRE && (
                              <p className="text-emerald-400/60 text-xs text-center">Disponible</p>
                            )}
                            {pc.estado === ESTADOS.MANTENIMIENTO && (
                              <p className="text-amber-400/60 text-xs text-center">Fuera de servicio</p>
                            )}
                          </div>

                          {/* Acciones según estado */}
                          {pc.estado === ESTADOS.OCUPADO && (
                            <button
                              onClick={() => liberar(pc.id)}
                              className="mt-auto w-full text-xs font-semibold py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 active:bg-rose-500/50 text-rose-300 border border-rose-500/30 hover:border-rose-400/60 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                            >
                              Liberar equipo
                            </button>
                          )}

                          {pc.estado === ESTADOS.MANTENIMIENTO && (
                            <button
                              onClick={() => reactivarEquipo(pc.id)}
                              className="mt-auto w-full text-xs font-semibold py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 active:bg-emerald-500/50 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/60 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                              Marcar como disponible
                            </button>
                          )}

                          {pc.estado === ESTADOS.LIBRE && (
                            <button
                              onClick={() => enviarAMantenimiento(pc.id)}
                              className="mt-auto w-full text-xs font-medium py-2 px-3 rounded-lg bg-slate-800/40 hover:bg-amber-500/15 text-slate-500 hover:text-amber-300 border border-slate-700/50 hover:border-amber-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                            >
                              Enviar a mantenimiento
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ---------------------- VISTA: INCIDENCIAS ---------------------- */}
            {vista === "incidencias" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  {[
                    { key: "pendientes", label: `Pendientes (${incidenciasPendientes})` },
                    { key: "resueltas", label: "Resueltas" },
                    { key: "todas", label: "Todas" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFiltroIncidencias(f.key)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                        filtroIncidencias === f.key
                          ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                          : "bg-slate-900/60 text-slate-400 border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {incidenciasFiltradas.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-12 border border-dashed border-slate-800 rounded-2xl">
                    No hay incidencias {filtroIncidencias === "pendientes" ? "pendientes" : filtroIncidencias === "resueltas" ? "resueltas" : "registradas"}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incidenciasFiltradas.map((inc) => {
                      const tcfg = tipoIncidenciaConfig[inc.tipo] ?? tipoIncidenciaConfig.OTRO;
                      const resuelto = inc.estado === "resuelto";
                      return (
                        <div
                          key={inc.id}
                          className={`rounded-2xl border p-4 flex flex-col gap-3 ${
                            resuelto ? "bg-slate-900/40 border-slate-800" : "bg-slate-900/70 border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold text-sm">{inc.pcId}</span>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${tcfg.color}`}>
                                {tcfg.label}
                              </span>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              resuelto
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            }`}>
                              {resuelto ? "Resuelta" : "Pendiente"}
                            </span>
                          </div>

                          <p className="text-slate-300 text-sm leading-snug">{inc.descripcion}</p>

                          <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-1">
                            <span>
                              Reportó: <span className="text-slate-400">{inc.alumno}</span>
                            </span>
                            <span className="font-mono capitalize">{fechaLegible(inc.fecha)} · {inc.hora ?? "—"}</span>
                          </div>

                          <button
                            onClick={() => toggleIncidencia(inc.id)}
                            className={`w-full text-xs font-semibold py-2 px-3 rounded-lg border transition-all ${
                              resuelto
                                ? "bg-slate-800/60 hover:bg-slate-800 text-slate-400 border-slate-700"
                                : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            {resuelto ? "Reabrir incidencia" : "Marcar como resuelta"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------- VISTA: HISTORIAL DE SESIONES ---------------------- */}
            {vista === "historial" && (
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={busquedaHistorial}
                  onChange={(e) => setBusquedaHistorial(e.target.value)}
                  placeholder="Buscar por alumno o equipo (ej. PC-03)..."
                  className="w-full sm:w-80 bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50"
                />

                {historialFiltrado.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-12 border border-dashed border-slate-800 rounded-2xl">
                    Aún no hay sesiones registradas.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wide">
                          <th className="text-left font-semibold px-4 py-3">Equipo</th>
                          <th className="text-left font-semibold px-4 py-3">Alumno</th>
                          <th className="text-left font-semibold px-4 py-3">Fecha</th>
                          <th className="text-left font-semibold px-4 py-3">Entrada</th>
                          <th className="text-left font-semibold px-4 py-3">Salida</th>
                          <th className="text-left font-semibold px-4 py-3">Duración</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {historialFiltrado.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="px-4 py-3 font-bold text-white">{s.pcId}</td>
                            <td className="px-4 py-3 text-slate-300">{s.alumno}</td>
                            <td className="px-4 py-3 text-slate-500 capitalize">{fechaLegible(s.fecha)}</td>
                            <td className="px-4 py-3 font-mono text-cyan-300">{s.horaInicio ?? "—"}</td>
                            <td className="px-4 py-3 font-mono text-rose-300">{s.horaFin ?? "—"}</td>
                            <td className="px-4 py-3 text-slate-400">{duracion(s.horaInicio, s.horaFin)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Pie de página */}
        <footer className="text-center text-slate-700 text-xs mt-4 pb-2">
          CECyTEM · Panel de Encargado · Sistema de Sala de Cómputo
        </footer>
      </div>
    </div>
  );
}