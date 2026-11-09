import React, { useId } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// Illustrations SVG du stockage arsenal (viewBox 0 0 160 132), teintées par
// la couleur passée en `c` — même principe que TypeLauncher.
// ═══════════════════════════════════════════════════════════════════════════

/** Pile de linge plié (réutilisée par plusieurs illustrations). */
function Stack({ x, y, w = 26, layers = 3, c, tones = [1, 0.7, 0.45] }) {
  return (
    <g>
      {Array.from({ length: layers }).map((_, i) => (
        <g key={i}>
          <rect x={x} y={y - (i + 1) * 7} width={w} height="7" rx="2.5" fill={c} opacity={tones[i % tones.length]} />
          <path d={`M${x + 3} ${y - (i + 1) * 7 + 2.5} H${x + w - 6}`} stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

/** Arsenal : rayonnage à trois niveaux garni de piles de linge. */
function ArsenalArt({ c, uid }) {
  return (
    <>
      <defs>
        <linearGradient id={`ars-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.95" />
          <stop offset="100%" stopColor={c} stopOpacity="0.75" />
        </linearGradient>
      </defs>
      {/* Fronton */}
      <path d="M28 26 L80 8 L132 26 Z" fill={`url(#ars-${uid})`} />
      <rect x="72" y="14" width="16" height="7" rx="2" fill="#FFFFFF" opacity="0.9" />
      {/* Montants */}
      <rect x="30" y="26" width="7" height="82" rx="2.5" fill={c} />
      <rect x="123" y="26" width="7" height="82" rx="2.5" fill={c} />
      {/* Fond */}
      <rect x="37" y="26" width="86" height="82" fill={c} opacity="0.08" />
      {/* Tablettes */}
      {[50, 76, 102].map((y) => (
        <rect key={y} x="30" y={y} width="100" height="5" rx="2" fill={c} opacity="0.9" />
      ))}
      {/* Linges rangés */}
      <Stack x={42} y={50} c={c} layers={3} />
      <Stack x={72} y={50} c="#94A3B8" layers={2} />
      <Stack x={96} y={50} c={c} layers={3} tones={[0.55, 0.8, 1]} />
      <Stack x={44} y={76} c="#94A3B8" layers={3} />
      <Stack x={78} y={76} c={c} layers={2} tones={[0.8, 0.5]} />
      <Stack x={50} y={102} c={c} layers={3} tones={[0.6, 0.9, 0.6]} />
      <Stack x={88} y={102} c={c} layers={2} />
    </>
  );
}

/** Badge agent : carte nominative, cordon et faisceau de scan. */
function BadgeArt({ c, uid }) {
  return (
    <>
      <defs>
        <linearGradient id={`bdg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.95" />
          <stop offset="100%" stopColor={c} stopOpacity="0.78" />
        </linearGradient>
      </defs>
      {/* Cordon */}
      <path d="M62 4 L76 26 M98 4 L84 26" stroke={c} strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" />
      <rect x="72" y="22" width="16" height="10" rx="3" fill={c} />
      {/* Carte */}
      <rect x="44" y="30" width="72" height="84" rx="10" fill="#FFFFFF" stroke={c} strokeWidth="2.5" />
      <rect x="44" y="30" width="72" height="24" rx="10" fill={`url(#bdg-${uid})`} />
      <rect x="44" y="44" width="72" height="10" fill={`url(#bdg-${uid})`} />
      <rect x="70" y="36" width="20" height="5" rx="2.5" fill="#FFFFFF" opacity="0.8" />
      {/* Avatar */}
      <circle cx="80" cy="64" r="11" fill={c} opacity="0.15" />
      <circle cx="80" cy="61" r="4.5" fill={c} />
      <path d="M71.5 72 Q80 64 88.5 72" fill={c} />
      {/* Nom */}
      <rect x="62" y="80" width="36" height="4" rx="2" fill={c} opacity="0.5" />
      {/* Code-barres */}
      {[0, 3, 5, 9, 11, 14, 18, 20, 23, 27, 29, 32].map((dx, i) => (
        <rect key={i} x={62 + dx} y="90" width={i % 3 === 0 ? 2 : 1.2} height="14" fill="#0F172A" opacity="0.75" />
      ))}
      {/* Faisceau */}
      <rect x="36" y="96" width="88" height="2.5" rx="1.25" fill="#EF4444" opacity="0.85" />
      <rect x="36" y="92" width="88" height="10" rx="5" fill="#EF4444" opacity="0.12" />
    </>
  );
}

/** Remise : chariot de linge propre. */
function RemiseArt({ c }) {
  return (
    <>
      {/* Poignée */}
      <path d="M126 40 V30 Q126 24 132 24 H138" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
      {/* Caisse */}
      <path d="M26 46 H130 L124 100 H32 Z" fill={c} opacity="0.18" stroke={c} strokeWidth="2.5" strokeLinejoin="round" />
      {/* Linges dépassant */}
      <Stack x={36} y={58} w={28} c={c} layers={3} />
      <Stack x={68} y={58} w={26} c="#94A3B8" layers={2} />
      <Stack x={98} y={58} w={24} c={c} layers={3} tones={[0.5, 0.75, 1]} />
      <path d="M30 58 H128" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      {/* Étiquette remise */}
      <rect x="62" y="72" width="34" height="16" rx="4" fill="#FFFFFF" stroke={c} strokeWidth="2" />
      <path d="M68 80 H90" stroke={c} strokeWidth="2" strokeLinecap="round" />
      {/* Roues */}
      <circle cx="44" cy="108" r="7" fill="#FFFFFF" stroke={c} strokeWidth="3" />
      <circle cx="112" cy="108" r="7" fill="#FFFFFF" stroke={c} strokeWidth="3" />
    </>
  );
}

/** Comptage : pile de linge et bulle numérique. */
function CountArt({ c }) {
  return (
    <>
      <Stack x={44} y={108} w={58} c={c} layers={1} />
      <Stack x={46} y={101} w={54} c="#94A3B8" layers={1} />
      <Stack x={44} y={94} w={58} c={c} layers={1} tones={[0.75]} />
      <Stack x={47} y={87} w={52} c={c} layers={1} tones={[0.5]} />
      <Stack x={45} y={80} w={56} c="#94A3B8" layers={1} tones={[0.6]} />
      <Stack x={46} y={73} w={54} c={c} layers={1} />
      {/* Bulle */}
      <g transform="translate(96 14)">
        <rect width="46" height="34" rx="10" fill="#FFFFFF" stroke={c} strokeWidth="2.5" />
        <path d="M10 34 L6 44 L20 34" fill="#FFFFFF" stroke={c} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="8" y="33" width="14" height="3" fill="#FFFFFF" />
        <path d="M16 10 L13 25 M25 10 L22 25 M11 15 H28 M10 20 H27" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="36" cy="17" r="3" fill={c} />
      </g>
      {/* Doigt de comptage */}
      <path d="M108 70 Q118 66 122 74" fill="none" stroke={c} strokeOpacity="0.5" strokeWidth="2" strokeDasharray="3 4" strokeLinecap="round" />
    </>
  );
}

/** Étagère : un niveau mis en évidence avec son étiquette code-barres. */
function ShelfArt({ c }) {
  return (
    <>
      <rect x="30" y="16" width="7" height="96" rx="2.5" fill={c} opacity="0.55" />
      <rect x="123" y="16" width="7" height="96" rx="2.5" fill={c} opacity="0.55" />
      {/* Niveaux */}
      <rect x="30" y="40" width="100" height="4" rx="2" fill={c} opacity="0.4" />
      <rect x="30" y="98" width="100" height="4" rx="2" fill={c} opacity="0.4" />
      {/* Niveau actif */}
      <rect x="22" y="50" width="116" height="40" rx="8" fill={c} opacity="0.12" stroke={c} strokeWidth="2" strokeDasharray="5 4" />
      <rect x="30" y="72" width="100" height="5" rx="2" fill={c} />
      <Stack x={44} y={72} c={c} layers={2} />
      <Stack x={76} y={72} c="#94A3B8" layers={2} />
      {/* Étiquette */}
      <rect x="100" y="78" width="26" height="12" rx="2" fill="#FFFFFF" stroke={c} strokeWidth="1.5" />
      {[0, 2, 4, 7, 9, 12, 14, 17].map((dx, i) => (
        <rect key={i} x={104 + dx} y="81" width="1.2" height="6" fill="#0F172A" opacity="0.75" />
      ))}
      {/* Faisceau */}
      <rect x="18" y="83" width="124" height="2" rx="1" fill="#EF4444" opacity="0.8" />
    </>
  );
}

/** Localisation : repère au-dessus d'un rayonnage. */
function LocateArt({ c, uid }) {
  return (
    <>
      <defs>
        <linearGradient id={`pin-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} />
          <stop offset="100%" stopColor={c} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <rect x="22" y="64" width="116" height="44" rx="6" fill={c} opacity="0.08" />
      {[64, 86, 108].map((y) => (
        <rect key={y} x="22" y={y} width="116" height="4" rx="2" fill={c} opacity="0.45" />
      ))}
      <Stack x={30} y={86} c="#94A3B8" layers={2} />
      <Stack x={60} y={86} c={c} layers={3} />
      <Stack x={98} y={86} c="#94A3B8" layers={2} />
      <Stack x={36} y={108} c={c} layers={2} tones={[0.6, 0.85]} />
      <Stack x={104} y={108} c="#94A3B8" layers={3} />
      {/* Repère */}
      <ellipse cx="73" cy="64" rx="12" ry="3.5" fill={c} opacity="0.25" />
      <path d="M73 62 C60 46 56 40 56 31 A17 17 0 0 1 90 31 C90 40 86 46 73 62 Z" fill={`url(#pin-${uid})`} />
      <circle cx="73" cy="31" r="6.5" fill="#FFFFFF" />
    </>
  );
}

/** Terminé : coche sur une pile rangée. */
function DoneArt({ c }) {
  return (
    <>
      <rect x="30" y="98" width="100" height="5" rx="2" fill={c} opacity="0.5" />
      <Stack x={40} y={98} c={c} layers={3} />
      <Stack x={68} y={98} c="#94A3B8" layers={2} />
      <Stack x={94} y={98} c={c} layers={3} tones={[0.5, 0.75, 1]} />
      <circle cx="80" cy="44" r="26" fill={c} />
      <circle cx="80" cy="44" r="26" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="4" />
      <path d="M68 44 L77 53 L93 36" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/** Vide : carton ouvert. */
function EmptyArt({ c }) {
  return (
    <>
      <path d="M40 58 L80 46 L120 58 L80 70 Z" fill={c} opacity="0.2" />
      <path d="M40 58 V100 L80 112 V70 Z" fill={c} opacity="0.35" />
      <path d="M120 58 V100 L80 112 V70 Z" fill={c} opacity="0.55" />
      <path d="M40 58 L26 44 L66 32 L80 46" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M120 58 L134 44 L94 32 L80 46" fill={c} opacity="0.4" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M68 86 L74 90 M92 84 L86 88" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

const ARTS = {
  arsenal: ArsenalArt,
  badge: BadgeArt,
  remise: RemiseArt,
  count: CountArt,
  shelf: ShelfArt,
  locate: LocateArt,
  done: DoneArt,
  empty: EmptyArt,
};

/** Illustration complète : halo, ombre au sol et objet. */
export function Illustration({ kind, color = "#0794a4", className = "sa-art" }) {
  const uid = useId().replace(/:/g, "");
  const Art = ARTS[kind] || EmptyArt;
  return (
    <svg viewBox="0 0 160 132" className={className} aria-hidden="true">
      <circle cx="80" cy="64" r="58" fill={color} opacity="0.08" />
      <circle cx="80" cy="64" r="44" fill={color} opacity="0.07" />
      <ellipse cx="80" cy="122" rx="58" ry="5" fill="#0F172A" opacity="0.07" />
      <g transform="translate(0 4)">
        <Art c={color} uid={uid} />
      </g>
    </svg>
  );
}

/** Mini-étagère (icône 24×24) pour les tuiles d'emplacement. */
export function ShelfGlyph({ size = 22, filled = 0 }) {
  // filled : 0 → vide, 1 → quelques linges, 2 → bien garni
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 3v18M20 3v18M4 12h16M4 20h16" />
      {filled > 0 && <rect x="6.5" y="7.5" width="5" height="4" rx="1" fill="currentColor" stroke="none" opacity="0.55" />}
      {filled > 1 && <rect x="12.5" y="15.5" width="5" height="4" rx="1" fill="currentColor" stroke="none" opacity="0.55" />}
    </svg>
  );
}

/** Anneau de progression (rangés / total). */
export function ProgressRing({ value, total, size = 132, color = "#0794a4", label }) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const ratio = total > 0 ? Math.min(value / total, 1) : 0;
  return (
    <div className="sa-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="sa-ring__track" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - ratio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.34, 1.2, 0.64, 1)" }}
        />
      </svg>
      <div className="sa-ring__center">
        <strong>{value}<span>/{total}</span></strong>
        {label && <small>{label}</small>}
      </div>
    </div>
  );
}

/** Anneau segmenté par catégorie (stock de l'arsenal). */
export function CategoryDonut({ counts, colorOf, size = 140, children }) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const entries = Object.entries(counts || {}).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  let offset = 0;
  return (
    <div className="sa-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="sa-ring__track" strokeWidth={stroke} />
        {total > 0 &&
          entries.map(([cat, v]) => {
            const len = (v / total) * circ;
            const seg = (
              <circle
                key={cat}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={colorOf(cat)}
                strokeWidth={stroke}
                strokeDasharray={`${Math.max(len - 2, 0.5)} ${circ}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offset += len;
            return seg;
          })}
      </svg>
      <div className="sa-ring__center">{children}</div>
    </div>
  );
}
