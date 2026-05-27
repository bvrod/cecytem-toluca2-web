import React from 'react';
import { useAuth } from '../context/AuthContext';

const getRoleLabel = (rol) => {
  if (rol === 'ADMIN') return 'Administrador';
  if (rol === 'DOCENTE') return 'Docente';
  if (rol === 'ALUMNO') return 'Alumno';
  return rol ?? 'Usuario';
};

export function Navbar() {
  const { user, logout } = useAuth();

  // ┌─────────────────────────────────────────────────────────────┐
  // │ CORRECCIÓN BUG 3: Manejar el logout sin bloqueos              │
  // │ La función logout() ahora es completamente reactiva          │
  // └─────────────────────────────────────────────────────────────┘
  const handleLogout = () => {
    logout();
    // No es necesario hacer nada más aquí
    // App.jsx detectará setUser(null) y renderizará LoginForm automáticamente
  };

  return (
    <nav className="bg-[#0f0f1a] text-white border-b border-white/10 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="bg-purple-800 h-8 w-8 rounded-xl flex items-center justify-center shrink-0">
          <svg
            className="h-4 w-4 text-purple-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-bold leading-none">CECyTEM</h1>
          <p className="text-[10px] text-white/40 mt-0.5">Plantel Toluca II</p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <a
          href="http://localhost:5173"
          className="hidden md:flex items-center gap-1.5 text-xs text-white/50 hover:text-purple-300 transition-colors font-medium"
        >
          Sitio Web
        </a>
        <div className="hidden md:block h-5 w-px bg-white/10" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white/90 leading-none">
              {user?.nombre ?? user?.username ?? 'Usuario'}
            </p>
            <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full font-medium border border-purple-800/50 mt-1 inline-block">
              {getRoleLabel(user?.rol)}
            </span>
          </div>

          {/* ┌───────────────────────────────────────────────────────────┐ */}
          {/* │ BOTÓN DE LOGOUT: Ahora funciona reactivamente              │ */}
          {/* │ onClick → logout() → setUser(null) → App.jsx desmonta      │ */}
          {/* └───────────────────────────────────────────────────────────┘ */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 text-white/50 hover:text-amber-300 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;