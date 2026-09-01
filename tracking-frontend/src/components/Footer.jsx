import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 px-6 py-8 mt-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">CECyTEM Plantel Toluca II</div>
            <div className="text-xs text-slate-400">Lunes a viernes, 7:00 – 15:00 hrs · plantel.toluca2@cecytem.mx</div>
          </div>

          <div className="flex items-center gap-4">
            {/* Social links (Instagram intentionally omitted) */}
            <a href="mailto:plantel.toluca2@cecytem.mx" className="text-slate-300 hover:text-green-400 text-sm">Contacto</a>
            <a href="/aviso-de-privacidad" className="text-slate-300 hover:text-green-400 text-sm">Aviso de Privacidad</a>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500">
          <div>© {new Date().getFullYear()} CECyTEM Plantel Toluca II. Todos los derechos reservados.</div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Desarrollo:</span>
            <a
              href="https://github.com/bvrod"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-emerald-400"
              aria-label="Roro Tryhard - bvrod on GitHub"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.578 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.238 1.84 1.238 1.07 1.833 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.303-5.467-1.332-5.467-5.93 0-1.31.467-2.382 1.235-3.222-.123-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 013.003-.404c1.02.005 2.045.138 3.003.404 2.29-1.552 3.296-1.23 3.296-1.23.653 1.653.241 2.874.118 3.176.77.84 1.234 1.912 1.234 3.222 0 4.61-2.807 5.624-5.48 5.92.43.372.814 1.103.814 2.222 0 1.606-.015 2.898-.015 3.293 0 .319.216.694.825.576C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="hidden sm:inline">Roro Tryhard (bvrod)</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
