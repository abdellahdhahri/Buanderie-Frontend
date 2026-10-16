import React, { useEffect, useId } from "react";
import {
  Biohazard, Check, CheckCheck, TriangleAlert, Sparkles, X, ScanLine, SquareCheckBig, Square,
} from "lucide-react";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import "./ChambreLits.css";

// ─── États visuels d'un lit ───────────────────────────────────────────────
export const LIT_TONES = {
  VIDE:     { main: "#94A3B8", soft: "#F1F5F9", label: "Vide" },
  A_FAIRE:  { main: "#7C3AED", soft: "#EDE9FE", label: "À collecter" },
  INFECTE:  { main: "#DC2626", soft: "#FEE2E2", label: "Lit infecté" },
  BLANC:    { main: "#15803D", soft: "#DCFCE7", label: "Blanc" },
  INFECTE_OK: { main: "#B91C1C", soft: "#FEE2E2", label: "Infecté" },
  TRAITE:   { main: "#475569", soft: "#E2E8F0", label: "Traité" },
};

export function getLitTone(lit) {
  if (!lit.linges?.length) return LIT_TONES.VIDE;
  if (lit.statut === "BLANC") return LIT_TONES.BLANC;
  if (lit.statut === "INFECTE") return LIT_TONES.INFECTE_OK;
  if (lit.statut === "TRAITE") return LIT_TONES.TRAITE;
  return lit.estInfecte ? LIT_TONES.INFECTE : LIT_TONES.A_FAIRE;
}

// ─── États d'un linge ─────────────────────────────────────────────────────
const LINGE_STATUTS = {
  BLANC:           { color: "#15803D", soft: "#DCFCE7", label: "Blanc", Icon: CheckCheck },
  INFECTE:         { color: "#DC2626", soft: "#FEE2E2", label: "Infecté", Icon: Biohazard },
  INFECTE_PRESUME: { color: "#DC2626", soft: "#FEE2E2", label: "Infecté", Icon: Biohazard },
  PROPRE:          { color: "#0284C7", soft: "#E0F2FE", label: "Propre", Icon: Sparkles },
  MANQUANT:        { color: "#D97706", soft: "#FEF3C7", label: "Manquant", Icon: TriangleAlert },
};

/**
 * Lit vu de dessus : tête de lit, oreiller, couverture teintée.
 * filled : couverture visible · center : "count" | "check" | "dash".
 */
export function BedGraphic({ tone, filled, center, count = 0, active }) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg viewBox="0 0 120 150" className="bed-svg" aria-hidden="true">
      <defs>
        <linearGradient id={`blanket-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone.main} stopOpacity="0.85" />
          <stop offset="100%" stopColor={tone.main} stopOpacity="0.65" />
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="144" rx="44" ry="4" fill="#0F172A" opacity="0.07" />

      {/* Cadre + tête de lit */}
      <rect x="10" y="8" width="100" height="132" rx="12" fill={tone.soft} stroke={tone.main} strokeOpacity="0.35" strokeWidth="1.5" />
      <rect x="10" y="8" width="100" height="16" rx="8" fill={tone.main} opacity={filled ? 0.9 : 0.35} />

      {/* Matelas */}
      <rect
        x="17" y="24" width="86" height="110" rx="8" fill="#FFFFFF"
        stroke={filled ? "none" : "#CBD5E1"} strokeDasharray={filled ? undefined : "4 4"} strokeWidth="1.5"
      />

      {/* Oreiller */}
      <rect x="31" y="31" width="58" height="20" rx="9" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      <path d="M40 41 Q60 36 80 41" fill="none" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />

      {/* Couverture */}
      {filled && (
        <>
          <rect x="17" y="60" width="86" height="74" rx="8" fill={`url(#blanket-${uid})`} />
          <rect x="17" y="60" width="86" height="11" rx="5" fill="#FFFFFF" opacity="0.35" />
          <path d="M30 90 Q60 84 90 90 M30 108 Q60 102 90 108" fill="none" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {/* Pastille centrale */}
      <circle cx="60" cy="98" r="15" fill="#FFFFFF" opacity="0.95" />
      {center === "dash" ? (
        <path d="M54 98 H66" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      ) : center === "check" ? (
        <path d="M53 98 L58 103 L67 93" fill="none" stroke={tone.main} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <text x="60" y="103" textAnchor="middle" className="bed-svg__count" fill={tone.main}>{count}</text>
      )}

      {/* Anneau du lit sélectionné */}
      {active && (
        <rect x="5" y="3" width="110" height="142" rx="16" fill="none" stroke={tone.main} strokeWidth="2.5" className="bed-svg__ring" />
      )}
    </svg>
  );
}

/** Lit de la collecte : l'état vient des linges du lit. */
export function BedSvg({ lit, active }) {
  const vide = !lit.linges?.length;
  const restants = (lit.linges || []).filter((l) => !l.statut).length;
  return (
    <BedGraphic
      tone={getLitTone(lit)}
      filled={!vide}
      center={vide ? "dash" : lit.statut ? "check" : "count"}
      count={restants}
      active={active}
    />
  );
}

/** Carte de lit générique (collecte et distribution). */
export function BedTile({ tone, code, meta, pill, active, muted, flag, onClick, children }) {
  return (
    <button
      type="button"
      className={`lit-tile${active ? " is-active" : ""}${muted ? " is-empty" : ""}`}
      style={{ "--tone": tone.main, "--tone-soft": tone.soft }}
      onClick={onClick}
      onMouseDown={keepScanFocus}
      aria-disabled={muted || undefined}
      aria-pressed={active}
    >
      {flag && (
        <span className="lit-tile__flag" title="Lit infecté">
          <Biohazard size={12} strokeWidth={2.4} />
        </span>
      )}
      {children}
      <span className="lit-tile__code">Lit {code}</span>
      {meta && <span className="lit-tile__meta">{meta}</span>}
      {pill && <span className="lit-tile__pill">{pill}</span>}
    </button>
  );
}

/** Carte cliquable d'un lit (collecte). */
export function LitTile({ lit, active, onClick }) {
  const tone = getLitTone(lit);
  const total = lit.linges?.length || 0;
  const traites = (lit.linges || []).filter((l) => l.statut).length;
  const vide = total === 0;

  return (
    <BedTile
      tone={tone}
      code={lit.codeLit}
      meta={vide ? "Aucun linge" : `${traites}/${total} linge${total > 1 ? "s" : ""}`}
      pill={tone.label}
      active={active}
      muted={vide}
      flag={lit.estInfecte && !lit.statut}
      onClick={() => onClick(lit)}
    >
      <BedSvg lit={lit} active={active} />
    </BedTile>
  );
}

/** Pile de linge plié, teintée par la catégorie, avec l'icône de la catégorie. */
function LingeSvg({ categorie, statut }) {
  const { Icon, accent } = getCategorieMeta(categorie);
  const color = statut ? LINGE_STATUTS[statut]?.color || accent : accent;
  return (
    <span className="linge-svg" style={{ "--accent": color }}>
      <svg viewBox="0 0 64 56" aria-hidden="true">
        <rect x="6" y="34" width="52" height="14" rx="5" fill={color} opacity="0.22" />
        <rect x="9" y="22" width="46" height="14" rx="5" fill={color} opacity="0.4" />
        <rect x="12" y="8" width="40" height="16" rx="5" fill={color} opacity="0.85" />
        <path d="M12 16 H52" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.5" />
      </svg>
      <span className="linge-svg__icon"><Icon size={14} strokeWidth={2.2} /></span>
    </span>
  );
}

// Garde le focus sur le champ de scan : un toucher ne doit pas le voler
const keepScanFocus = (e) => e.preventDefault();

// Petit retour haptique sur les tablettes qui le supportent
const vibrer = () => { try { navigator.vibrate?.(12); } catch {} };

/** Carte tactile d'un linge : toute la carte coche / décoche. */
function LingeTile({ linge, selectable, checked, onToggle, onPropre, onManquant, onInfecte, t }) {
  const st = LINGE_STATUTS[linge.statut];
  const label = t(`categories.${linge.categorie}`, linge.categorie || "—");

  const toggle = () => {
    if (!selectable) return;
    vibrer();
    onToggle(linge.lingeId);
  };

  return (
    <div
      className={`linge-tile${selectable ? " is-selectable" : ""}${checked ? " is-checked" : ""}${st ? " is-done" : ""}`}
      style={st ? { "--st": st.color, "--st-soft": st.soft } : undefined}
      onClick={toggle}
      onMouseDown={keepScanFocus}
      role={selectable ? "checkbox" : undefined}
      aria-checked={selectable ? checked : undefined}
    >
      <LingeSvg categorie={linge.categorie} statut={linge.statut} />

      <div className="linge-tile__body">
        <span className="linge-tile__label">{label}</span>
        <code className="linge-tile__code">{linge.codeBarre}</code>
        {st ? (
          <span className="linge-tile__status">
            <st.Icon size={12} strokeWidth={2.4} /> {st.label}
          </span>
        ) : (
          <div className="linge-tile__actions" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="act act--propre" title="Déclarer propre" onMouseDown={keepScanFocus} onClick={() => onPropre(linge)}>
              <Sparkles size={15} strokeWidth={2.4} />
            </button>
            <button type="button" className="act act--manquant" title="Déclarer manquant" onMouseDown={keepScanFocus} onClick={() => onManquant(linge)}>
              <TriangleAlert size={15} strokeWidth={2.4} />
            </button>
            <button type="button" className="act act--infecte" title="Déclarer infecté" onMouseDown={keepScanFocus} onClick={() => onInfecte(linge)}>
              <Biohazard size={15} strokeWidth={2.4} />
            </button>
          </div>
        )}
      </div>

      {selectable && (
        <span className="linge-tile__check" aria-hidden="true">
          <Check size={18} strokeWidth={3.2} />
        </span>
      )}
    </div>
  );
}

/**
 * Petit dialogue des linges du lit ouvert, pensé pour l'écran tactile.
 * Le champ de scan reste actif derrière : on scanne le bac / sac sans fermer.
 */
export function LitDialog({
  lit, enSelection, actionSuivante, selection, nbSelectionnables, toutCoche,
  scanStatus, lingeInfecte,
  onToggle, onToggleTout, onFermer, onPropre, onManquant, onInfecte, t,
}) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onFermer(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFermer]);

  const tone = getLitTone(lit);
  const infecte = actionSuivante === "SCANNER_SAC_INFECTE";
  const total = lit.linges.length;
  const traites = lit.linges.filter((l) => l.statut).length;
  const nb = selection.length;

  return (
    <div className="lit-dialog__overlay" onClick={onFermer} onMouseDown={keepScanFocus}>
      <section
        className="lit-dialog"
        style={{ "--tone": tone.main, "--tone-soft": tone.soft }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Lit ${lit.codeLit}`}
      >
        <header className="lit-dialog__head">
          <div className="lit-dialog__bed"><BedSvg lit={lit} active={false} /></div>
          <div className="lit-dialog__title">
            <h3>Lit {lit.codeLit}</h3>
            <p>
              {total} linge{total > 1 ? "s" : ""} · {traites} traité{traites > 1 ? "s" : ""}
              {lit.estInfecte && !lit.statut && <span className="lit-dialog__flag"><Biohazard size={11} /> Infecté</span>}
            </p>
          </div>
          <button type="button" className="lit-dialog__close" onMouseDown={keepScanFocus} onClick={onFermer} aria-label="Fermer">
            <X size={20} />
          </button>
        </header>

        {lingeInfecte && (
          <div className="lit-dialog__banner is-infecte">
            <Biohazard size={18} /> Scannez le sac infecté pour {lingeInfecte.codeBarre}
          </div>
        )}

        <div className="lit-dialog__grid">
          {lit.linges.map((linge) => (
            <LingeTile
              key={linge.lingeId}
              linge={linge}
              selectable={enSelection && !linge.statut}
              checked={selection.includes(linge.lingeId)}
              onToggle={onToggle}
              onPropre={onPropre}
              onManquant={onManquant}
              onInfecte={onInfecte}
              t={t}
            />
          ))}
        </div>

        {enSelection ? (
          <footer className={`lit-dialog__foot${infecte ? " is-infecte" : ""}`}>
            <div className="lit-dialog__next">
              <span className="lit-dialog__scan-icon"><ScanLine size={22} strokeWidth={2.2} /></span>
              <div>
                <strong>
                  {nb} / {nbSelectionnables} coché{nb > 1 ? "s" : ""}
                </strong>
                <span>
                  {scanStatus?.loading
                    ? "Scan en cours…"
                    : scanStatus?.error
                    ? scanStatus.error
                    : nb === 0
                    ? "Touchez les linges collectés"
                    : infecte ? "Scannez le sac rouge" : "Scannez le bac blanc"}
                </span>
              </div>
            </div>
            {nbSelectionnables > 0 && (
              <button type="button" className="lit-dialog__all" onMouseDown={keepScanFocus} onClick={() => { vibrer(); onToggleTout(); }}>
                {toutCoche ? <Square size={18} /> : <SquareCheckBig size={18} />}
                {toutCoche ? "Tout décocher" : "Tout cocher"}
              </button>
            )}
          </footer>
        ) : (
          <footer className="lit-dialog__foot is-readonly">
            <span>Lit déjà traité — consultation seule</span>
            <button type="button" className="lit-dialog__all" onMouseDown={keepScanFocus} onClick={onFermer}>Fermer</button>
          </footer>
        )}
      </section>
    </div>
  );
}

const LEGENDE_COLLECTE = [LIT_TONES.A_FAIRE, LIT_TONES.INFECTE, LIT_TONES.BLANC, LIT_TONES.INFECTE_OK, LIT_TONES.VIDE];

export function LegendeLits({ items = LEGENDE_COLLECTE }) {
  return (
    <div className="lits-legend">
      {items.map((tone) => (
        <span key={tone.label} className="lits-legend__item">
          <span className="lits-legend__dot" style={{ background: tone.main }} />
          {tone.label}
        </span>
      ))}
    </div>
  );
}

