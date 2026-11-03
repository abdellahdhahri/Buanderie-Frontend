// pages/lavage/MachinesDashboard.jsx — suivi en direct des machines (laveuses et sécheurs)
import React, { useState, useEffect, useCallback, useMemo, useId } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  RefreshCw, Play, Biohazard, WashingMachine, Thermometer, Timer, Layers, Gauge,
  History, Settings2, Square, CircleCheck, Weight, Wind,
} from "lucide-react";
import { useMachineContext } from "../../contextes/MachineContext";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { DetailModal, Block } from "../../components/ui/modal-kit";
import { useSetting, formatDateTime } from "../../utils/appSettings";
import { useCircuitInfecte } from "../../hooks/useEstablishment";
import "../Linge/WorkflowList.css";
import "./machines-dashboard.css";

// ─── Thèmes par groupe de machine ───────────────────────────────────────────
const THEME = {
  LINGE_NORMAL: { tone: "#0284c7", soft: "#e0f2fe", Icon: WashingMachine, key: "filter_normal" },
  LINGES_INFECTE: { tone: "#e11d48", soft: "#ffe4e6", Icon: Biohazard, key: "filter_infected" },
  SECHEUR: { tone: "#d97706", soft: "#fef3c7", Icon: Wind, key: "filter_dryers" },
};
const estSecheur = (m) => m.type === "SECHEUR";
// Groupe d'affichage : les sécheurs à part, les laveuses selon le linge traité
const categorieDe = (m) => (estSecheur(m) ? "SECHEUR" : m.categorie === "LINGES_INFECTE" ? "LINGES_INFECTE" : "LINGE_NORMAL");
// Écran de pilotage de la machine
const ecranDe = (m) => (estSecheur(m) ? "/Sechages" : "/Lavages");

// ─── États d'une machine ────────────────────────────────────────────────────
const ETAT_CFG = {
  DISPONIBLE: { label: "Disponible", color: "#10b981" },
  EN_COURS: { label: "En cours", color: "#7c3aed" },
  EN_PAUSE: { label: "En pause", color: "#f59e0b" },
  EN_PANNE: { label: "En panne", color: "#ef4444" },
  MAINTENANCE: { label: "Maintenance", color: "#64748b" },
};

const pad = (n) => String(n).padStart(2, "0");

/** Durée écoulée depuis le début du cycle, mise à jour chaque seconde. */
function useElapsed(dateDebut) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!dateDebut) return undefined;
    const tick = () => setS(Math.max(0, Math.floor((Date.now() - new Date(dateDebut)) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateDebut]);
  return s;
}

const formatDuree = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h > 0 ? `${pad(h)}:` : ""}${pad(m)}:${pad(sec % 60)}`;
};

/* ═══════════════════════════════════════════════════════════════════════════
   ILLUSTRATIONS SVG
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Lave-linge vu de face : panneau de commande, hublot, eau au niveau de la
 * charge, tambour qui tourne pendant un cycle.
 */
function WasherSvg({ tone, soft, etat, fillPct = 0 }) {
  const uid = useId().replace(/:/g, "");
  const running = etat === "EN_COURS";
  const off = etat === "EN_PANNE" || etat === "MAINTENANCE";
  const level = Math.max(0, Math.min(100, fillPct));
  const waterTop = 84 + 30 - (60 * (running ? Math.max(level, 35) : level * 0.5)) / 100;
  const ink = off ? "#94a3b8" : tone;

  return (
    <svg viewBox="0 0 120 144" className={`md-washer${running ? " is-running" : ""}`} aria-hidden="true">
      <defs>
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef2f7" />
        </linearGradient>
        <radialGradient id={`glass-${uid}`} cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={off ? "#e2e8f0" : soft} />
        </radialGradient>
        <clipPath id={`door-${uid}`}>
          <circle cx="60" cy="84" r="29" />
        </clipPath>
      </defs>

      {/* Ombre au sol + pieds */}
      <ellipse cx="60" cy="139" rx="44" ry="3.5" fill="#0f172a" opacity="0.08" />
      <rect x="18" y="130" width="12" height="6" rx="2" fill="#cbd5e1" />
      <rect x="90" y="130" width="12" height="6" rx="2" fill="#cbd5e1" />

      {/* Carrosserie */}
      <rect x="8" y="6" width="104" height="126" rx="14" fill={`url(#body-${uid})`} stroke="#d8e0ea" strokeWidth="1.5" />
      {/* Panneau de commande */}
      <path d="M8 20 Q8 6 22 6 H98 Q112 6 112 20 V34 H8 Z" fill="#f8fafc" />
      <line x1="8" y1="34" x2="112" y2="34" stroke="#e2e8f0" strokeWidth="1.5" />
      <rect x="16" y="14" width="24" height="12" rx="3" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="46" y="14" width="34" height="12" rx="3" fill={off ? "#cbd5e1" : "#0f172a"} />
      <circle className="md-washer__led" cx="52" cy="20" r="2" fill={running ? "#34d399" : off ? "#94a3b8" : "#60a5fa"} />
      <path d="M58 20 H74" stroke={running ? "#34d399" : "#475569"} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <circle cx="96" cy="20" r="6.5" fill="#fff" stroke="#cbd5e1" strokeWidth="1.5" />
      <path d="M96 15.5 V20" stroke={ink} strokeWidth="2" strokeLinecap="round" />

      {/* Hublot : bague chromée + verre */}
      <circle cx="60" cy="84" r="37" fill="#e2e8f0" />
      <circle cx="60" cy="84" r="34" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <circle cx="60" cy="84" r="29" fill={`url(#glass-${uid})`} />

      <g clipPath={`url(#door-${uid})`}>
        {/* Eau (niveau = charge) */}
        {(running || level > 0) && !off && (
          <g>
            <rect x="20" y={waterTop + 3} width="80" height="70" fill={tone} opacity="0.22" />
            <path
              className={running ? "md-washer__wave" : undefined}
              d={`M20 ${waterTop + 4} q10 -5 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V130 H20 Z`}
              fill={tone}
              opacity="0.3"
            />
          </g>
        )}
        {/* Tambour + linge */}
        <g className="md-washer__drum">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <circle
              key={a}
              cx={60 + 21 * Math.cos((a * Math.PI) / 180)}
              cy={84 + 21 * Math.sin((a * Math.PI) / 180)}
              r="1.6"
              fill="#94a3b8"
              opacity="0.6"
            />
          ))}
          {(running || level > 0) && !off && (
            <>
              <ellipse cx="52" cy="92" rx="10" ry="6" fill={tone} opacity="0.75" transform="rotate(-20 52 92)" />
              <ellipse cx="68" cy="94" rx="9" ry="5.5" fill="#ffffff" stroke={tone} strokeOpacity="0.4" transform="rotate(25 68 94)" />
              {running && <ellipse cx="62" cy="72" rx="7" ry="4.5" fill={tone} opacity="0.45" transform="rotate(10 62 72)" />}
            </>
          )}
        </g>
      </g>

      {/* Reflet du verre */}
      <path d="M40 70 A24 24 0 0 1 58 58" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      {/* Poignée */}
      <rect x="92" y="78" width="5" height="14" rx="2.5" fill="#cbd5e1" />

      {/* Pastille d'alerte (panne / maintenance) */}
      {off && (
        <g transform="translate(86 104)">
          <circle cx="10" cy="10" r="11" fill="#fff" stroke={etat === "EN_PANNE" ? "#ef4444" : "#64748b"} strokeWidth="2" />
          {etat === "EN_PANNE" ? (
            <path d="M10 5 V11 M10 14.5 V15" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
          ) : (
            <path d="M6.5 13.5 L11 9 M12.5 5.5 a3 3 0 1 0 2 2" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          )}
        </g>
      )}
    </svg>
  );
}

/**
 * Sèche-linge vu de face : panneau à molette, hublot, tambour qui tourne
 * avec le linge, ondes de chaleur au-dessus pendant un séchage.
 */
function DryerSvg({ tone, soft, etat, fillPct = 0 }) {
  const uid = useId().replace(/:/g, "");
  const running = etat === "EN_COURS";
  const off = etat === "EN_PANNE" || etat === "MAINTENANCE";
  const loaded = running || fillPct > 0;
  const ink = off ? "#94a3b8" : tone;

  return (
    <svg viewBox="0 0 120 144" className={`md-washer md-dryer${running ? " is-running" : ""}`} aria-hidden="true">
      <defs>
        <linearGradient id={`dbody-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef2f7" />
        </linearGradient>
        <radialGradient id={`dglass-${uid}`} cx="40%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={off ? "#e2e8f0" : soft} />
        </radialGradient>
        <clipPath id={`ddoor-${uid}`}>
          <circle cx="60" cy="84" r="29" />
        </clipPath>
      </defs>

      {/* Ombre + pieds */}
      <ellipse cx="60" cy="139" rx="44" ry="3.5" fill="#0f172a" opacity="0.08" />
      <rect x="18" y="130" width="12" height="6" rx="2" fill="#cbd5e1" />
      <rect x="90" y="130" width="12" height="6" rx="2" fill="#cbd5e1" />

      {/* Carrosserie */}
      <rect x="8" y="6" width="104" height="126" rx="14" fill={`url(#dbody-${uid})`} stroke="#d8e0ea" strokeWidth="1.5" />
      {/* Panneau : molette de programme, écran, voyant, pictogramme chaleur */}
      <path d="M8 20 Q8 6 22 6 H98 Q112 6 112 20 V34 H8 Z" fill="#f8fafc" />
      <line x1="8" y1="34" x2="112" y2="34" stroke="#e2e8f0" strokeWidth="1.5" />
      <circle cx="24" cy="20" r="7" fill="#fff" stroke="#cbd5e1" strokeWidth="1.5" />
      <path d="M24 15 V20 L27.5 22" stroke={ink} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <rect x="40" y="14" width="34" height="12" rx="3" fill={off ? "#cbd5e1" : "#0f172a"} />
      <circle className="md-washer__led" cx="46" cy="20" r="2" fill={running ? "#fbbf24" : off ? "#94a3b8" : "#60a5fa"} />
      <path d="M52 20 H68" stroke={running ? "#fbbf24" : "#475569"} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <path d="M90 14 q-3 3 0 6 t0 6 M97 14 q-3 3 0 6 t0 6" stroke={ink} strokeWidth="1.7" strokeLinecap="round" fill="none" />

      {/* Hublot */}
      <circle cx="60" cy="84" r="37" fill="#e2e8f0" />
      <circle cx="60" cy="84" r="34" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <circle cx="60" cy="84" r="29" fill={`url(#dglass-${uid})`} />

      <g clipPath={`url(#ddoor-${uid})`}>
        {running && <circle cx="60" cy="84" r="29" fill={tone} opacity="0.1" />}
        {/* Ondes de chaleur qui montent dans le tambour (séchage en cours) */}
        {running && (
          <g className="md-dryer__heat" stroke={tone} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6">
            <path d="M50 82 q-3 -3 0 -6 t0 -6" />
            <path d="M60 80 q-3 -3 0 -6 t0 -6" />
            <path d="M70 82 q-3 -3 0 -6 t0 -6" />
          </g>
        )}
        {/* Tambour : aubes + linge qui retombe */}
        <g className="md-washer__drum">
          {[0, 120, 240].map((a) => (
            <path key={a} d="M60 57 V63" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" opacity="0.5" transform={`rotate(${a} 60 84)`} />
          ))}
          {loaded && !off && (
            <>
              <path d="M44 90 q8 -10 18 -4 q-4 9 -18 4 Z" fill={tone} opacity="0.75" />
              <path d="M62 96 q10 -8 16 2 q-8 6 -16 -2 Z" fill="#ffffff" stroke={tone} strokeOpacity="0.45" />
              {running && <path d="M54 70 q6 -6 12 0 q-6 5 -12 0 Z" fill={tone} opacity="0.45" />}
            </>
          )}
        </g>
      </g>

      {/* Reflet, poignée, grille du filtre à peluches */}
      <path d="M40 70 A24 24 0 0 1 58 58" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      <rect x="92" y="78" width="5" height="14" rx="2.5" fill="#cbd5e1" />
      <g stroke="#cbd5e1" strokeWidth="1.4" strokeLinecap="round">
        <path d="M44 124 H76" />
        <path d="M48 127.5 H72" />
      </g>

      {off && (
        <g transform="translate(86 104)">
          <circle cx="10" cy="10" r="11" fill="#fff" stroke={etat === "EN_PANNE" ? "#ef4444" : "#64748b"} strokeWidth="2" />
          {etat === "EN_PANNE" ? (
            <path d="M10 5 V11 M10 14.5 V15" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" />
          ) : (
            <path d="M6.5 13.5 L11 9 M12.5 5.5 a3 3 0 1 0 2 2" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          )}
        </g>
      )}
    </svg>
  );
}

/** Anneau de progression (indicateurs du haut). */
function Ring({ pct, color, children }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct || 0));
  return (
    <svg viewBox="0 0 54 54" className="md-kpi__visual" aria-hidden="true">
      <circle cx="27" cy="27" r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="6" />
      <motion.circle
        cx="27" cy="27" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (p / 100) * c }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        transform="rotate(-90 27 27)"
      />
      <foreignObject x="13" y="13" width="28" height="28">
        <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color }}>{children}</div>
      </foreignObject>
    </svg>
  );
}

/** Tuile d'indicateur. */
function Kpi({ color, visual, value, unit, label, extra }) {
  return (
    <div className="md-kpi" style={{ "--kpi": color }}>
      {visual}
      <div>
        <div className="md-kpi__value">{value}{unit && <small>{unit}</small>}</div>
        <div className="md-kpi__label">{label}</div>
        {extra && <div className="md-kpi__extra">{extra}</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CARTE MACHINE
   ═══════════════════════════════════════════════════════════════════════════ */
function CarteMachine({ machine, cycles, onOpen, onTerminer }) {
  const { t } = useTranslation();
  const cat = categorieDe(machine);
  const theme = THEME[cat];
  const etat = machine.etatImmobilisation || "DISPONIBLE";
  const etatCfg = ETAT_CFG[etat] || ETAT_CFG.DISPONIBLE;
  const enCours = etat === "EN_COURS";

  const cycleActif = cycles?.find((c) => c.machine?.id === machine.id && c.statut === "EN_COURS");
  const dernier = cycles?.find((c) => c.machine?.id === machine.id && c.statut === "TERMINE");
  const elapsed = useElapsed(enCours ? cycleActif?.dateDebut : null);
  const dureeMax = (cycleActif?.programmeLavage?.dureeMinutes || 30) * 60;
  const pctTemps = enCours ? Math.min(100, (elapsed / dureeMax) * 100) : 0;
  const capacite = Number(machine.capaciteKg) || 0;
  const poids = Number(machine.poidsActuel) || 0;
  const pctCharge = capacite ? Math.min(100, (poids / capacite) * 100) : 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`md-card${enCours ? " is-running" : ""}`}
      style={{ "--tone": theme.tone }}
      onClick={() => onOpen(machine)}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(machine); }}
      tabIndex={0}
      role="button"
      aria-label={machine.code}
    >
      <div className="md-card__top">
        <span className="md-card__code">{machine.code}</span>
        <span className="md-chip"><theme.Icon size={12} /> {t(`machines_dashboard.${theme.key}`)}</span>
        <span className={`md-status${enCours ? " is-live" : ""}`} style={{ "--st": etatCfg.color }}>
          <i /> {t(`machine_status.${etat}`, etatCfg.label)}
        </span>
      </div>

      <div className="md-card__body">
        <div className="md-card__visual">
          {estSecheur(machine)
            ? <DryerSvg tone={theme.tone} soft={theme.soft} etat={etat} fillPct={pctCharge} />
            : <WasherSvg tone={theme.tone} soft={theme.soft} etat={etat} fillPct={pctCharge} />}
        </div>

        <div className="md-card__info">
          {enCours && estSecheur(machine) && !cycleActif ? (
            <>
              <div className="md-card__program">{t("machines_dashboard.status_drying", "Séchage en cours")}</div>
              <div className="md-card__note">{t("machines_dashboard.dryer_cycle_hint", "Suivi détaillé dans l'écran Séchage.")}</div>
            </>
          ) : enCours ? (
            <>
              <div className="md-card__program" title={cycleActif?.programmeLavage?.nom}>
                {cycleActif?.programmeLavage?.nom || t("machines_dashboard.cycle_name")}
              </div>
              <div className="md-facts">
                <span className="md-fact"><Timer /> <span className="md-timer">{formatDuree(elapsed)}</span></span>
                {cycleActif?.programmeLavage?.temperatureCelsius != null && (
                  <span className="md-fact"><Thermometer /> <strong>{cycleActif.programmeLavage.temperatureCelsius}°C</strong></span>
                )}
                {cycleActif?.items?.length > 0 && (
                  <span className="md-fact"><Layers /> <strong>{cycleActif.items.length}</strong> {t("machines_dashboard.cycle_items")}</span>
                )}
              </div>
              <div className="md-meter" style={{ "--m": theme.tone }}>
                <div className="md-meter__row">
                  <span>{t("machines_dashboard.status_cycle_progress")}</span>
                  <strong>{Math.round(pctTemps)}%</strong>
                </div>
                <div className="md-meter__track"><div className="md-meter__fill" style={{ width: `${pctTemps}%` }} /></div>
              </div>
            </>
          ) : etat === "DISPONIBLE" ? (
            <>
              <div className="md-card__ready">{t("machines_dashboard.status_available")}</div>
              <div className="md-card__note">
                {t("machines_dashboard.status_available_capacity", { capacity: Math.max(0, capacite - poids).toFixed(1) })}
              </div>
            </>
          ) : (
            <div className="md-card__note">{machine.observation || t(`machine_status.${etat}`, etatCfg.label)}</div>
          )}

          <div className="md-meter" style={{ "--m": pctCharge >= 90 ? "#e11d48" : theme.tone }}>
            <div className="md-meter__row">
              <span>{t("machines_dashboard.load")}</span>
              <strong>{poids.toFixed(1)} / {capacite || "—"} kg</strong>
            </div>
            <div className="md-meter__track"><div className="md-meter__fill" style={{ width: `${pctCharge}%` }} /></div>
          </div>
        </div>
      </div>

      <div className="md-card__foot" onClick={(e) => e.stopPropagation()}>
        <span className="md-card__last">
          {dernier
            ? `${t("machines_dashboard.status_recent_cycles")} · ${dernier.programmeLavage?.nom || t("machines_dashboard.cycle_name")}`
            : ""}
        </span>
        {enCours ? (
          <>
            <Link to={ecranDe(machine)} className="md-act md-act--soft"><Settings2 /> {t("machines_dashboard.btn_manage")}</Link>
            {cycleActif?.id && (
              <button type="button" className="md-act md-act--danger" onClick={() => onTerminer(cycleActif.id, machine.code)}>
                <Square /> {t("machines_dashboard.btn_finish")}
              </button>
            )}
          </>
        ) : etat === "DISPONIBLE" ? (
          <Link to={ecranDe(machine)} className="md-act md-act--tone"><Play /> {t("machines_dashboard.btn_start")}</Link>
        ) : null}
      </div>
    </motion.article>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FICHE MACHINE (kit de modales)
   ═══════════════════════════════════════════════════════════════════════════ */
function FicheMachine({ machine, cycles, onFermer, onTerminer }) {
  const { t } = useTranslation();
  const cat = categorieDe(machine);
  const theme = THEME[cat];
  const etat = machine.etatImmobilisation || "DISPONIBLE";
  const etatCfg = ETAT_CFG[etat] || ETAT_CFG.DISPONIBLE;
  const cycleActif = cycles?.find((c) => c.machine?.id === machine.id && c.statut === "EN_COURS");
  const termines = cycles?.filter((c) => c.machine?.id === machine.id && c.statut === "TERMINE") || [];
  const elapsed = useElapsed(cycleActif?.dateDebut);

  return (
    <DetailModal
      isOpen
      onClose={onFermer}
      title={t("machines_dashboard.modal_title")}
      subtitle={machine.marque || machine.designation}
      icon={<theme.Icon />}
      heading={machine.code}
      badges={
        <>
          <span className="md-status" style={{ "--st": etatCfg.color }}><i /> {t(`machine_status.${etat}`, etatCfg.label)}</span>
          <span className="md-chip" style={{ "--tone": theme.tone }}><theme.Icon size={12} /> {t(`machines_dashboard.${theme.key}`)}</span>
        </>
      }
      metrics={[
        { label: t("machines_dashboard.capacity"), value: machine.capaciteKg ? `${machine.capaciteKg} kg` : null },
        { label: t("machines_dashboard.weight"), value: `${(Number(machine.poidsActuel) || 0).toFixed(1)} kg` },
        { label: t("machines_dashboard.modal_history"), value: termines.length },
      ]}
      sections={[
        {
          title: t("machines_dashboard.cycle_name"),
          icon: "stats",
          accent: theme.tone,
          items: cycleActif ? [
            { label: t("machines_dashboard.status_cycle", { id: cycleActif.id }), value: cycleActif.programmeLavage?.nom || "—", icon: <WashingMachine /> },
            { label: t("machines_dashboard.cycle_duration"), value: formatDuree(elapsed), icon: <Timer /> },
            { label: t("machines_dashboard.cycle_temperature"), value: cycleActif.programmeLavage?.temperatureCelsius != null ? `${cycleActif.programmeLavage.temperatureCelsius}°C` : null, icon: <Thermometer /> },
            { label: t("machines_dashboard.cycle_items"), value: cycleActif.items?.length ?? null, icon: <Layers /> },
            { label: t("machines_dashboard.cycle_start"), value: formatDateTime(cycleActif.dateDebut), icon: <Gauge /> },
          ] : [],
        },
        {
          title: t("machines_dashboard.modal_title"),
          icon: "specs",
          items: [
            { label: t("machines_dashboard.capacity"), value: machine.capaciteKg ? `${machine.capaciteKg} kg` : null, icon: <Weight /> },
            { label: t("machines_dashboard.observation"), value: machine.observation, span: 2, hidden: !machine.observation },
          ],
        },
      ]}
      actions={
        cycleActif?.id ? (
          <button type="button" className="bg-danger inline-flex items-center gap-2 px-4 py-2" onClick={() => onTerminer(cycleActif.id, machine.code)}>
            <Square className="h-4 w-4" /> {t("machines_dashboard.btn_terminate_cycle")}
          </button>
        ) : etat === "DISPONIBLE" ? (
          <Link to={ecranDe(machine)} className="inline-flex items-center gap-2 rounded-[10px] bg-teal-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-teal-700">
            <Play className="h-4 w-4" /> {estSecheur(machine) ? t("machines_dashboard.btn_start_dry", "Démarrer un séchage") : t("machines_dashboard.btn_start_wash")}
          </Link>
        ) : null
      }
    >
      <Block title={t("machines_dashboard.modal_history")} icon={<History />} accent="#475569" meta={termines.length || null} defaultOpen={termines.length > 0}>
        {termines.length === 0 ? (
          <p className="m-0 text-[13px] text-slate-500">{t("machines_dashboard.modal_no_history")}</p>
        ) : (
          <div className="md-history">
            {termines.slice(0, 8).map((c) => (
              <div key={c.id} className="md-history__row">
                <CircleCheck className="h-4 w-4 text-emerald-500" />
                <strong>{c.programmeLavage?.nom || t("machines_dashboard.cycle_name")}</strong>
                <span>{formatDateTime(c.dateFin || c.dateDebut)}</span>
              </div>
            ))}
          </div>
        )}
      </Block>
    </DetailModal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
function Section({ color, Icon, title, machines, children }) {
  const { t } = useTranslation();
  const dispo = machines.filter((m) => m.etatImmobilisation === "DISPONIBLE").length;
  return (
    <section className="md-section" style={{ "--s": color }}>
      <div className="md-section__head">
        <span className="md-section__icon"><Icon size={17} /></span>
        <span className="md-section__title">{title}</span>
        <span className="md-section__count">{machines.length}</span>
        <span className="md-section__line" />
        <span className="md-section__avail"><i /> {dispo} {t("machines_dashboard.stats_available").toLowerCase()}</span>
      </div>
      <div className="md-grid">{children}</div>
    </section>
  );
}

export default function MachinesDashboard() {
  const { t } = useTranslation();
  const circuitInfecte = useCircuitInfecte();
  const { machines, cycles, isLoading, lastRefresh, loadAllData, terminerCycle } = useMachineContext();
  const refreshSeconds = Number(useSetting("refresh.machinesSeconds")) || 15;

  const [machineSelectee, setMachineSelectee] = useState(null);
  const [filtre, setFiltre] = useState("TOUS");
  const [loading, setLoading] = useState(false);

  const rafraichir = useCallback(async () => {
    setLoading(true);
    try { await loadAllData(); } finally { setLoading(false); }
  }, [loadAllData]);

  // Rafraîchissement automatique : Paramètres › Préférences
  useEffect(() => {
    const id = setInterval(() => loadAllData(), refreshSeconds * 1000);
    return () => clearInterval(id);
  }, [loadAllData, refreshSeconds]);

  const handleTerminer = useCallback(async (cycleId, code) => {
    const res = await Swal.fire({
      icon: "question",
      title: t("machines_dashboard.btn_terminate_cycle"),
      text: `${code || ""} · #${cycleId}`,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: t("machines_dashboard.btn_finish"),
      cancelButtonText: t("common.cancel"),
    });
    if (!res.isConfirmed) return;
    try { await terminerCycle(cycleId); setMachineSelectee(null); } catch { /* alerte affichée par le contexte */ }
  }, [terminerCycle, t]);

  const machinesNormal = useMemo(() => machines.filter((m) => categorieDe(m) === "LINGE_NORMAL"), [machines]);
  const machinesInfecte = useMemo(() => machines.filter((m) => categorieDe(m) === "LINGES_INFECTE"), [machines]);
  const machinesSecheurs = useMemo(() => machines.filter((m) => categorieDe(m) === "SECHEUR"), [machines]);
  const machinesFiltrees = filtre === "TOUS" ? machines : machines.filter((m) => categorieDe(m) === filtre);

  const cyclesEnCours = cycles?.filter((c) => c.statut === "EN_COURS") || [];
  const cyclesTermines = cycles?.filter((c) => c.statut === "TERMINE") || [];
  const disponibles = machines.filter((m) => m.etatImmobilisation === "DISPONIBLE").length;
  const poidsTotal = machines.reduce((s, m) => s + (Number(m.poidsActuel) || 0), 0);
  const capaciteTotale = machines.reduce((s, m) => s + (Number(m.capaciteKg) || 0), 0);
  const pct = (a, b) => (b ? (a / b) * 100 : 0);

  const carte = (m) => (
    <CarteMachine key={m.id || m.code} machine={m} cycles={cycles} onOpen={setMachineSelectee} onTerminer={handleTerminer} />
  );

  return (
    <div className="md-page" style={{ padding: "8px 0 40px" }}>
      {machineSelectee && (
        <FicheMachine
          machine={machines.find((m) => m.id === machineSelectee.id) || machineSelectee}
          cycles={cycles}
          onFermer={() => setMachineSelectee(null)}
          onTerminer={handleTerminer}
        />
      )}

      {/* ═══ En-tête ═══ */}
      <motion.header className="page-head md-head" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="md-head__title">
          <PageHeaderIcon size={56} />
          <div>
            <h1>{t("machines_dashboard.title")}</h1>
            <div className="md-head__sub">
              <span className="md-live"><span className="md-live__dot" /> {refreshSeconds}s</span>
              <span>{t("machines_dashboard.subtitle", { enCours: cyclesEnCours.length, termines: cyclesTermines.length })}</span>
              {lastRefresh && (
                <span style={{ color: "var(--md-faint)" }}>
                  · {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="md-head__actions">
          <button type="button" className="md-btn md-btn--ghost" onClick={rafraichir} disabled={loading}>
            <RefreshCw size={15} className={loading ? "md-spin" : undefined} /> {t("machines_dashboard.refresh")}
          </button>
          {machinesSecheurs.length > 0 && (
            <Link to="/Sechages" className="md-btn md-btn--ghost">
              <Wind size={14} /> {t("machines_dashboard.new_dry", "Nouveau séchage")}
            </Link>
          )}
          <Link to="/Lavages" className="md-btn md-btn--primary">
            <Play size={14} /> {t("machines_dashboard.new_wash")}
          </Link>
        </div>
      </motion.header>

      {/* ═══ Indicateurs ═══ */}
      <div className="md-kpis">
        <Kpi
          color="#0284c7"
          visual={<Ring pct={100} color="#0284c7"><WashingMachine size={16} /></Ring>}
          value={machines.length}
          label={t("machines_dashboard.stats_machines")}
          extra={`${machinesNormal.length} ${t("machines_dashboard.filter_normal").toLowerCase()} · ${circuitInfecte ? `${machinesInfecte.length} ${t("machines_dashboard.filter_infected").toLowerCase()} · ` : ""}${machinesSecheurs.length} ${t("machines_dashboard.filter_dryers", "Sécheurs").toLowerCase()}`}
        />
        <Kpi
          color="#10b981"
          visual={<Ring pct={pct(disponibles, machines.length)} color="#10b981"><CircleCheck size={16} /></Ring>}
          value={disponibles}
          unit={`/ ${machines.length}`}
          label={t("machines_dashboard.stats_available")}
          extra={`${Math.round(pct(disponibles, machines.length))} %`}
        />
        <Kpi
          color="#7c3aed"
          visual={<Ring pct={pct(cyclesEnCours.length, machines.length)} color="#7c3aed"><RefreshCw size={16} className={cyclesEnCours.length ? "md-spin" : undefined} style={{ animationDuration: "3s" }} /></Ring>}
          value={cyclesEnCours.length}
          label={t("machines_dashboard.stats_cycles")}
          extra={t("machines_dashboard.cycles_done", { count: cyclesTermines.length })}
        />
        <Kpi
          color="#d97706"
          visual={<Ring pct={pct(poidsTotal, capaciteTotale)} color="#d97706"><Weight size={16} /></Ring>}
          value={poidsTotal.toFixed(1)}
          unit="kg"
          label={t("machines_dashboard.stats_weight")}
          extra={capaciteTotale ? `${Math.round(pct(poidsTotal, capaciteTotale))} % · ${capaciteTotale} kg` : null}
        />
      </div>

      {/* ═══ Filtres ═══ */}
      <div className="md-filters" role="tablist">
        {[
          { id: "TOUS", label: t("machines_dashboard.filter_all"), count: machines.length, color: "#0f172a" },
          { id: "LINGE_NORMAL", label: t("machines_dashboard.filter_normal"), count: machinesNormal.length, color: THEME.LINGE_NORMAL.tone },
          { id: "LINGES_INFECTE", label: t("machines_dashboard.filter_infected"), count: machinesInfecte.length, color: THEME.LINGES_INFECTE.tone },
          { id: "SECHEUR", label: t("machines_dashboard.filter_dryers", "Sécheurs"), count: machinesSecheurs.length, color: THEME.SECHEUR.tone },
        ].filter((f) => f.id === "TOUS" || f.count > 0).map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filtre === f.id}
            className={`md-filter${filtre === f.id ? " is-active" : ""}`}
            style={{ "--f": f.color }}
            onClick={() => setFiltre(f.id)}
          >
            {f.label} <span className="md-filter__count">{f.count}</span>
          </button>
        ))}
      </div>

      {/* ═══ Machines ═══ */}
      {isLoading ? (
        <div className="md-empty">
          <RefreshCw size={34} className="md-spin" color="#0284c7" />
          <span>{t("machines_dashboard.loading")}</span>
        </div>
      ) : machines.length === 0 ? (
        <div className="md-empty">
          <WashingMachine size={44} strokeWidth={1.4} />
          <strong>{t("machines_dashboard.no_machines")}</strong>
          <span>{t("machines_dashboard.no_machines_text")}</span>
        </div>
      ) : filtre === "TOUS" ? (
        <>
          {machinesNormal.length > 0 && (
            <Section color={THEME.LINGE_NORMAL.tone} Icon={WashingMachine} title={t("machines_dashboard.section_normal")} machines={machinesNormal}>
              {machinesNormal.map(carte)}
            </Section>
          )}
          {machinesInfecte.length > 0 && (
            <Section color={THEME.LINGES_INFECTE.tone} Icon={Biohazard} title={t("machines_dashboard.section_infected")} machines={machinesInfecte}>
              {machinesInfecte.map(carte)}
            </Section>
          )}
          {machinesSecheurs.length > 0 && (
            <Section color={THEME.SECHEUR.tone} Icon={Wind} title={t("machines_dashboard.section_dryers", "Sécheurs")} machines={machinesSecheurs}>
              {machinesSecheurs.map(carte)}
            </Section>
          )}
        </>
      ) : (
        <div className="md-grid" style={{ marginBottom: 30 }}>{machinesFiltrees.map(carte)}</div>
      )}

      {/* ═══ Légende ═══ */}
      <div className="md-legend">
        <span>{t("machines_dashboard.legend")}</span>
        {Object.entries(ETAT_CFG).map(([key, v]) => (
          <span key={key} className="md-legend__item" style={{ "--st": v.color }}>
            <i /> {t(`machine_status.${key}`, v.label)}
          </span>
        ))}
      </div>
    </div>
  );
}
