import React from 'react';
import { useAuth } from '../context/AuthContext';

// ─── Design Tokens (misma paleta que login / AdminDashboard) ───────────────────

const T = {
  bg:           "rgba(5,18,32,0.88)",
  border:       "rgba(6,182,212,0.18)",
  borderStrong: "rgba(6,182,212,0.32)",
  accent:       "#1db954",
  accentEnd:    "#159b45",
  accentGlow:   "rgba(29,185,84,0.18)",
  cyan:         "#06b6d4",
  cyanDim:      "rgba(6,182,212,0.10)",
  textPrimary:  "#e5e7eb",
  textSecondary:"#9aa5b7",
  textMuted:    "#4d6070",
  danger:       "rgba(239,68,68,0.10)",
  dangerBorder: "rgba(239,68,68,0.22)",
  dangerText:   "#fca5a5",
  radiusSm:     "12px",
  radiusXs:     "8px",
};

const ROLE_META = {
  ADMIN:   { label: "Administrador", color: T.accent,  bg: "rgba(29,185,84,0.12)",  border: "rgba(29,185,84,0.28)" },
  DOCENTE: { label: "Docente",       color: T.cyan,    bg: T.cyanDim,               border: T.border               },
  ALUMNO:  { label: "Alumno",        color: "#a78bfa", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.25)" },
};

const getRoleMeta = (rol) => ROLE_META[rol] ?? { label: rol ?? "Usuario", color: T.textSecondary, bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.10)" };

// ─── Navbar ─────────────────────────────────────────────────────────────────────

export function Navbar() {
  const { user, logout } = useAuth();
  const handleLogout = () => logout();

  const roleMeta = getRoleMeta(user?.rol);
  const displayName = user?.nombre ?? user?.username ?? "Usuario";
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <>
      {/* Syne + DM Sans */}
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <nav
        style={{
          position: "sticky", top: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px",
          height: 60,
          background: T.bg,
          borderBottom: `1px solid ${T.border}`,
          backdropFilter: "blur(20px)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Logo ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: T.radiusSm, flexShrink: 0,
              background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentEnd} 100%)`,
              boxShadow: `0 4px 18px ${T.accentGlow}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width={17} height={17} fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.textPrimary, lineHeight: 1, fontFamily: "'Syne', sans-serif" }}>
              CECyTEM
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 10, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
              Plantel Toluca II
            </p>
          </div>
        </div>

        {/* ── Right side ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

          {/* Sitio Web link */}
          <a
            href="http://localhost:5173"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 600,
              color: T.textMuted, textDecoration: "none",
              transition: "color 0.18s",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => e.currentTarget.style.color = T.cyan}
            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
          >
            <svg width={13} height={13} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={12} cy={12} r={10} />
              <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
            </svg>
            Sitio Web
          </a>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: T.border }} />

          {/* Avatar + info */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Avatar */}
            <div
              style={{
                width: 34, height: 34, borderRadius: T.radiusXs, flexShrink: 0,
                background: "linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(29,185,84,0.12) 100%)",
                border: `1px solid ${T.borderStrong}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: T.cyan,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {initials}
            </div>

            {/* Name + role badge */}
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: T.textPrimary, lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>
                {displayName}
              </p>
              <span
                style={{
                  display: "inline-block", marginTop: 4,
                  padding: "2px 8px", borderRadius: 100,
                  fontSize: 10, fontWeight: 700,
                  background: roleMeta.bg,
                  border: `1px solid ${roleMeta.border}`,
                  color: roleMeta.color,
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "0.04em",
                }}
              >
                {roleMeta.label}
              </span>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: T.radiusSm,
              background: T.danger,
              border: `1px solid ${T.dangerBorder}`,
              color: T.dangerText,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.18s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.18)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.38)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = T.danger;
              e.currentTarget.style.borderColor = T.dangerBorder;
            }}
          >
            <svg width={13} height={13} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </nav>
    </>
  );
}

export default Navbar;