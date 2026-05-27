import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import DocenteDashboard from './components/DocenteDashboard';
import AlumnoDashboard from './components/AlumnoDashboard';

// ────────────────────────────────────────────────────────
// ROUTER: Renderizar dashboard según el rol del usuario
// ────────────────────────────────────────────────────────
function DashboardRouter({ rol }) {
  if (rol === 'ADMIN') return <AdminDashboard />;
  if (rol === 'DOCENTE') return <DocenteDashboard />;
  if (rol === 'ALUMNO') return <AlumnoDashboard />;
  return (
    <div className="text-white text-center p-10">
      Rol no reconocido: {rol}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// LOGIN FORM: Formulario de autenticación
// ────────────────────────────────────────────────────────
function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(username.trim(), password);
    } catch (err) {
      setError('Credenciales incorrectas o error de conexión.');
      console.error('[LoginForm]', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-4"
      >
        <h2 className="text-xl font-bold text-center text-white">
          CECyTEM Toluca II
        </h2>

        {error && (
          <div className="text-xs text-amber-400 bg-amber-900/20 p-3 rounded-xl border border-amber-500/20">
            {error}
          </div>
        )}

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuario"
          className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
          disabled={loading}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-700 py-2.5 rounded-xl text-white font-semibold text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Cargando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// APP: Componente raíz
// ────────────────────────────────────────────────────────
// ┌─────────────────────────────────────────────────────────────┐
// │ FLUJO REACTIVO (BUG 1 CORREGIDO):                            │
// │                                                              │
// │ 1. Usuario hace clic en "Cerrar Sesión"                     │
// │ 2. Navbar → handleLogout() → logout()                       │
// │ 3. logout() → localStorage.removeItem() → setUser(null)     │
// │ 4. AuthContext emite el cambio de estado                    │
// │ 5. App.jsx re-renderiza con user === null                  │
// │ 6. Renderiza <LoginForm /> en lugar de Navbar + Dashboard   │
// │                                                              │
// │ ✅ NO hay window.location.href                              │
// │ ✅ Desmontaje nativo y flujo reactivo completo              │
// └─────────────────────────────────────────────────────────────┘
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="text-white text-center mt-20">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <DashboardRouter rol={user.rol} />
      </main>
    </div>
  );
}

export default App;