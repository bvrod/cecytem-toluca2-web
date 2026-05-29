// tracking-frontend/src/App.jsx
import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import CecytoMascota from './imagenes/Cecyto.png';

// Importaciones de tus dashboards que ya funcionaban
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import DocenteDashboard from './components/DocenteDashboard';
import AlumnoDashboard from './components/AlumnoDashboard';

// ==========================================
// ESTILOS CSS EN EMBAJADA (Mantenidos Intactos)
// ==========================================
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;800;900&family=DM+Sans:wght@300;400;500&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mascotaDrop {
    0%   { opacity: 0; transform: translateY(-20px); }
    100% { opacity: 1; transform: translateY(35px); }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.75; }
    50%       { opacity: 1; }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }

  .login-page * { box-sizing: border-box; }
  .login-page { font-family: 'DM Sans', sans-serif; }

  .card-enter   { animation: fadeUp 0.55s ease both; }
  .card-enter-1 { animation: fadeUp 0.55s 0.1s ease both; }
  .card-enter-2 { animation: fadeUp 0.55s 0.2s ease both; }
  .card-enter-3 { animation: fadeUp 0.55s 0.3s ease both; }
  .card-enter-4 { animation: fadeUp 0.55s 0.4s ease both; }

  .mascota-anim {
    animation: mascotaDrop 0.65s cubic-bezier(0.25, 1, 0.5, 1) both;
    animation-delay: 0.2s;
  }

  .glow-bg      { animation: glowPulse 5s ease-in-out infinite; }
  .glow-mascot  { animation: glowPulse 5s 1.5s ease-in-out infinite; }

  .input-field {
    width: 100%;
    background: rgba(5,20,30,0.70);
    border: 1px solid rgba(6,182,212,0.20);
    border-radius: 12px;
    padding: 12px 16px;
    color: #e5e7eb;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 400;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-field::placeholder { color: #6b7280; }
  .input-field:focus {
    border-color: #1db954;
    box-shadow: 0 0 0 3px rgba(29,185,84,0.14);
  }
  .input-field:disabled { opacity: 0.5; cursor: not-allowed; }

  .login-btn {
    width: 100%;
    background: #1db954;
    border: none;
    border-radius: 12px;
    padding: 13px 0;
    color: #0f172a;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 15px;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: background 0.18s, transform 0.1s, box-shadow 0.18s;
    box-shadow: 0 4px 18px rgba(29,185,84,0.35);
  }
  .login-btn:hover:not(:disabled) {
    background: #159b45;
    box-shadow: 0 6px 24px rgba(29,185,84,0.45);
  }
  .login-btn:active:not(:disabled) { transform: scale(0.96); }
  .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .error-shake { animation: shake 0.42s ease; }

  .divider-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(6,182,212,0.22), transparent);
    margin: 4px 0 20px;
  }
`;

function App() {
  const { user, login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      
      // Llamada directa al login que SÍ funciona con Django
      await login(username.trim(), password);

    } catch (err) {
      setError('Usuario o contraseña incorrectos.');
      setShakeKey(k => k + 1);
      console.error('[LoginForm]', err);
    } finally {
      setLoading(false);
    }
  };

  // VISTA 1: Si NO hay usuario, renderizamos el Login de Alta Gama con la Mascota
  if (!user) {
    return (
      <>
        <style>{STYLES}</style>

        <div
          className="login-page"
          style={{
            minHeight: '100vh',
            background: '#082030',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* DOTS */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              backgroundImage: 'radial-gradient(rgba(6,182,212,0.18) 1.5px, transparent 1.5px)',
              backgroundSize: '26px 26px',
              pointerEvents: 'none',
            }}
          />

          {/* GLOW PRINCIPAL */}
          <div
            className="glow-bg"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              background: 'radial-gradient(ellipse 75% 55% at 50% 60%, rgba(6,182,212,0.28) 0%, rgba(8,145,178,0.10) 45%, transparent 72%)',
              filter: 'blur(45px)',
              pointerEvents: 'none',
            }}
          />

          {/* SPOTLIGHT MASCOTA */}
          <div
            className="glow-mascot"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              background: 'radial-gradient(ellipse 40% 30% at 50% 33%, rgba(6,182,212,0.38) 0%, rgba(8,145,178,0.12) 50%, transparent 75%)',
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />

          {/* Wrapper general */}
          <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '420px' }}>

            {/* PEEK-A-BOO */}
            <div
              style={{
                position: 'absolute',
                top: '-165px',
                left: 0,
                width: '100%',
                height: '166px',
                overflow: 'hidden',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            >
              <img
                src={CecytoMascota}
                alt="Mascota CECyTEM"
                className="mascota-anim"
                style={{
                  display: 'block',
                  margin: '0 auto',
                  width: '180px',
                  height: 'auto',
                  transform: 'translateY(35px)',
                }}
              />
            </div>

            {/* Tarjeta glassmorphism */}
            <div
              key={shakeKey > 0 ? `shake-${shakeKey}` : 'card'}
              className={shakeKey > 0 ? 'error-shake' : ''}
              style={{
                background: 'rgba(5,18,32,0.72)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(6,182,212,0.18)',
                borderRadius: '20px',
                padding: '52px 36px 36px',
                paddingTop: '48px',
                boxShadow: '0 25px 80px rgba(2,10,20,0.55), 0 0 0 1px rgba(6,182,212,0.08) inset',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {/* Franja verde */}
              <div style={{
                position: 'absolute', top: 0,
                left: '50%', transform: 'translateX(-50%)',
                width: '60px', height: '3px',
                background: 'linear-gradient(90deg, #1db954, #159b45)',
                borderRadius: '0 0 4px 4px',
              }} />

              {/* Encabezado */}
              <div className="card-enter" style={{ textAlign: 'center', marginBottom: '28px' }}>
                <p style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: '22px',
                  color: '#e5e7eb', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2,
                }}>
                  CECyTEM<span style={{ color: '#1db954' }}> Toluca II</span>
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: '13px',
                  color: '#9aa5b7', margin: '6px 0 0', letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  Control Escolar
                </p>
              </div>

              <div className="divider-line" />

              {error && (
                <div className="card-enter" style={{
                  background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.25)',
                  borderRadius: '10px', padding: '10px 14px', marginBottom: '18px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{ fontSize: '15px' }}>⚠️</span>
                  <span style={{ color: '#fca5a5', fontSize: '13px', fontWeight: 400 }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="card-enter-1">
                  <label style={{
                    display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '12px',
                    fontWeight: 500, color: '#9aa5b7', letterSpacing: '0.06em',
                    textTransform: 'uppercase', marginBottom: '7px',
                  }}>
                    Usuario o Matrícula
                  </label>
                  <input
                    type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Ingresa tu usuario" className="input-field"
                    disabled={loading} autoComplete="username"
                  />
                </div>

                <div className="card-enter-2">
                  <label style={{
                    display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '12px',
                    fontWeight: 500, color: '#9aa5b7', letterSpacing: '0.06em',
                    textTransform: 'uppercase', marginBottom: '7px',
                  }}>
                    Contraseña
                  </label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" className="input-field"
                    disabled={loading} autoComplete="current-password"
                  />
                </div>

                <div className="card-enter-3" style={{ marginTop: '8px' }}>
                  <button type="submit" disabled={loading} className="login-btn">
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5"
                          style={{ animation: 'spin 0.8s linear infinite' }}>
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                        </svg>
                        Verificando...
                      </span>
                    ) : 'Ingresar'}
                  </button>
                </div>
              </form>

              <div className="card-enter-4" style={{
                marginTop: '24px', textAlign: 'center', color: '#4b5563',
                fontSize: '11px', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.03em',
              }}>
                © {new Date().getFullYear()} CECyTEM · Sistema de Control Escolar
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }

  // VISTA 2: Si el usuario SÍ existe, renderiza los dashboards correspondientes al rol de inmediato
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      <Navbar />
      <main className="flex-1 p-6">
        {user.rol === 'ADMIN' && <AdminDashboard />}
        {user.rol === 'DOCENTE' && <DocenteDashboard />}
        {user.rol === 'ALUMNO' && <AlumnoDashboard />}
      </main>
    </div>
  );
}

export default App;