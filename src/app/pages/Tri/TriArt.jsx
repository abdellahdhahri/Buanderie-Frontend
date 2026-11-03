import React, { useId } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// Illustrations SVG du tri : linge orienté vers des lots (paniers colorés).
// ═══════════════════════════════════════════════════════════════════════════

/** Petit glyphe : une pièce de linge aiguillée vers deux paniers. */
export function SortGlyph({ size = 40, c = "#e67700" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="17" y="4" width="14" height="9" rx="3" fill={c} />
      <path d="M20 8.5h8" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M24 14v6M24 20l-10 7M24 20l10 7" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <path d="M5 29h18l-2 13a2.5 2.5 0 0 1-2.5 2H9.5A2.5 2.5 0 0 1 7 42L5 29z" fill={c} opacity="0.85" />
      <path d="M25 29h18l-2 13a2.5 2.5 0 0 1-2.5 2h-9A2.5 2.5 0 0 1 27 42l-2-13z" fill={c} opacity="0.45" />
      <rect x="4" y="27.5" width="20" height="3.4" rx="1.7" fill={c} />
      <rect x="24" y="27.5" width="20" height="3.4" rx="1.7" fill={c} opacity="0.7" />
    </svg>
  );
}

/** État vide de l'historique : linge en attente au-dessus de trois lots. */
export function SortArt({ c = "#e67700", width = 150 }) {
  const uid = useId().replace(/:/g, "");
  const lots = [
    { x: 12, tone: "#0d9488" },
    { x: 58, tone: c },
    { x: 104, tone: "#7c3aed" },
  ];
  return (
    <svg width={width} viewBox="0 0 150 110" fill="none" aria-hidden="true" style={{ display: "block", maxWidth: "100%" }}>
      <defs>
        <linearGradient id={`drop-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <ellipse cx="75" cy="102" rx="64" ry="5" fill={c} opacity="0.08" />
      {/* Pièce de linge pliée */}
      <g className="rc-beam" style={{ animationDuration: "3s" }}>
        <rect x="60" y="6" width="30" height="9" rx="3.5" fill={`url(#drop-${uid})`} />
        <rect x="63" y="15" width="24" height="7" rx="3" fill={c} opacity="0.45" />
      </g>
      <path d="M75 34v8" stroke={c} strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 4" />
      {/* Lots */}
      {lots.map(({ x, tone }) => (
        <g key={x}>
          <path d={`M${x} 58h34l-4 36a4 4 0 0 1-4 3.5H${x + 8}a4 4 0 0 1-4-3.5L${x} 58z`} fill={tone} opacity="0.16" />
          <rect x={x - 2} y="53" width="38" height="7" rx="3.5" fill={tone} opacity="0.55" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={x + 9 + i * 7} y="66" width="3.4" height="20" rx="1.7" fill={tone} opacity="0.3" />
          ))}
        </g>
      ))}
    </svg>
  );
}
