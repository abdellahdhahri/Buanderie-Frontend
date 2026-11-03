import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Plus, Search, Edit, Trash2, RefreshCw, Loader2, Building2, BedDouble, CloudDownload,
  CheckCircle2, AlertTriangle, ChevronDown, History, Settings2, Inbox,
} from "lucide-react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../../components/ui/input";
import { FormModal, FormSection } from "../../components/ui/modal-kit";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { SynchroniserButton } from "../../components/ui/SynchroniserButton";
import { BadgeImporte, BadgeInactif } from "../Arsenal/ArsenalEmplacements";
import { useIntegration } from "../../hooks/useIntegration";
import { integrationService } from "../../services/integrationService";
import { serviceService } from "../../services/serviceService";
import { formatDateTime } from "../../utils/appSettings";

const VIDE = { code: "", nom: "", typeService: "", reference: "", description: "" };
const ACCENTS = ["#0d9488", "#6366f1", "#0ea5e9", "#f59e0b", "#ec4899", "#8b5cf6", "#10b981", "#ef4444"];

// Couleur stable par service (initiales de la carte)
const accentDe = (s) => ACCENTS[Math.abs(String(s.code || s.id).split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % ACCENTS.length];
const libelle = (s) => s.nom || s.code || `Service ${s.id}`;
const typeDe = (s) => s.typeService || s.type || "";
const enErreur = (statut) => /ERREUR|ECHEC|PARTIEL/i.test(statut || "");

function StatutSynchro({ statut }) {
  const { t } = useTranslation();
  if (!statut) return <span className="text-slate-400">{t("integration.never_synced", "Jamais synchronisé")}</span>;
  const ko = enErreur(statut);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
      ko ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"
    }`}>
      {ko ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
      {statut}
    </span>
  );
}

function Kpi({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-slate-200/70 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}14`, color }}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="m-0 text-[22px] font-extrabold leading-none tabular-nums text-slate-800">{value}</p>
        <p className="m-0 mt-1 truncate text-[12px] font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ─── Bandeau : origine des services (interne ou système externe) ─────────
function BandeauIntegration({ importes, endpoint, onSynchro }) {
  const { t } = useTranslation();
  const [journal, setJournal] = useState(null);
  const [ouvert, setOuvert] = useState(false);
  const derniereSynchro = endpoint?.derniereSynchro;

  // Journal rechargé à l'ouverture et après chaque synchronisation
  useEffect(() => {
    if (!ouvert) return;
    let actif = true;
    integrationService.getJournal("SERVICE")
      .then((data) => actif && setJournal((Array.isArray(data) ? data : []).slice(0, 5)))
      .catch(() => actif && setJournal([]));
    return () => { actif = false; };
  }, [ouvert, derniereSynchro]);

  if (!importes) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50/70 px-5 py-3.5">
        <Settings2 className="h-5 w-5 shrink-0 text-slate-400" />
        <p className="m-0 min-w-0 flex-1 text-[13px] text-slate-600">
          {t("services_page.local_mode", "Les services sont gérés dans l'application. Pour les importer depuis le système de l'établissement, activez le référentiel « Services » dans Paramètres › Intégration.")}
        </p>
        <Link to="/parametres?tab=integration" className="text-[13px] font-semibold text-teal-700 hover:underline">
          {t("services_page.open_integration", "Ouvrir l'intégration")}
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50/60">
      <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <CloudDownload className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[13.5px] font-semibold text-indigo-900">
            {t("services_page.external_mode", "Services synchronisés depuis le système externe")}
          </p>
          <p className="m-0 mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-indigo-700/80">
            {t("integration.last_sync", "Dernière synchro")} : <StatutSynchro statut={endpoint?.dernierStatut} />
            {derniereSynchro && <span>{formatDateTime(derniereSynchro)}</span>}
            <span>· {t("services_page.read_only_imported", "services importés en lecture seule, ajout manuel possible")}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-indigo-700 hover:bg-white/70"
        >
          <History className="h-4 w-4" />
          {t("integration.journal", "Journal de synchronisation")}
          <ChevronDown className={`h-4 w-4 transition-transform ${ouvert ? "rotate-180" : ""}`} />
        </button>
        <SynchroniserButton referentiel="SERVICE" label={t("services_page.sync", "Synchroniser les services")} onTermine={onSynchro} />
      </div>

      <AnimatePresence initial={false}>
        {ouvert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-indigo-100 bg-white/70"
          >
            {journal === null ? (
              <div className="flex items-center gap-2 px-5 py-4 text-[13px] text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading", "Chargement…")}
              </div>
            ) : journal.length === 0 ? (
              <p className="m-0 px-5 py-4 text-[13px] text-slate-400">{t("integration.journal_empty", "Aucune synchronisation.")}</p>
            ) : (
              <ul className="m-0 list-none divide-y divide-indigo-50 p-0">
                {journal.map((j) => (
                  <li key={j.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2.5 text-[12.5px]">
                    <span className="w-[140px] shrink-0 text-slate-500">{formatDateTime(j.dateDebut)}</span>
                    <StatutSynchro statut={j.statut} />
                    <span className="text-slate-600">
                      {t("integration.nb_recus", "Reçus")} <b className="tabular-nums">{j.nbRecus ?? 0}</b>
                      {" · "}{t("integration.nb_crees", "Créés")} <b className="tabular-nums">{j.nbCrees ?? 0}</b>
                      {" · "}{t("integration.nb_mis_a_jour", "Mis à jour")} <b className="tabular-nums">{j.nbMisAJour ?? 0}</b>
                    </span>
                    {j.message && <span className="min-w-0 flex-1 truncate text-slate-400" title={j.message}>{j.message}</span>}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Carte d'un service ──────────────────────────────────────────────────
function CarteService({ service, chambres, importes, ouvert, onToggle, onEdit, onDelete, index }) {
  const { t } = useTranslation();
  const accent = accentDe(service);
  const lectureSeule = service.source === "EXTERNE";
  const initiales = libelle(service).replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join("").toUpperCase() || "S";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.2 }}
      className={`group flex flex-col rounded-[20px] border bg-white transition-shadow hover:shadow-[0_10px_28px_-12px_rgba(15,23,42,0.18)] ${
        ouvert ? "border-teal-300 ring-2 ring-teal-500/15" : "border-slate-200"
      } ${service.actif === false ? "opacity-60" : ""}`}
    >
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-3.5 p-4 text-left" aria-expanded={ouvert}>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[15px] font-extrabold text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
        >
          {initiales}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1">
            <span className="truncate text-[15px] font-bold text-slate-900">{libelle(service)}</span>
            <BadgeImporte item={service} />
            {importes && !lectureSeule && (
              <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {t("services_page.manual", "Manuel")}
              </span>
            )}
            <BadgeInactif item={service} />
          </span>
          <span className="mt-0.5 block font-mono text-[12px] font-semibold" style={{ color: accent }}>
            {service.code || `#${service.id}`}
          </span>
          {service.description && service.description !== libelle(service) && (
            <span className="mt-1 line-clamp-2 block text-[12.5px] text-slate-500">{service.description}</span>
          )}
        </span>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform ${ouvert ? "rotate-180" : ""}`} />
      </button>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-semibold text-slate-600">
          <BedDouble className="h-3.5 w-3.5" />
          {t("services_page.rooms_count", "{{count}} chambre(s)", { count: chambres.length })}
        </span>
        {typeDe(service) && (
          <span className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold" style={{ background: `${accent}12`, color: accent }}>
            {typeDe(service)}
          </span>
        )}
        {service.reference && (
          <span className="truncate font-mono text-[11px] text-slate-400" title={t("services_page.reference", "Référence externe")}>
            {service.reference}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1">
          {!lectureSeule && (
            <button type="button" onClick={onEdit} className="rounded-lg p-1.5 text-[#006f94] hover:bg-slate-100" title={t("common.edit", "Modifier")}>
              <Edit className="h-4 w-4" />
            </button>
          )}
          {!lectureSeule && service.actif !== false && (
            <button type="button" onClick={onDelete} className="rounded-lg p-1.5 text-[#e03131] hover:bg-red-50" title={t("services_page.deactivate", "Désactiver")}>
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {ouvert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-b-[20px] border-t border-slate-100 bg-slate-50/70 px-4 py-3">
              <p className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t("services_page.rooms", "Chambres du service")}
              </p>
              {chambres.length === 0 ? (
                <p className="m-0 text-[12.5px] text-slate-400">{t("services_page.no_rooms", "Aucune chambre rattachée.")}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {chambres.map((c) => (
                    <span
                      key={c.id}
                      className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[12px] font-semibold text-slate-700 ${c.actif === false ? "opacity-50" : ""}`}
                    >
                      <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                      {c.code || c.nom || `#${c.id}`}
                    </span>
                  ))}
                </div>
              )}
              <Link to="/chambre" className="mt-2.5 inline-block text-[12.5px] font-semibold text-teal-700 hover:underline">
                {t("services_page.manage_rooms", "Gérer les chambres →")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🏥 SERVICES — référentiel interne ou importé via l'intégration
// ═══════════════════════════════════════════════════════════════════════════
export default function ServiceList() {
  const { t } = useTranslation();
  const { integration, estImporte } = useIntegration();
  const importes = estImporte("SERVICE");
  const endpoint = (integration?.endpoints || []).find((e) => e.referentiel === "SERVICE");

  const [services, setServices] = useState([]);
  const [chambres, setChambres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rafraichir, setRafraichir] = useState(0);
  const [tous, setTous] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [ouvertId, setOuvertId] = useState(null);
  const [modal, setModal] = useState(null); // null | "create" | service à modifier
  const [form, setForm] = useState(VIDE);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let actif = true;
    Promise.all([serviceService.getAll(tous), serviceService.getChambres().catch(() => [])])
      .then(([s, c]) => {
        if (!actif) return;
        setServices(s);
        setChambres(c);
      })
      .catch((err) => actif && Swal.fire({ title: t("common.error", "Erreur"), text: err.message, icon: "error" }))
      .finally(() => actif && setIsLoading(false));
    return () => { actif = false; };
  }, [tous, rafraichir, t]);

  const recharger = useCallback(() => {
    setIsLoading(true);
    setRafraichir((n) => n + 1);
  }, []);

  const chambresPar = useMemo(() => {
    const map = new Map();
    chambres.forEach((c) => {
      const id = c.serviceId ?? c.service?.id;
      if (id == null) return;
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(c);
    });
    return map;
  }, [chambres]);

  const types = useMemo(() => [...new Set(services.map(typeDe).filter(Boolean))].sort(), [services]);

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return services
      .filter((s) => !filtreType || typeDe(s) === filtreType)
      .filter((s) => !terme || [s.code, s.nom, s.description, s.reference].some((v) => v?.toLowerCase().includes(terme)))
      .sort((a, b) => libelle(a).localeCompare(libelle(b), "fr"));
  }, [services, recherche, filtreType]);

  const actifs = services.filter((s) => s.actif !== false);
  const kpis = {
    actifs: actifs.length,
    importes: services.filter((s) => s.source === "EXTERNE").length,
    chambres: actifs.reduce((n, s) => n + (chambresPar.get(s.id)?.length || 0), 0),
    sansChambre: actifs.filter((s) => !chambresPar.get(s.id)?.length).length,
  };

  // ─── CRUD (services internes uniquement) ────────────────────────────────
  const ouvrir = (service) => {
    setForm(service ? {
      code: service.code || "", nom: service.nom || "", typeService: typeDe(service),
      reference: service.reference || "", description: service.description || "",
    } : VIDE);
    setModal(service || "create");
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.nom.trim()) {
      Swal.fire({ title: t("services_page.required", "Le code et le nom sont obligatoires."), icon: "warning" });
      return;
    }
    const code = form.code.trim().toUpperCase();
    const doublon = services.find((s) => s.code?.toUpperCase() === code && (modal === "create" || s.id !== modal.id));
    if (doublon) {
      Swal.fire({ title: t("services_page.duplicate", "Le code {{code}} est déjà utilisé.", { code }), icon: "warning" });
      return;
    }
    setIsSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() || null]));
      payload.code = payload.code.toUpperCase();
      const edition = modal !== "create";
      if (edition) await serviceService.update(modal.id, payload);
      else await serviceService.create(payload);
      setModal(null);
      recharger();
      Swal.fire({
        title: edition ? t("services_page.updated", "Service mis à jour") : t("services_page.created", "Service créé"),
        icon: "success", timer: 1500, showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({ title: t("common.error", "Erreur"), text: err.message, icon: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const desactiver = async (service) => {
    const nb = chambresPar.get(service.id)?.length || 0;
    const res = await Swal.fire({
      title: t("services_page.deactivate_title", "Désactiver « {{nom}} » ?", { nom: libelle(service) }),
      text: nb
        ? t("services_page.deactivate_rooms", "{{count}} chambre(s) sont rattachées à ce service.", { count: nb })
        : t("services_page.deactivate_text", "Le service n'apparaîtra plus dans les listes."),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e03131",
      confirmButtonText: t("services_page.deactivate", "Désactiver"),
      cancelButtonText: t("common.cancel", "Annuler"),
    });
    if (!res.isConfirmed) return;
    try {
      await serviceService.desactiver(service.id);
      recharger();
      Swal.fire({ title: t("services_page.deactivated", "Service désactivé"), icon: "success", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: t("common.error", "Erreur"), text: err.message, icon: "error" });
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      {/* ─── En-tête ─── */}
      <div className="page-head" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <PageHeaderIcon size={52} />
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: 0 }} className="dark:!text-foreground">
              {t("services_page.title", "Services")}
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "2px 0 0 0" }}>
              {t("services_page.subtitle", "Services de l'établissement et chambres rattachées.")}
            </p>
          </div>
        </div>
      </div>

      <BandeauIntegration importes={importes} endpoint={endpoint} onSynchro={recharger} />

      {/* ─── Indicateurs ─── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Building2} label={t("services_page.kpi_active", "Services actifs")} value={kpis.actifs} color="#0d9488" />
        <Kpi icon={CloudDownload} label={t("services_page.kpi_imported", "Importés")} value={kpis.importes} color="#6366f1" />
        <Kpi icon={BedDouble} label={t("services_page.kpi_rooms", "Chambres rattachées")} value={kpis.chambres} color="#0ea5e9" />
        <Kpi icon={Inbox} label={t("services_page.kpi_no_rooms", "Sans chambre")} value={kpis.sansChambre} color="#f59e0b" />
      </div>

      {/* ─── Barre d'outils ─── */}
      <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-slate-200/50 bg-white/65 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md">
        <button
          onClick={() => ouvrir(null)}
          className="flex items-center gap-2 rounded-[14px] border border-[#0ca678]/30 bg-white px-5 py-2.5 text-sm font-bold text-[#0ca678] transition-all hover:bg-[#0ca678]/5"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" /> {t("services_page.new", "Nouveau service")}
        </button>
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={t("services_page.search", "Rechercher un code, un nom, une référence…")}
            className="h-10 w-full rounded-[12px] border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        {types.length > 0 && (
          <select
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value)}
            className="h-10 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">{t("services_page.all_types", "Tous les types")}</option>
            {types.map((ty) => <option key={ty} value={ty}>{ty}</option>)}
          </select>
        )}
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={tous} onChange={(e) => { setIsLoading(true); setTous(e.target.checked); }} />
          {t("services_page.show_inactive", "Afficher les inactifs")}
        </label>
        <button
          onClick={recharger}
          className="flex items-center gap-2 rounded-[14px] border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> {t("common.refresh", "Actualiser")}
        </button>
      </div>

      {/* ─── Liste ─── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-[150px] animate-pulse rounded-[20px] bg-slate-100" />)}
        </div>
      ) : filtres.length === 0 ? (
        <div className="rounded-[20px] border-2 border-dashed border-slate-200 px-6 py-14 text-center">
          <Building2 className="mx-auto h-10 w-10 text-slate-300" />
          <p className="m-0 mt-3 text-sm font-bold text-slate-600">
            {services.length === 0
              ? t("services_page.empty", "Aucun service pour le moment.")
              : t("services_page.no_match", "Aucun service ne correspond à la recherche.")}
          </p>
          <p className="m-0 mt-1 text-[13px] text-slate-400">
            {services.length > 0 ? null : importes
              ? t("services_page.empty_external", "Lancez une synchronisation pour importer les services, ou ajoutez-en un manuellement.")
              : t("services_page.empty_local", "Créez votre premier service avec « Nouveau service ».")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtres.map((s, i) => (
            <CarteService
              key={s.id}
              index={i}
              service={s}
              importes={importes}
              chambres={chambresPar.get(s.id) || []}
              ouvert={ouvertId === s.id}
              onToggle={() => setOuvertId((id) => (id === s.id ? null : s.id))}
              onEdit={() => ouvrir(s)}
              onDelete={() => desactiver(s)}
            />
          ))}
        </div>
      )}

      {/* ─── Création / modification ─── */}
      <FormModal
        isOpen={modal !== null}
        onClose={() => setModal(null)}
        title={modal && modal !== "create" ? `${t("services_page.edit", "Modifier le service")} · ${libelle(modal)}` : t("services_page.new", "Nouveau service")}
        mode={modal && modal !== "create" ? "edit" : "create"}
        size="lg"
        onSubmit={enregistrer}
        saving={isSaving}
      >
        {importes && modal === "create" && (
          <p className="m-0 mb-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3.5 py-2.5 text-[12.5px] text-indigo-800">
            {t("services_page.manual_hint", "Ce service est ajouté manuellement : il reste modifiable ici et n'est pas remplacé par la synchronisation. Utilisez un code qui n'existe pas dans le système externe.")}
          </p>
        )}
        <FormSection title={t("modal.general_info", "Informations générales")} icon="specs" columns={2}>
          <Input
            label={`${t("common.code", "Code")} *`}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="CARDIO"
            required
          />
          <Input label={`${t("common.name", "Nom")} *`} value={form.nom} onChange={set("nom")} placeholder="Cardiologie" required />
          <div>
            <Input label={t("services_page.type", "Type")} value={form.typeService} onChange={set("typeService")} list="service-types" />
            <datalist id="service-types">
              {types.map((ty) => <option key={ty} value={ty} />)}
            </datalist>
          </div>
          <Input label={t("services_page.reference", "Référence externe")} value={form.reference} onChange={set("reference")} />
          <div className="col-span-2">
            <Input label={t("common.description", "Description")} value={form.description} onChange={set("description")} />
          </div>
        </FormSection>
      </FormModal>
    </div>
  );
}
