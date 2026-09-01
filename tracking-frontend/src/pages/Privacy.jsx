import React from 'react';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Aviso de Privacidad</h1>
        <p className="text-slate-400 mb-8">SIGART - CECyTEM Plantel Toluca II</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Responsable del Tratamiento</h2>
          <p className="text-slate-300">Institución: <strong>CECyTEM Plantel Toluca II</strong></p>
          <p className="text-slate-300">Correo de contacto: <a href="mailto:plantel.toluca2@cecytem.mx" className="text-emerald-400 hover:underline">plantel.toluca2@cecytem.mx</a></p>
          <p className="text-slate-300">Horario de atención: Lunes a viernes, 7:00 – 15:00 hrs.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. Datos Personales Recabados</h2>
          <ul className="list-disc pl-6 text-slate-300">
            <li><strong>Datos de identificación y contacto:</strong> Nombre, CURP, matrícula/número de empleado, correo institucional/personal y teléfono.</li>
            <li><strong>Datos académicos y de uso del sistema:</strong> Registros de acceso a laboratorios de cómputo, asignación de equipos, asistencias y calificaciones.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. Finalidades del Tratamiento</h2>
          <h3 className="font-semibold text-slate-200">Finalidades primarias</h3>
          <ul className="list-disc pl-6 text-slate-300 mb-3">
            <li>Control académico y gestión de expedientes escolares.</li>
            <li>Gestión de préstamos y uso de recursos tecnológicos y laboratorios de cómputo.</li>
            <li>Autenticación de usuarios en la plataforma SIGART y mantenimiento de la seguridad.</li>
            <li>Comunicación oficial entre la institución, alumnos, docentes y tutores.</li>
          </ul>

          <h3 className="font-semibold text-slate-200">Finalidades secundarias</h3>
          <ul className="list-disc pl-6 text-slate-300">
            <li>Generación de estadísticas internas anonimizadas sobre el uso de infraestructura tecnológica para mejora de servicios.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4. Transferencia de Datos y Tecnologías de Rastreos</h2>
          <p className="text-slate-300 mb-2">Los datos personales no se compartirán con terceros ajenos a la institución sin el consentimiento explícito del titular, salvo por requerimiento legal debidamente fundado (órdenes judiciales, requerimientos de autoridades competentes, obligaciones fiscales, entre otros).</p>

          <p className="text-slate-300">La plataforma utiliza tecnologías de almacenamiento local y de sesión con fines estrictos de funcionamiento y seguridad:</p>
          <ul className="list-disc pl-6 text-slate-300">
            <li><strong>localStorage / sessionStorage:</strong> Se usan únicamente para mantener información de sesión autenticada o preferencias mínimas necesarias para la operatividad de la aplicación. No se almacenan datos sensibles sin cifrado.</li>
            <li><strong>Cookies de sesión:</strong> Se emplean para mantener la sesión activa y mejorar la seguridad (CSRF tokens, identificación de sesión). Las cookies no se usan para rastreo comercial externo ni para publicidad.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Derechos ARCO</h2>
          <p className="text-slate-300 mb-2">Como titular de datos personales, usted tiene derecho a:</p>
          <ul className="list-disc pl-6 text-slate-300 mb-3">
            <li><strong>Acceso:</strong> Obtener confirmación sobre si sus datos personales están siendo tratados y acceder a los mismos.</li>
            <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos.</li>
            <li><strong>Cancelación:</strong> Solicitar la supresión de sus datos, cuando proceda conforme a la legislación aplicable y las obligaciones institucionales.</li>
            <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos para fines específicos cuando proceda.</li>
          </ul>

          <p className="text-slate-300">Para ejercer cualquiera de estos derechos, dirija su solicitud al correo institucional <a href="mailto:plantel.toluca2@cecytem.mx" className="text-emerald-400 hover:underline">plantel.toluca2@cecytem.mx</a> indicando:</p>
          <ul className="list-disc pl-6 text-slate-300">
            <li>Nombre completo del titular y, en su caso, documentación que acredite la representación legal.</li>
            <li>Descripción clara de los datos respecto de los que ejercita el derecho ARCO.</li>
            <li>Documento que acredite la identidad del solicitante o poder notarial en su caso.</li>
          </ul>

          <p className="text-slate-300 mt-3">También puede dirigirse a la Unidad de Transparencia del plantel para orientación y seguimiento en caso de dudas o reclamaciones.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Información Adicional</h2>
          <p className="text-slate-300">Esta institución implementa medidas administrativas y técnicas razonables para proteger los datos personales contra pérdida, uso indebido, acceso no autorizado, divulgación, alteración y destrucción. No obstante, en caso de incidentes de seguridad que afecten la confidencialidad de datos personales, se informará a los titulares conforme a la normativa aplicable.</p>
        </section>

        <p className="text-slate-400 text-sm">Fecha de última actualización: 31 de agosto de 2026</p>
      </div>

      <Footer />
    </div>
  );
}
