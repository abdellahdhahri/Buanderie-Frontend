import React, { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Check, Copy, Loader2, PenLine, ChevronDown,
  Fingerprint, SlidersHorizontal, MapPin, CalendarClock, Users, StickyNote, BarChart3, Info,
} from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";

/* ═══════════════════════════════════════════════════════════════════════════
   KIT DE MODALES PARTAGÉ
   - DetailModal  : fiche de consultation (bandeau d'identité + blocs)
   - FormModal    : formulaire d'ajout / modification (barre d'actions fixe)
   - Block        : bloc repliable (en-tête avec tuile d'icône + contenu)
   - InfoSection, InfoItem, FormSection, FormField : contenus des blocs
   Construit sur <Modal> (cadre, en-tête, animation, mode sombre).
   ═══════════════════════════════════════════════════════════════════════════ */

// Icônes de bloc prédéfinies, chacune avec sa couleur :
// icon="id" | "specs" | "location" | "dates" | "people" | "notes" | "stats" | "info"
const SECTION_ICONS = {
  id:       { Icon: Fingerprint,       accent: "#0284c7" },
  specs:    { Icon: SlidersHorizontal, accent: "#7c3aed" },
  location: { Icon: MapPin,            accent: "#059669" },
  dates:    { Icon: CalendarClock,     accent: "#d97706" },
  people:   { Icon: Users,             accent: "#db2777" },
  notes:    { Icon: StickyNote,        accent: "#475569" },
  stats:    { Icon: BarChart3,         accent: "#0d9488" },
  info:     { Icon: Info,              accent: "#0d9488" },
};
const DEFAULT_ACCENT = "#0d9488";

const resolveIcon = (icon) => {
  if (typeof icon !== "string") return { node: icon, accent: null };
  const def = SECTION_ICONS[icon];
  return def ? { node: <def.Icon />, accent: def.accent } : { node: null, accent: null };
};

const isEmpty = (v) => v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);

/* ── Bloc repliable ───────────────────────────────────────────────────────── */

/**
 * Bloc avec en-tête cliquable (tuile d'icône colorée, titre, description, résumé)
 * et contenu qui se replie en douceur.
 *   icon        : nœud React ou clé prédéfinie ("id", "specs"…)
 *   accent      : couleur du bloc (sinon celle de l'icône prédéfinie)
 *   meta        : résumé affiché à droite de l'en-tête (ex. « 4 champs »)
 *   collapsible : false pour un bloc toujours ouvert
 */
export function Block({ title, description, icon, accent, meta, collapsible = true, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  const { node, accent: iconAccent } = resolveIcon(icon);
  const color = accent || iconAccent || DEFAULT_ACCENT;
  const isOpen = !collapsible || open;

  const header = (
    <>
      {node && <span className="mk-block__icon">{node}</span>}
      <span className="mk-block__titles">
        {title && <span className="mk-block__title">{title}</span>}
        {description && <span className="mk-block__desc">{description}</span>}
      </span>
      {meta != null && <span className="mk-block__meta">{meta}</span>}
      {collapsible && (
        <span className="mk-block__chevron" aria-hidden="true">
          <ChevronDown />
        </span>
      )}
    </>
  );

  return (
    <section
      className={`mk-block${isOpen ? " is-open" : ""}`}
      style={{ "--mk-accent": color }}
      // Un champ obligatoire vide dans un bloc replié : on le rouvre
      onInvalidCapture={() => setOpen(true)}
    >
      {(title || node) && (collapsible ? (
        <button
          type="button"
          className="mk-block__head"
          aria-expanded={isOpen}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
        >
          {header}
        </button>
      ) : (
        <div className="mk-block__head is-static">{header}</div>
      ))}
      <div className="mk-block__body" id={bodyId}>
        <div className="mk-block__inner">
          <div className="mk-block__content">{children}</div>
        </div>
      </div>
    </section>
  );
}

/* ── Fiche détail ─────────────────────────────────────────────────────────── */

function CopyButton({ value }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* presse-papiers indisponible */ }
  };
  return (
    <button type="button" onClick={copy} className="mk-copy" title={t("common.copy", "Copier")}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/**
 * Tuile libellé / valeur.
 *   mono : valeur technique (code, identifiant) en police à chasse fixe + bouton copier
 *   span : 2 = pleine largeur
 */
export function InfoItem({ label, value, icon, mono = false, span = 1, children }) {
  const content = children ?? value;
  const empty = children === undefined && isEmpty(value);
  return (
    <div className={`mk-info ${span === 2 ? "mk-info--wide" : ""}`}>
      <div className="mk-info__label">
        {icon && <span className="mk-info__icon">{icon}</span>}
        {label}
      </div>
      <div className={`mk-info__value ${mono ? "is-mono" : ""} ${empty ? "is-empty" : ""}`}>
        {empty ? "—" : content}
        {mono && !empty && <CopyButton value={value} />}
      </div>
    </div>
  );
}

/** Bloc d'informations (grille de tuiles), repliable. */
export function InfoSection({ title, description, icon, accent, meta, collapsible, defaultOpen, children }) {
  return (
    <Block
      title={title}
      description={description}
      icon={icon}
      accent={accent}
      meta={meta}
      collapsible={collapsible}
      defaultOpen={defaultOpen}
    >
      <div className="mk-info-grid">{children}</div>
    </Block>
  );
}

/** Décor du bandeau d'identité : arcs et pastilles. */
function HeroPattern() {
  return (
    <svg className="mk-hero__pattern" viewBox="0 0 240 140" fill="none" aria-hidden="true">
      <path d="M150 140 C150 80 190 40 240 30" stroke="currentColor" strokeOpacity=".16" strokeWidth="1.5" />
      <path d="M120 140 C120 64 176 14 240 4" stroke="currentColor" strokeOpacity=".12" strokeWidth="1.5" />
      <path d="M180 140 C180 100 206 70 240 62" stroke="currentColor" strokeOpacity=".2" strokeWidth="1.5" />
      <circle cx="214" cy="104" r="18" fill="currentColor" fillOpacity=".06" />
      <circle cx="196" cy="26" r="6" fill="currentColor" fillOpacity=".12" />
    </svg>
  );
}

/**
 * Fiche de consultation.
 *   heading  : identifiant principal affiché en grand dans le bandeau (ex. code)
 *   badges   : statuts affichés dans le bandeau (nœuds React)
 *   metrics  : [{ label, value }] chiffres clés du bandeau
 *   sections : [{ title, description, icon, accent, collapsed, items: [{ label, value, icon, mono, span, render, hidden }] }]
 *   actions  : boutons supplémentaires dans le pied (ex. impression d'étiquette)
 *   onEdit   : affiche le bouton « Modifier »
 */
export function DetailModal({
  isOpen, onClose, title, subtitle, icon, size = "lg",
  heading, badges, metrics = [], sections = [], children, actions, onEdit,
}) {
  const { t } = useTranslation();
  const hasHero = !isEmpty(heading) || badges || metrics.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="detail"
      title={title}
      subtitle={subtitle}
      icon={icon}
      size={size}
      footer={
        <>
          {actions && <div className="mr-auto flex items-center gap-2">{actions}</div>}
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.close", "Fermer")}
          </Button>
          {onEdit && (
            <Button type="button" onClick={onEdit}>
              <PenLine className="h-4 w-4" />
              {t("common.edit", "Modifier")}
            </Button>
          )}
        </>
      }
    >
      <div className="mk-stack">
        {hasHero && (
          <div className="mk-hero">
            <HeroPattern />
            <div className="mk-hero__main">
              {!isEmpty(heading) && <div className="mk-hero__heading">{heading}</div>}
              {badges && <div className="mk-hero__badges">{badges}</div>}
            </div>
            {metrics.length > 0 && (
              <div className="mk-hero__metrics">
                {metrics.map((m) => (
                  <div key={m.label} className="mk-metric">
                    <span className="mk-metric__value">{isEmpty(m.value) ? "—" : m.value}</span>
                    <span className="mk-metric__label">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {sections.map((section, i) => {
          const items = section.items.filter((it) => !it.hidden);
          if (items.length === 0) return null;
          return (
            <InfoSection
              key={section.title || i}
              title={section.title}
              description={section.description}
              icon={section.icon}
              accent={section.accent}
              defaultOpen={!section.collapsed}
              meta={items.length > 1 ? t("modal.fields_count", { count: items.length, defaultValue: `${items.length} champs` }) : null}
            >
              {items.map((it) => (
                <InfoItem key={it.label} label={it.label} value={it.value} icon={it.icon} mono={it.mono} span={it.span}>
                  {it.render}
                </InfoItem>
              ))}
            </InfoSection>
          );
        })}

        {children}
      </div>
    </Modal>
  );
}

/* ── Formulaire ───────────────────────────────────────────────────────────── */

/**
 * Formulaire d'ajout ou de modification.
 *   mode       : "create" | "edit" (couleur et icône de l'en-tête)
 *   onSubmit   : reçoit l'événement submit (la page garde sa logique)
 *   saving     : désactive les boutons et affiche un indicateur
 *   canSubmit  : false pour désactiver le bouton d'enregistrement
 */
export function FormModal({
  isOpen, onClose, title, subtitle, mode = "create", size = "lg",
  onSubmit, saving = false, canSubmit = true, submitLabel, children,
}) {
  const { t } = useTranslation();
  const formId = useId();
  const label = submitLabel || (mode === "edit" ? t("common.save", "Enregistrer") : t("common.create", "Créer"));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant={mode === "edit" ? "edit" : "create"}
      title={title}
      subtitle={subtitle}
      size={size}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t("common.cancel", "Annuler")}
          </Button>
          <Button type="submit" form={formId} disabled={saving || !canSubmit}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? t("common.saving", "Enregistrement…") : label}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="mk-form">
        {children}
      </form>
    </Modal>
  );
}

/** Bloc de champs repliable ; columns = 1 | 2 | 3 */
export function FormSection({ title, description, icon, accent, meta, columns = 2, collapsible, defaultOpen, children }) {
  // Sans titre ni icône : simple grille, sans en-tête
  if (!title && !icon) {
    return <div className={`mk-form-grid mk-form-grid--${columns}`}>{children}</div>;
  }
  return (
    <Block
      title={title}
      description={description}
      icon={icon}
      accent={accent}
      meta={meta}
      collapsible={collapsible}
      defaultOpen={defaultOpen}
    >
      <div className={`mk-form-grid mk-form-grid--${columns}`}>{children}</div>
    </Block>
  );
}

/** Champ : libellé, obligatoire, aide, erreur ; span = 2 pour pleine largeur */
export function FormField({ label, required, hint, error, span = 1, icon, children }) {
  return (
    <div className={`mk-field ${span === 2 ? "mk-field--wide" : ""} ${span === "full" ? "mk-field--full" : ""}`}>
      {label && (
        <label className="mk-field__label">
          {icon && <span className="mk-field__icon">{icon}</span>}
          {label}
          {required && <span className="mk-field__required">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="mk-field__error">{error}</p> : hint && <p className="mk-field__hint">{hint}</p>}
    </div>
  );
}

/** Sélecteur segmenté (ex. « Nouveau linge / Linge existant ») */
export function Segmented({ value, onChange, options }) {
  return (
    <div className="mk-segmented" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          className={`mk-segmented__opt${value === opt.value ? " is-active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
