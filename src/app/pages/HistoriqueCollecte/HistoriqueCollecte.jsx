// pages/HistoriqueCollecte/HistoriqueCollecte.jsx
import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Search, Eye, RefreshCw, X, ChevronRight, ChevronLeft, List, LayoutGrid,
  Printer, Copy, Check, RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { ServiceContext } from "../../contextes/ServiceContext";
import {
  fetchCollectes,
  fetchCollecteDetails,
  fetchPersonnelsByIds,
} from "../../services/historiqueCollecteService";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { SortableHeader } from "../../components/ui/SortableHeader";
import { useSortableData } from "../../hooks/useSortableData";
import { getSetting, formatDateTime } from "../../utils/appSettings";
import { getCategorieMeta } from "../../constants/categoriesLinge";
import {
  C, Glyph, tint, dot, KpiTile, Avatar, StatusPill, useRelativeTime, DrawerShell,
  HistoryPagination, PillFilter, QuickRanges, EmptyIllustration, LoadingRows,
} from "../../components/ui/history-kit";

const IconRoom = (p) => (
  <Glyph {...p}>
    <path d="M3 5v14M21 19v-6.5a3 3 0 0 0-3-3h-7.5V14" />
    <path d="M3 14h18v3H3Z" {...tint} />
    <rect x="5" y="9.5" width="4" height="3" rx="1.5" {...tint} />
  </Glyph>
);
const IconService = (p) => (
  <Glyph {...p}>
    <path d="M4 21V8.5A1.5 1.5 0 0 1 5.5 7H9V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7h3.5A1.5 1.5 0 0 1 20 8.5V21" {...tint} />
    <path d="M2.5 21h19M12 9.5v4M10 11.5h4M10 21v-3.5h4V21" />
  </Glyph>
);
const IconUniform = (p) => (
  <Glyph {...p}>
    <path d="M8 3 4 5.5 2.5 10l3 1.2V21h13V11.2l3-1.2L20 5.5 16 3c-.6 1.6-2.2 2.6-4 2.6S8.6 4.6 8 3Z" {...tint} />
    <path d="M12 5.6V21M15 13h2" />
  </Glyph>
);
const IconBundle = (p) => (
  <Glyph {...p}>
    <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z" {...tint} />
    <path d="M4 8.5 12 13l8-4.5M12 13v7" />
  </Glyph>
);
const IconCollect = (p) => (
  <Glyph {...p}>
    <path d="M5 9h14l-1.3 10.2A2 2 0 0 1 15.7 21H8.3a2 2 0 0 1-2-1.8z" {...tint} />
    <path d="M3.5 9h17M9 9V6.5a3 3 0 0 1 6 0V9" />
  </Glyph>
);
const IconStack = (p) => (
  <Glyph {...p}>
    <path d="M3 7.5 12 3l9 4.5-9 4.5z" {...tint} />
    <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
  </Glyph>
);
const IconGauge = (p) => (
  <Glyph {...p}>
    <path d="M3.5 16a8.5 8.5 0 1 1 17 0" {...tint} />
    <path d="M12 16l4-5" />
    <circle cx="12" cy="16" r="1.4" {...dot} />
    <path d="M3.5 16h2M18.5 16h2M12 7.5v1.5" />
  </Glyph>
);
const IconAlert = (p) => (
  <Glyph {...p}>
    <path d="M10.3 4.3 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" {...tint} />
    <path d="M12 9.5v4" />
    <circle cx="12" cy="16.8" r=".9" {...dot} />
  </Glyph>
);
const IconClock = (p) => (
  <Glyph {...p}>
    <circle cx="12" cy="12" r="9" {...tint} />
    <path d="M12 7.5V12l3 2" />
  </Glyph>
);

/* ═══════════════════════════════════════════════════════════════
   DONNÉES — origine, compteurs, état
   ═══════════════════════════════════════════════════════════════ */
// L'origine se lit dans le préfixe du numéro (CH-…, SVC-…, UNI-…, COL-…)
const SOURCES = {
  CH:  { id: "CH",  color: C.teal,   Icon: IconRoom,    key: "source_room",    fb: "Chambre" },
  SVC: { id: "SVC", color: C.sky,    Icon: IconService, key: "source_service", fb: "Service" },
  UNI: { id: "UNI", color: C.violet, Icon: IconUniform, key: "source_uniform", fb: "Uniformes" },
  COL: { id: "COL", color: C.orange, Icon: IconBundle,  key: "source_linen",   fb: "Linge de service" },
  AUTRE: { id: "AUTRE", color: C.slate, Icon: IconCollect, key: "source_other", fb: "Collecte" },
};
const getSource = (c) => SOURCES[(c.numeroCollecte || "").split("-")[0].toUpperCase()] || SOURCES.AUTRE;

// Compteurs renvoyés par l'API (clés accentuées côté backend)
function getCounts(c) {
  const n = (v) => Number(v) || 0;
  const blanc = n(c["nbScannésBlanc"] ?? c.nbScannesBlanc);
  const infectes = n(c["nbInfectésPrésumés"] ?? c.nbInfectesPresumes);
  const propres = n(c.nbPropres);
  const manquants = n(c.nbManquants);
  const attendus = n(c.nbAttendus);
  const traites = blanc + infectes + propres + manquants;
  const pct = attendus > 0 ? Math.min(100, Math.round((traites / attendus) * 100)) : traites > 0 ? 100 : 0;
  return { blanc, infectes, propres, manquants, attendus, traites, pct };
}

const ETATS = {
  EN_TRAITEMENT: { color: C.amber, key: "etat_running", fb: "En cours", pulse: true },
  VERIFIE:       { color: C.green, key: "etats.VERIFIE", fb: "Vérifiée" },
  CLOTUREE:      { color: C.teal,  key: "etats.CLOTUREE", fb: "Clôturée" },
};
const normEtat = (e) => String(e || "").toUpperCase();
const etatLabel = (etat, t) => {
  const e = ETATS[normEtat(etat)];
  return e ? t(`historique_collecte.${e.key}`, e.fb) : etat || "—";
};
const isDone = (c) => ["VERIFIE", "CLOTUREE"].includes(normEtat(c.etatCollecte));

function parseExpected(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}

function durationMinutes(c) {
  const start = c.dateDebut || c.dateCollecte;
  if (!start || !c.dateFin) return null;
  const m = Math.round((new Date(c.dateFin) - new Date(start)) / 60000);
  return m >= 0 ? m : null;
}

function extractPersonnelName(p) {
  if (!p) return null;
  if (p.nomPrenom) return p.nomPrenom;
  if (p.nom_prenom) return p.nom_prenom;
  if (p.nomComplet) return p.nomComplet;
  if (p.fullName) return p.fullName;
  const nom = p.nom || p.Nom || p.lastName || "";
  const prenom = p.prenom || p.Prenom || p.firstName || "";
  if (nom || prenom) return `${nom} ${prenom}`.trim();
  return p.matricule || p.code || null;
}

const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

/* ═══════════════════════════════════════════════════════════════
   PETITS COMPOSANTS
   ═══════════════════════════════════════════════════════════════ */
function SourceTile({ source, size = 40 }) {
  const { Icon, color } = source;
  return (
    <div className="flex items-center justify-center shrink-0 rounded-xl"
      style={{ width: size, height: size, color, background: `${color}14`, border: `1px solid ${color}26` }}>
      <Icon size={Math.round(size * 0.5)} />
    </div>
  );
}

function EtatPill({ etat, t }) {
  const e = ETATS[normEtat(etat)];
  return <StatusPill color={e?.color || C.slate} pulse={e?.pulse} label={etatLabel(etat, t)} />;
}

// Barre empilée Blanc / Propre / Infecté / Manquant
const SEGMENTS = [
  { k: "blanc", color: C.green, key: "white_collected", fb: "Blanc" },
  { k: "propres", color: C.sky, key: "clean_in_place", fb: "Propre en place" },
  { k: "infectes", color: C.red, key: "infected", fb: "Infecté" },
  { k: "manquants", color: C.amber, key: "missing", fb: "Manquant" },
];
function StackedBar({ counts, height = 8 }) {
  const base = Math.max(counts.attendus, counts.traites, 1);
  return (
    <div className="flex w-full overflow-hidden rounded-full bg-slate-100" style={{ height }}>
      {SEGMENTS.map((s) => counts[s.k] > 0 && (
        <motion.span key={s.k} initial={{ width: 0 }} animate={{ width: `${(counts[s.k] / base) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }} style={{ background: s.color }} />
      ))}
    </div>
  );
}

function ProgressRing({ pct, size = 112, color = C.teal }) {
  const r = 42, circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-slate-100" strokeWidth="9" />
      <motion.circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        transform="rotate(-90 50 50)" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
        transition={{ duration: 0.9, ease: "easeOut" }} />
      <text x="50" y="48" textAnchor="middle" dominantBaseline="central" className="fill-current text-slate-800"
        style={{ fontSize: 22, fontWeight: 800 }}>{pct}%</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PANNEAU DE DÉTAIL
   ═══════════════════════════════════════════════════════════════ */
function DetailDrawer({ collecte, resume, resumeLoading, onClose, agentName, serviceName, t, relative }) {
  const [copied, setCopied] = useState(false);

  if (!collecte) return null;

  const source = getSource(collecte);
  const counts = getCounts(collecte);
  const expected = parseExpected(collecte.quantitesAttendues);
  const duration = durationMinutes(collecte);
  const done = isDone(collecte);

  // Catégories collectées (résumé) fusionnées avec les quantités attendues
  const catMap = {};
  (resume?.categories || []).forEach((c) => { catMap[c.categorie] = { collected: Number(c.quantite) || 0, expected: 0 }; });
  Object.entries(expected).forEach(([cat, q]) => {
    catMap[cat] = { collected: catMap[cat]?.collected || 0, expected: Number(q) || 0 };
  });
  const categories = Object.entries(catMap).sort((a, b) => b[1].collected - a[1].collected);
  const totalPieces = resume?.totalPieces ?? categories.reduce((s, [, v]) => s + v.collected, 0);
  const catMax = Math.max(1, ...categories.map(([, v]) => Math.max(v.collected, v.expected)));

  const location =
    source.id === "CH" && collecte.codeChambre ? `${t("historique_collecte.room", "Chambre")} ${collecte.codeChambre}` : serviceName;

  const copy = async () => {
    try { await navigator.clipboard.writeText(collecte.numeroCollecte || String(collecte.id)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* presse-papiers indisponible */ }
  };

  const printReport = () => {
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) return;
    const rows = SEGMENTS.map((s) => `<tr><td><span class="dot" style="background:${s.color}"></span>${escapeHtml(t(`historique_collecte.${s.key}`, s.fb))}</td><td class="num">${counts[s.k]}</td></tr>`).join("");
    const catRows = categories.map(([cat, v]) => `<tr><td>${escapeHtml(t(`categories.${cat}`, cat))}</td><td class="num">${v.collected}</td><td class="num">${v.expected || "—"}</td></tr>`).join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(collecte.numeroCollecte || collecte.id)}</title>
      <style>
        *{box-sizing:border-box} body{font-family:Segoe UI,Arial,sans-serif;color:#0f172a;margin:32px;font-size:13px}
        h1{font-size:20px;margin:0} .muted{color:#64748b} .head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #0d9488;padding-bottom:12px;margin-bottom:20px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-bottom:20px} .grid div{display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding:6px 0}
        h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#0d9488;margin:22px 0 8px}
        table{width:100%;border-collapse:collapse} td,th{padding:7px 8px;border-bottom:1px solid #e2e8f0;text-align:left} th{font-size:11px;text-transform:uppercase;color:#64748b}
        .num{text-align:right;font-variant-numeric:tabular-nums;font-weight:600} .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:8px}
        .total td{font-weight:800;border-top:2px solid #0f172a} .foot{margin-top:40px;display:flex;justify-content:space-between;color:#64748b;font-size:11px}
        .sign{margin-top:48px;display:flex;justify-content:space-between} .sign div{width:40%;border-top:1px solid #94a3b8;padding-top:6px;color:#64748b;font-size:11px}
      </style></head><body>
      <div class="head"><div><div class="muted">${escapeHtml(t("historique_collecte.report_title", "Rapport de collecte"))}</div><h1>${escapeHtml(collecte.numeroCollecte || "#" + collecte.id)}</h1></div>
      <div class="muted">${escapeHtml(t(`historique_collecte.${source.key}`, source.fb))} · ${escapeHtml(formatDateTime(collecte.dateCollecte))}</div></div>
      <div class="grid">
        <div><span class="muted">${escapeHtml(t("historique_collecte.agent", "Agent"))}</span><b>${escapeHtml(agentName)}</b></div>
        <div><span class="muted">${escapeHtml(t("historique_collecte.location", "Lieu"))}</span><b>${escapeHtml(location)}</b></div>
        <div><span class="muted">${escapeHtml(t("historique_collecte.status", "État"))}</span><b>${escapeHtml(etatLabel(collecte.etatCollecte, t))}</b></div>
        <div><span class="muted">${escapeHtml(t("historique_collecte.duration", "Durée"))}</span><b>${duration != null ? duration + " " + escapeHtml(t("historique_collecte.min", "min")) : "—"}</b></div>
        <div><span class="muted">${escapeHtml(t("historique_collecte.ended_at", "Terminée le"))}</span><b>${escapeHtml(formatDateTime(collecte.dateFin))}</b></div>
        <div><span class="muted">${escapeHtml(t("historique_collecte.completion", "Complétude"))}</span><b>${counts.traites} / ${counts.attendus} (${counts.pct}%)</b></div>
      </div>
      <h2>${escapeHtml(t("historique_collecte.outcome", "Résultat"))}</h2>
      <table>${rows}<tr class="total"><td>${escapeHtml(t("historique_collecte.processed", "Traitées"))}</td><td class="num">${counts.traites}</td></tr></table>
      ${categories.length ? `<h2>${escapeHtml(t("historique_collecte.categories", "Catégories"))}</h2><table><tr><th>${escapeHtml(t("historique_collecte.category", "Catégorie"))}</th><th class="num">${escapeHtml(t("historique_collecte.collected", "Collecté"))}</th><th class="num">${escapeHtml(t("historique_collecte.expected", "Attendu"))}</th></tr>${catRows}<tr class="total"><td>${escapeHtml(t("historique_collecte.total_pieces", "Total pièces"))}</td><td class="num">${totalPieces}</td><td></td></tr></table>` : ""}
      <div class="sign"><div>${escapeHtml(t("historique_collecte.sign_agent", "Signature de l'agent"))}</div><div>${escapeHtml(t("historique_collecte.sign_manager", "Visa du responsable"))}</div></div>
      <div class="foot"><span>ID ${collecte.id}</span><span>${escapeHtml(t("historique_collecte.printed_on", "Imprimé le"))} ${escapeHtml(formatDateTime(new Date()))}</span></div>
      <script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  };

  const timeline = [
    { label: t("historique_collecte.opened", "Ouverte"), date: collecte.dateDebut || collecte.dateCollecte, color: source.color, done: true },
    done || collecte.dateFin
      ? { label: t("historique_collecte.ended", "Terminée"), date: collecte.dateFin, color: C.green, done: true }
      : { label: t("historique_collecte.in_progress", "En cours de collecte"), date: null, color: C.amber, done: false },
  ];

  const info = [
    [t("historique_collecte.collection_number", "Numéro"), collecte.numeroCollecte || "—", true],
    [t("historique_collecte.collection_id", "ID"), collecte.id, true],
    [t("historique_collecte.agent", "Agent"), agentName],
    [t("historique_collecte.service", "Service"), serviceName],
    ...(collecte.codeChambre ? [[t("historique_collecte.room", "Chambre"), collecte.codeChambre]] : []),
    ...(collecte.litIdSqlServer ? [[t("historique_collecte.bed", "Lit"), `#${collecte.litIdSqlServer}`, true]] : []),
    [t("historique_collecte.created_at", "Créée le"), formatDateTime(collecte.dateCollecte)],
  ];

  return (
    <DrawerShell onClose={onClose} ariaLabel={t("historique_collecte.collection_details", "Détails de la collecte")}>
        {/* En-tête */}
        <div className="relative shrink-0 overflow-hidden px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 bg-white border-b border-slate-200">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${source.color}18, transparent 60%)` }} />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${source.color}, ${source.color}cc)`, boxShadow: `0 8px 20px ${source.color}40` }}>
                <source.Icon size={28} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: source.color }}>
                  {t(`historique_collecte.${source.key}`, source.fb)}
                </p>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900 font-mono truncate">{collecte.numeroCollecte || `#${collecte.id}`}</h2>
                  <button type="button" onClick={copy} className="premium-table__icon-btn" title={t("common.copy", "Copier")}>
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 truncate">{location} · {relative(collecte.dateCollecte)}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="premium-table__icon-btn" title={t("common.close", "Fermer")}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            <EtatPill etat={collecte.etatCollecte} t={t} />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
              <Avatar name={agentName} id={collecte.personnelId} size={16} /> {agentName}
            </span>
            {duration != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
                <IconClock size={13} /> {duration} {t("historique_collecte.min", "min")}
              </span>
            )}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-4">
          {/* Résultat */}
          <section className="bg-white rounded-[18px] border border-slate-200 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">{t("historique_collecte.outcome", "Résultat")}</h3>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
              <div className="shrink-0 text-center">
                <ProgressRing pct={counts.pct} color={counts.pct >= 100 ? C.green : source.color} size={104} />
                <p className="text-[11px] font-semibold text-slate-500 -mt-1">
                  {counts.traites} / {counts.attendus || "—"} {t("historique_collecte.processed_short", "traitées")}
                </p>
              </div>
              <div className="w-full sm:flex-1 grid grid-cols-2 gap-2">
                {SEGMENTS.map((s) => (
                  <div key={s.k} className="rounded-xl border border-slate-100 px-3 py-2.5" style={{ background: `${s.color}08` }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{t(`historique_collecte.${s.key}`, s.fb)}</span>
                    </div>
                    <p className="text-xl font-extrabold text-slate-800 tabular-nums leading-tight mt-0.5">{counts[s.k]}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4"><StackedBar counts={counts} height={10} /></div>
            {(counts.infectes > 0 || counts.manquants > 0) && (
              <div className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                style={{ color: counts.infectes ? C.red : C.amber, background: `${counts.infectes ? C.red : C.amber}0f` }}>
                <IconAlert size={16} />
                <span>
                  {counts.infectes > 0 && t("historique_collecte.alert_infected", "{{count}} pièce(s) infectée(s) présumée(s)", { count: counts.infectes })}
                  {counts.infectes > 0 && counts.manquants > 0 && " · "}
                  {counts.manquants > 0 && t("historique_collecte.alert_missing", "{{count}} pièce(s) manquante(s)", { count: counts.manquants })}
                </span>
              </div>
            )}
          </section>

          {/* Catégories */}
          <section className="bg-white rounded-[18px] border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("historique_collecte.categories", "Catégories")}</h3>
              {!resumeLoading && (
                <span className="text-xs font-bold text-slate-600">{totalPieces} {t("historique_collecte.pieces", "pièce(s)")}</span>
              )}
            </div>
            {resumeLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />)}</div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">{t("historique_collecte.no_categories", "Aucune pièce enregistrée pour cette collecte.")}</p>
            ) : (
              <div className="space-y-3">
                {categories.map(([cat, v], i) => {
                  const { Icon, accent } = getCategorieMeta(cat);
                  const over = v.expected > 0 && v.collected >= v.expected;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ color: accent, background: `${accent}14` }}>
                        <Icon className="w-[18px] h-[18px]" strokeWidth={1.9} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-700 truncate">{t(`categories.${cat}`, cat)}</span>
                          <span className="text-sm tabular-nums">
                            <b className="text-slate-800">{v.collected}</b>
                            {v.expected > 0 && <span className="text-slate-400"> / {v.expected}</span>}
                          </span>
                        </div>
                        <div className="relative mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          {v.expected > 0 && <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(v.expected / catMax) * 100}%`, background: `${accent}26` }} />}
                          <motion.span className="absolute inset-y-0 left-0 rounded-full" initial={{ width: 0 }}
                            animate={{ width: `${(v.collected / catMax) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.05 }}
                            style={{ background: over ? C.green : accent }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(expected).length > 0 && (
                  <p className="text-[11px] text-slate-400 pt-1">{t("historique_collecte.expected_hint", "Partie claire de la barre : quantité attendue.")}</p>
                )}
              </div>
            )}
          </section>

          {/* Chronologie */}
          <section className="bg-white rounded-[18px] border border-slate-200 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">{t("historique_collecte.timeline", "Chronologie")}</h3>
            <ol className="relative ml-2">
              {timeline.map((step, i) => (
                <li key={i} className="relative pl-7 pb-5 last:pb-0">
                  {i < timeline.length - 1 && <span className="absolute left-[5px] top-4 bottom-0 w-px bg-slate-200" />}
                  <span className={`absolute left-0 top-1 w-3 h-3 rounded-full ring-4 ${step.done ? "" : "animate-pulse"}`}
                    style={{ background: step.color, "--tw-ring-color": `${step.color}26` }} />
                  <p className="text-sm font-bold text-slate-800">{step.label}</p>
                  <p className="text-xs text-slate-500">{step.date ? `${formatDateTime(step.date)} · ${relative(step.date)}` : t("historique_collecte.not_finished", "Pas encore terminée")}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Informations */}
          <section className="bg-white rounded-[18px] border border-slate-200 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t("historique_collecte.information", "Informations")}</h3>
            <dl className="divide-y divide-slate-100">
              {info.map(([label, value, mono]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className={`text-sm font-semibold text-slate-800 text-right truncate ${mono ? "font-mono" : ""}`}>{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Pied */}
        <div className="shrink-0 flex items-center justify-end gap-2 px-4 sm:px-5 py-3 sm:py-4 bg-white border-t border-slate-200">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50">
            {t("common.close", "Fermer")}
          </button>
          <button type="button" onClick={printReport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-bold text-white shadow-sm hover:shadow-md transition-all"
            style={{ background: `linear-gradient(135deg, ${C.green}, ${C.teal})` }}>
            <Printer className="w-4 h-4" /> {t("historique_collecte.print_report", "Imprimer le rapport")}
          </button>
        </div>
    </DrawerShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════════════════════════ */
const EMPTY_FILTERS = { search: "", source: "", etat: "", dateFrom: "", dateTo: "" };

export default function HistoriqueCollecte() {
  const { t } = useTranslation();
  const { services = [] } = useContext(ServiceContext) || {};

  const [collectes, setCollectes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [personnelsCache, setPersonnelsCache] = useState({});
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const [selected, setSelected] = useState(null);
  const [resumes, setResumes] = useState({});
  const [resumeLoading, setResumeLoading] = useState(false);
  const itemsPerPage = Number(getSetting("display.pageSize")) || 10;

  /* ─── Chargement ─────────────────────────────────────────────── */
  const loadCollectes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCollectes();
      const list = Array.isArray(data) ? data : [];
      setCollectes(list);
      // Noms des agents en une fois (fetchPersonnelsByIds renvoie { id: personnel })
      const ids = [...new Set(list.map((c) => c.personnelId).filter((id) => id != null))];
      if (ids.length) {
        const map = await fetchPersonnelsByIds(ids);
        const cache = {};
        Object.entries(map || {}).forEach(([id, p]) => { cache[id] = extractPersonnelName(p) || `#${id}`; });
        setPersonnelsCache(cache);
      }
    } catch (error) {
      console.error("Erreur chargement collectes:", error);
      setCollectes([]);
      Swal.fire({ icon: "error", title: t("common.error"), text: error.message || t("historique_collecte.load_error"), timer: 3000, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadCollectes(); }, [loadCollectes]);
  useEffect(() => { setCurrentPage(1); }, [filters]);

  const openDetails = useCallback(async (collecte) => {
    setSelected(collecte);
    if (resumes[collecte.id]) return;
    setResumeLoading(true);
    try {
      const data = await fetchCollecteDetails(collecte.id);
      setResumes((prev) => ({ ...prev, [collecte.id]: data }));
    } catch (err) {
      console.error("Erreur chargement détails:", err);
    } finally {
      setResumeLoading(false);
    }
  }, [resumes]);

  /* ─── Libellés ───────────────────────────────────────────────── */
  const getAgentName = useCallback((id) => {
    if (id == null) return t("historique_collecte.unknown_agent", "Agent non renseigné");
    return personnelsCache[id] || `#${id}`;
  }, [personnelsCache, t]);

  const getServiceName = useCallback((serviceId) => {
    if (!serviceId) return t("historique_collecte.unassigned");
    const s = services.find((x) => x.id === serviceId);
    return s ? (s.nom || s.libelle || s.code) : `#${serviceId}`;
  }, [services, t]);

  const getLocation = useCallback((c) => {
    const src = getSource(c);
    if (src.id === "CH" && c.codeChambre) return `${t("historique_collecte.room", "Chambre")} ${c.codeChambre}`;
    return getServiceName(c.service);
  }, [getServiceName, t]);

  const relative = useRelativeTime();

  /* ─── Filtres ────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return collectes.filter((c) => {
      if (filters.source && getSource(c).id !== filters.source) return false;
      if (filters.etat && normEtat(c.etatCollecte) !== filters.etat) return false;
      const d = new Date(c.dateCollecte);
      if (filters.dateFrom && d < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && d > new Date(filters.dateTo + "T23:59:59")) return false;
      if (!term) return true;
      return [c.numeroCollecte, c.codeChambre, getAgentName(c.personnelId), getServiceName(c.service), String(c.id)]
        .some((v) => String(v || "").toLowerCase().includes(term));
    })
      // Ordre de base : la plus récente en premier
      .sort((a, b) => new Date(b.dateCollecte) - new Date(a.dateCollecte));
  }, [collectes, filters, getAgentName, getServiceName]);

  const hasFilters = Object.values(filters).some(Boolean);

  /* ─── Indicateurs ────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    let traites = 0, attendus = 0, infectes = 0, manquants = 0, done = 0;
    filtered.forEach((c) => {
      const k = getCounts(c);
      traites += k.traites; attendus += k.attendus; infectes += k.infectes; manquants += k.manquants;
      if (isDone(c)) done++;
    });
    return {
      total: filtered.length, done, traites, infectes, manquants,
      completion: attendus > 0 ? Math.min(100, Math.round((traites / attendus) * 100)) : 0,
    };
  }, [filtered]);

  const sourceCounts = useMemo(() => {
    const m = {};
    collectes.forEach((c) => { const id = getSource(c).id; m[id] = (m[id] || 0) + 1; });
    return m;
  }, [collectes]);

  /* ─── Tri + pagination ───────────────────────────────────────── */
  const { sortedItems, requestSort, directionFor } = useSortableData(filtered, {
    agent: (c) => getAgentName(c.personnelId),
    location: (c) => getLocation(c),
    progress: (c) => getCounts(c).pct,
    etatCollecte: (c) => normEtat(c.etatCollecte),
  });
  const sorted = sortedItems;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = sorted.slice(startIndex, startIndex + itemsPerPage);

  /* ─── Rendu ──────────────────────────────────────────────────── */
  const progressCell = (c) => {
    const k = getCounts(c);
    return (
      <div className="min-w-[150px]">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="text-xs font-bold text-slate-700 tabular-nums">{k.traites}<span className="text-slate-400 font-medium"> / {k.attendus || "—"}</span></span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: k.pct >= 100 ? C.green : C.slate }}>{k.pct}%</span>
        </div>
        <StackedBar counts={k} height={6} />
      </div>
    );
  };

  const emptyState = (
    <div className="text-center py-16 px-6">
      <EmptyIllustration />
      <h3 className="text-lg font-bold text-slate-800 mt-4">{t("historique_collecte.no_collections")}</h3>
      <p className="text-sm text-slate-500 mt-1">{t("historique_collecte.no_collections_hint")}</p>
      {hasFilters && (
        <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-[12px] border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50">
          <RotateCcw className="w-4 h-4" /> {t("common.reset")}
        </button>
      )}
    </div>
  );

  const loadingState = <LoadingRows />;

  const selectCls = "h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6">
        <PageHeaderIcon size={52} />
        <div>
          <h1 className="text-[28px] font-extrabold text-slate-900 m-0 leading-tight">{t("historique_collecte.title")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("historique_collecte.subtitle", "Traçabilité de toutes les collectes : chambres, services et uniformes.")}</p>
        </div>
      </div>

      {/* Indicateurs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile icon={IconCollect} color={C.teal} delay={0}
          label={t("historique_collecte.kpi_collections", "Collectes")} value={kpis.total}
          hint={t("historique_collecte.kpi_done", "{{count}} terminée(s)", { count: kpis.done })} />
        <KpiTile icon={IconStack} color={C.sky} delay={0.05}
          label={t("historique_collecte.kpi_pieces", "Pièces traitées")} value={kpis.traites}
          hint={t("historique_collecte.kpi_pieces_hint", "Blanc, propre, infecté et manquant")} />
        <KpiTile icon={IconGauge} color={kpis.completion >= 90 ? C.green : C.orange} delay={0.1}
          label={t("historique_collecte.completion", "Complétude")} value={`${kpis.completion}%`}
          hint={t("historique_collecte.kpi_completion_hint", "Pièces traitées / attendues")} />
        <KpiTile icon={IconAlert} color={kpis.infectes ? C.red : C.amber} delay={0.15}
          label={t("historique_collecte.kpi_alerts", "Alertes")} value={kpis.infectes + kpis.manquants}
          hint={t("historique_collecte.kpi_alerts_hint", "{{infected}} infectée(s) · {{missing}} manquante(s)", { infected: kpis.infectes, missing: kpis.manquants })} />
      </div>

      {/* Barre d'outils : origine + actions */}
      <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <PillFilter
          ariaLabel={t("historique_collecte.source", "Origine")}
          value={filters.source}
          onChange={(source) => setFilters((f) => ({ ...f, source }))}
          options={[
            { id: "", label: t("historique_collecte.all_sources", "Toutes"), color: C.teal, count: collectes.length },
            ...["CH", "SVC", "UNI", "COL"].filter((id) => sourceCounts[id]).map((id) => ({
              id, label: t(`historique_collecte.${SOURCES[id].key}`, SOURCES[id].fb), color: SOURCES[id].color, Icon: SOURCES[id].Icon, count: sourceCounts[id],
            })),
          ]}
        />

        <div className="flex-1" />

        <button type="button" onClick={loadCollectes} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-60">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{t("common.refresh")}</span>
        </button>
        <div className="flex items-center bg-slate-100 p-1 rounded-[12px]" role="group">
          {[{ mode: "table", Icon: List }, { mode: "cards", Icon: LayoutGrid }].map(({ mode, Icon }) => (
            <button key={mode} type="button" onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode}
              className={`p-2 rounded-[9px] transition-all ${viewMode === mode ? "bg-white shadow-sm text-[#0d9488]" : "text-slate-500 hover:text-slate-700"}`}>
              <Icon className="w-4 h-4 stroke-[2.5]" />
            </button>
          ))}
        </div>
      </div>

      {/* Recherche, état, période */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input type="text" value={filters.search} placeholder={t("historique_collecte.search_placeholder")}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full h-10 pl-10 pr-9 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              {filters.search && (
                <button type="button" onClick={() => setFilters({ ...filters, search: "" })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select value={filters.etat} onChange={(e) => setFilters({ ...filters, etat: e.target.value })} className={`${selectCls} lg:w-44`}>
              <option value="">{t("historique_collecte.all_states", "Tous les états")}</option>
              {Object.entries(ETATS).map(([k, v]) => <option key={k} value={k}>{t(`historique_collecte.${v.key}`, v.fb)}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className={`${selectCls} w-[150px]`} aria-label={t("historique_collecte.date_from", "Du")} />
              <span className="text-slate-400">→</span>
              <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className={`${selectCls} w-[150px]`} aria-label={t("historique_collecte.date_to", "Au")} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <QuickRanges dateFrom={filters.dateFrom} dateTo={filters.dateTo} onPick={(range) => setFilters((f) => ({ ...f, ...range }))} />
            {hasFilters && (
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100">
                <RotateCcw className="w-3.5 h-3.5" /> {t("common.reset")}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      {viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            {loading ? loadingState : currentData.length === 0 ? emptyState : (
              <div className="premium-table-wrap">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <SortableHeader direction={directionFor("numeroCollecte")} onSort={() => requestSort("numeroCollecte")}>{t("historique_collecte.collection", "Collecte")}</SortableHeader>
                      <SortableHeader direction={directionFor("location")} onSort={() => requestSort("location")}>{t("historique_collecte.location", "Lieu")}</SortableHeader>
                      <SortableHeader direction={directionFor("agent")} onSort={() => requestSort("agent")}>{t("historique_collecte.agent")}</SortableHeader>
                      <SortableHeader direction={directionFor("dateCollecte")} onSort={() => requestSort("dateCollecte")}>{t("historique_collecte.date_time")}</SortableHeader>
                      <SortableHeader direction={directionFor("progress")} onSort={() => requestSort("progress")}>{t("historique_collecte.progress", "Progression")}</SortableHeader>
                      <SortableHeader direction={directionFor("etatCollecte")} onSort={() => requestSort("etatCollecte")} align="center">{t("historique_collecte.status")}</SortableHeader>
                      <th style={{ textAlign: "right", paddingRight: 20 }}>{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((c) => {
                      const src = getSource(c);
                      const agent = getAgentName(c.personnelId);
                      return (
                        <tr key={c.id} onClick={() => openDetails(c)} className={selected?.id === c.id ? "is-selected" : ""} style={{ cursor: "pointer" }}>
                          <td>
                            <div className="flex items-center gap-3">
                              <SourceTile source={src} />
                              <div className="min-w-0">
                                <div className="premium-table__primary font-mono truncate max-w-[200px]">{c.numeroCollecte || `#${c.id}`}</div>
                                <span className="text-[11px] font-semibold" style={{ color: src.color }}>{t(`historique_collecte.${src.key}`, src.fb)}</span>
                              </div>
                            </div>
                          </td>
                          <td><span className="premium-table__primary">{getLocation(c)}</span></td>
                          <td>
                            <div className="flex items-center gap-2">
                              <Avatar name={agent} id={c.personnelId} />
                              <span className={`text-sm truncate max-w-[160px] ${c.personnelId ? "font-semibold text-slate-700" : "text-slate-400 italic"}`}>{agent}</span>
                            </div>
                          </td>
                          <td>
                            <div className="premium-table__primary tabular-nums">{formatDateTime(c.dateCollecte)}</div>
                            <span className="premium-table__muted">{relative(c.dateCollecte)}</span>
                          </td>
                          <td>{progressCell(c)}</td>
                          <td style={{ textAlign: "center" }}><EtatPill etat={c.etatCollecte} t={t} /></td>
                          <td style={{ textAlign: "right", paddingRight: 20 }} onClick={(e) => e.stopPropagation()}>
                            <div className="premium-table__actions">
                              <button type="button" onClick={() => openDetails(c)} className="premium-table__icon-btn" title={t("common.details")}>
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : loading ? (
        <Card><CardContent className="p-0">{loadingState}</CardContent></Card>
      ) : currentData.length === 0 ? (
        <Card><CardContent className="p-0">{emptyState}</CardContent></Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
          {currentData.map((c, idx) => {
            const src = getSource(c);
            const k = getCounts(c);
            const agent = getAgentName(c.personnelId);
            return (
              <motion.button type="button" key={c.id} onClick={() => openDetails(c)}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                className="group text-left bg-white rounded-[20px] border border-slate-200/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <SourceTile source={src} size={44} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: src.color }}>{t(`historique_collecte.${src.key}`, src.fb)}</p>
                      <p className="font-extrabold text-slate-800 truncate">{getLocation(c)}</p>
                      <p className="text-[11px] font-mono text-slate-400 truncate">{c.numeroCollecte || `#${c.id}`}</p>
                    </div>
                  </div>
                  <EtatPill etat={c.etatCollecte} t={t} />
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs text-slate-500">{t("historique_collecte.progress", "Progression")}</span>
                    <span className="text-xs font-bold text-slate-700 tabular-nums">{k.traites} / {k.attendus || "—"} · {k.pct}%</span>
                  </div>
                  <StackedBar counts={k} height={8} />
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {SEGMENTS.filter((s) => k[s.k] > 0).map((s) => (
                      <span key={s.k} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />{t(`historique_collecte.${s.key}`, s.fb)} {k[s.k]}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Avatar name={agent} id={c.personnelId} size={24} />
                    <span className="text-xs font-semibold text-slate-600 truncate">{agent}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">{relative(c.dateCollecte)}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && (
        <HistoryPagination page={currentPage} pageSize={itemsPerPage} total={sorted.length}
          onChange={setCurrentPage} unitLabel={t("historique_collecte.collections")} />
      )}

      {/* Panneau de détail */}
      <AnimatePresence>
        {selected && (
          <DetailDrawer
            key={selected.id}
            collecte={selected}
            resume={resumes[selected.id]}
            resumeLoading={resumeLoading && !resumes[selected.id]}
            onClose={() => setSelected(null)}
            agentName={getAgentName(selected.personnelId)}
            serviceName={getServiceName(selected.service)}
            relative={relative}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
