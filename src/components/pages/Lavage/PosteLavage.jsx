import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Check, CheckCircle2, Loader2, RotateCcw, ScanLine, UserRound } from "lucide-react";

export function EtapesLavage({ etapes, courante, termine }) {
  const { t } = useTranslation();
  return (
    <ol className="lw-steps" aria-label={t("lavage.steps", "Étapes du lavage")}>
      {etapes.map((e, i) => {
        const fait = termine || i < courante;
        const actif = !termine && i === courante;
        return (
          <li key={e} className={`${fait ? "is-done" : ""} ${actif ? "is-current" : ""}`} aria-current={actif ? "step" : undefined}>
            <span className="lw-steps__num">{fait ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
            <span className="lw-steps__label">{e}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function PosteLavage({ poste, titre, aide, mode, tone, bloque, etapes, machine, statut, children }) {
  const { t } = useTranslation();
  return (
    <section className={`lw-station is-${bloque ? "blocked" : tone}`} aria-labelledby="lw-consigne">
      <header className="lw-station__head">
        <span className="lw-station__icon" aria-hidden="true">
          {bloque ? <AlertTriangle size={22} /> : <ScanLine size={22} />}
        </span>
        <div className="lw-station__text">
          <span className="lw-eyebrow">{poste || t("lavage.workstation", "Poste de travail")}</span>
          <strong id="lw-consigne">{titre}</strong>
          {aide && <small>{aide}</small>}
        </div>
        {mode && <span className={`lw-mode is-${tone}`}><i aria-hidden="true" />{mode}</span>}
      </header>
      {etapes}
      <div className="lw-station__body">
        <div className="lw-station__scan">
          <label className="lw-label">{t("lavage.scan_field", "Lecture code-barres")}</label>
          {children}
          {statut}
        </div>
        {machine}
      </div>
    </section>
  );
}

export function EmplacementMachine({ machine, icon, detail, tone, charge, jauge, libelle, videTitre, onChanger, enCours }) {
  const { t } = useTranslation();
  if (!machine) {
    return (
      <div className="lw-slot is-empty">
        <span className="lw-slot__icon" aria-hidden="true">{icon}</span>
        <div>
          <strong>{videTitre || t("lavage.no_machine", "Aucune machine")}</strong>
        </div>
      </div>
    );
  }
  const barre = jauge || (charge && machine.capaciteKg ? {
    libelle: t("recap_chargement.capacity", "Remplissage de la machine"),
    texte: `${charge.poids.toFixed(1)} / ${machine.capaciteKg} kg`,
    pct: (charge.poids / machine.capaciteKg) * 100,
    alerte: true,
  } : null);
  const pct = barre ? Math.max(0, Math.min(barre.pct || 0, 100)) : null;
  const niveau = !barre ? "" : barre.alerte ? (pct >= 90 ? "is-full" : pct >= 70 ? "is-warn" : "") : pct >= 100 ? "is-ok" : "";
  return (
    <div className={`lw-slot is-${tone}`}>
      <div className="lw-slot__row">
        <span className="lw-slot__icon" aria-hidden="true">{icon}</span>
        <div className="lw-slot__id">
          <span className="lw-eyebrow">{libelle || t("lavage.machine", "Machine")}</span>
          <strong>{machine.code}</strong>
          {detail && <small>{detail}</small>}
        </div>
        {enCours && (
          <span className="lw-slot__live"><i aria-hidden="true" />{t("lavage.in_progress", "En cours")}</span>
        )}
        {onChanger && (
          <button type="button" className="lw-link" onClick={onChanger}>
            <RotateCcw size={13} /> {t("lavage_infecte.change", "Modifier")}
          </button>
        )}
      </div>
      {barre && (
        <div className={`lw-load ${niveau}`}>
          <div className="lw-load__row">
            <span>{barre.libelle}</span>
            <strong>{barre.texte}</strong>
          </div>
          <div className="lw-load__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

export function EtatScan({ status }) {
  if (!status) return null;
  if (status.loading) return <div className="lw-status is-loading"><Loader2 size={15} className="animate-spin" /><span>{status.code}</span></div>;
  if (status.error) return <div className="lw-status is-error" role="alert"><AlertTriangle size={15} /><span>{status.error}</span></div>;
  if (status.success) {
    return (
      <div className="lw-status is-ok" role="status">
        <CheckCircle2 size={15} />
        <span><strong>{status.success.message}</strong>{status.success.detail ? ` · ${status.success.detail}` : ""}</span>
      </div>
    );
  }
  return null;
}

export function FinOperation({ titre, texte, children }) {
  return (
    <section className="lw-done" role="status">
      <span className="lw-done__icon"><CheckCircle2 size={26} /></span>
      <div>
        <h3>{titre}</h3>
        {texte && <p>{texte}</p>}
      </div>
      {children && <div className="lw-done__actions">{children}</div>}
    </section>
  );
}

export function Panneau({ id, icon, titre, compte, aide, outils, tone, children }) {
  return (
    <section className={`lw-panel ${tone ? `is-${tone}` : ""}`} aria-labelledby={id}>
      <header className="lw-panel__head">
        <span className="lw-panel__icon" aria-hidden="true">{icon}</span>
        <div className="lw-panel__title">
          <h3 id={id}>{titre}{compte != null && <span className="lw-count">{compte}</span>}</h3>
          {aide && <small>{aide}</small>}
        </div>
        {outils && <div className="lw-panel__tools">{outils}</div>}
      </header>
      <div className="lw-panel__body">{children}</div>
    </section>
  );
}

export function AgentConnecte({ agent }) {
  const { t } = useTranslation();
  if (!agent) {
    return (
      <span className="lw-agent is-off">
        <span className="lw-agent__avatar"><UserRound size={15} /></span>
        <span className="lw-agent__text">
          <strong>{t("lavage.no_agent_connected")}</strong>
          <small>{t("lavage.agent", "Agent")}</small>
        </span>
      </span>
    );
  }
  const nom = String(agent.nomPrenom || agent.nom || agent.login || "").trim();
  const mots = nom.split(/\s+/).filter(Boolean);
  const initiales = ((mots[0]?.[0] || "") + (mots.length > 1 ? mots[mots.length - 1][0] : "")).toUpperCase() || "?";
  return (
    <span className="lw-agent">
      <span className="lw-agent__avatar">{initiales}<i aria-hidden="true" /></span>
      <span className="lw-agent__text">
        <strong>{nom || "—"}</strong>
        <small>{agent.matricule ? `${t("lavage.agent", "Agent")} · ${agent.matricule}` : t("lavage.agent", "Agent")}</small>
      </span>
    </span>
  );
}
