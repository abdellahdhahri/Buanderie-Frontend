import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { RefreshCw, Loader2, CloudDownload, CheckCircle2, AlertTriangle, ChevronDown, History, Settings2, Pencil, Ban, BedDouble } from "lucide-react";
import Swal from "../../kit/dialogueApi";
import { motion, AnimatePresence } from "framer-motion";
import { SynchroniserButton } from "../../ui/SynchroniserButton";
import { BadgeImporte, BadgeInactif } from "../Arsenal/ArsenalEmplacements";
import { useIntegration } from "../../../hooks/useIntegration";
import { integrationService } from "../../../services/integrationService";
import { serviceService } from "../../../services/serviceService";
import { formatDateTime } from "../../../utils/appSettings";

import {
  Page, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterActions,
  ListSection, DataTable, Pagination, Badge,
  Modal, Button, FormField,
  DetailsPage, DetailsButton, KpiTiles, DetailCard, DetailGrid, InfoList, DetailText,
  ColumnSettingsModal, useListPage, useRowSelection, exportExcel,
  RowActions, RowButton, FormGrid, Code, QuickStats,
} from "../../kit";
import { IconAjouter, IconDetails, IconModifier, IconSupprimer } from "../../kit/ActionIcons";

const VIDE = { code: "", nom: "", typeService: "", reference: "", description: "" };

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

function BandeauIntegration({ importes, endpoint, onSynchro }) {
  const { t } = useTranslation();
  const [journal, setJournal] = useState(null);
  const [ouvert, setOuvert] = useState(false);
  const derniereSynchro = endpoint?.derniereSynchro;

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

const COLUMNS_DEFAULT = [
  { key: "code", label: "Code", visible: true, searchable: true },
  { key: "nom", label: "Nom", visible: true, searchable: true },
  { key: "typeService", label: "Type", visible: true, searchable: true },
  { key: "chambres", label: "Chambres", visible: true, searchable: false },
  { key: "reference", label: "Référence externe", visible: true, searchable: true },
  { key: "description", label: "Description", visible: false, searchable: true },
  { key: "source", label: "Origine", visible: true, searchable: false },
  { key: "actions", label: "Actions", visible: true, searchable: false },
];

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
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(VIDE);
  const [isSaving, setIsSaving] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);

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
  const chambresDe = (s) => chambresPar.get(s.id) || [];

  const types = useMemo(() => [...new Set(services.map(typeDe).filter(Boolean))].sort(), [services]);

  const actifs = services.filter((s) => s.actif !== false);
  const kpis = {
    actifs: actifs.length,
    importes: services.filter((s) => s.source === "EXTERNE").length,
    chambres: actifs.reduce((n, s) => n + chambresDe(s).length, 0),
    sansChambre: actifs.filter((s) => !chambresDe(s).length).length,
  };

  const columns = useMemo(() => COLUMNS_DEFAULT.map((c) => ({
    ...c,
    label: {
      code: t("common.code", "Code"), nom: t("common.name", "Nom"), typeService: t("services_page.type", "Type"),
      chambres: t("services_page.rooms", "Chambres du service"), reference: t("services_page.reference", "Référence externe"),
      description: t("common.description", "Description"), source: t("machines.source", "Source"), actions: t("common.actions", "Actions"),
    }[c.key] || c.label,
  })), [t]);

  const origine = (s) => (s.source === "EXTERNE" ? t("integration.imported", "Importé") : t("services_page.manual", "Manuel"));
  const searchValue = (s, key) => {
    switch (key) {
      case "nom": return libelle(s);
      case "typeService": return typeDe(s);
      case "chambres": return chambresDe(s).length;
      case "source": return origine(s);
      case "actions": return "";
      default: return s[key] ?? "";
    }
  };
  const sortValue = (s, key) => (key === "chambres" ? chambresDe(s).length : String(searchValue(s, key)).toLowerCase());

  const list = useListPage({
    rows: services,
    columns,
    getSearchValue: searchValue,
    getSortValue: sortValue,
    defaultSort: (a, b) => libelle(a).localeCompare(libelle(b), "fr"),
    filters: {
      type: { initial: "all", column: "typeService", test: (s, v) => v === "all" || typeDe(s) === v },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const lectureSeule = (s) => s?.source === "EXTERNE";

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
      if (edition) { setSelected(null); setViewMode("list"); }
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
    if (!service || lectureSeule(service) || service.actif === false) return;
    const nb = chambresDe(service).length;
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
      setSelected(null);
      setViewMode("list");
      recharger();
      Swal.fire({ title: t("services_page.deactivated", "Service désactivé"), icon: "success", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: t("common.error", "Erreur"), text: err.message, icon: "error" });
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const handleRowClick = (s) => setSelected(selected?.id === s.id ? null : s);
  const openDetails = (s) => { if (s) { setSelected(s); setViewMode("details"); } };

  const handleExportExcel = (lignes) => {
    const source = Array.isArray(lignes) ? lignes : list.sorted;
    if (!source.length) return;
    exportExcel({
      fileName: "services",
      sheetName: t("services_page.title", "Services"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const TABLE_COLUMNS = {
    code: { label: t("common.code", "Code"), sortable: true, render: (s) => <Code>{s.code || `#${s.id}`}</Code> },
    nom: {
      label: t("common.name", "Nom"), sortable: true,
      render: (s) => <><strong>{libelle(s)}</strong><BadgeInactif item={s} /></>,
    },
    typeService: { label: t("services_page.type", "Type"), sortable: true, render: (s) => (typeDe(s) ? <Badge variant="info">{typeDe(s)}</Badge> : "—") },
    chambres: {
      label: t("services_page.rooms", "Chambres du service"), sortable: true, align: "center",
      render: (s) => <Badge variant={chambresDe(s).length ? "success" : "warning"}>{chambresDe(s).length}</Badge>,
    },
    reference: { label: t("services_page.reference", "Référence externe"), sortable: true, render: (s) => (s.reference ? <Code>{s.reference}</Code> : "—") },
    description: { label: t("common.description", "Description"), sortable: true, render: (s) => s.description || "—" },
    source: {
      label: t("machines.source", "Source"), sortable: true,
      render: (s) => <Badge variant={s.source === "EXTERNE" ? "info" : "default"}>{origine(s)}</Badge>,
    },
    actions: {
      label: t("common.actions", "Actions"), align: "center",
      render: (s) => (
        <RowActions>
          <RowButton icon={Pencil} title={t("common.edit", "Modifier")} disabled={lectureSeule(s)} onClick={() => ouvrir(s)} />
          <RowButton icon={Ban} tone="danger" title={t("services_page.deactivate", "Désactiver")} disabled={lectureSeule(s) || s.actif === false} onClick={() => desactiver(s)} />
        </RowActions>
      ),
    },
  };

  const peutModifier = selected && !lectureSeule(selected);

  return (
    <Page>
      {viewMode === "list" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <BandeauIntegration importes={importes} endpoint={endpoint} onSynchro={recharger} />
          </div>

          <ActionBar>
            <ActionButton icon={IconAjouter} label={t("services_page.new", "Nouveau service")} variant="ajouter" onClick={() => ouvrir(null)} />
            <ActionButton icon={IconDetails} label={t("common.details", "Détails")} variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={IconModifier} label={t("common.edit", "Modifier")} variant="modifier" disabled={!peutModifier} onClick={() => ouvrir(selected)} />
            <ActionButton icon={IconSupprimer} label={t("services_page.deactivate", "Désactiver")} variant="supprimer" disabled={!peutModifier || selected?.actif === false} onClick={() => desactiver(selected)} />
            <ActionButton
              icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />}
              label={t("common.refresh", "Actualiser")}
              variant="details"
              onClick={recharger}
            />
          </ActionBar>

          <FilterPanel>
            <FilterRow>
              <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
              <FilterText
                label={t("common.search", "Recherche")}
                placeholder={t("services_page.search", "Rechercher un code, un nom, une référence…")}
                value={draft.searchTerm}
                onChange={(v) => setFilter("searchTerm", v)}
                onEnter={list.apply}
              />
              {types.length > 0 && list.isColVisible("typeService") && (
                <FilterSelect
                  label={t("services_page.type", "Type")}
                  value={draft.type}
                  onChange={(v) => setFilter("type", v)}
                  allLabel={t("services_page.all_types", "Tous les types")}
                  options={types.map((ty) => ({ value: ty, label: ty }))}
                />
              )}
              <FilterSelect
                label={t("common.status", "Statut")}
                value={tous ? "tous" : "actifs"}
                onChange={(v) => { setIsLoading(true); setTous(v === "tous"); }}
                allLabel={null}
                options={[
                  { value: "actifs", label: t("services_page.kpi_active", "Services actifs") },
                  { value: "tous", label: t("services_page.show_inactive", "Afficher les inactifs") },
                ]}
              />
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

          <ListSection
            selection={sel}
            unit="service"
            units="services"
            bulkActions={[{ label: t("kit.exportExcel", "Exporter Excel"), onClick: (l) => handleExportExcel(l) }]}
          >
            <DataTable
              columns={TABLE_COLUMNS}
              visible={list.visibleColumns}
              rows={list.paginated}
              sort={list.sort}
              onSort={list.toggleSort}
              selection={sel}
              activeId={selected?.id}
              onRowClick={handleRowClick}
              onRowDoubleClick={openDetails}
              rowClassName={(s) => (s.actif === false ? "kit-row-inactive" : "")}
              loading={isLoading && !services.length}
              loadingText={t("common.loading", "Chargement…")}
              emptyText={services.length === 0
                ? `${t("services_page.empty", "Aucun service pour le moment.")} ${importes
                  ? t("services_page.empty_external", "Lancez une synchronisation pour importer les services, ou ajoutez-en un manuellement.")
                  : t("services_page.empty_local", "Créez votre premier service avec « Nouveau service ».")}`
                : t("services_page.no_match", "Aucun service ne correspond à la recherche.")}
            />
            <Pagination
              total={list.sorted.length}
              page={list.page}
              totalPages={list.totalPages}
              pageSize={list.pageSize}
              onPage={list.setPage}
              unit="service(s)"
            />
          </ListSection>
        </>
      )}

      {viewMode === "details" && selected && (
        <DetailsPage
          onBack={() => setViewMode("list")}
          eyebrow={t("services_page.title", "Services")}
          title={`${selected.code || `#${selected.id}`} · ${libelle(selected)}`}
          badge={<span><BadgeImporte item={selected} /><BadgeInactif item={selected} /></span>}
          actions={peutModifier && (
            <>
              <DetailsButton icon={Pencil} onClick={() => ouvrir(selected)}>{t("common.edit", "Modifier")}</DetailsButton>
              {selected.actif !== false && (
                <DetailsButton icon={Ban} variant="danger" onClick={() => desactiver(selected)}>{t("services_page.deactivate", "Désactiver")}</DetailsButton>
              )}
            </>
          )}
        >
          <KpiTiles items={[
            { label: t("services_page.rooms", "Chambres du service"), value: chambresDe(selected).length, tone: "blue" },
            { label: t("services_page.type", "Type"), value: typeDe(selected) || "—", tone: "violet" },
            { label: t("machines.source", "Source"), value: origine(selected), tone: "green" },
          ]} />
          <DetailGrid>
            <DetailCard title={t("modal.general_info", "Informations générales")}>
              <InfoList items={[
                { label: t("common.code", "Code"), value: selected.code },
                { label: t("common.name", "Nom"), value: selected.nom },
                { label: t("services_page.type", "Type"), value: typeDe(selected) },
                { label: t("services_page.reference", "Référence externe"), value: selected.reference },
              ]} />
              <DetailText>{selected.description !== libelle(selected) ? selected.description : null}</DetailText>
            </DetailCard>
            <DetailCard title={t("services_page.rooms", "Chambres du service")}>
              {chambresDe(selected).length === 0 ? (
                <DetailText empty={t("services_page.no_rooms", "Aucune chambre rattachée.")} />
              ) : (
                <div className="kit-chips">
                  {chambresDe(selected).map((c) => (
                    <span key={c.id} className="kit-chip" style={c.actif === false ? { opacity: 0.5 } : undefined}>
                      <BedDouble size={14} /> {c.code || c.nom || `#${c.id}`}
                    </span>
                  ))}
                </div>
              )}
              <Link to="/chambre" className="kit-link" style={{ display: "inline-block", marginTop: 12 }}>
                {t("services_page.manage_rooms", "Gérer les chambres →")}
              </Link>
            </DetailCard>
          </DetailGrid>
        </DetailsPage>
      )}

      {modal !== null && (
        <Modal
          className="kit-std-form"
          size="md"
          title={modal !== "create" ? `${t("services_page.edit", "Modifier le service")} · ${libelle(modal)}` : t("services_page.new", "Nouveau service")}
          onClose={isSaving ? undefined : () => setModal(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setModal(null)} disabled={isSaving}>{t("common.cancel", "Annuler")}</Button>
              <Button type="submit" form="service-form" disabled={isSaving}>{isSaving ? t("common.saving", "Enregistrement…") : t("common.save", "Enregistrer")}</Button>
            </>
          )}
        >
          {importes && modal === "create" && (
            <div className="kit-modal-summary">
              {t("services_page.manual_hint", "Ce service est ajouté manuellement : il reste modifiable ici et n'est pas remplacé par la synchronisation. Utilisez un code qui n'existe pas dans le système externe.")}
            </div>
          )}
          <form id="service-form" onSubmit={enregistrer}>
            <FormGrid>
              <FormField label={t("common.code", "Code")} required>
                <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="CARDIO" required />
              </FormField>
              <FormField label={t("common.name", "Nom")} required>
                <input value={form.nom} onChange={set("nom")} placeholder="Cardiologie" required />
              </FormField>
              <FormField label={t("services_page.type", "Type")}>
                <input value={form.typeService} onChange={set("typeService")} list="service-types" />
                <datalist id="service-types">
                  {types.map((ty) => <option key={ty} value={ty} />)}
                </datalist>
              </FormField>
              <FormField label={t("services_page.reference", "Référence externe")}>
                <input value={form.reference} onChange={set("reference")} />
              </FormField>
              <FormField label={t("common.description", "Description")} span>
                <input value={form.description} onChange={set("description")} />
              </FormField>
            </FormGrid>
          </form>
        </Modal>
      )}

      {showStats && (
        <QuickStats
          title={t("services_page.title", "Services")}
          subtitle={`${services.length} service(s)`}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t("services_page.kpi_active", "Services actifs"), value: kpis.actifs, color: "#10b981" },
            { label: t("services_page.kpi_imported", "Importés"), value: kpis.importes, color: "#6366f1" },
            { label: t("services_page.kpi_rooms", "Chambres rattachées"), value: kpis.chambres, color: "#0ea5e9" },
            { label: t("services_page.kpi_no_rooms", "Sans chambre"), value: kpis.sansChambre, color: "#f59e0b" },
          ]}
          repartitions={types.length ? [{ title: t("services_page.type", "Type"), items: types.map((ty) => ({ label: ty, value: actifs.filter((s) => typeDe(s) === ty).length })) }] : []}
          classements={[{ title: t("services_page.rooms", "Chambres du service"), items: actifs.map((s) => ({ label: libelle(s), value: chambresDe(s).length })).filter((x) => x.value).sort((a, b) => b.value - a.value) }]}
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
