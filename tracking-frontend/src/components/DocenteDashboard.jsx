import { useState, useEffect, useCallback, useMemo } from "react";
import { Navbar } from './Navbar';
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ────────────────────────────────────────────────────────────────────────────
// UTILIDADES Y FUNCIONES PURAS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Determina si una actividad está bloqueada para edición
 * (más de 7 días pasada la fecha de vencimiento)
 */
function isLocked(fechaVencimiento) {
  if (!fechaVencimiento) return false;
  const venc = new Date(fechaVencimiento);
  const now = new Date();
  return (now - venc) / (1000 * 60 * 60 * 24) > 7;
}

/**
 * Extrae el nombre real de la materia desde respuesta del backend
 */
function extractNombreMateria(asignacion) {
  if (!asignacion) return "Materia";
  return (
    asignacion.nombre_materia ||
    asignacion.materia_nombre ||
    asignacion.materia?.nombre ||
    asignacion.materia?.clave ||
    (typeof asignacion.materia === 'object' ? "Asignación Académica" : `Materia (ID: ${asignacion.materia})`)
  );
}

/**
 * Extrae el nombre real del grupo
 */
function extractNombreGrupo(asignacion) {
  if (!asignacion) return "Grupo";
  return (
    asignacion.nombre_grupo ||
    asignacion.detalle_grupo ||
    asignacion.grupo_nombre ||
    asignacion.grupo?.nombre ||
    asignacion.grupo?.codigo ||
    `Grupo: ${asignacion.grupo}`
  );
}

/**
 * Extrae el nombre del aula/salón
 */
function extractAula(asignacion) {
  if (!asignacion) return "Por asignar";
  return asignacion.aula_nombre || asignacion.salon || asignacion.aula || "Por asignar";
}

/**
 * Normaliza respuestas del backend para garantizar arrays
 */
function normalizeArrayResponse(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  
  return (
    data.asignaciones ||
    data.results ||
    data.data ||
    (Array.isArray(data.asignacion) ? data.asignacion : [])
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: DOCENTE DASHBOARD
// ────────────────────────────────────────────────────────────────────────────

export default function DocenteDashboard() {
  const { user } = useAuth();
  
  // Estado de datos
  const [asignaciones, setAsignaciones] = useState([]);
  const [selectedAsignacion, setSelectedAsignacion] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  
  // Estado de UI
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. CARGAR ASIGNACIONES DEL DOCENTE
  // ──────────────────────────────────────────────────────────────────────────
  
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingDashboard(true);
      setError(null);
      
      const res = await api.get("/academico/docentes/dashboard");
      const dataAsignaciones = normalizeArrayResponse(res.data);
      
      console.log("🔍 [DocenteDashboard] Respuesta del backend:", res.data);
      
      setAsignaciones(dataAsignaciones);
      
      // Si existe una asignación seleccionada, actualizarla
      if (selectedAsignacion) {
        const updated = dataAsignaciones.find(a => a.id === selectedAsignacion.id);
        if (updated) {
          setSelectedAsignacion(updated);
        }
      }
    } catch (err) {
      console.error("❌ Error al cargar dashboard:", err);
      setError("No se pudieron cargar tus asignaciones. Intenta recargar la página.");
    } finally {
      setLoadingDashboard(false);
    }
  }, [selectedAsignacion]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. CARGAR DETALLES DE LA ASIGNACIÓN SELECCIONADA (ACTIVIDADES + ALUMNOS)
  // ──────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (!selectedAsignacion?.id) {
      setActividades([]);
      setAlumnos([]);
      return;
    }

    const fetchDetallesMateria = async () => {
      try {
        setLoadingDetalles(true);
        setError(null);
        
        // Peticiones paralelas
        const [resActividades, resAlumnos] = await Promise.all([
          api.get(`/seguimiento/actividades/?asignacion=${selectedAsignacion.id}`),
          api.get(`/academico/alumnos/?asignacion=${selectedAsignacion.id}`)
            .catch(err => {
              console.warn("⚠️ Error al cargar alumnos, usando datos de respaldo:", err);
              return { data: [] };
            })
        ]);

        // Normalizar actividades
        const listaActividades = normalizeArrayResponse(resActividades.data);
        setActividades(listaActividades);
        
        // Normalizar alumnos (con respaldo en datos de asignación)
        let listaAlumnos = normalizeArrayResponse(resAlumnos.data);
        if (listaAlumnos.length === 0) {
          listaAlumnos = selectedAsignacion.alumnos || 
                         selectedAsignacion.grupo?.alumnos || 
                         [];
        }
        setAlumnos(listaAlumnos);
        
        console.log("✅ [DetallesMateria] Actividades:", listaActividades);
        console.log("✅ [DetallesMateria] Alumnos:", listaAlumnos);
        
      } catch (err) {
        console.error("❌ Error al cargar detalles:", err);
        setError("No se pudieron cargar los detalles de esta materia.");
      } finally {
        setLoadingDetalles(false);
      }
    };

    fetchDetallesMateria();
  }, [selectedAsignacion]);

  // ──────────────────────────────────────────────────────────────────────────
  // 3. FILTRADO DEFENSIVO DE LA BARRA DE BÚSQUEDA
  // ──────────────────────────────────────────────────────────────────────────
  
  const filteredAsignaciones = useMemo(() => {
    return asignaciones.filter(a => {
      if (!a) return false;
      
      const query = String(searchQuery).toLowerCase();
      
      const textoMateria = String(extractNombreMateria(a)).toLowerCase();
      const textoGrupo = String(extractNombreGrupo(a)).toLowerCase();
      const textoAula = String(extractAula(a)).toLowerCase();

      return (
        textoMateria.includes(query) ||
        textoGrupo.includes(query) ||
        textoAula.includes(query)
      );
    });
  }, [asignaciones, searchQuery]);

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div 
      className="min-h-screen text-gray-100 flex flex-col" 
      style={{ 
        backgroundColor: "#06020a",
        backgroundImage: "radial-gradient(circle at 80% 20%, rgba(88,28,135,0.08) 0%, transparent 50%)"
      }}
    >
      <Navbar />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-70px)] overflow-hidden">
        
        {/* ────── PANEL IZQUIERDO: SELECCIÓN DE MATERIAS (4 cols) ────── */}
        <aside className="lg:col-span-4 flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Encabezado y Buscador */}
          <div className="flex flex-col gap-3 sticky top-0 z-10 bg-gradient-to-b from-[#06020a] via-[#06020a] to-transparent pb-2">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-gray-100 via-gray-300 to-purple-300 bg-clip-text text-transparent">
                Bienvenido, {user?.nombre || user?.username || "Docente"}
              </h1>
              <p className="text-xs text-gray-500">
                {loadingDashboard ? "Cargando..." : `${asignaciones.length} ${asignaciones.length === 1 ? "asignación" : "asignaciones"} activa${asignaciones.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Buscador */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-purple-400 text-xs">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Buscar materia, grupo o aula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-purple-950/10 border border-purple-900/30 rounded-xl pl-8 pr-4 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-900/20 transition-all"
              />
            </div>
          </div>

          {/* Contenedor de Tarjetas */}
          {loadingDashboard ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12">
                <div className="animate-spin mb-3 text-purple-400 text-2xl">⚙️</div>
                <p className="text-xs text-gray-500">Cargando tus clases del CECyTEM...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12 p-4 border border-red-900/20 rounded-xl bg-red-950/5">
                <p className="text-xs text-red-400">⚠️ {error}</p>
              </div>
            </div>
          ) : filteredAsignaciones.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12 p-4 border border-dashed border-purple-950/40 rounded-xl">
                <p className="text-xs text-gray-600 italic">
                  {searchQuery ? "Ninguna clase coincide con tu búsqueda" : "Ninguna asignación disponible"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredAsignaciones.map((asignacion) => (
                <ClassroomCard
                  key={asignacion.id}
                  asignacion={asignacion}
                  isSelected={selectedAsignacion?.id === asignacion.id}
                  onClick={() => setSelectedAsignacion(asignacion)}
                  actividadesCount={asignacion.actividades_count || 0}
                />
              ))}
            </div>
          )}
        </aside>

        {/* ────── PANEL DERECHO: ESPACIO DE TRABAJO DINÁMICO (8 cols) ────── */}
        <section className="lg:col-span-8 bg-purple-950/5 border border-purple-900/10 rounded-2xl p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
          
          {selectedAsignacion ? (
            <div className="flex flex-col gap-6 h-full">
              
              {/* ──── CABECERA DEL GRUPO SELECCIONADO ──── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-950/40 pb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-950/40 px-2.5 py-1 rounded-md border border-purple-900/30">
                      Clase Seleccionada
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      ID: {selectedAsignacion.id}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-gray-100 leading-tight">
                    {extractNombreMateria(selectedAsignacion)}
                  </h2>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>
                      👥 Grupo: <strong className="text-purple-300 font-semibold">{extractNombreGrupo(selectedAsignacion)}</strong>
                    </span>
                    <span>
                      📍 Aula: <strong className="text-purple-300 font-semibold">{extractAula(selectedAsignacion)}</strong>
                    </span>
                    <span>
                      {selectedAsignacion.total_alumnos || alumnos.length || 0} alumnos
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-800 via-purple-700 to-purple-600 hover:from-purple-700 hover:via-purple-600 hover:to-purple-500 text-white font-bold text-xs rounded-xl transition-all duration-200 shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2 h-10 whitespace-nowrap active:scale-95"
                >
                  🚀 Nueva Actividad
                </button>
              </div>

              {/* ──── CONTENIDO DIVIDIDO: ACTIVIDADES Y ALUMNOS ──── */}
              {loadingDetalles ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin mb-2 text-purple-400 text-xl">⚙️</div>
                    <p className="text-xs text-gray-500">Cargando detalles...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden">
                  
                  {/* ──── COLUMNA A: HISTORIAL DE ACTIVIDADES ──── */}
                  <div className="flex flex-col gap-3 h-full min-h-0">
                    <div className="flex items-center justify-between sticky top-0 z-5 pb-2 bg-gradient-to-b from-purple-950/5 to-transparent">
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <span>📋 Planeaciones</span>
                      </h3>
                      <span className="bg-purple-900/30 text-purple-300 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold">
                        {actividades.length}
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2.5 custom-scrollbar">
                      {actividades.length === 0 ? (
                        <EmptyState 
                          icon="📚"
                          title="Sin planeaciones"
                          message="Crea la primera actividad para este grupo usando el botón de arriba."
                        />
                      ) : (
                        actividades.map((act) => (
                          <ActivityCard key={act.id} actividad={act} />
                        ))
                      )}
                    </div>
                  </div>

                  {/* ──── COLUMNA B: LISTADO DE ALUMNOS ──── */}
                  <div className="flex flex-col gap-3 h-full min-h-0">
                    <div className="flex items-center justify-between sticky top-0 z-5 pb-2 bg-gradient-to-b from-purple-950/5 to-transparent">
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <span>👥 Alumnos Matriculados</span>
                      </h3>
                      <span className="bg-purple-900/30 text-purple-300 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold">
                        {alumnos.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-1.5 custom-scrollbar">
                      {alumnos.length === 0 ? (
                        <EmptyState 
                          icon="📋"
                          title="Sin alumnos"
                          message="No se encontraron alumnos matriculados en Control Escolar."
                        />
                      ) : (
                        alumnos.map((alu, index) => (
                          <StudentRow key={alu.id || index} alumno={alu} />
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          ) : (
            // Empty State cuando no hay clase seleccionada
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="mb-4 text-5xl animate-bounce">🏫</div>
              <h3 className="text-base font-black text-gray-300 mb-2">Panel de Control del Docente</h3>
              <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                Selecciona una de tus materias asignadas en la barra lateral para gestionar planeaciones, ver el listado de alumnos e ingresar actividades.
              </p>
              {asignaciones.length === 0 && (
                <div className="mt-6 p-4 border border-dashed border-purple-950/30 rounded-lg bg-purple-950/5">
                  <p className="text-[11px] text-gray-600 italic">
                    Parece que no tienes asignaciones aún. Contacta a Dirección.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* ────── MODAL DE NUEVA ACTIVIDAD ────── */}
      {showModal && selectedAsignacion && (
        <ModalNuevaActividad
          asignacion={selectedAsignacion}
          nombreMateria={extractNombreMateria(selectedAsignacion)}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            // Recargar actividades del grupo
            if (selectedAsignacion.id) {
              fetchDashboardData();
            }
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTE: TARJETA DE CLASE (ESTILO GOOGLE CLASSROOM)
// ────────────────────────────────────────────────────────────────────────────

function ClassroomCard({ asignacion, isSelected, onClick, actividadesCount }) {
  const nombreMateria = extractNombreMateria(asignacion);
  const nombreGrupo = extractNombreGrupo(asignacion);
  const aula = extractAula(asignacion);
  const totalAlumnos = asignacion.total_alumnos || 0;
  const tieneActividades = actividadesCount > 0;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      className={`group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 flex flex-col border backdrop-blur-sm ${
        isSelected 
          ? "ring-2 ring-purple-500 border-purple-500/30 shadow-lg shadow-purple-950/50 bg-gradient-to-br from-purple-950/40 to-purple-900/20" 
          : "border-purple-900/20 hover:border-purple-800/40 bg-purple-950/10 hover:bg-purple-950/15"
      }`}
    >
      {/* Encabezado: Materia y Grupo */}
      <div className="p-3.5 bg-gradient-to-r from-purple-900/30 via-purple-950/20 to-transparent border-b border-purple-950/40">
        <h3 
          className="font-black text-gray-200 text-xs tracking-tight truncate pr-4" 
          title={nombreMateria}
        >
          {nombreMateria}
        </h3>
        <p className="text-[11px] text-purple-400 mt-1 font-semibold">
          Gr. {nombreGrupo}
        </p>
      </div>

      {/* Cuerpo: Info de Aula y Alumnos */}
      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5 bg-black/10 text-[11px]">
        <div className="flex items-center justify-between text-gray-400">
          <span>📍 {aula}</span>
          <span className="text-purple-400 font-mono font-medium">{totalAlumnos} 👥</span>
        </div>

        {/* Indicador de Actividades */}
        <div className="pt-2.5 border-t border-purple-950/20 flex items-center justify-between">
          {tieneActividades ? (
            <span className="text-[10px] text-green-400/80 font-medium">
              ✓ Activa ({actividadesCount})
            </span>
          ) : (
            <span className="text-[10px] text-amber-500/80 italic font-medium">
              ⚠️ Requiere planeación
            </span>
          )}
          <span className="text-gray-600 text-xs group-hover:translate-x-1 transition-transform duration-200">→</span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTE: TARJETA DE ACTIVIDAD
// ────────────────────────────────────────────────────────────────────────────

function ActivityCard({ actividad }) {
  const isBlocked = isLocked(actividad.fecha_limite);
  const diasVencimiento = actividad.fecha_limite 
    ? Math.ceil((new Date(actividad.fecha_limite) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-3 bg-purple-950/10 border border-purple-900/20 rounded-lg hover:border-purple-800/40 hover:bg-purple-950/15 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xs font-bold text-gray-200 line-clamp-2 flex-1">
          📌 {actividad.titulo}
        </h4>
        <span className="text-[9px] px-1.5 py-0.5 bg-purple-900/40 text-purple-300 rounded font-mono shrink-0 whitespace-nowrap">
          S{actividad.semana}
        </span>
      </div>

      {actividad.descripcion && (
        <p className="text-[11px] text-gray-400 line-clamp-2 mb-2">
          {actividad.descripcion}
        </p>
      )}

      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <span>
          📅 {new Date(actividad.fecha_limite || "").toLocaleDateString('es-MX', {
            month: 'short',
            day: 'numeric'
          })}
        </span>
        {diasVencimiento !== null && (
          <span className={`font-semibold ${
            isBlocked 
              ? "text-red-400" 
              : diasVencimiento <= 3 
              ? "text-amber-400" 
              : "text-green-400"
          }`}>
            {isBlocked ? "🔒 Bloqueada" : diasVencimiento <= 0 ? "⏰ Hoy" : `${diasVencimiento}d`}
          </span>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTE: FILA DE ALUMNO
// ────────────────────────────────────────────────────────────────────────────

function StudentRow({ alumno }) {
  const nombreCompleto = 
    alumno.nombre_completo || 
    alumno.alumno_nombre || 
    `${alumno.nombre || ""} ${alumno.apellido || ""}`.trim() ||
    "Alumno sin nombre";
  
  const matricula = alumno.matricula || alumno.id || "Sin matrícula";

  return (
    <div className="p-2.5 bg-black/20 border border-purple-950/20 rounded-lg hover:bg-purple-950/10 hover:border-purple-900/40 transition-all group">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-300 font-medium truncate flex-1">
          {nombreCompleto}
        </span>
        <span className="text-[10px] font-mono text-gray-500 shrink-0 group-hover:text-purple-400 transition-colors">
          {matricula}
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTE: ESTADO VACÍO REUTILIZABLE
// ────────────────────────────────────────────────────────────────────────────

function EmptyState({ icon, title, message }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-purple-950/20 rounded-lg bg-purple-950/5">
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="text-xs font-bold text-gray-400 mb-1">{title}</h4>
      <p className="text-[11px] text-gray-500 leading-relaxed max-w-[150px]">
        {message}
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTE MODAL: NUEVA ACTIVIDAD
// ────────────────────────────────────────────────────────────────────────────

function ModalNuevaActividad({ asignacion, nombreMateria, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    semana: "1",
    fecha_limite: ""
  });
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorLocal(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorLocal(null);

    // Validaciones
    if (!formData.titulo.trim()) {
      setErrorLocal("El título de la actividad es obligatorio.");
      return;
    }
    if (!formData.fecha_limite) {
      setErrorLocal("Debes especificar una fecha límite.");
      return;
    }

    setEnviando(true);

    try {
      // Extraer el mes desde la fecha seleccionada
      const fechaSeleccionada = new Date(formData.fecha_limite + "T00:00:00");
      const numeroMes = fechaSeleccionada.getMonth() + 1;

      // CRÍTICO: Enviar tipos de datos correctos
      // El backend espera:
      // - semana: Integer (ej: 3)
      // - mes: Integer (ej: 5)
      // - asignacion: Integer ID
      const payload = {
        asignacion: typeof asignacion === 'object' ? asignacion.id : asignacion,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim() || "",
        semana: parseInt(formData.semana, 10),
        mes: numeroMes,
        fecha_limite: formData.fecha_limite
      };

      console.log("📤 [ModalNuevaActividad] Enviando payload:", payload);

      await api.post("/seguimiento/actividades/", payload);

      console.log("✅ [ModalNuevaActividad] Actividad creada exitosamente");
      onCreated();

    } catch (err) {
      console.error("❌ [ModalNuevaActividad] Error al crear actividad:", err);
      
      // Manejo de errores del backend
      let mensajeError = "No se pudo guardar la actividad. Intenta nuevamente.";
      
      if (err.response?.data) {
        const datos = err.response.data;
        
        if (typeof datos === 'object') {
          const errores = Object.entries(datos)
            .map(([campo, mensajes]) => {
              const msg = Array.isArray(mensajes) ? mensajes.join(", ") : mensajes;
              return `${campo}: ${msg}`;
            })
            .join("\n");
          mensajeError = errores || mensajeError;
        } else {
          mensajeError = String(datos);
        }
      }

      setErrorLocal(mensajeError);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-md rounded-2xl border border-purple-900/40 p-6 flex flex-col gap-4 shadow-2xl" 
        style={{ background: "#0c0618" }}
      >
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between border-b border-purple-950/40 pb-3">
          <div className="flex-1">
            <h3 className="text-sm font-black text-gray-200">Nueva Actividad</h3>
            <p className="text-[11px] text-purple-400 truncate mt-1">
              Materia: {nombreMateria}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-300 font-mono text-lg transition-colors ml-4 flex-shrink-0"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Mensajes de Error */}
        {errorLocal && (
          <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
            <p className="text-xs text-red-400 whitespace-pre-wrap">{errorLocal}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo: Título */}
          <div>
            <label className="block text-[10px] uppercase font-black text-gray-400 tracking-wider mb-2">
              Título de la Actividad *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Práctica 1: Modelado de Datos"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              className="w-full bg-purple-950/10 border border-purple-900/30 rounded-xl px-3 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-900/20 transition-all"
            />
          </div>

          {/* Campo: Descripción */}
          <div>
            <label className="block text-[10px] uppercase font-black text-gray-400 tracking-wider mb-2">
              Instrucciones o Criterios
            </label>
            <textarea
              rows="3"
              placeholder="Describe qué deben hacer los alumnos, criterios de evaluación, etc..."
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              className="w-full bg-purple-950/10 border border-purple-900/30 rounded-xl px-3 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-900/20 transition-all resize-none"
            />
          </div>

          {/* Campos: Semana y Fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-black text-gray-400 tracking-wider mb-2">
                Semana *
              </label>
              <select
                value={formData.semana}
                onChange={(e) => handleInputChange('semana', e.target.value)}
                className="w-full bg-purple-950/10 border border-purple-900/30 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-900/20 transition-all"
                style={{ colorScheme: 'dark' }}
              >
                {[1, 2, 3, 4, 5].map(s => (
                  <option key={s} value={s} className="bg-[#0c0618]">
                    Semana {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-gray-400 tracking-wider mb-2">
                Fecha Límite *
              </label>
              <input
                type="date"
                required
                value={formData.fecha_limite}
                onChange={(e) => handleInputChange('fecha_limite', e.target.value)}
                className="w-full bg-purple-950/10 border border-purple-900/30 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-900/20 transition-all"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-purple-950/20">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="px-4 py-2 text-gray-400 hover:text-gray-300 text-xs font-bold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-5 py-2 bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-700 hover:to-purple-500 disabled:from-purple-900 disabled:to-purple-900 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-950/40 transition-all duration-200 disabled:opacity-60 flex items-center gap-2"
            >
              {enviando ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  Publicando...
                </>
              ) : (
                <>
                  🚀 Publicar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}