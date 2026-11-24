import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Loader2, RotateCcw, ScanLine, Square } from "lucide-react";
import { formaterDuree, useChrono } from "./useChrono";

export function ConsoleScan({ titre, aide, tone = "teal", machine, machineIcon, machineDetail, onChangerMachine, bloque, children }) {
  const { t } = useTranslation();
  return (
    <section className={`at-console is-${tone} ${bloque ? "is-blocked" : ""}`} aria-labelledby="at-consigne">
      <div className="at-console__main">
        <span className="at-console__icon" aria-hidden="true">
          {bloque ? <AlertTriangle size={20} /> : <ScanLine size={20} />}
        </span>
        <div className="at-console__text">
          <strong id="at-consigne">{titre}</strong>
          {aide && <small>{aide}</small>}
        </div>
      </div>
      <div className="at-console__field">{children}</div>
      {machine && (
        <div className="at-console__machine">
          <span className="at-console__machine-icon" aria-hidden="true">{machineIcon}</span>
          <div>
            <strong>{machine.code}</strong>
            {machineDetail && <small>{machineDetail}</small>}
          </div>
          {onChangerMachine && (
            <button type="button" className="at-link" onClick={onChangerMachine}>
              <RotateCcw size={13} /> {t("lavage_infecte.change", "Modifier")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Hublot({ pct, statut, infecte }) {
  const niveau = pct == null ? 55 : 14 + (Math.min(100, pct) / 100) * 52;
  const y = 80 - niveau;
  return (
    <div className={`wm-porthole is-${statut} ${infecte ? "is-infecte" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 96 96">
        <defs>
          <clipPath id="wm-glass"><circle cx="48" cy="48" r="31" /></clipPath>
        </defs>
        <circle className="wm-porthole__frame" cx="48" cy="48" r="44" />
        <circle className="wm-porthole__rim" cx="48" cy="48" r="36" />
        <g clipPath="url(#wm-glass)">
          <rect className="wm-porthole__glass" x="17" y="17" width="62" height="62" />
          <g className="wm-porthole__water" style={{ transform: `translateY(${y - 17}px)` }}>
            <path className="wm-porthole__wave" d="M-40 20 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V90 H-40 Z" />
          </g>
          <g className="wm-porthole__drum">
            <circle cx="48" cy="34" r="5" />
            <circle cx="60" cy="52" r="4" />
            <circle cx="38" cy="58" r="5" />
          </g>
        </g>
        <path className="wm-porthole__shine" d="M30 38 A20 20 0 0 1 44 26" />
      </svg>
    </div>
  );
}

export function CarteCycle({ cycle, infecte, onTerminer, busy, libelleFin }) {
  const { t } = useTranslation();
  const chrono = useChrono(cycle.dateDebut, cycle.dureePrevue);
  const programme = cycle.programme && cycle.programme !== "—" ? cycle.programme : null;
  const temperature = cycle.temperature != null && cycle.temperature !== "—" ? `${cycle.temperature}°C` : null;
  const lots = cycle.lots || [];
  const details = [programme, temperature, cycle.dureePrevue ? `${cycle.dureePrevue} min` : null].filter(Boolean).join(" · ");

  const etat = infecte
    ? { cls: "is-danger", label: t("lavage_infecte.badge") }
    : chrono.depasse
      ? { cls: "is-danger", label: t("minuteur.over", "Dépassé") }
      : chrono.statut === "soon"
        ? { cls: "is-warn", label: t("minuteur.almost", "Bientôt fini") }
        : { cls: "is-live", label: t("lavage.in_progress", "En cours") };

  const sousTexte = chrono.total == null
    ? t("minuteur.running", "En cours")
    : chrono.depasse
      ? t("minuteur.overrun", "+{{temps}} de dépassement", { temps: formaterDuree(chrono.ecoule - chrono.total) })
      : t("minuteur.remaining", "Reste : {{temps}}", { temps: formaterDuree(chrono.reste) });

  return (
    <article className={`wm-card ${infecte ? "is-infecte" : ""} is-${chrono.statut}`}>
      <div className="wm-card__main">
        <Hublot pct={chrono.pct} statut={chrono.statut} infecte={infecte} />
        <div className="wm-card__info">
          <div className="wm-card__top">
            <strong className="wm-card__code">{cycle.machine?.code || "—"}</strong>
            <span className={`wm-state ${etat.cls}`}><i aria-hidden="true" />{etat.label}</span>
          </div>
          <output className="wm-card__time" aria-label={t("minuteur.elapsed", "Temps écoulé")}>{formaterDuree(chrono.ecoule)}</output>
          <small className="wm-card__sub">{sousTexte}</small>
        </div>
      </div>

      <div className="wm-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={chrono.pct != null ? Math.round(chrono.pct) : undefined}>
        <span style={{ width: `${chrono.pct ?? 100}%` }} className={chrono.pct == null ? "is-indeterminate" : ""} />
      </div>

      <div className="wm-card__foot">
        <div className="wm-card__meta">
          <span>{details || t("lavage.cycle_number", "Cycle #{{id}}", { id: cycle.numeroCycle || cycle.id })}</span>
          <small>
            {lots.length > 0
              ? `${lots.slice(0, 2).map((l) => l.codeLot).join(", ")}${lots.length > 2 ? ` +${lots.length - 2}` : ""}`
              : cycle.bac || (cycle.nbArticles != null ? `${cycle.nbArticles} ${t("lavage.items")}` : "")}
          </small>
        </div>
        {onTerminer && (
          <button type="button" className="wm-finish" onClick={onTerminer} disabled={busy}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Square size={12} />}
            {libelleFin}
          </button>
        )}
      </div>
    </article>
  );
}

export function SectionAtelier({ id, icon, titre, compte, aide, outils, tone, children }) {
  return (
    <section className={`at-section ${tone ? `is-${tone}` : ""}`} aria-labelledby={id}>
      <header className="at-section__head">
        <div>
          <h3 id={id}>{icon} {titre}{compte != null && <span className="at-count">{compte}</span>}</h3>
          {aide && <small>{aide}</small>}
        </div>
        {outils && <div className="at-section__tools">{outils}</div>}
      </header>
      {children}
    </section>
  );
}
