import React from "react";
import { useTranslation } from "react-i18next";
import { Check, LoaderCircle } from "lucide-react";
import { accentOf } from "./arsenalUtils";
import { Illustration, ShelfGlyph } from "./illustrations";

/** Carte de contenu ; `title` + `icon` + `right` forment l'en-tête. */
export function Panel({ title, icon, right, children, className = "" }) {
  return (
    <section className={`sa-panel ${className}`}>
      {(title || right) && (
        <div className="sa-panel__head">
          {title && (
            <h2 className="sa-panel__title">
              {icon && <span className="sa-panel__title-icon">{icon}</span>}
              {title}
            </h2>
          )}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

/** Illustration + consigne de l'étape, puis le contenu (scan, saisie…). */
export function Hero({ art, eyebrow, title, text, children }) {
  return (
    <div className="sa-hero">
      <Illustration kind={art} />
      <div>
        {eyebrow && <span className="sa-hero__eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {text && <p>{text}</p>}
        {children}
      </div>
    </div>
  );
}

export function Loading({ label }) {
  const { t } = useTranslation();
  return (
    <div className="sa-loading">
      <LoaderCircle size={18} className="animate-spin" />
      {label || t("common.loading")}
    </div>
  );
}

export function EmptyState({ art = "empty", title, children }) {
  return (
    <div className="sa-empty">
      <Illustration kind={art} />
      {title && <strong>{title}</strong>}
      {children && <span>{children}</span>}
    </div>
  );
}

/** Pastilles « catégorie : quantité » à partir d'un objet { DRAP: 3, ... }. */
export function CategoryChips({ counts, size = "md" }) {
  const { t } = useTranslation();
  const entries = Object.entries(counts || {});
  if (!entries.length) return null;
  return (
    <div className="sa-chips">
      {entries.map(([categorie, qte]) => (
        <span key={categorie} className={`sa-cat ${size === "sm" ? "sa-cat--sm" : ""}`} style={{ "--c": accentOf(categorie) }}>
          <i />
          {t(`categories.${categorie}`, categorie)}
          <b>{qte}</b>
        </span>
      ))}
    </div>
  );
}

/** Barre empilée proportionnelle aux quantités par catégorie. */
export function CategoryBar({ counts }) {
  const entries = Object.entries(counts || {}).filter(([, v]) => v > 0);
  return (
    <div className="sa-catbar" aria-hidden="true">
      {entries.map(([categorie, qte]) => (
        <span key={categorie} style={{ flexGrow: qte, background: accentOf(categorie) }} />
      ))}
    </div>
  );
}

/** Grille d'étagères cliquables ; l'étagère active est mise en évidence. */
export function ShelfGrid({ emplacements, activeId, onSelect, compact = false }) {
  const { t } = useTranslation();
  if (!emplacements.length) {
    return <EmptyState title={t("stockageArsenal.no_shelves")} />;
  }
  return (
    <div className={`sa-shelves ${compact ? "sa-shelves--compact" : ""}`}>
      {emplacements.map((emp) => {
        const active = emp.id === activeId;
        return (
          <button key={emp.id} type="button" className={`sa-shelf ${active ? "is-active" : ""}`} onClick={() => onSelect(emp)}>
            <span className="sa-shelf__glyph">
              <ShelfGlyph size={20} filled={active ? 2 : 1} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span className="sa-shelf__name">
                {emp.nom}
                {emp.numero != null && <> · n° {emp.numero}</>}
              </span>
              {emp.codeBarre && <span className="sa-shelf__code" style={{ display: "block" }}>{emp.codeBarre}</span>}
            </span>
            {active && (
              <span className="sa-shelf__check">
                <Check size={13} strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Zone de scan encadrée (pointillés + liseré animé) autour de ScanInput. */
export function ScanZone({ color, children }) {
  return (
    <div className="sa-scan" style={color ? { "--scan": color } : undefined}>
      {children}
    </div>
  );
}
