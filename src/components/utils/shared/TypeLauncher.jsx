import React, { useEffect, useId } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import "./TypeLauncher.css";

// ═══════════════════════════════════════════════════════════════════════════
// Illustrations SVG (viewBox 0 0 160 120), teintées par la couleur du type
// ═══════════════════════════════════════════════════════════════════════════

/** Service hospitalier : bâtiment, fenêtres, croix médicale. */
function ServiceArt({ c, uid }) {
  return (
    <>
      <defs>
        <linearGradient id={`svc-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.95" />
          <stop offset="100%" stopColor={c} stopOpacity="0.75" />
        </linearGradient>
      </defs>
      {/* Aile gauche + aile droite */}
      <rect x="22" y="52" width="30" height="52" rx="4" fill={c} opacity="0.25" />
      <rect x="108" y="52" width="30" height="52" rx="4" fill={c} opacity="0.25" />
      {/* Bâtiment central */}
      <rect x="46" y="30" width="68" height="74" rx="6" fill={`url(#svc-${uid})`} />
      <rect x="46" y="30" width="68" height="10" rx="5" fill="#FFFFFF" opacity="0.18" />
      {/* Croix */}
      <rect x="71" y="12" width="18" height="18" rx="5" fill="#FFFFFF" stroke={c} strokeWidth="2.5" />
      <path d="M80 15.5 V26.5 M74.5 21 H85.5" stroke={c} strokeWidth="3" strokeLinecap="round" />
      {/* Fenêtres */}
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((k) => (
          <rect key={`${r}-${k}`} x={54 + k * 19} y={46 + r * 14} width="13" height="8" rx="2" fill="#FFFFFF" opacity="0.85" />
        ))
      )}
      {[0, 1, 2].map((r) => (
        <React.Fragment key={r}>
          <rect x="28" y={60 + r * 13} width="18" height="7" rx="2" fill="#FFFFFF" />
          <rect x="114" y={60 + r * 13} width="18" height="7" rx="2" fill="#FFFFFF" />
        </React.Fragment>
      ))}
      {/* Porte */}
      <rect x="71" y="88" width="18" height="16" rx="3" fill="#FFFFFF" />
      <path d="M80 88 V104" stroke={c} strokeWidth="1.5" opacity="0.5" />
    </>
  );
}

/** Chambre : lit d'hôpital vu de côté, oreiller et couverture. */
function ChambreArt({ c, uid }) {
  return (
    <>
      <defs>
        <linearGradient id={`bed-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* Tête et pied de lit */}
      <rect x="20" y="34" width="10" height="66" rx="4" fill={c} />
      <rect x="130" y="56" width="10" height="44" rx="4" fill={c} opacity="0.85" />
      {/* Sommier + matelas */}
      <rect x="26" y="74" width="108" height="10" rx="3" fill={c} opacity="0.35" />
      <rect x="28" y="62" width="104" height="14" rx="6" fill="#FFFFFF" stroke={c} strokeOpacity="0.35" strokeWidth="2" />
      {/* Oreiller */}
      <rect x="34" y="50" width="30" height="16" rx="8" fill="#FFFFFF" stroke={c} strokeOpacity="0.45" strokeWidth="2" />
      {/* Couverture */}
      <path d="M60 60 Q62 52 72 52 H126 Q132 52 132 58 V76 H60 Z" fill={`url(#bed-${uid})`} />
      <path d="M72 52 Q70 64 76 76" fill="none" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="2" />
      <path d="M96 58 H122 M96 66 H116" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
      {/* Roulettes */}
      <circle cx="34" cy="104" r="5" fill="#FFFFFF" stroke={c} strokeWidth="2.5" />
      <circle cx="126" cy="104" r="5" fill="#FFFFFF" stroke={c} strokeWidth="2.5" />
    </>
  );
}

/** Uniforme : blouse médicale avec col, poche et stéthoscope. */
function UniformeArt({ c, uid }) {
  return (
    <>
      <defs>
        <linearGradient id={`coat-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1F5F9" />
        </linearGradient>
      </defs>
      {/* Cintre */}
      <path d="M80 6 Q86 6 86 11 Q86 15 80 17" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M80 17 L48 30 M80 17 L112 30" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      {/* Blouse */}
      <path
        d="M58 26 L80 36 L102 26 L124 38 L134 70 L118 74 L114 60 L114 108 Q114 112 110 112 H50 Q46 112 46 108 L46 60 L42 74 L26 70 L36 38 Z"
        fill={`url(#coat-${uid})`} stroke={c} strokeWidth="2.5" strokeLinejoin="round"
      />
      {/* Col en V coloré */}
      <path d="M58 26 L80 36 L102 26 L94 24 L80 30 L66 24 Z" fill={c} />
      <path d="M80 36 L72 60 M80 36 L88 60" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M80 60 V110" stroke={c} strokeOpacity="0.35" strokeWidth="1.5" />
      {/* Boutons */}
      {[70, 84, 98].map((y) => <circle key={y} cx="80" cy={y} r="2.3" fill={c} />)}
      {/* Poche + badge */}
      <rect x="92" y="66" width="16" height="13" rx="3" fill="none" stroke={c} strokeWidth="2" />
      <rect x="54" y="66" width="16" height="10" rx="2" fill={c} opacity="0.85" />
      {/* Stéthoscope */}
      <path d="M68 40 Q60 62 66 78 Q72 90 84 88" fill="none" stroke={c} strokeOpacity="0.8" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="87" cy="88" r="4.5" fill="#FFFFFF" stroke={c} strokeWidth="2.5" />
    </>
  );
}

const ARTS = { service: ServiceArt, chambre: ChambreArt, uniforme: UniformeArt };

/** Illustration complète : halo, sol, objet, pastille de flux (collecte / distribution). */
export function TypeIllustration({ kind, color, mode }) {
  const uid = useId().replace(/:/g, "");
  const Art = ARTS[kind] || ServiceArt;
  return (
    <svg viewBox="0 0 160 132" className="tl-art" aria-hidden="true">
      <circle cx="80" cy="64" r="58" fill={color} opacity="0.08" />
      <circle cx="80" cy="64" r="44" fill={color} opacity="0.07" />
      <ellipse cx="80" cy="118" rx="58" ry="5" fill="#0F172A" opacity="0.07" />
      <g transform="translate(0 6)">
        <Art c={color} uid={uid} />
      </g>
      {/* Pastille de flux : entrée vers la buanderie (collecte) ou sortie (distribution) */}
      <g transform="translate(130 10)">
        <circle cx="12" cy="12" r="12" fill="#FFFFFF" stroke={color} strokeWidth="2" />
        {mode === "collecte" ? (
          <path d="M16 8 L8 16 M8 10 V16 H14" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M8 16 L16 8 M10 8 H16 V14" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </g>
    </svg>
  );
}

/**
 * Écran de départ : choix du type (collecte ou distribution), centré.
 * types : [{ id, kind, label, description, route, color }]
 * Les touches 1, 2, 3… ouvrent directement le type correspondant.
 */
export function TypeLauncher({ title, subtitle, types, mode }) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < types.length) navigate(types[idx].route);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [types, navigate]);

  return (
    <div className="tl-stage">
      <div className="tl-intro">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="tl-grid">
        {types.map((type, i) => (
          <motion.button
            key={type.id}
            type="button"
            className="tl-card"
            style={{ "--c": type.color }}
            onClick={() => navigate(type.route)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, type: "spring", stiffness: 260, damping: 24 }}
          >
            <span className="tl-card__key">{i + 1}</span>
            <div className="tl-card__art">
              <TypeIllustration kind={type.kind} color={type.color} mode={mode} />
            </div>
            <div className="tl-card__text">
              <span className="tl-card__label">{type.label}</span>
              <span className="tl-card__desc">{type.description}</span>
            </div>
            <span className="tl-card__go">
              <ArrowRight size={18} strokeWidth={2.4} />
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default TypeLauncher;
