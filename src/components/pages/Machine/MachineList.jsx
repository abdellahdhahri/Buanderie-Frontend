import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "../../kit/dialogueApi";
import { RefreshCw, Pencil, Trash2, CheckCircle, Wrench, AlertCircle, AlertTriangle, Clock, WashingMachine, Wind, Repeat, Download } from "lucide-react";
import { useMachineContext } from "../../../contextes/MachineContext";
import { useAuth } from "../../../constants/AuthContext";
import { TYPES_RECLAMATION_MACHINE, DESCRIPTION_MAX, declarerReclamationMachine } from "../../../services/reclamationMachineService";
import { SynchroniserButton } from "../../ui/SynchroniserButton";
import { useIntegration } from "../../../hooks/useIntegration";
import { formatDateTime } from "../../../utils/appSettings";
import BarcodeLabel from "../../BarcodeLabel";
import ImportMachinesCubix from "./ImportMachinesCubix";

import {
  Page, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterActions,
  ListSection, DataTable, Pagination, Badge,
  Modal, Button, FormField, ConfirmDialog,
  DetailsPage, DetailsButton, KpiTiles, DetailCard, DetailGrid, InfoList,
  ColumnSettingsModal, useListPage, useRowSelection, deleteMany, exportExcel,
  Tabs, FormGrid, Code, QuickStats,
} from "../../kit";
import { IconAjouter, IconDetails, IconModifier, IconSupprimer } from "../../kit/ActionIcons";

const TYPES_MACHINE = [
  { value: "LAVEUR", label: "Laveur", icon: WashingMachine },
  { value: "SECHEUR", label: "Sécheur", icon: Wind },
  { value: "LAVEUR_SECHEUR", label: "Laveur/Sécheur", icon: Repeat },
];

const ETATS_TECHNIQUES = [
  { value: "FONCTIONNEL", label: "Fonctionnel", variant: "success", icon: CheckCircle },
  { value: "EN_PANNE", label: "En panne", variant: "danger", icon: AlertCircle },
  { value: "FONCTIONNEL_AVEC_PROBLEME", label: "Fonctionnel avec problème", variant: "warning", icon: AlertTriangle },
  { value: "EN_COURS_DE_REPARATION", label: "En réparation", variant: "info", icon: Wrench },
  { value: "EN_MAINTENANCE", label: "En maintenance", variant: "warning", icon: Wrench },
  { value: "HORS_SERVICE", label: "Hors service", variant: "secondary", icon: AlertCircle },
];

const ETATS_IMMOBILISATION = [
  { value: "DISPONIBLE", label: "Disponible", variant: "success", icon: CheckCircle },
  { value: "OCCUPE", label: "Occupé", variant: "info", icon: Clock },
  { value: "EN_REPARATION", label: "En réparation", variant: "warning", icon: Wrench },
  { value: "IMMOBILISE", label: "Immobilisé", variant: "danger", icon: AlertCircle },
];

const CATEGORIES_MACHINE = [
  { value: "LINGES_INFECTE", label: "Linges infectés" },
  { value: "LINGES_NORMAL", label: "Linges normaux" },
];

const VIDE = {
  reference: "", type: "LAVEUR", marque: "", categorie: "", capaciteKg: "", code: "",
  etatTechnique: "FONCTIONNEL", etatImmobilisation: "DISPONIBLE", localisation: "", designation: "", modele: "",
  nom: "", description: "",
};

const COLUMNS_DEFAULT = [
  { key: "code", label: "Code", visible: true, searchable: true },
  { key: "designation", label: "Désignation", visible: true, searchable: true },
  { key: "marque", label: "Marque", visible: true, searchable: true },
  { key: "modele", label: "Modèle", visible: true, searchable: true },
  { key: "categorie", label: "Catégorie", visible: false, searchable: true },
  { key: "capaciteKg", label: "Capacité", visible: false, searchable: false },
  { key: "localisation", label: "Localisation", visible: false, searchable: true },
  { key: "etatTechnique", label: "État technique", visible: true, searchable: true },
  { key: "etatImmobilisation", label: "Disponibilité", visible: true, searchable: true },
];

const nomMachine = (m) => m.designation || m.reference || "—";

export default function MachineList() {
  const { t } = useTranslation();
  const { machines, isLoading, pagination, loadMachines, createMachine, updateMachine, deleteMachine } = useMachineContext();
  const { agent: agentConnecte } = useAuth() || {};
  const { estImporte, modeCubix } = useIntegration();
  const machinesImportees = estImporte("MACHINE");

  const [activeTab, setActiveTab] = useState("LAVEUR");
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showImportCubix, setShowImportCubix] = useState(false);
  const [signalement, setSignalement] = useState(null);
  const [signalementBusy, setSignalementBusy] = useState(false);

  const etatTech = (v) => ETATS_TECHNIQUES.find((e) => e.value === v);
  const etatImmo = (v) => ETATS_IMMOBILISATION.find((e) => e.value === v);
  const typeLabel = (v) => {
    const ty = TYPES_MACHINE.find((x) => x.value === v);
    return ty ? t(`machine_type.${v}`, ty.label) : v || "—";
  };
  const etatLabel = (e, v) => (e ? t(`machine_status.${e.value}`, e.label) : v || t("common.undefined", "Inconnu"));
  const categorieLabel = (v) => {
    const c = CATEGORIES_MACHINE.find((x) => x.value === v);
    return c ? t(`machine_category.${v}`, c.label) : v || "";
  };

  const EtatBadge = ({ etat, value }) => {
    const Icon = etat?.icon;
    return (
      <Badge variant={etat?.variant || "default"}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          {Icon && <Icon size={12} />}
          {etatLabel(etat, value)}
        </span>
      </Badge>
    );
  };

  const columns = useMemo(() => COLUMNS_DEFAULT.map((c) => ({
    ...c,
    label: {
      code: t("machines.code"), designation: t("machines.designation"), marque: t("machines.brand"),
      modele: t("machines.model"), categorie: t("machines.category"), capaciteKg: t("machines.capacity"),
      localisation: t("machines.location"), etatTechnique: t("machines.technical_state"),
      etatImmobilisation: t("machines.availability"), actions: t("common.actions"),
    }[c.key] || c.label,
  })), [t]);

  const searchValue = (m, key) => {
    switch (key) {
      case "code": return m.code || m.reference || "";
      case "designation": return nomMachine(m);
      case "categorie": return categorieLabel(m.categorie);
      case "capaciteKg": return m.capaciteKg != null ? `${m.capaciteKg}` : "";
      case "etatTechnique": return etatLabel(etatTech(m.etatTechnique), m.etatTechnique);
      case "etatImmobilisation": return etatLabel(etatImmo(m.etatImmobilisation), m.etatImmobilisation);
      case "actions": return "";
      default: return m[key] || "";
    }
  };
  const sortValue = (m, key) => (key === "capaciteKg" ? Number(m.capaciteKg) || 0 : String(searchValue(m, key)).toLowerCase());

  const rows = useMemo(() => machines.filter((m) => m.type === activeTab), [machines, activeTab]);

  const list = useListPage({
    rows,
    columns,
    getSearchValue: searchValue,
    getSortValue: sortValue,
    pageSize: pagination.itemsPerPage || 10,
    filters: {
      etatTechnique: { initial: "all", column: "etatTechnique", test: (m, v) => v === "all" || m.etatTechnique === v },
      etatImmobilisation: { initial: "all", column: "etatImmobilisation", test: (m, v) => v === "all" || m.etatImmobilisation === v },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const stats = (type) => {
    const liste = machines.filter((m) => m.type === type);
    return {
      total: liste.length,
      fonctionnel: liste.filter((m) => m.etatTechnique === "FONCTIONNEL").length,
      disponible: liste.filter((m) => m.etatImmobilisation === "DISPONIBLE").length,
    };
  };
  const currentStats = stats(activeTab);

  const changeTab = (type) => { setActiveTab(type); setSelected(null); list.setPage(1); };
  const handleRowClick = (m) => setSelected(selected?.id === m.id ? null : m);
  const openDetails = (m) => { setSelected(m); setViewMode("details"); };

  const openCreate = () => setForm({ machine: null, rec: { ...VIDE, type: activeTab } });
  const openEdit = (m) => {
    if (!m) return;
    setForm({
      machine: m,
      rec: {
        reference: m.reference || "", type: m.type || activeTab, marque: m.marque || "", categorie: m.categorie || "",
        capaciteKg: m.capaciteKg ?? "", code: m.code || "", etatTechnique: m.etatTechnique || "FONCTIONNEL",
        etatImmobilisation: m.etatImmobilisation || "DISPONIBLE", localisation: m.localisation || "",
        designation: m.designation || "", modele: m.modele || "",
        nom: m.nom || "", description: m.description || "",
      },
    });
  };
  const setRec = (patch) => setForm((f) => ({ ...f, rec: { ...f.rec, ...patch } }));

  const toast = (text) => Swal.fire({ title: "✅", text, icon: "success", timer: 1500, showConfirmButton: false });
  const erreur = (err) => Swal.fire({ title: "❌", text: err?.message || t("machines.error_text"), icon: "error" });

  const openSignalement = (m) => {
    if (!m) return;
    setSignalement({
      machine: m,
      type: TYPES_RECLAMATION_MACHINE[0].value,
      description: "",
      matriculeAgent: agentConnecte?.matricule || agentConnecte?.codeBarre || "",
    });
  };
  const setSignal = (patch) => setSignalement((s) => ({ ...s, ...patch }));

  const handleSignalement = async (e) => {
    e.preventDefault();
    const { machine, type, description, matriculeAgent } = signalement;
    const matricule = matriculeAgent.trim();
    if (!matricule) {
      Swal.fire({ title: t("reclamations.agent_required", "Agent déclarant obligatoire"), text: t("reclamations.agent_required_text", "Scannez ou saisissez le code-barres du personnel."), icon: "warning" });
      return;
    }
    setSignalementBusy(true);
    try {
      await declarerReclamationMachine({ codeMachine: machine.code || machine.reference, type, matriculeAgent: matricule, description });
      setSignalement(null);
      toast(t("machines.report_success", "Problème signalé : la réclamation a été enregistrée."));
      await loadMachines();
    } catch (err) {
      erreur(err);
    } finally {
      setSignalementBusy(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const { machine, rec } = form;
    if (!rec.reference && !rec.designation) {
      Swal.fire({ title: t("machines.reference_required"), text: t("machines.reference_required_text"), icon: "warning" });
      return;
    }
    const externe = machine?.source === "EXTERNE";
    const changements = machine ? (() => {
      const diff = {};
      const texte = (v) => (v ?? "").toString().trim();
      if (texte(rec.marque) !== texte(machine.marque)) diff.marque = texte(rec.marque);
      const capacite = rec.capaciteKg === "" ? null : parseFloat(rec.capaciteKg);
      if (capacite != null && !Number.isNaN(capacite) && capacite !== machine.capaciteKg) diff.capaciteKg = capacite;
      if (texte(rec.localisation) !== texte(machine.localisation)) diff.localisation = texte(rec.localisation);
      if (texte(rec.nom) !== texte(machine.nom)) diff.nom = texte(rec.nom);
      if (texte(rec.description) !== texte(machine.description)) diff.description = texte(rec.description);
      if (rec.categorie && rec.categorie !== (machine.categorie || "")) diff.categorie = rec.categorie;
      if (rec.etatTechnique && rec.etatTechnique !== machine.etatTechnique) diff.etatTechnique = rec.etatTechnique;
      if (!externe && rec.type && rec.type !== machine.type) diff.type = rec.type;
      return diff;
    })() : null;
    if (machine && Object.keys(changements).length === 0) {
      setForm(null);
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        reference: rec.reference?.trim() || rec.designation?.trim(),
        designation: rec.designation?.trim(),
        modele: rec.modele?.trim(),
        type: rec.type || activeTab,
        marque: rec.marque?.trim() || null,
        categorie: rec.categorie || null,
        capaciteKg: rec.capaciteKg === "" ? null : parseFloat(rec.capaciteKg),
        code: rec.code?.trim() || undefined,
        etatTechnique: rec.etatTechnique || "FONCTIONNEL",
        etatImmobilisation: rec.etatImmobilisation || "DISPONIBLE",
        localisation: rec.localisation?.trim() || null,
        ...(rec.nom?.trim() ? { nom: rec.nom.trim() } : {}),
        ...(rec.description?.trim() ? { description: rec.description.trim() } : {}),
      };
      if (machine) {
        await updateMachine(machine.id, changements);
        toast(t("machines.update_success"));
        setSelected(null);
        setViewMode("list");
      } else {
        await createMachine(payload);
        toast(t("machines.create_success"));
      }
      setForm(null);
      loadMachines();
    } catch (err) {
      erreur(err);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    const cible = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteMachine(cible.id);
      if (selected?.id === cible.id) { setSelected(null); setViewMode("list"); }
      toast(t("machines.delete_success"));
      loadMachines();
    } catch (err) {
      erreur(err);
    }
  };

  const handleBulkDelete = async (lignes) => {
    if (!lignes.length || bulkDeleting) return;
    const ok = await Swal.fire({
      title: t("machines.delete_confirm"),
      text: `${lignes.length} machine(s)`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: t("machines.delete_confirm_yes"),
      cancelButtonText: t("machines.delete_confirm_no"),
    });
    if (!ok.isConfirmed) return;
    setBulkDeleting(true);
    try {
      const { deleted, failed } = await deleteMany(lignes, (id) => deleteMachine(id));
      sel.keepOnly(failed);
      if (selected && deleted.includes(selected.id)) setSelected(null);
      if (failed.length) erreur({ message: `${deleted.length} / ${lignes.length}` });
      loadMachines();
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleExportExcel = (lignes) => {
    const source = Array.isArray(lignes) ? lignes : list.sorted;
    if (!source.length) return;
    exportExcel({
      fileName: `machines_${activeTab.toLowerCase()}`,
      sheetName: t("machines.title"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const TABLE_COLUMNS = {
    code: {
      label: t("machines.code"), sortable: true,
      render: (m) => (
        <>
          <Code>{m.code || m.reference}</Code>
          {m.source === "EXTERNE" && (
            <span className="kit-tag" title={m.idExterne ? `${t("machines.external_id", "ID externe")} : ${m.idExterne}` : undefined}>
              {t("integration.imported", "Importé")}
            </span>
          )}
        </>
      ),
    },
    designation: { label: t("machines.designation"), sortable: true, render: (m) => <strong>{nomMachine(m)}</strong> },
    marque: { label: t("machines.brand"), sortable: true, render: (m) => m.marque || "—" },
    modele: { label: t("machines.model"), sortable: true, render: (m) => m.modele || "—" },
    categorie: { label: t("machines.category"), sortable: true, render: (m) => categorieLabel(m.categorie) || "—" },
    capaciteKg: { label: t("machines.capacity"), sortable: true, align: "right", render: (m) => (m.capaciteKg != null ? `${m.capaciteKg} kg` : "—") },
    localisation: { label: t("machines.location"), sortable: true, render: (m) => m.localisation || "—" },
    etatTechnique: { label: t("machines.technical_state"), sortable: true, render: (m) => <EtatBadge etat={etatTech(m.etatTechnique)} value={m.etatTechnique} /> },
    etatImmobilisation: { label: t("machines.availability"), sortable: true, render: (m) => <EtatBadge etat={etatImmo(m.etatImmobilisation)} value={m.etatImmobilisation} /> },
  };

  const typeNouveau = activeTab === "LAVEUR" ? t("machines.laveur") : activeTab === "SECHEUR" ? t("machines.secheur") : t(`machine_type.${activeTab}`, "Laveur/Sécheur");

  return (
    <Page>
      {viewMode === "list" && (
        <>
          <ActionBar>
            {!machinesImportees && (
              <ActionButton icon={IconAjouter} label={t("machines.new")} variant="ajouter" onClick={openCreate} />
            )}
            {modeCubix && (
              <ActionButton icon={Download} label={t("machines.import_cubix", "Importer depuis CUBIX")} variant="ajouter" onClick={() => setShowImportCubix(true)} />
            )}
            <SynchroniserButton referentiel="MACHINE" onTermine={loadMachines} variant="action" />
            <ActionButton icon={IconDetails} label={t("machines.details")} variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={IconModifier} label={t("common.edit")} variant="modifier" disabled={!selected} onClick={() => openEdit(selected)} />
            <ActionButton icon={AlertTriangle} label={t("machines.report", "Signaler un problème")} variant="supprimer" disabled={!selected} onClick={() => openSignalement(selected)} />
            <ActionButton icon={IconSupprimer} label={t("common.delete")} variant="supprimer" disabled={!selected} onClick={() => setDeleteTarget(selected)} />
            <BarcodeLabel item={selected} type="machine" variant="action" />
            <ActionButton
              icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />}
              label={t("common.refresh")}
              variant="details"
              onClick={loadMachines}
            />
          </ActionBar>

          <div className="kit-toolbar">
            <Tabs
              value={activeTab}
              onChange={changeTab}
              items={TYPES_MACHINE.map((ty) => ({
                value: ty.value,
                icon: <ty.icon size={16} strokeWidth={2} />,
                label: t(`machine_type.${ty.value}`, ty.label),
                count: stats(ty.value).total,
              }))}
            />
          </div>

          <FilterPanel>
            <FilterRow>
              <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
              <FilterText
                label={t("common.search")}
                placeholder={t("machines.search_placeholder")}
                value={draft.searchTerm}
                onChange={(v) => setFilter("searchTerm", v)}
                onEnter={list.apply}
              />
              {list.isColVisible("etatTechnique") && (
                <FilterSelect
                  label={t("machines.technical_state")}
                  value={draft.etatTechnique}
                  onChange={(v) => setFilter("etatTechnique", v)}
                  allLabel={t("common.all")}
                  options={ETATS_TECHNIQUES.map((e) => ({ value: e.value, label: etatLabel(e) }))}
                />
              )}
              {list.isColVisible("etatImmobilisation") && (
                <FilterSelect
                  label={t("machines.availability")}
                  value={draft.etatImmobilisation}
                  onChange={(v) => setFilter("etatImmobilisation", v)}
                  allLabel={t("common.all")}
                  options={ETATS_IMMOBILISATION.map((e) => ({ value: e.value, label: etatLabel(e) }))}
                />
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

          <ListSection
            selection={sel}
            unit="machine"
            units="machines"
            bulkActions={[
              { label: t("kit.exportExcel", "Exporter Excel"), onClick: (l) => handleExportExcel(l) },
              { label: t("common.delete"), variant: "danger", onClick: handleBulkDelete, busy: bulkDeleting, busyLabel: t("common.loading") },
            ]}
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
              loading={isLoading && !machines.length}
              loadingText={t("common.loading")}
              emptyText={draft.searchTerm ? t("machines.no_match") : t("machines.no_data")}
            />
            <Pagination
              total={list.sorted.length}
              page={list.page}
              totalPages={list.totalPages}
              pageSize={list.pageSize}
              onPage={list.setPage}
              unit="machine(s)"
            />
          </ListSection>
        </>
      )}

      {viewMode === "details" && selected && (
        <DetailsPage
          onBack={() => setViewMode("list")}
          eyebrow={t("machines.details")}
          title={`${selected.code || selected.reference || `#${selected.id}`} · ${nomMachine(selected)}`}
          badge={<EtatBadge etat={etatTech(selected.etatTechnique)} value={selected.etatTechnique} />}
          actions={(
            <>
              <BarcodeLabel item={selected} type="machine" variant="action" />
              <DetailsButton icon={AlertTriangle} variant="danger" onClick={() => openSignalement(selected)}>{t("machines.report", "Signaler un problème")}</DetailsButton>
              <DetailsButton icon={Pencil} onClick={() => openEdit(selected)}>{t("common.edit")}</DetailsButton>
              <DetailsButton icon={Trash2} variant="danger" onClick={() => setDeleteTarget(selected)}>{t("common.delete")}</DetailsButton>
            </>
          )}
        >
          <KpiTiles items={[
            { label: t("machines.type"), value: typeLabel(selected.type), tone: "blue" },
            { label: t("machines.capacity"), value: `${selected.capaciteKg || 0} kg`, tone: "green" },
            { label: t("machines.availability"), value: etatLabel(etatImmo(selected.etatImmobilisation), selected.etatImmobilisation), tone: "amber" },
          ]} />

          <DetailGrid>
            <DetailCard title={t("modal.identification", "Identification")}>
              <InfoList items={[
                { label: "ID", value: selected.id },
                { label: t("machines.code"), value: selected.code },
                { label: t("machines.designation"), value: nomMachine(selected) },
                selected.source && { label: t("machines.source", "Source"), value: selected.source === "EXTERNE" ? t("integration.imported", "Importé") : selected.source },
                selected.idExterne && { label: t("machines.external_id", "ID externe"), value: selected.idExterne },
                selected.dateSynchro && { label: t("machines.sync_date", "Dernière synchronisation"), value: formatDateTime(selected.dateSynchro) },
              ].filter(Boolean)} />
            </DetailCard>
            <DetailCard title={t("modal.characteristics", "Caractéristiques")}>
              <InfoList items={[
                { label: t("machines.brand"), value: selected.marque },
                { label: t("machines.model"), value: selected.modele },
                { label: t("machines.category"), value: categorieLabel(selected.categorie) || null },
                { label: t("machines.location"), value: selected.localisation },
              ]} />
            </DetailCard>
          </DetailGrid>
        </DetailsPage>
      )}

      {form && (
        <Modal
          className="kit-std-form"
          size="md"
          title={form.machine ? `${t("machines.edit")} #${form.machine.id}` : `${t("machines.new")} ${typeNouveau}`}
          onClose={isSaving ? undefined : () => setForm(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setForm(null)} disabled={isSaving}>{t("common.cancel")}</Button>
              <Button type="submit" form="machine-form" disabled={isSaving}>{isSaving ? t("common.saving") : t("common.save")}</Button>
            </>
          )}
        >
          <form id="machine-form" onSubmit={handleSave}>
            <FormGrid>
              <FormField
                label={<>{t("machines.designation")} {form.machine?.source === "EXTERNE" && <Badge variant="info">CUBIX</Badge>}</>}
                required={!form.machine}
                hint={form.machine?.source === "EXTERNE" ? t("machines.cubix_readonly", "Géré par CUBIX : lecture seule.") : undefined}
              >
                <input value={form.rec.designation} onChange={(e) => setRec({ designation: e.target.value })} placeholder={t("machines.designation_placeholder")} disabled={!!form.machine} />
              </FormField>
              <FormField
                label={<>{t("machines.code")} {form.machine?.source === "EXTERNE" && <Badge variant="info">CUBIX</Badge>}</>}
                hint={form.machine ? t("machines.code_disabled") : t("machines.code_auto")}
              >
                <input value={form.rec.code} onChange={(e) => setRec({ code: e.target.value.toUpperCase() })} placeholder={t("machines.code_placeholder")} disabled={!!form.machine} />
              </FormField>
              <FormField label={t("machines.type")} required>
                <select value={form.rec.type} onChange={(e) => setRec({ type: e.target.value })} required disabled={form.machine?.source === "EXTERNE"}>
                  {TYPES_MACHINE.map((ty) => <option key={ty.value} value={ty.value}>{typeLabel(ty.value)}</option>)}
                </select>
              </FormField>
              <FormField label={t("machines.brand")}>
                <input value={form.rec.marque} onChange={(e) => setRec({ marque: e.target.value })} placeholder={t("machines.brand_placeholder")} />
              </FormField>
              <FormField label={t("machines.model")}>
                <input value={form.rec.modele} onChange={(e) => setRec({ modele: e.target.value })} placeholder={t("machines.model_placeholder")} disabled={!!form.machine} />
              </FormField>
              <FormField label={t("machines.category")}>
                <select value={form.rec.categorie} onChange={(e) => setRec({ categorie: e.target.value })}>
                  <option value="">{t("machines.select_category")}</option>
                  {CATEGORIES_MACHINE.map((c) => <option key={c.value} value={c.value}>{categorieLabel(c.value)}</option>)}
                </select>
              </FormField>
              <FormField label={t("machines.capacity")}>
                <input type="number" step="0.5" value={form.rec.capaciteKg} onChange={(e) => setRec({ capaciteKg: e.target.value })} placeholder={t("machines.capacity_placeholder")} />
              </FormField>
              <FormField label={t("machines.technical_state")}>
                <select value={form.rec.etatTechnique} onChange={(e) => setRec({ etatTechnique: e.target.value })}>
                  {ETATS_TECHNIQUES.map((e) => <option key={e.value} value={e.value}>{etatLabel(e)}</option>)}
                </select>
              </FormField>
              <FormField label={t("machines.availability")}>
                <select value={form.rec.etatImmobilisation} onChange={(e) => setRec({ etatImmobilisation: e.target.value })} disabled={!!form.machine}>
                  {ETATS_IMMOBILISATION.map((e) => <option key={e.value} value={e.value}>{etatLabel(e)}</option>)}
                </select>
              </FormField>
              <FormField label={t("machines.location")} span>
                <input value={form.rec.localisation} onChange={(e) => setRec({ localisation: e.target.value })} placeholder={t("machines.location_placeholder")} />
              </FormField>
              <FormField label={t("machines.name", "Nom")}>
                <input value={form.rec.nom} onChange={(e) => setRec({ nom: e.target.value })} />
              </FormField>
              <FormField label={t("machines.description", "Description")}>
                <input value={form.rec.description} onChange={(e) => setRec({ description: e.target.value })} />
              </FormField>
            </FormGrid>
          </form>
        </Modal>
      )}

      {signalement && (
        <Modal
          className="kit-std-form"
          size="sm"
          title={`${t("machines.report", "Signaler un problème")} · ${signalement.machine.code || signalement.machine.reference}`}
          onClose={signalementBusy ? undefined : () => setSignalement(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setSignalement(null)} disabled={signalementBusy}>{t("common.cancel")}</Button>
              <Button type="submit" form="signalement-form" disabled={signalementBusy}>{signalementBusy ? t("common.saving") : t("machines.report_send", "Signaler")}</Button>
            </>
          )}
        >
          <form id="signalement-form" onSubmit={handleSignalement}>
            <FormGrid>
              <FormField label={t("reclamations.details_title", "Type")} required span>
                <select value={signalement.type} onChange={(e) => setSignal({ type: e.target.value })} required>
                  {TYPES_RECLAMATION_MACHINE.map((ty) => (
                    <option key={ty.value} value={ty.value}>{t(`reclamations.types.${ty.value}`, ty.label)}</option>
                  ))}
                </select>
              </FormField>
              <FormField label={t("reclamations.agent_code", "Agent déclarant (code-barres)")} required span hint={t("reclamations.agent_code_hint", "Badge ou matricule du personnel qui signale le défaut")}>
                <input value={signalement.matriculeAgent} onChange={(e) => setSignal({ matriculeAgent: e.target.value.toUpperCase() })} required />
              </FormField>
              <FormField label={t("reclamations.problem_description", "Description")} span hint={`${signalement.description.length} / ${DESCRIPTION_MAX}`}>
                <textarea rows={4} maxLength={DESCRIPTION_MAX} value={signalement.description} onChange={(e) => setSignal({ description: e.target.value })} />
              </FormField>
            </FormGrid>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t("machines.delete_confirm")}
          message={t("machines.delete_confirm_text")}
          details={<><strong>{deleteTarget.code || deleteTarget.reference}</strong> — {nomMachine(deleteTarget)}</>}
          confirmLabel={t("machines.delete_confirm_yes")}
          cancelLabel={t("machines.delete_confirm_no")}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {showImportCubix && (
        <ImportMachinesCubix onClose={() => setShowImportCubix(false)} onImporte={loadMachines} />
      )}

      {showStats && (
        <QuickStats
          title={`${t("machines.title")} · ${typeLabel(activeTab)}`}
          subtitle={`${list.sorted.length} machine(s)`}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t("kit.total", "Total"), value: currentStats.total },
            { label: t("machines.functional"), value: currentStats.fonctionnel, color: "#10b981" },
            { label: t("machines.available"), value: currentStats.disponible, color: "#3b82f6" },
          ]}
          repartitions={[
            {
              title: t("machines.technical_state"),
              items: ETATS_TECHNIQUES.map((e, i) => ({ label: etatLabel(e), value: list.sorted.filter((m) => m.etatTechnique === e.value).length, color: ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#eab308", "#64748b"][i] })),
            },
            {
              title: t("machines.availability"),
              items: ETATS_IMMOBILISATION.map((e, i) => ({ label: etatLabel(e), value: list.sorted.filter((m) => m.etatImmobilisation === e.value).length, color: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"][i] })),
            },
          ]}
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
