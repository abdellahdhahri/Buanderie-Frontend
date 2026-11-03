import React, { useId } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// Illustrations SVG de la réception, teintées par la couleur `c`.
// ═══════════════════════════════════════════════════════════════════════════

/** Bac de linge sale : caisse ajourée garnie de linge. */
export function BacGlyph({ size = 40, c = "#0284c7" }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`bac-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.95" />
          <stop offset="100%" stopColor={c} stopOpacity="0.72" />
        </linearGradient>
      </defs>
      {/* Linge qui dépasse */}
      <path d="M13 17c2-4 6-6 10-5 3-3 9-3 12 1 2 0 3 1 3 4H13z" fill={c} opacity="0.28" />
      <path d="M17 16c2-2 5-3 8-2" stroke={c} strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
      {/* Caisse */}
      <path d="M8 18h32l-3 21a3 3 0 0 1-3 2.6H14a3 3 0 0 1-3-2.6L8 18z" fill={`url(#bac-${uid})`} />
      <rect x="6" y="15.5" width="36" height="5" rx="2.5" fill={c} />
      {/* Ajours */}
      {[16, 22, 28].map((x) => (
        <rect key={x} x={x} y="25" width="4" height="10" rx="2" fill="#fff" opacity="0.42" />
      ))}
      <path d="M11 22.5h26" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Sac infecté : sac fermé par un lien, pictogramme de risque biologique. */
export function SacGlyph({ size = 40, c = "#e03131" }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`sac-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.95" />
          <stop offset="100%" stopColor={c} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path d="M19 6c1.5 2 3 3 5 3s3.5-1 5-3l1.5 6h-13L19 6z" fill={c} opacity="0.55" />
      <rect x="17" y="11" width="14" height="3.4" rx="1.7" fill={c} />
      <path d="M18 14.5C11 18 8 25 9 32c1 6 6 10 15 10s14-4 15-10c1-7-2-14-9-17.5H18z" fill={`url(#sac-${uid})`} />
      {/* Risque biologique stylisé */}
      <g stroke="#fff" strokeOpacity="0.92" strokeWidth="1.8" fill="none">
        <circle cx="24" cy="23.5" r="3.6" />
        <circle cx="19.4" cy="31.3" r="3.6" />
        <circle cx="28.6" cy="31.3" r="3.6" />
      </g>
      <circle cx="24" cy="28.6" r="1.6" fill="#fff" />
      <path d="M14 21c-1.5 2.5-2 5-2 7.5" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Linge plié (pile de trois pièces). */
export function LingeGlyph({ size = 40, c = "#0ca678" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="9" y="30" width="30" height="8" rx="3" fill={c} opacity="0.5" />
      <rect x="11" y="22" width="26" height="8" rx="3" fill={c} opacity="0.75" />
      <rect x="13" y="14" width="22" height="8" rx="3" fill={c} />
      {[17, 25, 33].map((y, i) => (
        <path key={y} d={`M${15 - i * 2} ${y + 0.5}H${30 + i * 2}`} stroke="#fff" strokeOpacity="0.5" strokeWidth="1.3" strokeLinecap="round" />
      ))}
      <path d="M33 10l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill={c} opacity="0.7" />
    </svg>
  );
}

/** Code-barres balayé par un faisceau (en-tête de la zone de scan). */
export function ScannerGlyph({ size = 52, c = "#e67700" }) {
  const bars = [3, 1.5, 2.5, 1, 3, 1.5, 1, 2.5, 1.5, 3, 1, 2];
  let x = 12;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="52" height="52" rx="16" fill={c} opacity="0.1" />
      <path d="M10 17v-4a3 3 0 0 1 3-3h4M39 10h4a3 3 0 0 1 3 3v4M46 39v4a3 3 0 0 1-3 3h-4M17 46h-4a3 3 0 0 1-3-3v-4" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      {bars.map((w, i) => {
        const r = <rect key={i} x={x} y="17" width={w} height="22" rx="0.6" fill={c} opacity={i % 3 === 0 ? 0.95 : 0.7} />;
        x += w + 1.6;
        return r;
      })}
      <g className="rc-beam">
        <rect x="8" y="16" width="40" height="2.4" rx="1.2" fill={c} />
        <rect x="8" y="12" width="40" height="6" rx="3" fill={c} opacity="0.15" />
      </g>
    </svg>
  );
}

/** Accueil : badge agent présenté à un lecteur. */
export function BadgeScanArt({ c = "#e67700", width = 220 }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg width={width} viewBox="0 0 220 170" fill="none" aria-hidden="true" style={{ display: "block", maxWidth: "100%" }}>
      <defs>
        <linearGradient id={`card-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fd9a2b" />
          <stop offset="100%" stopColor={c} />
        </linearGradient>
        <linearGradient id={`beam-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c} stopOpacity="0" />
          <stop offset="50%" stopColor={c} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Sol */}
      <ellipse cx="110" cy="156" rx="88" ry="8" fill={c} opacity="0.08" />
      {/* Lecteur */}
      <rect x="128" y="62" width="62" height="90" rx="14" fill={c} opacity="0.14" />
      <rect x="136" y="72" width="46" height="30" rx="7" fill={c} opacity="0.3" />
      <rect x="141" y="80" width="36" height="3" rx="1.5" fill={c} opacity="0.55" />
      <rect x="141" y="87" width="24" height="3" rx="1.5" fill={c} opacity="0.35" />
      <circle cx="159" cy="124" r="10" fill={c} opacity="0.22" />
      <circle cx="159" cy="124" r="4.5" fill={c} />
      {/* Faisceau */}
      <rect className="rc-beam" x="96" y="70" width="40" height="3" rx="1.5" fill={`url(#beam-${uid})`} />
      {/* Badge */}
      <g transform="rotate(-8 70 90)">
        <rect x="28" y="40" width="88" height="110" rx="14" fill={`url(#card-${uid})`} />
        <rect x="62" y="32" width="20" height="14" rx="5" fill={c} opacity="0.6" />
        <rect x="66" y="36" width="12" height="4" rx="2" fill="#fff" opacity="0.8" />
        <circle cx="72" cy="78" r="16" fill="#fff" opacity="0.92" />
        <circle cx="72" cy="74" r="6" fill={c} opacity="0.75" />
        <path d="M61 88c2-6 7-8 11-8s9 2 11 8" fill={c} opacity="0.75" />
        <rect x="46" y="102" width="52" height="5" rx="2.5" fill="#fff" opacity="0.85" />
        <rect x="54" y="112" width="36" height="4" rx="2" fill="#fff" opacity="0.55" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <rect key={i} x={47 + i * 5.2} y="124" width={i % 3 === 0 ? 2.6 : 1.6} height="14" rx="0.6" fill="#fff" opacity="0.8" />
        ))}
      </g>
      {/* Étincelles */}
      <path d="M196 40l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={c} opacity="0.5" />
      <circle cx="24" cy="34" r="3" fill={c} opacity="0.3" />
    </svg>
  );
}

/** État vide : panier de linge vide. */
export function EmptyBasketArt({ c = "#8892a4", size = 92 }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 110 88" fill="none" aria-hidden="true">
      <ellipse cx="55" cy="80" rx="40" ry="5" fill={c} opacity="0.12" />
      <path d="M18 34h74l-7 38a6 6 0 0 1-6 5H31a6 6 0 0 1-6-5l-7-38z" fill={c} opacity="0.16" />
      <rect x="14" y="28" width="82" height="9" rx="4.5" fill={c} opacity="0.32" />
      {[34, 46, 58, 70].map((x) => (
        <rect key={x} x={x} y="44" width="6" height="24" rx="3" fill={c} opacity="0.22" />
      ))}
      <path d="M40 18c4-6 10-8 15-8s11 2 15 8" stroke={c} strokeOpacity="0.35" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 5" />
    </svg>
  );
}
