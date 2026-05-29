// ─── siteData.js ─────────────────────────────────────────────
// CECyTEM Plantel Toluca II · Datos institucionales reales
// Actualizado con información verificada del plantel (Ciclo 2026)
// ─────────────────────────────────────────────────────────────

// Imágenes de carreras e instalaciones
import logistImg from "../imagenes/Logistica.png";
import dataImg from "../imagenes/Ciencia de Datos e Informacion.png";
import lab1 from "../imagenes/Sala de computo 1.1.jpeg";
import lab2 from "../imagenes/Sala de computo 1.2.jpeg";
import lab3 from "../imagenes/Sala de computo.jpeg";
import lib1 from "../imagenes/Toluca 5.4.jpeg";
import lib2 from "../imagenes/Toluca 3.1.jpeg";
import lib3 from "../imagenes/Toluca 3.2.jpeg";
import lib4 from "../imagenes/Toluca 3.9.jpeg";
import lib5 from "../imagenes/Toluca 3.6.jpeg";
import lib6 from "../imagenes/Toluca 4.6.jpeg";
import lib7 from "../imagenes/Toluca 4.9.jpeg";
import lib8 from "../imagenes/Toluca 5.3.jpeg";
import lib9 from "../imagenes/Toluca 5.5.jpeg";
import lib10 from "../imagenes/Toluca 5.6.jpeg";
import lib11 from "../imagenes/Toluca 5.7.jpeg";
import lib12 from "../imagenes/Toluca 5.8.jpeg";
import lib13 from "../imagenes/Toluca 5.9.jpeg";
import lib14 from "../imagenes/Toluca 6.jpeg";
import lib15 from "../imagenes/Toluca 6.1.jpeg";
import lib16 from "../imagenes/Toluca 6.4.jpeg";
import com1 from "../imagenes/Toluca 3.5.jpeg";
import com2 from "../imagenes/Toluca 4.6.jpeg";
import com3 from "../imagenes/Toluca 5.1.jpeg";
import com4 from "../imagenes/Toluca 3.1.jpeg";
import com5 from "../imagenes/Actividad Deportiva.jpeg";
import com6 from "../imagenes/actividades.jpeg";
import com7 from "../imagenes/Deportes toluca 2.1.jpeg";
import com8 from "../imagenes/Deportes toluca 2.2.jpeg";
import com9 from "../imagenes/Deportes Toluca 2.3.jpeg";
import com10 from "../imagenes/Deportes toluca 2.4.jpeg";
import com11 from "../imagenes/Deportes Toluca 2.5.jpeg";
import com12 from "../imagenes/Deportes toluca 2.6.jpeg";
import com13 from "../imagenes/Deportes toluca 2.7.jpeg";
import com14 from "../imagenes/Deportes toluca 2.8.jpeg";
import com15 from "../imagenes/Deportes toluca 2.9.jpeg";
import com16 from "../imagenes/Deportes toluca 2.jpeg";
import com17 from "../imagenes/Deportes toluca 3.1.jpeg";
import com18 from "../imagenes/Deportes toluca 3.2.jpeg";
import com19 from "../imagenes/Deportes toluca 3.3.jpeg";
import com20 from "../imagenes/Deportes toluca 3.4.jpeg";
import com21 from "../imagenes/Deportes toluca 3.5.jpeg";
import com22 from "../imagenes/Deportes toluca 3.jpeg";
import alumA from "../imagenes/cecytem alumnos.jpeg";
import alumB from "../imagenes/cecytem alumnos 1.1.jpeg";
import cecytem5img from "../imagenes/Cecytem 1.5.jpeg";
// Documentos PDF
import protocoloConvivencia from "../Documents/01 PROTOCOLO PARA LA CONVIVENCIA ARMÓNICA DEL ESTUDIANTADO EN LOS PLANTELES FEDERALES DE EMS _250823 FINAL-1.pdf";
import normasConvivencia from "../Documents/01Normas de convivencia escolar.pdf";
import protocolosSeguridad from "../Documents/02 PROTOCOLOS DE SEGURIDAD PARA LOS PLANTELES FEDERALES _250823 FINAL.pdf";
import derechosDeberes from "../Documents/02Derechos y Deberes Alumnos Plantel Toluca II.pdf";
import formatoExprAviso from "../Documents/04 Formato Exprés de Aviso de Privacidad.pdf";
import anexoParticipacion from "../Documents/ANEXO 05 Participación Informada Mochila de paz.pdf";
import anexoConsentimiento from "../Documents/ANEXO 3 CONSENTIMIENTO INFORMADO Mochila de paz.pdf";
import formatoCotejo from "../Documents/Formato de Cotejo de entrega de Documentos.pdf";
import formatoCroquis from "../Documents/Formato de Croquis.pdf";

// ── Navegación ───────────────────────────────────────────────
export const navigation = [
  { id: "inicio",        label: "Inicio" },
  { id: "nosotros",      label: "Nosotros" },
  { id: "oferta",        label: "Oferta Educativa" },
  { id: "instalaciones", label: "Instalaciones" },
  { id: "noticias",      label: "Noticias" },
  { id: "documentos",    label: "Documentos" },
  { id: "admisiones",    label: "Admisiones" },
  { id: "contacto",      label: "Contacto" },
];

// ── Hero: estadísticas institucionales reales ─────────────────
export const heroStats = [
  { value: 199,  suffix: "",    label: "Estudiantes activos en el plantel" },
  { value: 2,    suffix: "",    label: "Carreras técnicas especializadas" },
  { value: 2014, suffix: "",    label: "Año de fundación del plantel", noFormat: true },
];

// ── ¿Por qué elegirnos? ──────────────────────────────────────
export const whyChooseUs = [
  {
    icon: "quality",
    title: "Bachillerato bivalente",
    description:
      "Al concluir tus estudios obtienes tanto el certificado de bachillerato como una formación técnica especializada, permitiéndote continuar en la universidad o incorporarte al mundo laboral con conocimientos prácticos y competencias profesionales desde nivel medio superior.",
  },
  {
    icon: "infra",
    title: "Infraestructura en evolución",
    description:
      "CECyTEM Toluca II continúa fortaleciendo sus espacios educativos y tecnológicos. Con áreas funcionales, biblioteca, cafetería y 52 equipos de cómputo especializados, el plantel impulsa una formación práctica y competitiva desde el primer día.",
  },
  {
    icon: "cert",
    title: "Certificaciones técnicas",
    description:
      "Las certificaciones académicas y laborales del CECyTEM fortalecen el perfil profesional del estudiante, brindando competencias útiles tanto para incorporarse al campo laboral como para continuar estudios universitarios con mejores herramientas.",
  },
  {
    icon: "industry",
    title: "Enfoque práctico",
    description:
      "El modelo educativo combina conocimientos teóricos con actividades prácticas en talleres, laboratorios y proyectos aplicados, desarrollando habilidades técnicas, trabajo en equipo y experiencia cercana a entornos reales.",
  },
  {
    icon: "growth",
    title: "Comunidad activa",
    description:
      "El plantel promueve una formación integral mediante actividades deportivas, culturales, académicas y cívicas, además de espacios de tutoría y convivencia que fortalecen el desarrollo personal y el sentido de comunidad.",
  },
];

// ── Valores institucionales ───────────────────────────────────
export const values = [
  {
    title: "Excelencia académica",
    description:
      "Comprometidos con una formación rigurosa que prepare a cada estudiante para continuar estudios superiores o integrarse al mercado laboral con sólidas competencias técnicas.",
  },
  {
    title: "Innovación educativa",
    description:
      "Adoptamos metodologías activas y herramientas tecnológicas que hacen más relevante y dinámica la experiencia de aprendizaje en cada especialidad.",
  },
  {
    title: "Inclusión y respeto",
    description:
      "Un ambiente de convivencia sana donde la diversidad es un valor, el respeto es norma y cada estudiante se siente parte de la comunidad escolar.",
  },
  {
    title: "Formación integral",
    description:
      "Más allá de lo académico: fomentamos el desarrollo personal, el pensamiento crítico y los valores que forman ciudadanos responsables y comprometidos.",
  },
];

// ── Línea de tiempo institucional ────────────────────────────
export const historyTimeline = [
  {
    year: "2014",
    title: "Fundación del plantel",
    description:
      "CECyTEM Toluca II abre sus puertas como parte de la red de planteles del Colegio de Estudios Científicos y Tecnológicos del Estado de México, atendiendo a la comunidad de Totoltepec.",
  },
  {
    year: "Crecimiento",
    title: "Consolidación académica",
    description:
      "El plantel consolida su oferta educativa con carreras técnicas orientadas a las necesidades productivas de la región, fortaleciendo la planta docente y la atención estudiantil.",
  },
  {
    year: "Desarrollo",
    title: "Tecnología e infraestructura",
    description:
      "Incorporación de 52 equipos de cómputo especializados y fortalecimiento de áreas académicas para impulsar la enseñanza de Logística y Ciencia de Datos.",
  },
  {
    year: "Hoy",
    title: "Nuevo campus en construcción",
    description:
      "El plantel avanza en la construcción de instalaciones definitivas que consolidarán una infraestructura moderna y funcional para toda la comunidad estudiantil.",
  },
];

// ── Oferta educativa (Fieles al plan de estudios vigente) ─────
export const programs = [
  {
    icon: "administration",
    name: "Técnico en Logística",
    duration: "3 años · Bachillerato Bivalente",
    description:
      "Gestiona la administración de bienes, suministros y transporte dentro de cadenas logísticas. Una especialidad con alta demanda en el sector empresarial, comercial e industrial de la región.",
    technologies: ["Administración de bienes", "Suministros", "Transporte", "Cadena logística"],
    image: logistImg,
  },
  {
    icon: "programming",
    name: "Técnico en Ciencia de Datos e Información",
    duration: "3 años · Bachillerato Bivalente",
    description:
      "Domina la programación de algoritmos, bases de datos, estadística aplicada, minería de datos y fundamentos de machine learning. Una de las especialidades más relevantes de la economía digital actual.",
    technologies: ["Programación de algoritmos", "Bases de datos", "Estadística", "Machine Learning"],
    image: dataImg,
  },
];

// ── Orientación vocacional ────────────────────────────────────
export const guidanceHighlights = [
  "Conoce el enfoque práctico de cada especialidad",
  "Charla directa con docentes especializados",
  "Visita los laboratorios y espacios técnicos",
  "Orientación vocacional sin costo para aspirantes",
  "Acompañamiento para padres de familia",
];

// ── Instalaciones ─────────────────────────────────────────────
export const facilities = [
  {
    category: "Tecnología",
    title: "Laboratorio de Cómputo",
    description:
      "El plantel cuenta con 52 equipos de cómputo especializados que soportan las actividades académicas de Ciencia de Datos y Logística. Conectividad y software actualizado para el aprendizaje técnico desde el primer semestre.",
    photos: [
      { src: lab1, caption: "Laboratorio de cómputo" },
      { src: lab2, caption: "Estaciones de trabajo especializadas" },
      { src: lab3, caption: "Trabajo colaborativo en laboratorio" },
    ],
  },
  {
    category: "Momentos CECyTEM",
    title: "#TOLUCA II",
    description:
      "Experiencias, logros y actividades que reflejan el espíritu, la identidad y el orgullo de nuestra comunidad estudiantil.",
    photos: [
    { src: lib1, caption: "#OrgulloTolucaII" },
    { src: lib2, caption: "#ComunidadCECyTEM" },
    { src: lib3, caption: "#TalentoQueTrasciende" },
    { src: lib4, caption: "#FuturoEnConstrucción" },
    { src: lib5, caption: "#FormaciónIntegral" },
    { src: lib6, caption: "#CrecimientoPersonal" },
    { src: lib7, caption: "#IdentidadCECyTEM" },
    { src: lib8, caption: "#ExperienciaEducativa" },
    { src: lib9, caption: "#ComunidadUnida" },
    { src: lib10, caption: "#AprendizajeActivo" },
    { src: lib11, caption: "#DesarrolloDeHabilidades" },
    { src: lib12, caption: "#FormaciónParaElFuturo" },
    { src: lib13, caption: "#OrgulloEstudiantil" },
    { src: lib14, caption: "#CulturaCECyTEM" },
    { src: lib15, caption: "#VidaEnElCampus" },
    { src: lib16, caption: "#ExperienciasQueInspiran" },
  ],
  },
  {
    category: "Mas que clases",
    title: "Actividades que Forman Lideres",
    description:
      "Actividades que fortalecen el talento, la disciplina y el desarrollo integral de nuestros estudiantes.",
    photos: [
      { src: com1, caption: "Área de convivencia estudiantil" },
      { src: com2, caption: "Espacios de descanso" },
      { src: com3, caption: "Actividades comunitarias" },
      { src: com4, caption: "Eventos cívicos y culturales" },
      { src: com5, caption: "Actividades extracurriculares" },
      { src: com6, caption: "Talleres de desarrollo personal" },
      { src: com7, caption: "Deporte en CECyTEM Toluca" },
      { src: com8, caption: "Actividad deportiva institucional" },
      { src: com9, caption: "Formación física y salud" },
      { src: com10, caption: "Torneo de fútbol interno" },
      { src: com11, caption: "Competencia deportiva estudiantil" },
      { src: com12, caption: "Valores de trabajo en equipo" },
      { src: com13, caption: "Encuentros deportivos locales" },
      { src: com14, caption: "Equipo representativo del plantel" },
      { src: com15, caption: "Identidad y disciplina deportiva" },
      { src: com16, caption: "Convivencia inter-escolar" },
      { src: com17, caption: "Torneo estudiantil de fútbol" },
      { src: com18, caption: "Desarrollo deportivo integral" },
      { src: com19, caption: "Sana competencia en el plantel" },
      { src: com20, caption: "Talleres deportivos de fin de semana" },
      { src: com21, caption: "Selección de atletas CECyTEM" },
      { src: com22, caption: "Deporte, salud y convivencia" },
    ],
  },
];

// ── Estadísticas de secciones internas ────────────────────────
export const facilityStats = [
  { value: 52,  suffix: "",  label: "Equipos de cómputo especializados" },
  { value: 2,   suffix: "",  label: "Carreras técnicas activas" },
  { value: 12,  suffix: "",  label: "Docentes especializados" },
  { value: 199, suffix: "",  label: "Estudiantes en el plantel" },
];

export const resultStats = [
  { value: 199, suffix: "",  label: "Alumnos activos actualmente" },
  { value: 12,  suffix: "",  label: "Docentes con perfil especializado" },
  { value: 17,  suffix: "",  label: "Personal administrativo de apoyo" },
];

// ── Noticias (Ciclo Actual 2026) ──────────────────────────────
export const newsItems = [
  {
    category: "Académico",
    date: "Mayo 2026",
    title: "Estudiantes de Ciencia de Datos presentan proyectos de análisis y visualización",
    description:
      "Como parte del cierre de semestre, alumnos expusieron proyectos aplicados que integraron programación, estadística y visualización de datos, demostrando las competencias técnicas desarrolladas durante el ciclo.",
  },
  {
    category: "Convocatoria",
    date: "Abril 2026",
    title: "Apertura del proceso de admisión para el ciclo 2026–2027",
    description:
      "El plantel anuncia el inicio del proceso de registro para aspirantes de nuevo ingreso. Consulta los requisitos, fechas clave y documentos necesarios en la sección de Admisiones.",
  },
  {
    category: "Comunidad",
    date: "Marzo 2026",
    title: "Semana cívica y actividades culturales en el plantel",
    description:
      "La comunidad estudiantil participó en ceremonias cívicas, exposiciones culturales y actividades que reforzaron el sentido de identidad y pertenencia al CECyTEM Toluca II.",
  },
];

// ── Próximos eventos ──────────────────────────────────────────
export const upcomingEvents = [
  {
    date: "Jun 2026",
    time: "10:00 hrs",
    category: "Admisiones",
    title: "Día de puertas abiertas para aspirantes",
    description:
      "Visita el campus, conoce los laboratorios y resuelve tus dudas directamente con docentes y orientadores. Abierto a aspirantes y familias.",
  },
  {
    date: "Jun 2026",
    time: "09:00 hrs",
    category: "Académico",
    title: "Entrega de documentos — Nuevo ingreso",
    description:
      "Fecha límite para presentar el expediente completo de aspirantes seleccionados. Revisa el checklist en la sección de Admisiones.",
  },
  {
    date: "Ago 2026",
    time: "08:00 hrs",
    category: "Institucional",
    title: "Inicio de clases ciclo escolar 2026–2027",
    description:
      "Arranque oficial del nuevo ciclo. Bienvenida institucional a estudiantes de nuevo ingreso y apertura de actividades académicas.",
  },
];

// ── Testimonios ───────────────────────────────────────────────
export const testimonials = [
  {
    name: "Sofía Ramírez",
    role: "Egresada · Técnico en Logística",
    quote:
      "La especialidad me dio herramientas reales: aprendí a gestionar cadenas de suministro y al terminar pude incorporarme a una empresa distribuidora sin necesitar otra capacitación.",
    avatar: alumA,
  },
  {
    name: "Diego Hernández",
    role: "Egresado · Técnico en Ciencia de Datos",
    quote:
      "Aprendí programación, bases de datos y análisis de datos desde preparatoria. Eso me abrió puertas en la universidad y me permitió entrar a ingeniería con ventaja real.",
    avatar: alumB,
  },
  {
    name: "Valeria Torres",
    role: "Estudiante activa · Ciencia de Datos",
    quote:
      "Los maestros se involucran de verdad. No es solo dar clase: te acompañan, resuelven dudas y hacen que aprendas aplicando lo que ves en clase a proyectos reales.",
    avatar: cecytem5img,
  },
];

// ── Vida estudiantil / Posts ──────────────────────────────────
export const studentLifePosts = [
  {
    image: alumA,
    category: "Vida en el campus",
    title: "Comunidad estudiantil activa",
    date: "Campus CECyTEM Toluca II",
    description:
      "Momentos del día a día en el plantel: clases, laboratorio de cómputo, convivencia y trabajo en equipo que hacen de este campus un lugar de crecimiento real.",
  },
  {
    image: alumB,
    category: "Ciencia de Datos",
    title: "Proyectos de análisis de datos",
    date: "Campus CECyTEM Toluca II",
    description:
      "Los estudiantes de Ciencia de Datos desarrollan proyectos aplicados que integran estadística, programación y visualización con herramientas actuales del sector tecnológico.",
  },
  {
    image: cecytem5img,
    category: "Logística",
    title: "Formación en gestión y suministro",
    date: "Campus CECyTEM Toluca II",
    description:
      "Los alumnos de Logística aprenden a gestionar cadenas de suministro y procesos de distribución mediante casos prácticos vinculados al sector empresarial de la región.",
  },
];

export const campusMoments = studentLifePosts;

// ── Proceso de admisión ───────────────────────────────────────
export const admissionSteps = [
  {
    step: "Paso 01",
    title: "Solicita información",
    description:
      "Llena el formulario de contacto o visita el plantel para recibir orientación personalizada sobre el proceso, las especialidades y los requisitos de ingreso.",
  },
  {
    step: "Paso 02",
    title: "Reúne tu documentación",
    description:
      "Prepara los documentos requeridos: certificado de secundaria, CURP, acta de nacimiento y fotografías. Consulta el checklist completo en la sección de Admisiones.",
  },
  {
    step: "Paso 03",
    title: "Registro y evaluación",
    description:
      "Completa tu pre-registro en el portal oficial del CECyTEM Estado de México y presenta el examen de admisión en la fecha asignada por la convocatoria.",
  },
  {
    step: "Paso 04",
    title: "Asignación e inicio",
    description:
      "Recibe tu resultado, confirma tu lugar, entrega documentos en plantel y prepárate para el inicio del ciclo escolar 2026–2027.",
  },
];

// ── Requisitos de admisión ────────────────────────────────────
export const requirements = [
  "Certificado original y copia de secundaria",
  "Acta de nacimiento (original y copia)",
  "CURP impresa (consulta en gob.mx)",
  "4 fotografías tamaño infantil a color",
  "Comprobante de domicilio reciente (últimos 6 meses)",
  "INE o identificación oficial del padre o tutor",
  "Comprobante de pago de registro según convocatoria vigente",
];

// ── Fechas importantes ────────────────────────────────────────
export const importantDates = [
  {
    date: "Mayo – Jun 2026",
    title: "Pre-registro en línea",
    description:
      "Completa tu solicitud en el portal oficial del CECyTEM Estado de México. Guarda tu número de folio al finalizar.",
  },
  {
    date: "Junio 2026",
    title: "Entrega de documentos",
    description:
      "Presenta tu expediente completo en el plantel según la fecha y horario asignados al confirmar tu registro.",
  },
  {
    date: "Jun – Jul 2026",
    title: "Examen de admisión",
    description:
      "Aplica en la sede y fecha indicadas por la convocatoria oficial. El examen es el mismo para todos los planteles CECyTEM.",
  },
  {
    date: "Agosto 2026",
    title: "Inicio del ciclo escolar",
    description:
      "Bienvenida institucional e inicio oficial de actividades académicas para estudiantes de nuevo ingreso y reingreso.",
  },
];

// ── Documentos institucionales reales ─────────────────────────
export const documents = [
  {
    category: "Inscripción",
    icon: "document",
    title: "Formato de Cotejo de Entrega de Documentos",
    description: "Lista oficial de verificación para la entrega de expediente de nuevo ingreso.",
    fileType: "PDF",
    fileSize: null,
    href: formatoCotejo,
    available: true,
  },
  {
    category: "Reglamentos",
    icon: "shield",
    title: "Normas de Convivencia Escolar",
    description: "Reglamento de conducta y convivencia escolar del plantel.",
    fileType: "PDF",
    fileSize: null,
    href: normasConvivencia,
    available: true,
  },
  {
    category: "Reglamentos",
    icon: "shield",
    title: "Derechos y Deberes del Alumnado",
    description: "Documento que establece los derechos y responsabilidades de los estudiantes.",
    fileType: "PDF",
    fileSize: null,
    href: derechosDeberes,
    available: true,
  },
  {
    category: "Privacidad",
    icon: "info",
    title: "Formato Exprés de Aviso de Privacidad",
    description: "Versión simplificada del aviso de privacidad para firma rápida.",
    fileType: "PDF",
    fileSize: null,
    href: formatoExprAviso,
    available: true,
  },
  {
    category: "Mochila de Paz",
    icon: "calendar",
    title: "Consentimiento Informado — Mochila de Paz (ANEXO)",
    description: "Documento de autorización para el protocolo Mochila de Paz.",
    fileType: "PDF",
    fileSize: null,
    href: anexoConsentimiento,
    available: true,
  },
  {
    category: "Mochila de Paz",
    icon: "calendar",
    title: "Formato de Participación Informada — Mochila de Paz (ANEXO)",
    description: "Formato de participación informada para NNyA dentro del protocolo.",
    fileType: "PDF",
    fileSize: null,
    href: anexoParticipacion,
    available: true,
  },
  {
    category: "General",
    icon: "document",
    title: "Formato de Croquis (Localización)",
    description: "Mapa y croquis oficial de localización del plantel.",
    fileType: "PDF",
    fileSize: null,
    href: formatoCroquis,
    available: true,
  },
  {
    category: "Seguridad",
    icon: "shield",
    title: "Protocolos de Seguridad para los Planteles",
    description: "Documentos técnicos sobre protocolos de seguridad institucional.",
    fileType: "PDF",
    fileSize: null,
    href: protocolosSeguridad,
    available: true,
  },
  {
    category: "Reglamentos",
    icon: "document",
    title: "Protocolo para la Convivencia Armónica",
    description: "Protocolo institucional para la convivencia armónica del estudiantado.",
    fileType: "PDF",
    fileSize: null,
    href: protocoloConvivencia,
    available: true,
  },
];

export const documentCategories = [
  "Todos",
  "Inscripción",
  "Reglamentos",
  "Privacidad",
  "Mochila de Paz",
  "General",
];

// ── FAQ ───────────────────────────────────────────────────────
export const faqItems = [
  {
    question: "¿Qué carreras ofrece el CECyTEM Toluca II?",
    answer:
      "El plantel ofrece dos especialidades técnicas: Técnico en Logística y Técnico en Ciencia de Datos e Información. Ambas son parte del bachillerato bivalente del CECyTEM y otorgan doble certificación al concluir.",
  },
  {
    question: "¿El CECyTEM Toluca II otorga doble certificación?",
    answer:
      "Sí. Al concluir los 3 años obtienes el certificado de bachillerato (válido para continuar estudios superiores) y el título de técnico en tu especialidad, ambos reconocidos por la SEP.",
  },
  {
    question: "¿Cómo es el proceso de admisión?",
    answer:
      "El proceso inicia con un pre-registro en el portal oficial del CECyTEM Estado de México, seguido de la entrega de documentos en el plantel y la aplicación del examen de admisión. Los resultados se publican conforme al calendario oficial de la convocatoria.",
  },
  {
    question: "¿Cuántos alumnos tiene el plantel actualmente?",
    answer:
      "CECyTEM Toluca II atiende a 199 estudiantes activos, con una planta de 12 docentes especializados y 17 personas en el área administrativa.",
  },
  {
    question: "¿Cuánto cuesta estudiar en el CECyTEM Toluca II?",
    answer:
      "Como institución pública del Estado de México, los costos son mínimos y regulados por la autoridad educativa. Se pagan cuotas de registro y de cooperación escolar según la convocatoria vigente. No se cobran colegiaturas mensuales.",
  },
  {
    question: "¿Puedo entrar a la universidad después del CECyTEM?",
    answer:
      "Sí. El bachillerato del CECyTEM es bivalente y válido para concursar por cualquier universidad pública o privada del país, incluyendo UNAM, UAEMéx, IPN y tecnológicos nacionales.",
  },
  {
    question: "¿Dónde está ubicado el plantel?",
    answer:
      "Calle Francisco I. Madero s/n, Col. La Constitución Totoltepec, Toluca, Estado de México, C.P. 50236. Puedes consultar el croquis de localización en la sección de Documentos.",
  },
];

// ── Información de contacto (datos reales del plantel) ────────
export const contactInfo = {
  phone: "722 179 51 68",
  email: "plantel.toluca2@cecytem.mx",
  address: "Calle Francisco I. Madero s/n, Col. La Constitución Totoltepec, Toluca, Estado de México, C.P. 50236",
  hours: "Lunes a viernes, 7:00 – 15:00 hrs",
  website: "https://www.cecytem.edu.mx",
  director: "Ing. Karla Ninel Rodríguez López",
  brochurePdf: "#",
  mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3765.4246875936774!2d-99.5786438!3d19.3225217!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d20980647b74f9%3A0xe7261944da9cbbf0!2sCECyTEM%20Plantel%20Toluca%20II!5e0!3m2!1ses-419!2smx!4v1716315000000!5m2!1ses-419!2smx",
  mapLink: "https://maps.app.goo.gl/9Z3RjZszB9D2C7zY8",
};

// ── Redes sociales ────────────────────────────────────────────
export const socialLinks = [
  { label: "Facebook",  href: "https://www.facebook.com" },
  { label: "Instagram", href: "https://www.instagram.com" },
  { label: "Web",       href: "https://www.cecytem.edu.mx" },
];