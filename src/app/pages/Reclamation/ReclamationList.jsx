import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus, Search, Edit, Trash2, Eye, RefreshCw, X, List, LayoutGrid, RotateCcw,
  Play, CheckCheck, Ban, Copy, Check, Printer, History,
} from "lucide-react";
import Swal from "sweetalert2";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { SortableHeader } from "../../components/ui/SortableHeader";
import { useSortableData } from "../../hooks/useSortableData";
import { FormModal, FormSection } from "../../components/ui/modal-kit";
import { ServiceContext } from "../../contextes/ServiceContext";
import { getSetting, formatDateTime } from "../../utils/appSettings";
import { getCategorieMeta } from "../../constants/categoriesLinge";
import {
  C, Glyph, tint, dot, KpiTile, IconTile, StatusPill, Avatar, useRelativeTime,
  DrawerShell, DrawerSection, HistoryPagination, PillFilter, QuickRanges,
  EmptyIllustration, LoadingRows,
} from "../../components/ui/history-kit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

/* ═══════════════════════════════════════════════════════════════
   TYPES DE RÉCLAMATION — icône duotone + couleur
   ═══════════════════════════════════════════════════════════════ */
const fabric = <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" {...tint} />;
const TYPES = {
  TROU: { color: C.red, Icon: (p) => (<Glyph {...p}>{fabric}<circle cx="12" cy="12" r="3.2" /><path d="M10.6 10.6l2.8 2.8" /></Glyph>) },
  TACHE_PERSISTANTE: { color: C.amber, Icon: (p) => (<Glyph {...p}>{fabric}<path d="M12 7.5c2 2.4 3 4 3 5.4a3 3 0 0 1-6 0c0-1.4 1-3 3-5.4Z" /></Glyph>) },
  DECHIRE: { color: C.violet, Icon: (p) => (<Glyph {...p}>{fabric}<path d="M8 6l2.5 3.5L8.5 12l3 3-1.5 3" /><path d="M13.5 6.5 16 9" /></Glyph>) },
  COUTURE_ABIMEE: { color: C.pink, Icon: (p) => (<Glyph {...p}>{fabric}<path d="M7 12h1.8M10.6 12h1.8M14.2 12h1.8" /><path d="M17.5 6.5 9.5 17.5" strokeOpacity=".55" /></Glyph>) },
  BOUTON_MANQUANT: { color: C.sky, Icon: (p) => (<Glyph {...p}><circle cx="12" cy="12" r="8" strokeDasharray="3 2.6" /><circle cx="12" cy="12" r="4.2" {...tint} /><circle cx="10.6" cy="10.6" r=".8" {...dot} /><circle cx="13.4" cy="10.6" r=".8" {...dot} /><circle cx="10.6" cy="13.4" r=".8" {...dot} /><circle cx="13.4" cy="13.4" r=".8" {...dot} /></Glyph>) },
  A_REFORMER: { color: C.orange, Icon: (p) => (<Glyph {...p}><path d="M4 8h16v10.5A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5z" {...tint} /><path d="M3 4.5h18V8H3zM12 11v5.5M9.5 14l2.5 2.5 2.5-2.5" /></Glyph>) },
  MAL_LAVE: { color: C.cyan, Icon: (p) => (<Glyph {...p}><rect x="4" y="3" width="16" height="18" rx="2.5" {...tint} /><path d="M4 7.5h16" /><circle cx="12" cy="14" r="4" /><path d="M10.6 12.6l2.8 2.8M13.4 12.6l-2.8 2.8" /></Glyph>) },
  AUTRE: { color: C.slate, Icon: (p) => (<Glyph {...p}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.5V17h0a2 2 0 0 1-2-2z" {...tint} /><path d="M12 8v3.5" /><circle cx="12" cy="13.8" r=".9" {...dot} /></Glyph>) },
};
const getType = (type) => TYPES[type] || TYPES.AUTRE;
const TYPE_KEYS = Object.keys(TYPES);

// Statuts et enchaînement : OUVERTE → EN_COURS → RESOLUE → FERMEE
const STATUSES = {
  OUVERTE:  { color: C.amber, pulse: true, fb: "Ouverte" },
  EN_COURS: { color: C.sky,   pulse: true, fb: "En cours" },
  RESOLUE:  { color: C.green, fb: "Résolue" },
  FERMEE:   { color: C.slate, fb: "Fermée" },
};
const STATUS_ORDER = ["OUVERTE", "EN_COURS", "RESOLUE", "FERMEE"];

// Icônes des indicateurs
const IconInbox = (p) => (<Glyph {...p}><path d="M3.5 13.5 6 5.5A1.5 1.5 0 0 1 7.4 4.5h9.2A1.5 1.5 0 0 1 18 5.5l2.5 8V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z" {...tint} /><path d="M3.5 13.5h4.5l1.5 2.5h5l1.5-2.5h4.5" /></Glyph>);
const IconHourglass = (p) => (<Glyph {...p}><path d="M7 3.5h10M7 20.5h10" /><path d="M8 3.5c0 4.5 4 5 4 8.5s-4 4-4 8.5h8c0-4.5-4-5-4-8.5s4-4 4-8.5" {...tint} /></Glyph>);
const IconShieldCheck = (p) => (<Glyph {...p}><path d="M12 3l7 3v5.5c0 4.3-3 7.9-7 9.5-4-1.6-7-5.2-7-9.5V6z" {...tint} /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></Glyph>);
const IconTarget = (p) => (<Glyph {...p}><circle cx="12" cy="12" r="8.5" {...tint} /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.2" {...dot} /></Glyph>);

const EMPTY_FILTERS = { search: "", status: "", type: "", dateFrom: "", dateTo: "" };
const EMPTY_FORM = { codeBarre: "", description: "", type: "TROU", categorieLinge: "", agentId: "" };

const agentFullName = (a) => (a ? [a.prenom, a.nom].filter(Boolean).join(" ") || a.matricule || `#${a.id}` : "");
const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

/* ═══════════════════════════════════════════════════════════════
   PANNEAU DE DÉTAIL
   ═══════════════════════════════════════════════════════════════ */
function ReclamationDrawer({ rec, onClose, onEdit, onDelete, onStatus, statusBusy, getServiceName, relative, t }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const type = getType(rec.type);
  const status = STATUSES[rec.status] || { color: C.slate, fb: rec.status };
  const linge = rec.linge || {};
  const cat = getCategorieMeta(linge.categorie);
  const agent = agentFullName(rec.agent);
  const typeLabel = t(`reclamations.types.${rec.type}`, rec.type || "—");
  const statusLabel = (s) => t(`reclamations.statuses.${s}`, STATUSES[s]?.fb || s);
  const currentIdx = STATUS_ORDER.indexOf(rec.status);

  // Actions possibles selon le statut
  const actions = {
    OUVERTE: [{ to: "EN_COURS", label: t("reclamations.take"), Icon: Play, color: C.sky }],
    EN_COURS: [
      { to: "RESOLUE", label: t("reclamations.resolve_btn"), Icon: CheckCheck, color: C.green },
      { to: "FERMEE", label: t("reclamations.close_btn"), Icon: Ban, color: C.slate },
    ],
    RESOLUE: [
      { to: "FERMEE", label: t("reclamations.close_btn"), Icon: Ban, color: C.slate },
      { to: "EN_COURS", label: t("reclamations.reopen_btn"), Icon: RotateCcw, color: C.amber },
    ],
    FERMEE: [{ to: "EN_COURS", label: t("reclamations.reopen_btn"), Icon: RotateCcw, color: C.amber }],
  }[rec.status] || [];

  const copy = async () => {
    try { await navigator.clipboard.writeText(linge.codeBarre || ""); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* indisponible */ }
  };

  const printSheet = () => {
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) return;
    const row = (k, v) => `<div><span class="muted">${escapeHtml(k)}</span><b>${escapeHtml(v ?? "—")}</b></div>`;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(t("reclamations.details_title"))} #${rec.id}</title>
      <style>*{box-sizing:border-box}body{font-family:Segoe UI,Arial,sans-serif;color:#0f172a;margin:32px;font-size:13px}
      h1{font-size:20px;margin:0}.muted{color:#64748b}.head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid ${type.color};padding-bottom:12px;margin-bottom:20px}
      h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:${type.color};margin:22px 0 8px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px}.grid div{display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding:6px 0}
      .desc{border:1px solid #e2e8f0;border-radius:8px;padding:12px;min-height:60px}
      .sign{margin-top:56px;display:flex;justify-content:space-between}.sign div{width:40%;border-top:1px solid #94a3b8;padding-top:6px;color:#64748b;font-size:11px}
      .foot{margin-top:32px;color:#64748b;font-size:11px;text-align:right}</style></head><body>
      <div class="head"><div><div class="muted">${escapeHtml(t("reclamations.sheet_title", "Fiche de réclamation"))}</div><h1>#${rec.id} · ${escapeHtml(typeLabel)}</h1></div>
      <div class="muted">${escapeHtml(statusLabel(rec.status))} · ${escapeHtml(formatDateTime(rec.dateCreation))}</div></div>
      <h2>${escapeHtml(t("reclamations.article_concerned", "Article concerné"))}</h2>
      <div class="grid">${row(t("reclamations.article_code"), linge.codeBarre)}${row(t("reclamations.article_category"), t(`categories.${linge.categorie}`, linge.categorie || "—"))}
      ${row(t("linge.service", "Service"), getServiceName(linge.serviceId))}${row(t("reclamations.wearer", "Porteur"), linge.porteurNom)}
      ${row(t("reclamations.wash_count", "Lavages"), linge.nbLavage)}${row(t("reclamations.linen_state", "État du linge"), linge.etat ? t(`linge_etat.${linge.etat}`, linge.etat) : "—")}</div>
      <h2>${escapeHtml(t("reclamations.problem_description"))}</h2><div class="desc">${escapeHtml(rec.description || t("reclamations.no_description", "Aucune description saisie."))}</div>
      <h2>${escapeHtml(t("reclamations.declared_by", "Déclarée par"))}</h2>
      <div class="grid">${row(t("reclamations.agent"), agent)}${row(t("reclamations.matricule", "Matricule"), rec.agent?.matricule)}</div>
      <div class="sign"><div>${escapeHtml(t("historique_collecte.sign_agent", "Signature de l'agent"))}</div><div>${escapeHtml(t("historique_collecte.sign_manager", "Visa du responsable"))}</div></div>
      <div class="foot">${escapeHtml(t("historique_collecte.printed_on", "Imprimé le"))} ${escapeHtml(formatDateTime(new Date()))}</div>
      <script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  };

  const lingeInfo = [
    [t("reclamations.article_category"), linge.categorie ? t(`categories.${linge.categorie}`, linge.categorie) : "—"],
    [t("reclamations.linen_state", "État du linge"), linge.etat ? t(`linge_etat.${linge.etat}`, linge.etat) : "—"],
    [t("linge.service", "Service"), getServiceName(linge.serviceId)],
    [t("reclamations.wearer", "Porteur"), linge.porteurNom || "—"],
    [t("reclamations.wash_count", "Lavages"), linge.nbLavage ?? "—"],
    [t("linge.export.weight", "Poids (kg)"), linge.poids ?? "—"],
    ...(linge.dureVie != null ? [[t("linge.export.lifespan", "Durée de vie"), linge.dureVie]] : []),
  ];

  return (
    <DrawerShell onClose={onClose} ariaLabel={`${t("reclamations.details_title")} #${rec.id}`}>
      {/* En-tête */}
      <div className="relative shrink-0 overflow-hidden px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 bg-white border-b border-slate-200">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${type.color}18, transparent 60%)` }} />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${type.color}, ${type.color}cc)`, boxShadow: `0 8px 20px ${type.color}40` }}>
              <type.Icon size={28} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: type.color }}>{typeLabel}</p>
              <h2 className="text-lg font-extrabold text-slate-900">{t("reclamations.details_title")} #{rec.id}</h2>
              <p className="text-xs text-slate-500 truncate">{formatDateTime(rec.dateCreation)} · {relative(rec.dateCreation)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="premium-table__icon-btn" title={t("common.close")}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <StatusPill color={status.color} pulse={status.pulse} label={statusLabel(rec.status)} />
          {agent && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
              <Avatar name={agent} id={rec.agent?.id} size={16} /> {agent}
            </span>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-4">
        {/* Avancement + actions */}
        <DrawerSection title={t("reclamations.progress", "Avancement")}>
          <ol className="flex items-start">
            {STATUS_ORDER.map((s, i) => {
              const reached = currentIdx >= i;
              const current = currentIdx === i;
              const color = STATUSES[s].color;
              return (
                <li key={s} className="flex-1 flex flex-col items-center text-center relative">
                  {i > 0 && (
                    <span className="absolute top-[13px] right-1/2 w-full h-[3px] rounded-full -z-0"
                      style={{ background: currentIdx >= i ? STATUSES[STATUS_ORDER[i]].color : "#e2e8f0" }} />
                  )}
                  <span className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${current ? "ring-4" : ""}`}
                    style={{ background: reached ? color : "#fff", color: reached ? "#fff" : "#94a3b8", border: reached ? "none" : "2px solid #e2e8f0", "--tw-ring-color": `${color}33` }}>
                    {reached && !current ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={`mt-1.5 text-[11px] font-bold ${current ? "" : "text-slate-400"}`} style={current ? { color } : undefined}>
                    {statusLabel(s)}
                  </span>
                </li>
              );
            })}
          </ol>
          {actions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5">
              {actions.map((a) => (
                <button key={a.to} type="button" disabled={statusBusy} onClick={() => onStatus(rec.id, a.to)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-[12px] text-sm font-bold border transition-all hover:-translate-y-px disabled:opacity-50"
                  style={{ color: a.color, borderColor: `${a.color}55`, background: `${a.color}0d` }}>
                  <a.Icon className="w-4 h-4" /> {a.label}
                </button>
              ))}
            </div>
          )}
        </DrawerSection>

        {/* Article concerné */}
        <DrawerSection title={t("reclamations.article_concerned", "Article concerné")}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ color: cat.accent, background: `${cat.accent}14` }}>
              <cat.Icon className="w-6 h-6" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-slate-800 truncate">{linge.categorie ? t(`categories.${linge.categorie}`, linge.categorie) : "—"}</p>
              <div className="flex items-center gap-1">
                <code className="text-sm font-mono text-slate-500 truncate">{linge.codeBarre || "—"}</code>
                {linge.codeBarre && (
                  <button type="button" onClick={copy} className="premium-table__icon-btn" title={t("common.copy", "Copier")}>
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
            {linge.codeBarre && (
              <button type="button" onClick={() => navigate(`/tracking?code=${encodeURIComponent(linge.codeBarre)}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[11px] border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 shrink-0">
                <History className="w-3.5 h-3.5" /> {t("reclamations.view_tracking", "Suivi")}
              </button>
            )}
          </div>
          <dl className="divide-y divide-slate-100">
            {lingeInfo.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-sm font-semibold text-slate-800 text-right truncate">{value}</dd>
              </div>
            ))}
          </dl>
        </DrawerSection>

        {/* Description */}
        <DrawerSection title={t("reclamations.problem_description")}>
          {rec.description ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{rec.description}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">{t("reclamations.no_description", "Aucune description saisie.")}</p>
          )}
        </DrawerSection>

        {/* Déclarant */}
        {rec.agent && (
          <DrawerSection title={t("reclamations.declared_by", "Déclarée par")}>
            <div className="flex items-center gap-3">
              <Avatar name={agent} id={rec.agent.id} size={44} />
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">{agent}</p>
                <p className="text-xs text-slate-500 truncate">
                  {[rec.agent.matricule, rec.agent.poste && t(`reclamations.postes.${rec.agent.poste}`, rec.agent.poste.replace(/_/g, " ").toLowerCase())].filter(Boolean).join(" · ")}
                </p>
                {rec.agent.telephone && <p className="text-xs text-slate-500 font-mono">{rec.agent.telephone}</p>}
              </div>
            </div>
          </DrawerSection>
        )}
      </div>

      {/* Pied */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 sm:py-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onEdit(rec)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[12px] border text-sm font-bold"
            style={{ color: C.blue, borderColor: `${C.blue}4d` }}>
            <Edit className="w-4 h-4" /> <span className="hidden sm:inline">{t("common.edit")}</span>
          </button>
          <button type="button" onClick={() => onDelete(rec.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[12px] border text-sm font-bold"
            style={{ color: C.red, borderColor: `${C.red}4d` }}>
            <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">{t("common.delete")}</span>
          </button>
        </div>
        <button type="button" onClick={printSheet}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-bold text-white shadow-sm hover:shadow-md transition-all"
          style={{ background: `linear-gradient(135deg, ${C.green}, ${C.teal})` }}>
          <Printer className="w-4 h-4" /> {t("reclamations.print_sheet", "Imprimer la fiche")}
        </button>
      </div>
    </DrawerShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════════════════════════ */
export default function ReclamationList() {
  const { t } = useTranslation();
  const relative = useRelativeTime();
  const { services = [] } = useContext(ServiceContext) || {};

  const [reclamations, setReclamations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const [selectedId, setSelectedId] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const itemsPerPage = Number(getSetting("display.pageSize")) || 10;

  // Formulaire
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newRec, setNewRec] = useState(EMPTY_FORM);

  /* ─── Chargement ─────────────────────────────────────────────── */
  const fetchReclamations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reclamations`);
      if (response.ok) {
        const data = await response.json();
        setReclamations(Array.isArray(data) ? data : []);
      } else {
        console.error("Erreur chargement réclamations:", await response.text());
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchReclamations(); }, [fetchReclamations]);
  useEffect(() => { setCurrentPage(1); }, [filters]);

  const getServiceName = useCallback((id) => {
    if (!id) return t("linge.unassigned", "Non assigné");
    const s = services.find((x) => x.id === id);
    return s ? (s.nom || s.code) : `#${id}`;
  }, [services, t]);

  /* ─── CRUD ───────────────────────────────────────────────────── */
  const handleOpenCreateModal = () => {
    setEditing(null);
    setNewRec(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec) => {
    setEditing(rec);
    setNewRec({
      codeBarre: rec.linge?.codeBarre || "",
      description: rec.description || "",
      type: rec.type || "TROU",
      categorieLinge: rec.linge?.categorie || "",
      agentId: rec.agent?.id || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { codeBarre: newRec.codeBarre, description: newRec.description, type: newRec.type, agentId: 1 };
      const url = editing ? `${API_URL}/api/reclamations/${editing.id}` : `${API_URL}/api/reclamations`;
      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = errorText;
        try { errorMsg = JSON.parse(errorText).message || errorText; } catch { /* texte brut */ }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      setReclamations((prev) => (editing ? prev.map((r) => (r.id === data.id ? data : r)) : [data, ...prev]));
      Swal.fire({ title: "✅", text: t(editing ? "reclamations.update_success" : "reclamations.create_success"), icon: "success", timer: 1500, showConfirmButton: false });
      setIsModalOpen(false);
      fetchReclamations();
    } catch (err) {
      console.error("❌ Erreur:", err);
      Swal.fire({ title: "❌", text: t("reclamations.error_text"), icon: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRec = async (id) => {
    const result = await Swal.fire({
      title: t("common.delete_confirm"),
      text: t("common.delete_confirm_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#64748b",
      confirmButtonText: t("common.delete_confirm_yes"),
      cancelButtonText: t("common.cancel"),
    });
    if (!result.isConfirmed) return;
    try {
      const response = await fetch(`${API_URL}/api/reclamations/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await response.text());
      setReclamations((prev) => prev.filter((r) => r.id !== id));
      if (selectedId === id) setSelectedId(null);
      Swal.fire({ title: "✅", text: t("reclamations.delete_success"), icon: "success", timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error("Erreur suppression:", err);
      Swal.fire({ title: "❌", text: t("reclamations.error_text"), icon: "error" });
    }
  };

  const updateStatus = async (id, newStatus) => {
    setStatusBusy(true);
    try {
      const response = await fetch(`${API_URL}/api/reclamations/${id}/status?status=${newStatus}`, { method: "PUT" });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setReclamations((prev) => prev.map((r) => (r.id === data.id ? data : r)));
      Swal.fire({
        title: "✅",
        text: t("reclamations.status_updated", { status: t(`reclamations.statuses.${newStatus}`, newStatus) }),
        icon: "success", timer: 1500, showConfirmButton: false,
      });
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
      Swal.fire({ title: "❌", text: t("reclamations.error_text"), icon: "error" });
    } finally {
      setStatusBusy(false);
    }
  };

  /* ─── Filtres ────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return reclamations
      .filter((r) => {
        if (filters.status && r.status !== filters.status) return false;
        if (filters.type && r.type !== filters.type) return false;
        const d = new Date(r.dateCreation);
        if (filters.dateFrom && d < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && d > new Date(filters.dateTo + "T23:59:59")) return false;
        if (!term) return true;
        return [
          r.id, r.linge?.codeBarre, r.linge?.categorie && t(`categories.${r.linge.categorie}`, r.linge.categorie),
          agentFullName(r.agent), r.agent?.matricule, t(`reclamations.types.${r.type}`, r.type), r.description, r.linge?.porteurNom,
        ].some((v) => String(v || "").toLowerCase().includes(term));
      })
      .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
  }, [reclamations, filters, t]);

  const hasFilters = Object.values(filters).some(Boolean);

  /* ─── Indicateurs ────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const count = (s) => filtered.filter((r) => r.status === s).length;
    const ouvertes = count("OUVERTE"), enCours = count("EN_COURS"), resolues = count("RESOLUE"), fermees = count("FERMEE");
    const byType = {};
    filtered.forEach((r) => { byType[r.type] = (byType[r.type] || 0) + 1; });
    const top = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
    return {
      total: filtered.length, ouvertes, enCours, resolues, fermees,
      aTraiter: ouvertes + enCours,
      tauxResolution: filtered.length ? Math.round(((resolues + fermees) / filtered.length) * 100) : 0,
      topType: top?.[0], topCount: top?.[1] || 0,
    };
  }, [filtered]);

  const statusCounts = useMemo(() => {
    const m = {};
    reclamations.forEach((r) => { m[r.status] = (m[r.status] || 0) + 1; });
    return m;
  }, [reclamations]);

  /* ─── Tri + pagination ───────────────────────────────────────── */
  const { sortedItems, requestSort, directionFor } = useSortableData(filtered, {
    article: (r) => r.linge?.codeBarre,
    agent: (r) => agentFullName(r.agent),
    status: (r) => STATUS_ORDER.indexOf(r.status),
  });
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = sortedItems.slice(startIndex, startIndex + itemsPerPage);
  const selected = reclamations.find((r) => r.id === selectedId) || null;

  /* ─── Rendu ──────────────────────────────────────────────────── */
  const typeLabel = (type) => t(`reclamations.types.${type}`, type || "—");
  const statusLabel = (s) => t(`reclamations.statuses.${s}`, STATUSES[s]?.fb || s || "—");
  const statusPill = (s) => <StatusPill color={(STATUSES[s] || { color: C.slate }).color} pulse={STATUSES[s]?.pulse} label={statusLabel(s)} />;

  const articleCell = (r) => {
    const cat = getCategorieMeta(r.linge?.categorie);
    return (
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ color: cat.accent, background: `${cat.accent}14` }}>
          <cat.Icon className="w-4 h-4" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <div className="premium-table__primary truncate">{r.linge?.categorie ? t(`categories.${r.linge.categorie}`, r.linge.categorie) : "—"}</div>
          <span className="premium-table__code">{r.linge?.codeBarre || "—"}</span>
        </div>
      </div>
    );
  };

  const emptyState = (
    <div className="text-center py-16 px-6">
      <EmptyIllustration />
      <h3 className="text-lg font-bold text-slate-800 mt-4">{hasFilters ? t("reclamations.no_match") : t("reclamations.no_data")}</h3>
      {hasFilters ? (
        <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-[12px] border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50">
          <RotateCcw className="w-4 h-4" /> {t("common.reset")}
        </button>
      ) : (
        <button type="button" onClick={handleOpenCreateModal}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-bold text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${C.green}, ${C.teal})` }}>
          <Plus className="w-4 h-4" /> {t("reclamations.new")}
        </button>
      )}
    </div>
  );

  const selectCls = "h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6">
        <PageHeaderIcon size={52} />
        <div>
          <h1 className="text-[28px] font-extrabold text-slate-900 m-0 leading-tight">{t("reclamations.title")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("reclamations.subtitle", { count: reclamations.length })}</p>
        </div>
      </div>

      {/* Indicateurs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile icon={IconInbox} color={C.teal} delay={0}
          label={t("reclamations.total")} value={kpis.total}
          hint={t("reclamations.kpi_total_hint", "{{open}} ouverte(s) · {{progress}} en cours", { open: kpis.ouvertes, progress: kpis.enCours })} />
        <KpiTile icon={IconHourglass} color={kpis.aTraiter ? C.amber : C.green} delay={0.05}
          label={t("reclamations.kpi_todo", "À traiter")} value={kpis.aTraiter}
          hint={kpis.aTraiter ? t("reclamations.kpi_todo_hint", "Ouvertes ou en cours") : t("reclamations.kpi_todo_none", "Rien en attente")} />
        <KpiTile icon={IconShieldCheck} color={C.green} delay={0.1}
          label={t("reclamations.kpi_resolution", "Taux de résolution")} value={`${kpis.tauxResolution}%`}
          hint={t("reclamations.kpi_resolution_hint", "{{resolved}} résolue(s) · {{closed}} fermée(s)", { resolved: kpis.resolues, closed: kpis.fermees })} />
        <KpiTile icon={kpis.topType ? getType(kpis.topType).Icon : IconTarget} color={kpis.topType ? getType(kpis.topType).color : C.slate} delay={0.15}
          label={t("reclamations.kpi_top_type", "Motif principal")} value={kpis.topType ? typeLabel(kpis.topType) : "—"}
          hint={kpis.topType ? t("reclamations.kpi_top_type_hint", "{{count}} réclamation(s)", { count: kpis.topCount }) : undefined} />
      </div>

      {/* Barre d'outils : statut + actions */}
      <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <button type="button" onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-sm font-bold text-white shadow-sm hover:shadow-md transition-all"
          style={{ background: `linear-gradient(135deg, ${C.green}, ${C.teal})` }}>
          <Plus className="w-4 h-4 stroke-[2.5]" /> {t("reclamations.new")}
        </button>
        <div className="w-px h-[30px] bg-slate-200 mx-1 hidden sm:block" />
        <PillFilter
          ariaLabel={t("reclamations.status")}
          value={filters.status}
          onChange={(status) => setFilters((f) => ({ ...f, status }))}
          options={[
            { id: "", label: t("historique_collecte.all_sources", "Toutes"), color: C.teal, count: reclamations.length },
            ...STATUS_ORDER.filter((s) => statusCounts[s]).map((s) => ({ id: s, label: statusLabel(s), color: STATUSES[s].color, count: statusCounts[s] })),
          ]}
        />
        <div className="flex-1" />
        <button type="button" onClick={fetchReclamations} disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-60">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
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

      {/* Recherche, type, période */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input type="text" value={filters.search} placeholder={t("reclamations.search_placeholder")}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full h-10 pl-10 pr-9 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              {filters.search && (
                <button type="button" onClick={() => setFilters({ ...filters, search: "" })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className={`${selectCls} lg:w-48`}>
              <option value="">{t("reclamations.all_types", "Tous les motifs")}</option>
              {TYPE_KEYS.map((k) => <option key={k} value={k}>{typeLabel(k)}</option>)}
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
            {isLoading && !reclamations.length ? <LoadingRows /> : currentData.length === 0 ? emptyState : (
              <div className="premium-table-wrap">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <SortableHeader direction={directionFor("type")} onSort={() => requestSort("type")}>{t("reclamations.details_title")}</SortableHeader>
                      <SortableHeader direction={directionFor("article")} onSort={() => requestSort("article")}>{t("reclamations.article")}</SortableHeader>
                      <SortableHeader direction={directionFor("agent")} onSort={() => requestSort("agent")}>{t("reclamations.agent")}</SortableHeader>
                      <SortableHeader direction={directionFor("dateCreation")} onSort={() => requestSort("dateCreation")}>{t("reclamations.date")}</SortableHeader>
                      <SortableHeader direction={directionFor("status")} onSort={() => requestSort("status")} align="center">{t("reclamations.status")}</SortableHeader>
                      <th style={{ textAlign: "right", paddingRight: 20 }}>{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((r) => {
                      const type = getType(r.type);
                      const agent = agentFullName(r.agent);
                      return (
                        <tr key={r.id} onClick={() => setSelectedId(r.id)} className={selectedId === r.id ? "is-selected" : ""} style={{ cursor: "pointer" }}>
                          <td>
                            <div className="flex items-center gap-3">
                              <IconTile icon={type.Icon} color={type.color} />
                              <div className="min-w-0">
                                <div className="premium-table__primary truncate">{typeLabel(r.type)}</div>
                                <span className="premium-table__muted">#{r.id}</span>
                              </div>
                            </div>
                          </td>
                          <td>{articleCell(r)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <Avatar name={agent || "?"} id={r.agent?.id} />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-700 truncate max-w-[160px]">{agent || "—"}</div>
                                {r.agent?.matricule && <span className="premium-table__muted">{r.agent.matricule}</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="premium-table__primary tabular-nums">{formatDateTime(r.dateCreation)}</div>
                            <span className="premium-table__muted">{relative(r.dateCreation)}</span>
                          </td>
                          <td style={{ textAlign: "center" }}>{statusPill(r.status)}</td>
                          <td style={{ textAlign: "right", paddingRight: 20 }} onClick={(e) => e.stopPropagation()}>
                            <div className="premium-table__actions">
                              <button type="button" onClick={() => setSelectedId(r.id)} className="premium-table__icon-btn" title={t("reclamations.details")}>
                                <Eye className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => handleOpenEditModal(r)} className="premium-table__icon-btn" title={t("common.edit")}>
                                <Edit className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => deleteRec(r.id)} className="premium-table__icon-btn is-danger" title={t("common.delete")}>
                                <Trash2 className="w-4 h-4" />
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
      ) : isLoading && !reclamations.length ? (
        <Card><CardContent className="p-0"><LoadingRows /></CardContent></Card>
      ) : currentData.length === 0 ? (
        <Card><CardContent className="p-0">{emptyState}</CardContent></Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
          {currentData.map((r, idx) => {
            const type = getType(r.type);
            const agent = agentFullName(r.agent);
            return (
              <motion.button type="button" key={r.id} onClick={() => setSelectedId(r.id)}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                className="group text-left bg-white rounded-[20px] border border-slate-200/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <IconTile icon={type.Icon} color={type.color} size={44} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: type.color }}>{typeLabel(r.type)}</p>
                      <p className="font-extrabold text-slate-800">{t("reclamations.details_title")} #{r.id}</p>
                    </div>
                  </div>
                  {statusPill(r.status)}
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">{articleCell(r)}</div>
                {r.description && <p className="mt-3 text-sm text-slate-600 line-clamp-2">{r.description}</p>}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Avatar name={agent || "?"} id={r.agent?.id} size={24} />
                    <span className="text-xs font-semibold text-slate-600 truncate">{agent || "—"}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">{relative(r.dateCreation)}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (
        <HistoryPagination page={currentPage} pageSize={itemsPerPage} total={sortedItems.length}
          onChange={setCurrentPage} unitLabel={t("reclamations.unit", "réclamation(s)")} />
      )}

      {/* Panneau de détail */}
      <AnimatePresence>
        {selected && (
          <ReclamationDrawer
            key={selected.id}
            rec={selected}
            onClose={() => setSelectedId(null)}
            onEdit={handleOpenEditModal}
            onDelete={deleteRec}
            onStatus={updateStatus}
            statusBusy={statusBusy}
            getServiceName={getServiceName}
            relative={relative}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Formulaire */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? `${t("reclamations.edit")} #${editing.id}` : t("reclamations.new")}
        mode={editing ? "edit" : "create"}
        size="lg"
        onSubmit={handleSave}
        saving={isSaving}
      >
        <FormSection title={t("modal.general_info", "Informations générales")} icon="specs" columns={2}>
          <div className="col-span-2">
            <Input
              label={t("reclamations.article_code")}
              value={newRec.codeBarre}
              onChange={(e) => setNewRec({ ...newRec, codeBarre: e.target.value.toUpperCase() })}
              placeholder="ex: L97AA77D8"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">{t("reclamations.article_code_hint")}</p>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">{t("reclamations.problem_type")}</label>
            {/* Choix du motif par tuiles (plus rapide qu'une liste déroulante) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup">
              {TYPE_KEYS.map((k) => {
                const type = getType(k);
                const active = newRec.type === k;
                return (
                  <button key={k} type="button" role="radio" aria-checked={active} onClick={() => setNewRec({ ...newRec, type: k })}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-[12px] border text-xs font-bold transition-all"
                    style={active
                      ? { color: type.color, borderColor: type.color, background: `${type.color}12`, boxShadow: `0 0 0 3px ${type.color}22` }
                      : { color: "#475569", borderColor: "#e2e8f0", background: "#fff" }}>
                    <type.Icon size={22} />
                    <span className="text-center leading-tight">{typeLabel(k)}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">{t("reclamations.problem_description")}</label>
            <textarea
              value={newRec.description}
              onChange={(e) => setNewRec({ ...newRec, description: e.target.value })}
              placeholder={t("reclamations.problem_description_placeholder")}
              className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </FormSection>
      </FormModal>
    </div>
  );
}
