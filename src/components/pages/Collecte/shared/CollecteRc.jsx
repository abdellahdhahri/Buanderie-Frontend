import React, { useState } from "react";
import { Check, ChevronDown, RotateCcw, ScanLine, UserCheck, Biohazard } from "lucide-react";
import ScanInput from "../../../utils/shared/ScanInput";
import { ScanStatus } from "./ScanStatus";
import "../../Reception/Reception.css";
import "../CollecteChambre.css";
import "./CollecteRc.css";

const initiales = (nom = "") =>
  nom.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

export const nomAgentCollecte = (agent) =>
  agent ? String(agent.nomPrenom || agent.nom || agent.matricule || "").trim() : "";

export function ToolbarCollecte({ agent, chips, extra, onReset, resetLabel = "Réinitialiser" }) {
  const nom = nomAgentCollecte(agent);
  return (
    <div className="rc-toolbar">
      <div className="rc-head__right">
        {chips}
        {agent && (
          <div className="rc-agent">
            <span className="rc-agent__avatar">{initiales(nom)}</span>
            <span className="rc-agent__text">
              <span className="rc-agent__name">{nom || "—"}</span>
              <span className="rc-agent__id">{agent.codeBarre || agent.matricule}</span>
            </span>
          </div>
        )}
        {extra}
        {onReset && (
          <button type="button" className="rc-btn" onClick={onReset}>
            <RotateCcw size={14} /> {resetLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function EtapesCollecte({ etapes, faites, label }) {
  const active = faites.findIndex((f) => !f);
  return (
    <ol className={`rc-steps rc-steps--${etapes.length}`} aria-label={label}>
      {etapes.map((texte, i) => (
        <li key={texte} className={`rc-step ${faites[i] ? "is-done" : ""} ${active === i ? "is-active" : ""}`}>
          <span className="rc-step__num">{faites[i] ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
          <span className="rc-step__label">{texte}</span>
        </li>
      ))}
    </ol>
  );
}

export function AccueilSansAgent({ eyebrow, titre, scanInputRef, value, onChange, onSubmit }) {
  return (
    <section className="rc-card rc-welcome">
      <div className="rc-welcome__icon"><UserCheck size={34} strokeWidth={1.6} /></div>
      <div className="rc-welcome__body">
        <span className="rc-eyebrow">{eyebrow}</span>
        <h2>{titre}</h2>
        <div className="rc-scan__field is-infecte">
          <ScanInput
            ref={scanInputRef}
            placeholder=""
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            borderColor="#e03131"
            keepFocus
            autoDebounce
            disabled
          />
        </div>
      </div>
    </section>
  );
}

export function PosteScan({
  titre, chips, alerte, infecte, scanInputRef, value, onChange, onSubmit,
  borderColor, disabled, scanStatus, scanningLabel, successLabel,
}) {
  return (
    <section className={`rc-card rc-scan ${infecte ? "is-infecte" : ""}`}>
      <header className="rc-scan__bar">
        <span className="rc-scan__title"><ScanLine size={17} /> {titre}</span>
        {chips && <span className="cl-chips">{chips}</span>}
      </header>
      <div className="rc-scan__body">
        <div className={`rc-scan__field ${infecte ? "is-infecte" : ""}`}>
          <ScanInput
            ref={scanInputRef}
            placeholder=""
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            borderColor={borderColor}
            keepFocus
            autoDebounce
            disabled={disabled}
          />
        </div>
        {alerte}
        <ScanStatus status={scanStatus} scanningLabel={scanningLabel} successLabel={successLabel} />
      </div>
    </section>
  );
}

export function PastilleEtat({ children, tone = "info" }) {
  return <span className={`cl-pill is-${tone}`}><i />{children}</span>;
}

export function AlerteCollecte({ children, tone = "danger" }) {
  return (
    <div className={`cc-alert ${tone === "info" ? "is-info" : ""}`}>
      {tone === "danger" && <Biohazard size={18} />}
      <span>{children}</span>
    </div>
  );
}

export function LigneCollecte({ icone, accent, titre, code, tags, etat, actions, active, estompe, onClick }) {
  return (
    <div
      className={`cl-line ${active ? "is-active" : ""} ${estompe ? "is-muted" : ""} ${onClick ? "is-clickable" : ""}`}
      style={accent ? { "--lc": accent } : undefined}
      onClick={onClick}
      onMouseDown={onClick ? (e) => e.preventDefault() : undefined}
      role={onClick ? "button" : undefined}
    >
      <span className="cl-line__icon">{icone}</span>
      <span className="cl-line__text">
        <span className="cl-line__title">{titre}{tags}</span>
        <code className="cl-line__code">{code}</code>
      </span>
      <span className="cl-line__state">{etat}</span>
      <span className="cl-line__actions">{actions}</span>
    </div>
  );
}

export function BoutonIcone({ icone, titre, tone = "ok", onClick, disabled }) {
  return (
    <button
      type="button"
      className={`cl-icon-btn is-${tone}`}
      title={titre}
      aria-label={titre}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
    >
      {icone}
    </button>
  );
}

export function GroupesLignes({ groupes, rendu, videMessage }) {
  const [replies, setReplies] = useState({});
  return (
    <div className="lit-groups">
      {groupes.map((g) => {
        if (g.items.length === 0 && !g.toujours) return null;
        const ouvert = !replies[g.key];
        return (
          <section key={g.key} className={`lit-group is-${g.key} ${g.estompe ? "is-muted" : ""}`}>
            <button
              type="button"
              className="lit-group__head"
              disabled={!g.repliable}
              onClick={() => setReplies((r) => ({ ...r, [g.key]: !r[g.key] }))}
              onMouseDown={(e) => e.preventDefault()}
              aria-expanded={ouvert}
            >
              <span className="lit-group__title">{g.titre}</span>
              <span className="lit-group__count">{g.items.length}</span>
              {g.repliable && <ChevronDown size={16} className="lit-group__chev" />}
            </button>
            {ouvert && (g.items.length === 0 ? (
              <div className="lit-group__empty"><Check size={16} strokeWidth={3} /> {videMessage}</div>
            ) : (
              <div className="cl-list">{g.items.map(rendu)}</div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

export function BilanCollecte({ titre, items, progression }) {
  return (
    <section className="rc-card">
      <div className="rc-card__head">
        <h3 className="rc-card__title">{titre}</h3>
      </div>
      <div className="rc-stats">
        {items.map((it) => (
          <div key={it.label} className={`rc-stat ${it.tone ? `rc-stat--${it.tone}` : ""}`}>
            <span className={`rc-stat__value ${it.texte ? "rc-stat__value--text" : ""}`}>{it.value}</span>
            <span className="rc-stat__label">{it.label}</span>
          </div>
        ))}
      </div>
      {progression != null && (
        <div className="cl-progress">
          <div className="cl-progress__bar"><i style={{ width: `${progression}%` }} /></div>
          <strong>{progression}%</strong>
        </div>
      )}
    </section>
  );
}
