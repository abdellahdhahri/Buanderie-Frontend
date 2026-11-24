import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Swal from "../../kit/dialogueApi";
import { toast } from "sonner";
import { lireErreur } from "../../../services/integrationService";
import { WashingMachine, RefreshCw, Pencil, Trash2, RotateCcw, Play, CheckCheck, Ban, Copy, Check, Printer, History, ArrowRight, Flag, Plus } from "lucide-react";
import { ServiceContext } from "../../../contextes/ServiceContext";
import { useAuth } from "../../../constants/AuthContext";
import { useMachineContext } from "../../../contextes/MachineContext";
import { TYPES_RECLAMATION_MACHINE, estReclamationMachine, libelleTypeMachine, declarerReclamationMachine } from "../../../services/reclamationMachineService";
import { getSetting, formatDateTime } from "../../../utils/appSettings";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import { C, Glyph, tint, dot, useRelativeTime } from "../../ui/history-kit";
import {
  Page, ActionBar, ActionButton, ActionMenu,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterDateRange, FilterActions,
  ListSection, DataTable, Pagination, PersonName, PersonBlock, Badge,
  Modal, Button, FormField, TextArea, ConfirmDialog,
  DetailsPage, DetailsButton, DetailCard, DetailGrid, InfoList, DetailText, Timeline,
  ColumnSettingsModal, useListPage, useRowSelection, exportExcel,
  Tabs, RowButton, FormGrid, Code, QuickStats, day, tk,
} from "../../kit";
import { IconAjouter, IconDetails, IconModifier, IconSupprimer } from "../../kit/ActionIcons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

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
const MACHINE_META = { color: C.cyan, Icon: (p) => <WashingMachine {...p} /> };
const getType = (type) => TYPES[type] || (String(type || "").startsWith("MACHINE_") ? MACHINE_META : TYPES.AUTRE);
const TYPE_KEYS = [...Object.keys(TYPES), ...TYPES_RECLAMATION_MACHINE.map((x) => x.value)];
const nomMachine = (m) => m?.designation || m?.code || m?.reference || (m?.id != null ? `#${m.id}` : "—");

const STATUSES = {
  OUVERTE:  { color: C.amber, pulse: true, fb: "Ouverte" },
  EN_COURS: { color: C.sky,   pulse: true, fb: "En cours" },
  RESOLUE:  { color: C.green, fb: "Résolue" },
  FERMEE:   { color: C.slate, fb: "Fermée" },
};
const STATUS_ORDER = ["OUVERTE", "EN_COURS", "RESOLUE", "FERMEE"];

const EMPTY_FORM = { codeBarre: "", description: "", type: "TROU", categorieLinge: "", agentId: "", codeBarrePersonnel: "" };

const agentFullName = (a) => (a ? [a.prenom, a.nom].filter(Boolean).join(" ") || a.matricule || `#${a.id}` : "");
const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

const COLUMNS_DEFAULT = [
  { key: "type", label: "Réclamation", visible: true, searchable: true },
  { key: "article", label: "Article", visible: true, searchable: true },
  { key: "agent", label: "Agent", visible: true, searchable: true },
  { key: "date", label: "Date", visible: true, searchable: true },
  { key: "description", label: "Description", visible: false, searchable: true },
  { key: "status", label: "Statut", visible: true, searchable: true },
];

const StatutPill = ({ status, label }) => {
  const s = STATUSES[status] || { color: C.slate };
  return (
    <span className={`kit-op-pill ${s.pulse ? "is-live" : ""}`} style={{ "--op": s.color }}>
      <i />{label}
    </span>
  );
};

const TypeCell = ({ type, label, sub }) => {
  const meta = getType(type);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span className="kit-zone-icon" style={{ "--z": meta.color }}><meta.Icon size={18} /></span>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
        <strong>{label}</strong>
        {sub && <small className="kit-muted">{sub}</small>}
      </span>
    </span>
  );
};

export default function ReclamationList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const relative = useRelativeTime();
  const { services = [] } = useContext(ServiceContext) || {};
  const { agent: agentConnecte } = useAuth() || {};
  const { loadMachines, machines = [] } = useMachineContext();
  const [reclamations, setReclamations] = useState([]);
  const [bonsMaintenance, setBonsMaintenance] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statut, setStatut] = useState("");
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [statusBusy, setStatusBusy] = useState(false);
  const [changement, setChangement] = useState(null);
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const pageSize = Number(getSetting("display.pageSize")) || 10;

  const fetchReclamations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reclamations`);
      if (response.ok) {
        const data = await response.json();
        setReclamations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchReclamations(); }, [fetchReclamations]);

  const getServiceName = useCallback((id) => {
    if (!id) return t("linge.unassigned", "Non assigné");
    const s = services.find((x) => x.id === id);
    return s ? (s.nom || s.code) : `#${id}`;
  }, [services, t]);

  const typeLabel = (type) => t(`reclamations.types.${type}`, libelleTypeMachine(type));
  const statusLabel = (s) => t(`reclamations.statuses.${s}`, STATUSES[s]?.fb || s || "—");
  const categorieLabel = (c) => (c ? t(`categories.${c}`, c) : "—");

  const columns = useMemo(() => COLUMNS_DEFAULT.map((c) => ({
    ...c,
    label: {
      type: t("reclamations.details_title"), article: t("reclamations.article"), agent: t("reclamations.agent"),
      date: t("reclamations.date"), description: t("reclamations.problem_description"), status: t("reclamations.status"), actions: t("common.actions"),
    }[c.key] || c.label,
  })), [t]);

  const searchValue = (r, key) => {
    switch (key) {
      case "type": return `#${r.id} ${typeLabel(r.type)}`;
      case "article": if (r.machine) return `${nomMachine(r.machine)} ${r.machine.code || ""}`; return `${r.linge?.codeBarre || ""} ${categorieLabel(r.linge?.categorie)} ${r.linge?.porteurNom || ""}`;
      case "agent": return r.personnelNom || "";
      case "date": return formatDateTime(r.dateCreation);
      case "description": return r.description || "";
      case "status": return statusLabel(r.status);
      default: return "";
    }
  };
  const sortValue = (r, key) => {
    if (key === "date") return new Date(r.dateCreation || 0).getTime();
    if (key === "status") return STATUS_ORDER.indexOf(r.status);
    return String(searchValue(r, key)).toLowerCase();
  };

  const rows = useMemo(() => (statut ? reclamations.filter((r) => r.status === statut) : reclamations), [reclamations, statut]);

  const list = useListPage({
    rows,
    columns,
    getSearchValue: searchValue,
    getSortValue: sortValue,
    pageSize,
    defaultSort: (a, b) => new Date(b.dateCreation) - new Date(a.dateCreation),
    filters: {
      type: { initial: "all", column: "type", test: (r, v) => v === "all" || r.type === v },
      source: { initial: "all", column: "article", test: (r, v) => v === "all" || (v === "MACHINE") === estReclamationMachine(r) },
      dateFrom: { initial: "", column: "date", test: (r, v) => !v || day(r.dateCreation) >= v },
      dateTo: { initial: "", column: "date", test: (r, v) => !v || day(r.dateCreation) <= v },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const courant = selected ? reclamations.find((r) => r.id === selected.id) || selected : null;
  const openDetails = (r) => { if (r) { setSelected(r); setViewMode("details"); } };

  const openForm = (r) => {
    if (r && estReclamationMachine(r)) {
      toast.info(t("reclamations.machine_not_editable", "Une réclamation de machine ne peut pas être modifiée : changez son statut."));
      return;
    }
    ouvrirFormulaire(r);
  };

  const ouvrirFormulaire = (r) => setForm({
    rec: r,
    data: r
      ? {
        codeBarre: r.linge?.codeBarre || "", description: r.description || "", type: r.type || "TROU", categorieLinge: r.linge?.categorie || "",
        agentId: r.agent?.id || "", codeBarrePersonnel: r.agent?.codeBarre || r.agent?.matricule || "",
      }
      : { ...EMPTY_FORM, agentId: agentConnecte?.id || "", codeBarrePersonnel: agentConnecte?.codeBarre || agentConnecte?.matricule || "" },
  });
  const setData = (patch) => setForm((f) => ({ ...f, data: { ...f.data, ...patch } }));

  const handleSave = async (e) => {
    e.preventDefault();
    const { rec, data } = form;
    setIsSaving(true);
    try {
      const codePersonnel = data.codeBarrePersonnel.trim();
      if (!codePersonnel) {
        Swal.fire({ title: t("reclamations.agent_required", "Agent déclarant obligatoire"), text: t("reclamations.agent_required_text", "Scannez ou saisissez le code-barres du personnel."), icon: "warning" });
        setIsSaving(false);
        return;
      }
      const typeMachine = String(data.type || "").startsWith("MACHINE_");
      if (typeMachine && !rec) {
        const saved = await declarerReclamationMachine({ codeMachine: data.codeBarre.trim(), type: data.type, matriculeAgent: codePersonnel, description: data.description });
        setReclamations((prev) => [saved, ...prev]);
        Swal.fire({ title: "✅", text: t("reclamations.create_success"), icon: "success", timer: 1500, showConfirmButton: false });
        setForm(null);
        fetchReclamations();
        loadMachines().catch(() => {});
        return;
      }
      const payload = {
        codeBarre: data.codeBarre,
        description: data.description,
        type: data.type,
        agentId: data.agentId || undefined,
        codeBarrePersonnel: codePersonnel,
        matriculeAgent: codePersonnel,
      };
      const response = await fetch(rec ? `${API_URL}/api/reclamations/${rec.id}` : `${API_URL}/api/reclamations`, {
        method: rec ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const texte = await response.text();
        let message = texte;
        try { message = JSON.parse(texte).message || texte; } catch { message = texte; }
        throw new Error(message);
      }
      const saved = await response.json();
      setReclamations((prev) => (rec ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev]));
      Swal.fire({ title: "✅", text: t(rec ? "reclamations.update_success" : "reclamations.create_success"), icon: "success", timer: 1500, showConfirmButton: false });
      setForm(null);
      fetchReclamations();
    } catch (err) {
      console.error("Erreur:", err);
      Swal.fire({ title: "❌", text: err?.message || t("reclamations.error_text"), icon: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    const cible = deleteTarget;
    setDeleteTarget(null);
    try {
      const response = await fetch(`${API_URL}/api/reclamations/${cible.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await lireErreur(response, t("reclamations.error_text")));
      setReclamations((prev) => prev.filter((r) => r.id !== cible.id));
      if (selected?.id === cible.id) { setSelected(null); setViewMode("list"); }
      Swal.fire({ title: "✅", text: t("reclamations.delete_success"), icon: "success", timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error("Erreur suppression:", err);
      Swal.fire({ title: "❌", text: err?.message || t("reclamations.error_text"), icon: "error" });
    }
  };

  const appliquerStatut = async () => {
    if (!changement) return;
    const { cibles, to } = changement;
    setStatusBusy(true);
    const echecs = [];
    const misesAJour = [];
    for (const r of cibles) {
      try {
        const response = await fetch(`${API_URL}/api/reclamations/${r.id}/status?status=${to}`, { method: "PUT" });
        if (!response.ok) throw new Error(await lireErreur(response, t("reclamations.error_text")));
        misesAJour.push(await response.json());
      } catch (err) {
        echecs.push({ id: r.id, message: err.message });
      }
    }
    if (misesAJour.some((d) => estReclamationMachine(d)) && (to === "RESOLUE" || to === "FERMEE")) {
      loadMachines().catch(() => {});
    }
    if (misesAJour.length) {
      const parId = new Map(misesAJour.map((d) => [d.id, d]));
      setReclamations((prev) => prev.map((r) => parId.get(r.id) || r));
      setSelected((cur) => (cur && parId.has(cur.id) ? parId.get(cur.id) : cur));
      toast.success(
        misesAJour.length > 1
          ? t("reclamations.status_updated_many", "{{count}} réclamations passées à « {{status}} »", { count: misesAJour.length, status: statusLabel(to) })
          : t("reclamations.status_updated", { status: statusLabel(to) })
      );
    }
    echecs.forEach((e) => toast.error(`#${e.id}`, { description: e.message }));
    setStatusBusy(false);
    setChangement(null);
    if (misesAJour.length) sel.clear?.();
  };

  const demanderStatut = (cibles, to) => {
    const liste = (Array.isArray(cibles) ? cibles : [cibles]).filter((r) => r && actionsStatut(r).some((a) => a.to === to));
    if (!liste.length) {
      toast.info(t("reclamations.no_transition", "Aucune réclamation sélectionnée ne peut passer à « {{status}} »", { status: statusLabel(to) }));
      return;
    }
    setChangement({ cibles: liste, to });
  };

  const imprimerFiche = (rec) => {
    const type = getType(rec.type);
    const linge = rec.linge || {};
    const machine = rec.machine || null;
    const agent = rec.personnelNom || "";
    const typeLib = typeLabel(rec.type);
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
      <div class="head"><div><div class="muted">${escapeHtml(t("reclamations.sheet_title", "Fiche de réclamation"))}</div><h1>#${rec.id} · ${escapeHtml(typeLib)}</h1></div>
      <div class="muted">${escapeHtml(statusLabel(rec.status))} · ${escapeHtml(formatDateTime(rec.dateCreation))}</div></div>
      <h2>${escapeHtml(machine ? t("reclamations.machine_concerned", "Machine concernée") : t("reclamations.article_concerned", "Article concerné"))}</h2>
      ${machine ? `<div class="grid">${row(t("machines.code", "Code"), machine.code)}${row(t("machines.designation", "Désignation"), nomMachine(machine))}</div>` : `<div class="grid">${row(t("reclamations.article_code"), linge.codeBarre)}${row(t("reclamations.article_category"), t(`categories.${linge.categorie}`, linge.categorie || "—"))}
      ${row(t("linge.service", "Service"), getServiceName(linge.serviceId))}${row(t("reclamations.wearer", "Porteur"), linge.porteurNom)}
      ${row(t("reclamations.wash_count", "Lavages"), linge.nbLavage)}${row(t("reclamations.linen_state", "État du linge"), linge.etat ? t(`linge_etat.${linge.etat}`, linge.etat) : "—")}</div>`}
      <h2>${escapeHtml(t("reclamations.problem_description"))}</h2><div class="desc">${escapeHtml(rec.description || t("reclamations.no_description", "Aucune description saisie."))}</div>
      <h2>${escapeHtml(t("reclamations.declared_by", "Déclarée par"))}</h2>
      <div class="grid">${row(t("reclamations.agent"), agent)}</div>
      <div class="sign"><div>${escapeHtml(t("historique_collecte.sign_agent", "Signature de l'agent"))}</div><div>${escapeHtml(t("historique_collecte.sign_manager", "Visa du responsable"))}</div></div>
      <div class="foot">${escapeHtml(t("historique_collecte.printed_on", "Imprimé le"))} ${escapeHtml(formatDateTime(new Date()))}</div>
      <script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  };

  const copier = async (code) => {
    try {
      await navigator.clipboard.writeText(code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.warn("Copie impossible :", err);
    }
  };

  const handleExportExcel = (lignes) => {
    const source = Array.isArray(lignes) ? lignes : list.sorted;
    if (!source.length) return;
    exportExcel({
      fileName: "reclamations",
      sheetName: t("reclamations.title", "Réclamations"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const actionsStatut = (r) => ({
    OUVERTE: [{ to: "EN_COURS", label: t("reclamations.take"), Icon: Play, variant: "details" }],
    EN_COURS: [
      { to: "RESOLUE", label: t("reclamations.resolve_btn"), Icon: CheckCheck, variant: "etat-accepter" },
      { to: "FERMEE", label: t("reclamations.close_btn"), Icon: Ban, variant: "etat-refuser" },
    ],
    RESOLUE: [
      { to: "FERMEE", label: t("reclamations.close_btn"), Icon: Ban, variant: "etat-refuser" },
      { to: "EN_COURS", label: t("reclamations.reopen_btn"), Icon: RotateCcw, variant: "modifier" },
    ],
    FERMEE: [{ to: "EN_COURS", label: t("reclamations.reopen_btn"), Icon: RotateCcw, variant: "modifier" }],
  }[r?.status] || []);

  const TABLE_COLUMNS = {
    type: { label: t("reclamations.details_title"), sortable: true, render: (r) => <TypeCell type={r.type} label={typeLabel(r.type)} sub={`#${r.id}`} /> },
    article: {
      label: t("reclamations.article"), sortable: true,
      render: (r) => {
        if (r.machine) {
          return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span className="kit-zone-icon" style={{ "--z": MACHINE_META.color }}><WashingMachine size={16} /></span>
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
                <strong>{nomMachine(r.machine)}</strong>
                <Code>{r.machine.code}</Code>
              </span>
            </span>
          );
        }
        const cat = getCategorieMeta(r.linge?.categorie);
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span className="kit-zone-icon" style={{ "--z": cat.accent }}><cat.Icon size={16} /></span>
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
              <strong>{categorieLabel(r.linge?.categorie)}</strong>
              <Code>{r.linge?.codeBarre}</Code>
            </span>
          </span>
        );
      },
    },
    agent: { label: t("reclamations.agent"), sortable: true, render: (r) => (r.personnelNom ? <PersonName name={r.personnelNom} strong={false} /> : "—") },
    date: {
      label: t("reclamations.date"), sortable: true,
      render: (r) => (
        <div className="kit-datetime">
          <strong>{formatDateTime(r.dateCreation)}</strong>
          <small>{relative(r.dateCreation)}</small>
        </div>
      ),
    },
    description: {
      label: t("reclamations.problem_description"),
      tdProps: (r) => ({ title: r.description || "", style: { maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }),
      render: (r) => r.description || <span className="kit-muted">—</span>,
    },
    status: { label: t("reclamations.status"), sortable: true, align: "center", render: (r) => <StatutPill status={r.status} label={statusLabel(r.status)} /> },
  };

  const compte = (s) => reclamations.filter((r) => r.status === s).length;
  const kpis = (() => {
    const src = list.sorted;
    const nb = (s) => src.filter((r) => r.status === s).length;
    const resolues = nb("RESOLUE") + nb("FERMEE");
    return {
      total: src.length,
      aTraiter: nb("OUVERTE") + nb("EN_COURS"),
      taux: src.length ? Math.round((resolues / src.length) * 100) : 0,
    };
  })();

  const etape = courant ? STATUS_ORDER.indexOf(courant.status) : -1;

  return (
    <Page>
      {viewMode === "list" && (
        <>
          <ActionBar>
            <ActionButton icon={IconAjouter} label={t("reclamations.new")} variant="ajouter" onClick={() => ouvrirFormulaire(null)} />
            <ActionButton icon={IconDetails} label={t("common.details")} variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={IconModifier} label={t("common.edit")} variant="modifier" disabled={!selected} onClick={() => openForm(selected)} />
            <ActionButton icon={IconSupprimer} label={t("common.delete")} variant="supprimer" disabled={!selected} onClick={() => setDeleteTarget(selected)} />
            <ActionMenu
              icon={Flag}
              label={t("reclamations.change_status", "Changer le statut")}
              variant="etat-accepter"
              disabled={!selected || !actionsStatut(selected).length}
              items={actionsStatut(selected).map((a) => ({ icon: a.Icon, label: a.label, onClick: () => demanderStatut(selected, a.to) }))}
            />
            <ActionButton icon={Printer} label={t("reclamations.print_sheet", "Imprimer la fiche")} variant="imprimer" disabled={!selected} onClick={() => imprimerFiche(selected)} />
            <ActionButton icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />} label={t("common.refresh")} variant="details" onClick={fetchReclamations} />
          </ActionBar>

          <div className="kit-toolbar">
            <Tabs
              value={statut}
              onChange={(v) => { setStatut(v); list.setPage(1); }}
              items={[
                { value: "", label: t("historique_collecte.all_sources", "Toutes"), count: reclamations.length },
                ...STATUS_ORDER.map((s) => ({ value: s, icon: <i className="kit-dot" style={{ background: STATUSES[s].color }} />, label: statusLabel(s), count: compte(s) })),
              ]}
            />
          </div>

          <FilterPanel>
            <FilterRow>
              {list.isColVisible("type") && (
                <FilterSelect
                  label={t("reclamations.details_title")}
                  value={draft.type}
                  onChange={(v) => setFilter("type", v)}
                  allLabel={t("reclamations.all_types", "Tous les motifs")}
                  options={TYPE_KEYS.map((k) => ({ value: k, label: typeLabel(k) }))}
                />
              )}
              <FilterSelect
                label={t("reclamations.source", "Nature")}
                value={draft.source}
                onChange={(v) => setFilter("source", v)}
                allLabel={t("common.all")}
                options={[
                  { value: "LINGE", label: t("reclamations.source_linge", "Linge") },
                  { value: "MACHINE", label: t("reclamations.source_machine", "Machine") },
                ]}
              />
              <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
              <FilterText
                label={t("common.search")}
                placeholder={t("reclamations.search_placeholder")}
                value={draft.searchTerm}
                onChange={(v) => setFilter("searchTerm", v)}
                onEnter={list.apply}
              />
              {list.isColVisible("date") && (
                <FilterDateRange from={draft.dateFrom} to={draft.dateTo} onFrom={(v) => setFilter("dateFrom", v)} onTo={(v) => setFilter("dateTo", v)} />
              )}
              <FilterActions
                onSearch={list.apply}
                count={list.sorted.length}
                onExcel={() => handleExportExcel()}
                onStats={() => setShowStats(true)}
                onReset={list.reset}
                onColumns={() => setShowColumnSettings(true)}
              />
            </FilterRow>
          </FilterPanel>

          <ListSection selection={sel} unit="réclamation" units="réclamations" bulkActions={[
            { label: `${t("reclamations.take")} / ${t("reclamations.reopen_btn")}`, onClick: (l) => demanderStatut(l, "EN_COURS") },
            { label: t("reclamations.resolve_btn"), onClick: (l) => demanderStatut(l, "RESOLUE") },
            { label: t("reclamations.close_btn"), onClick: (l) => demanderStatut(l, "FERMEE") },
            { label: tk("exportExcel", "Exporter Excel"), onClick: (l) => handleExportExcel(l) },
          ]}>
            <DataTable
              columns={TABLE_COLUMNS}
              visible={list.visibleColumns}
              rows={list.paginated}
              sort={list.sort}
              onSort={list.toggleSort}
              selection={sel}
              activeId={selected?.id}
              onRowClick={(r) => setSelected(selected?.id === r.id ? null : r)}
              onRowDoubleClick={openDetails}
              loading={isLoading && !reclamations.length}
              loadingText={t("common.loading")}
              emptyText={draft.searchTerm || statut ? t("reclamations.no_match") : t("reclamations.no_data")}
            />
            <Pagination total={list.sorted.length} page={list.page} totalPages={list.totalPages} pageSize={list.pageSize} onPage={list.setPage} unit={t("reclamations.unit", "réclamation(s)")} />
          </ListSection>
        </>
      )}

      {viewMode === "details" && courant && (() => {
        const linge = courant.linge || {};
        const machine = courant.machine || null;
        const cat = getCategorieMeta(linge.categorie);
        const meta = getType(courant.type);
        return (
          <DetailsPage
            onBack={() => setViewMode("list")}
            eyebrow={typeLabel(courant.type)}
            title={`${t("reclamations.details_title")} #${courant.id}`}
            badge={<StatutPill status={courant.status} label={statusLabel(courant.status)} />}
            actions={(
              <>
                <DetailsButton icon={Printer} onClick={() => imprimerFiche(courant)}>{t("reclamations.print_sheet", "Imprimer la fiche")}</DetailsButton>
                <DetailsButton icon={Pencil} onClick={() => openForm(courant)}>{t("common.edit")}</DetailsButton>
                <DetailsButton icon={Trash2} variant="danger" onClick={() => setDeleteTarget(courant)}>{t("common.delete")}</DetailsButton>
              </>
            )}
          >
            <div className="kit-hero" style={{ "--z": meta.color }}>
              <span className="kit-hero__icon"><meta.Icon size={30} /></span>
              <div>
                <small>{formatDateTime(courant.dateCreation)} · {relative(courant.dateCreation)}</small>
                <strong>{typeLabel(courant.type)}</strong>
                <span>{courant.description || t("reclamations.no_description", "Aucune description saisie.")}</span>
              </div>
            </div>

            <DetailCard title={t("reclamations.progress", "Avancement")}>
              <Timeline steps={STATUS_ORDER.map((s, i) => ({
                key: s,
                title: statusLabel(s),
                date: i === etape ? t("reclamations.current", "Étape actuelle") : "",
                status: i < etape ? "done" : i === etape ? (s === "RESOLUE" || s === "FERMEE" ? "success" : "current") : "pending",
              }))} />
              {actionsStatut(courant).length > 0 && (
                <ActionBar>
                  {actionsStatut(courant).map((a) => (
                    <ActionButton key={a.to} icon={a.Icon} label={a.label} variant={a.variant} disabled={statusBusy} onClick={() => demanderStatut(courant, a.to)} />
                  ))}
                </ActionBar>
              )}
            </DetailCard>

            <DetailGrid>
              {machine ? (
                <DetailCard title={t("reclamations.machine_concerned", "Machine concernée")}>
                  <InfoList items={[
                    { label: t("machines.designation", "Désignation"), value: nomMachine(machine) },
                    { label: t("machines.code", "Code"), value: machine.code || "—" },
                    { label: t("machines.brand", "Marque"), value: machine.marque || "—" },
                    { label: t("machines.technical_state", "État technique"), value: machine.etatTechnique ? t(`machine_status.${machine.etatTechnique}`, machine.etatTechnique.replace(/_/g, " ").toLowerCase()) : "—" },
                  ]} />
                </DetailCard>
              ) : (
              <DetailCard title={t("reclamations.article_concerned", "Article concerné")}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span className="kit-zone-icon" style={{ "--z": cat.accent, width: 44, height: 44 }}><cat.Icon size={22} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: "block" }}>{categorieLabel(linge.categorie)}</strong>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Code>{linge.codeBarre}</Code>
                      {linge.codeBarre && <RowButton icon={copied ? Check : Copy} title={t("common.copy", "Copier")} onClick={() => copier(linge.codeBarre)} />}
                      {linge.codeBarre && <RowButton icon={History} title={t("reclamations.view_tracking", "Suivi")} onClick={() => navigate(`/tracking?code=${encodeURIComponent(linge.codeBarre)}`)} />}
                    </span>
                  </div>
                </div>
                <InfoList items={[
                  { label: t("reclamations.linen_state", "État du linge"), value: linge.etat ? t(`linge_etat.${linge.etat}`, linge.etat) : "—" },
                  { label: t("linge.service", "Service"), value: getServiceName(linge.serviceId) },
                  { label: t("reclamations.wearer", "Porteur"), value: linge.porteurNom || "—" },
                  { label: t("reclamations.wash_count", "Lavages"), value: linge.nbLavage ?? "—" },
                  { label: t("linge.export.weight", "Poids (kg)"), value: linge.poids ?? "—" },
                  ...(linge.dureVie != null ? [{ label: t("linge.export.lifespan", "Durée de vie"), value: linge.dureVie }] : []),
                ]} />
              </DetailCard>
              )}
              <DetailCard title={t("reclamations.declared_by", "Déclarée par")}>
                {courant.personnelNom ? (
                  <PersonBlock id={courant.personnelId} name={courant.personnelNom} />
                ) : <DetailText />}
              </DetailCard>
            </DetailGrid>

            <DetailCard title={t("reclamations.maintenance_orders", "Bons de maintenance")}>
              <ActionBar>
                <ActionButton
                  icon={<Plus size={18} />}
                  label={t("reclamations.create_maintenance_order", "Créer un bon de maintenance")}
                  variant="ajouter"
                  onClick={() => setBonsMaintenance((prev) => {
                    const liste = prev[courant.id] || [];
                    const numero = `BM-${courant.id}-${String(liste.length + 1).padStart(2, "0")}`;
                    return { ...prev, [courant.id]: [...liste, { numero, date: new Date().toISOString(), statut: "OUVERT" }] };
                  })}
                />
              </ActionBar>
              <DataTable
                columns={{
                  numero: { label: t("reclamations.maintenance_number", "N° du bon"), render: (b) => <Code>{b.numero}</Code> },
                  date: { label: t("common.date", "Date"), render: (b) => formatDateTime(b.date) },
                  objet: { label: t("reclamations.maintenance_object", "Objet"), render: () => (machine ? nomMachine(machine) : typeLabel(courant.type)) },
                  statut: { label: t("common.status", "Statut"), render: (b) => <Badge variant="warning">{t("reclamations.maintenance_open", "Ouvert")}</Badge> },
                }}
                rows={bonsMaintenance[courant.id] || []}
                rowKey={(b) => b.numero}
                emptyText={t("reclamations.no_maintenance_order", "Aucun bon de maintenance.")}
              />
            </DetailCard>
          </DetailsPage>
        );
      })()}

      {form && (
        <Modal
          className="kit-std-form"
          size="md"
          title={form.rec ? `${t("reclamations.edit")} #${form.rec.id}` : t("reclamations.new")}
          onClose={isSaving ? undefined : () => setForm(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setForm(null)} disabled={isSaving}>{t("common.cancel")}</Button>
              <Button type="submit" form="reclamation-form" disabled={isSaving}>{isSaving ? t("common.saving") : t("common.save")}</Button>
            </>
          )}
        >
          <form id="reclamation-form" onSubmit={handleSave}>
            <FormGrid>
              <FormField
                label={String(form.data.type).startsWith("MACHINE_") ? t("reclamations.machine_code", "Code de la machine") : t("reclamations.article_code")}
                required
                span
              >
                <input
                  value={form.data.codeBarre}
                  list={String(form.data.type).startsWith("MACHINE_") ? "reclamation-machines" : undefined}
                  onChange={(e) => setData({ codeBarre: e.target.value.toUpperCase() })}
                  required
                  autoFocus
                />
                {String(form.data.type).startsWith("MACHINE_") && (
                  <datalist id="reclamation-machines">
                    {machines.map((m) => <option key={m.id} value={m.code || m.reference}>{nomMachine(m)}</option>)}
                  </datalist>
                )}
              </FormField>
              <FormField label={t("reclamations.agent_code", "Agent déclarant (code-barres)")} required span hint={t("reclamations.agent_code_hint", "Badge ou matricule du personnel qui signale le défaut")}>
                <input value={form.data.codeBarrePersonnel} onChange={(e) => setData({ codeBarrePersonnel: e.target.value.toUpperCase(), agentId: "" })} required />
              </FormField>
              <FormField label={t("reclamations.details_title")} required span>
                <div className="kit-type-grid">
                  {TYPE_KEYS.map((k) => {
                    const meta = getType(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        className={`kit-type-choice ${form.data.type === k ? "is-active" : ""}`}
                        style={{ "--z": meta.color }}
                        onClick={() => setData({ type: k })}
                      >
                        <meta.Icon size={20} />
                        <span>{typeLabel(k)}</span>
                      </button>
                    );
                  })}
                </div>
              </FormField>
              <FormField label={t("reclamations.problem_description")} span>
                <TextArea value={form.data.description} onChange={(v) => setData({ description: v })} placeholder={t("reclamations.problem_description_placeholder")} rows={4} />
              </FormField>
            </FormGrid>
          </form>
        </Modal>
      )}

      {changement && (
        <ConfirmDialog
          tone={changement.to === "RESOLUE" ? "success" : changement.to === "FERMEE" ? "danger" : "default"}
          title={t("reclamations.change_status", "Changer le statut")}
          message={changement.cibles.length > 1
            ? t("reclamations.change_status_many", "{{count}} réclamations vont passer au statut « {{status}} ».", { count: changement.cibles.length, status: statusLabel(changement.to) })
            : t("reclamations.change_status_one", "La réclamation #{{id}} va passer au statut « {{status}} ».", { id: changement.cibles[0].id, status: statusLabel(changement.to) })}
          details={(
            <div className="rcl-transitions">
              {changement.cibles.slice(0, 6).map((r) => (
                <div key={r.id} className="rcl-transition">
                  <span className="rcl-transition__id">#{r.id} · {typeLabel(r.type)}</span>
                  <StatutPill status={r.status} label={statusLabel(r.status)} />
                  <ArrowRight size={14} />
                  <StatutPill status={changement.to} label={statusLabel(changement.to)} />
                </div>
              ))}
              {changement.cibles.length > 6 && <small className="kit-muted">+ {changement.cibles.length - 6}</small>}
            </div>
          )}
          confirmLabel={t("reclamations.change_status_confirm", "Passer à « {{status}} »", { status: statusLabel(changement.to) })}
          cancelLabel={t("common.cancel")}
          busy={statusBusy}
          onConfirm={appliquerStatut}
          onClose={() => setChangement(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t("common.delete_confirm")}
          message={t("common.delete_confirm_text")}
          details={<><strong>#{deleteTarget.id} · {typeLabel(deleteTarget.type)}</strong><br /><Code>{deleteTarget.machine ? deleteTarget.machine.code : deleteTarget.linge?.codeBarre}</Code></>}
          confirmLabel={t("common.delete_confirm_yes")}
          cancelLabel={t("common.cancel")}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {showStats && (
        <QuickStats
          title={t("reclamations.title", "Réclamations")}
          subtitle={`${list.sorted.length} ${t("reclamations.unit", "réclamation(s)")}`}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t("reclamations.total"), value: kpis.total, color: C.teal },
            { label: t("reclamations.kpi_todo", "À traiter"), value: kpis.aTraiter, color: C.amber },
            { label: t("reclamations.kpi_resolution", "Taux de résolution"), value: `${kpis.taux}%`, color: C.green },
          ]}
          repartitions={[
            { title: t("reclamations.status"), items: STATUS_ORDER.map((s) => ({ label: statusLabel(s), value: list.sorted.filter((r) => r.status === s).length, color: STATUSES[s].color })) },
            { title: t("reclamations.details_title"), items: TYPE_KEYS.map((k) => ({ label: typeLabel(k), value: list.sorted.filter((r) => r.type === k).length, color: getType(k).color })) },
          ]}
          classements={[{
            title: t("reclamations.agent"), personnel: true,
            items: Object.entries(list.sorted.reduce((acc, r) => { const k = r.personnelNom; if (k) acc[k] = (acc[k] || 0) + 1; return acc; }, {}))
              .map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
          }]}
        />
      )}

      <ColumnSettingsModal
        show={showColumnSettings}
        onClose={() => setShowColumnSettings(false)}
        columns={list.columnSettings}
        onToggleVisibility={list.toggleColumnVisibility}
        onToggleSearch={list.toggleColumnSearchability}
      />
    </Page>
  );
}
