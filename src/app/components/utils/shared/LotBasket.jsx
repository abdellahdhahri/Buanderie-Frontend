import React, { useId } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import "./LotBasket.css";
import { getSetting } from "../../../utils/appSettings";

// Seuil « lot plein » réglé dans Paramètres › Seuils (orange 20 points avant)
export const getSeuilPlein = () => Number(getSetting("thresholds.lotFullPct")) || 80;

// Couleur selon le taux de remplissage du lot
export function getFillTone(pct) {
  if (pct == null) return { main: "#0284C7", soft: "#E0F2FE", deep: "#075985" };
  const plein = getSeuilPlein();
  if (pct >= plein) return { main: "#E11D48", soft: "#FFE4E6", deep: "#9F1239" };
  if (pct >= plein - 20) return { main: "#D97706", soft: "#FEF3C7", deep: "#92400E" };
  return { main: "#0D9488", soft: "#CCFBF1", deep: "#115E59" };
}

// Géométrie du panier (viewBox 0 0 220 210)
const BODY = "M34 70 L186 70 L170 192 Q169 200 160 200 L60 200 Q51 200 50 192 Z";
const INNER_TOP = 72;
const INNER_BOTTOM = 199;

/**
 * Panier à linge SVG : le linge monte selon le poids actuel / capacité.
 * Affiche le code du lot sur l'étiquette et le poids actuel.
 */
export function LotBasketSvg({ code, poids, capacite }) {
  const uid = useId().replace(/:/g, "");
  // Capacité inconnue : niveau indicatif si le lot contient du linge
  const pct = capacite > 0 ? Math.min((poids / capacite) * 100, 100) : null;
  const tone = getFillTone(pct);
  const level = pct ?? (poids > 0 ? 55 : 0);

  const fillHeight = ((INNER_BOTTOM - INNER_TOP) * level) / 100;
  const fillTop = INNER_BOTTOM - fillHeight;
  const codeText = code || "—";
  const longCode = codeText.length > 11;

  return (
    <svg viewBox="0 0 220 210" className="lot-basket__svg" role="img" aria-label={`${codeText} — ${poids.toFixed(1)} kg`}>
      <defs>
        <clipPath id={`body-${uid}`}>
          <path d={BODY} />
        </clipPath>
        <linearGradient id={`wicker-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`linen-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone.main} stopOpacity="0.55" />
          <stop offset="100%" stopColor={tone.main} stopOpacity="0.9" />
        </linearGradient>
        <pattern id={`weave-${uid}`} width="16" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 6 Q4 2 8 6 T16 6" fill="none" stroke="#94A3B8" strokeOpacity="0.35" strokeWidth="1.2" />
        </pattern>
      </defs>

      {/* Ombre au sol */}
      <ellipse cx="110" cy="203" rx="62" ry="5" fill="#0F172A" opacity="0.08" />

      {/* Poignées */}
      <path d="M52 70 C52 40 82 40 82 62" fill="none" stroke="#94A3B8" strokeWidth="7" strokeLinecap="round" />
      <path d="M138 62 C138 40 168 40 168 70" fill="none" stroke="#94A3B8" strokeWidth="7" strokeLinecap="round" />

      {/* Corps du panier */}
      <path d={BODY} fill={`url(#wicker-${uid})`} />

      <g clipPath={`url(#body-${uid})`}>
        {/* Linge à l'intérieur, monte avec le poids */}
        <motion.g
          initial={{ y: fillHeight }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <rect x="20" y={fillTop + 6} width="180" height={fillHeight + 10} fill={`url(#linen-${uid})`} />
          {level > 0 && (
            <path
              d={`M20 ${fillTop + 8} Q45 ${fillTop - 4} 70 ${fillTop + 4} T120 ${fillTop + 2} T170 ${fillTop + 4} T200 ${fillTop + 2} L200 ${fillTop + 14} L20 ${fillTop + 14} Z`}
              fill={tone.main}
              opacity="0.65"
            />
          )}
        </motion.g>

        {/* Tressage + montants */}
        <rect x="0" y="70" width="220" height="140" fill={`url(#weave-${uid})`} />
        {[62, 86, 110, 134, 158].map((x) => (
          <line key={x} x1={x} y1="70" x2={x + (x - 110) * -0.1} y2="200" stroke="#94A3B8" strokeOpacity="0.28" strokeWidth="1.5" />
        ))}
      </g>

      <path d={BODY} fill="none" stroke="#94A3B8" strokeWidth="2" />

      {/* Rebord */}
      <rect x="26" y="62" width="168" height="14" rx="7" fill="#CBD5E1" />
      <rect x="26" y="62" width="168" height="5" rx="2.5" fill="#FFFFFF" opacity="0.6" />

      {/* Étiquette : code + poids */}
      <g>
        <rect x="56" y="104" width="108" height="62" rx="10" fill="#FFFFFF" stroke={tone.main} strokeOpacity="0.35" strokeWidth="1.5" />
        <circle cx="110" cy="104" r="3" fill={tone.main} />
        <text
          x="110" y="126" textAnchor="middle" className="lot-basket__code" fill="#0F172A"
          {...(longCode ? { textLength: 96, lengthAdjust: "spacingAndGlyphs" } : {})}
        >
          {codeText}
        </text>
        <text x="110" y="153" textAnchor="middle" className="lot-basket__weight" fill={tone.deep}>
          {poids.toFixed(1)}
          <tspan className="lot-basket__unit" dx="3">kg</tspan>
        </text>
      </g>
    </svg>
  );
}

/**
 * Carte cliquable d'un lot (dialogue de tri, écrans lavage / séchage).
 * selected : affiche l'état sélectionné (coche + contour).
 */
export function LotBasketCard({ lot, onSelect, t, selected = false }) {
  const poids = Number(lot.poidsActuel) || 0;
  const capacite = Number(lot.capaciteMax) || 0;
  const pct = capacite > 0 ? (poids / capacite) * 100 : null;
  const tone = getFillTone(pct);
  const estPlein = pct != null && pct >= getSeuilPlein();
  const nbPieces = lot.nbPieces ?? lot.quantite;

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`lot-basket${selected ? " is-selected" : ""}`}
      style={{ "--tone": tone.main, "--tone-soft": tone.soft }}
      onClick={() => onSelect?.(lot)}
    >
      {selected && (
        <span className="lot-basket__check" aria-hidden="true">
          <Check size={13} strokeWidth={3} />
        </span>
      )}
      {pct != null && <span className="lot-basket__pct">{Math.round(pct)}%</span>}

      <LotBasketSvg code={lot.codeLot} poids={poids} capacite={capacite} />

      <div className="lot-basket__meta">
        <span className="lot-basket__chip">{t(`categories.${lot.categorie}`, lot.categorie || "—")}</span>
        {lot.typeCollecte && <span className="lot-basket__chip">{lot.typeCollecte}</span>}
        {nbPieces != null && <span className="lot-basket__chip">{nbPieces} {t("lavage.items")}</span>}
      </div>

      {pct != null && (
        <div className="lot-basket__gauge">
          <div className="lot-basket__gauge-track">
            <div className="lot-basket__gauge-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <span className="lot-basket__capacity">
            {poids.toFixed(1)} / {capacite} kg
          </span>
        </div>
      )}

      {estPlein && <span className="lot-basket__warn">{t("tri.full")}</span>}
    </button>
  );
}
