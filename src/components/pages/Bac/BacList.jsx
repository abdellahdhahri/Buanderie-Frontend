import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "../../kit/dialogueApi";
import { RefreshCw, Pencil, Trash2, History, Boxes, Layers, Download } from "lucide-react";
import BarcodeLabel from "../../BarcodeLabel";
import ImportCubixModal from "../../ui/ImportCubixModal";
import { useIntegration } from "../../../hooks/useIntegration";
import { bacImportService } from "../../../services/bacImportService";
import { useBac } from "../../../contextes/BacContext";
import {
  Page, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterActions,
  ListSection, DataTable, Pagination, Badge,
  Modal, Button, FormField, TextArea, ConfirmDialog,
  DetailsPage, DetailsButton, KpiTiles, DetailCard, InfoList,
  ColumnSettingsModal, useListPage, useRowSelection, deleteMany, exportExcel,
  FormGrid, Code, Tabs,
} from "../../kit";
import { CATEGORIES_LINGE } from "../../../constants/categoriesLinge";
import GroupeLavageBadge from "../../utils/shared/GroupeLavageBadge";
import { USAGES_BAC, ETATS_BAC_TRI, TONS_ETAT_BAC, listerBacsTri, libelleEtatBac, libelleUsageBac, estBacDechargement, libelleSourceBac } from "../../../services/bacTriService";
import { listeQuantites } from "../../../services/lavageInfecteService";
import { IconAjouter, IconDetails, IconModifier, IconSupprimer } from "../../kit/ActionIcons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const VIDE = {
  code: "", reference: "", etat: "EN_RECEPTION", poids: "", capacite_max: "",
  nombreLinges: 0, typeCollecte: "BLANC", typebac: "BLANC", observation: "",
  usage: "COLLECTE", categorie: "", poidsBalance: null,
};

const VIDE_TRI = { ...VIDE, usage: "TRI", etat: "VIDE" };

const STATUTS_BAC = {
  BLANC: "info", INFECTE: "danger", MIXTE: "warning", EN_RECEPTION: "warning",
  EN_ATTENTE_COLLECTE: "secondary", COLLECTE_EN_COURS: "info", COLLECTE_TERMINEE: "success",
  ...TONS_ETAT_BAC,
};

const ETATS_LINGE = {
  COLLECTE: "warning", EN_LAVAGE: "info", PROPRE_PRET: "success", RECEPTIONNE: "success", DISTRIBUE: "success",
  EN_SECHAGE_REPASSAGE: "info", STOCKE: "secondary", PRET_LIVRAISON: "success", EN_TRI: "info",
  LAVE: "success", SECHE: "success", SALE: "danger",
};

const COLUMNS_DEFAULT = [
  { key: "reference", label: "Référence", visible: true, searchable: true },
  { key: "code", label: "Code", visible: false, searchable: true },
  { key: "usage", label: "Usage", visible: true, searchable: true },
  { key: "etat", label: "État", visible: true, searchable: true },
  { key: "dateCreation", label: "Date de création", visible: true, searchable: true },
  { key: "poids", label: "Poids / Capacité", visible: true, searchable: false },
  { key: "typeCollecte", label: "Type", visible: true, searchable: true },
  { key: "linges", label: "Linges", visible: true, searchable: false },
];

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : "—");

export default function BacList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bacs, loading: isBacsLoading, fetchBacs, addBac, updateBac, deleteBac } = useBac();
  const { modeCubix } = useIntegration();
  const [showImportCubix, setShowImportCubix] = useState(false);
  const { pathname } = useLocation();
  const onglet = /\/bacs-tri$/i.test(pathname) ? "tri" : "tous";
  const changerOnglet = (v) => {
    setSelected(null);
    navigate(v === "tri" ? "/bacs-tri" : "/bac", { replace: true });
  };
  const [filtreTri, setFiltreTri] = useState({ etat: "all", categorie: "all", recherche: "" });
  const [resultatTri, setResultatTri] = useState({ cle: null, liste: [] });
  const [versionTri, setVersionTri] = useState(0);
  const cleTri = `${filtreTri.etat}|${filtreTri.categorie}|${versionTri}`;
  const bacsTri = resultatTri.liste;
  const chargementTri = onglet === "tri" && resultatTri.cle !== cleTri;
  const chargerBacsTri = useCallback(() => setVersionTri((v) => v + 1), []);

  useEffect(() => {
    if (onglet !== "tri") return undefined;
    let actif = true;
    listerBacsTri({ etat: filtreTri.etat, categorie: filtreTri.categorie })
      .then((liste) => { if (actif) setResultatTri({ cle: cleTri, liste }); })
      .catch((err) => {
        if (!actif) return;
        setResultatTri({ cle: cleTri, liste: [] });
        Swal.fire({ title: "❌", text: err.message, icon: "error" });
      });
    return () => { actif = false; };
  }, [onglet, cleTri, filtreTri.etat, filtreTri.categorie]);

  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [bacLinges, setBacLinges] = useState([]);
  const [isLingesLoading, setIsLingesLoading] = useState(false);
  const [selectedLinge, setSelectedLinge] = useState(null);
  const [lingeDetail, setLingeDetail] = useState(null);
  const [bacLingesCount, setBacLingesCount] = useState({});
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  useEffect(() => {
    if (!bacs?.length) return;
    let actif = true;
    (async () => {
      const counts = {};
      for (const bac of bacs) {
        try {
          const response = await fetch(`${API_URL}/api/bacs/bacs/${bac.id}/linges`);
          const data = response.ok ? await response.json() : [];
          counts[bac.id] = (Array.isArray(data) ? data : data.content || []).length;
        } catch {
          counts[bac.id] = 0;
        }
      }
      if (actif) setBacLingesCount(counts);
    })();
    return () => { actif = false; };
  }, [bacs]);

  const statutLabel = (s) => (s ? t(`bac_status.${s}`, s) : t("bacs.status_undefined", "Non défini"));
  const StatutBadge = ({ value }) => <Badge variant={STATUTS_BAC[value] || "secondary"}>{statutLabel(value)}</Badge>;
  const EtatLingeBadge = ({ value }) => (
    <Badge variant={ETATS_LINGE[value] || "secondary"}>{value ? t(`linge_status.${value}`, value) : t("linge_status.Non défini", "Non défini")}</Badge>
  );

  const fetchBacLinges = async (bac) => {
    setIsLingesLoading(true);
    setBacLinges([]);
    try {
      let items = [];
      const response = await fetch(`${API_URL}/api/bacs/bacs/${bac.id}/linges`);
      if (response.ok) {
        const data = await response.json();
        items = Array.isArray(data) ? data : data.content || [];
      }
      setBacLinges(items);
      setBacLingesCount((prev) => ({ ...prev, [bac.id]: items.length }));
    } catch (err) {
      console.error("Erreur chargement linges/items:", err);
      setBacLingesCount((prev) => ({ ...prev, [bac.id]: 0 }));
    } finally {
      setIsLingesLoading(false);
    }
  };

  const openDetails = (bac) => {
    if (!bac) return;
    setSelected(bac);
    setSelectedLinge(null);
    setViewMode("details");
    fetchBacLinges(bac);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchBacs();
    setIsLoading(false);
  };

  const columns = useMemo(() => COLUMNS_DEFAULT.map((c) => ({
    ...c,
    label: {
      reference: t("bacs.reference"), code: t("bacs.code"), dateCreation: t("bacs.date_creation"),
      usage: t("bacs.usage", "Usage"), etat: t("bacs.status"),
      poids: `${t("bacs.weight")} / ${t("bacs.capacity")}`, typeCollecte: t("bacs.type"),
      linges: t("bacs.linges_count"), actions: t("common.actions"),
    }[c.key] || c.label,
  })), [t]);

  const searchValue = (b, key) => {
    switch (key) {
      case "dateCreation": return b.dateCreation ? fmtDate(b.dateCreation) : "";
      case "poids": return `${Number(b.poids) || 0} / ${Number(b.capacite_max) || 0} kg`;
      case "typeCollecte": return statutLabel(b.typeCollecte);
      case "usage": return libelleUsageBac(t, b.usage);
      case "etat": return statutLabel(b.etat);
      case "linges": return bacLingesCount[b.id] ?? "";
      case "actions": return "";
      default: return b[key] ?? "";
    }
  };
  const sortValue = (b, key) => {
    if (key === "poids") return Number(b.poids) || 0;
    if (key === "linges") return bacLingesCount[b.id] ?? -1;
    if (key === "dateCreation") return b.dateCreation ? new Date(b.dateCreation).getTime() : 0;
    return String(searchValue(b, key)).toLowerCase();
  };

  const list = useListPage({
    rows: bacs || [],
    columns,
    getSearchValue: searchValue,
    getSortValue: sortValue,
    filters: {
      typeCollecte: { initial: "all", column: "typeCollecte", test: (b, v) => v === "all" || b.typeCollecte === v },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const openCreate = () => setForm({ bac: null, rec: { ...(onglet === "tri" ? VIDE_TRI : VIDE) } });
  const openEdit = (bac) => {
    if (!bac) return;
    setForm({
      bac,
      rec: {
        code: bac.code || "", reference: bac.reference || "", etat: bac.etat || "EN_RECEPTION",
        poids: bac.poids || "", capacite_max: bac.capacite_max || "", nombreLinges: bac.nombreLinges || 0,
        typebac: bac.typebac || "BLANC", typeCollecte: bac.typeCollecte || "BLANC", observation: bac.observations || "",
        usage: bac.usage || "COLLECTE", categorie: bac.categorie || "", poidsBalance: bac.poidsBalance ?? null,
        designation: bac.designation || "",
      },
    });
  };
  const setRec = (patch) => setForm((f) => ({ ...f, rec: { ...f.rec, ...patch } }));
  const changerUsage = (usage) => setForm((f) => ({
    ...f,
    rec: usage === "TRI"
      ? { ...f.rec, usage, typeCollecte: "BLANC", typebac: "BLANC", etat: f.bac?.usage === "TRI" ? f.rec.etat : "VIDE" }
      : { ...f.rec, usage, categorie: "", etat: f.rec.etat === "VIDE" || ETATS_BAC_TRI[f.rec.etat] ? "EN_RECEPTION" : f.rec.etat },
  }));

  const toast = (text) => Swal.fire({ title: "✅", text, icon: "success", timer: 1500, showConfirmButton: false });
  const erreur = (err) => Swal.fire({ title: "❌", text: err?.message || t("bacs.error_text"), icon: "error" });

  const handleSave = async (e) => {
    e.preventDefault();
    const { bac, rec } = form;
    if (!rec.reference?.trim()) {
      Swal.fire({ title: t("bacs.reference_required"), text: t("bacs.reference_required_text"), icon: "warning" });
      return;
    }
    if (rec.reference.trim().length > 20) {
      Swal.fire({ title: t("bacs.reference_too_long", "Référence trop longue"), text: t("bacs.reference_too_long_text", "La référence ne doit pas dépasser 20 caractères."), icon: "warning" });
      return;
    }
    const externe = bac?.sourceDonnee === "EXTERNE";
    const changements = bac ? (() => {
      const diff = {};
      const code = rec.code.trim();
      if (!externe && code && code !== (bac.code || "")) diff.code = code;
      if (!externe && (rec.designation || "").trim() !== (bac.designation || "")) diff.designation = (rec.designation || "").trim();
      if (rec.typebac && rec.typebac !== bac.typebac) diff.typebac = rec.typebac;
      if (rec.usage && rec.usage !== bac.usage) diff.usage = rec.usage;
      if (rec.typeCollecte && rec.typeCollecte !== bac.typeCollecte) diff.typeCollecte = rec.typeCollecte;
      const capacite = rec.capacite_max === "" ? null : parseFloat(rec.capacite_max);
      if (capacite != null && !Number.isNaN(capacite) && capacite !== bac.capacite_max) diff.capacite_max = capacite;
      if ((rec.observation || "") !== (bac.observations || "")) diff.observations = rec.observation || "";
      return diff;
    })() : null;
    if (bac && Object.keys(changements).length === 0) {
      setForm(null);
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        reference: rec.reference.trim(),
        usage: rec.usage || "COLLECTE",
        etat: rec.etat || (rec.usage === "TRI" ? "VIDE" : "EN_RECEPTION"),
        poids: parseFloat(rec.poids) || 0,
        capacite_max: parseFloat(rec.capacite_max) || 10,
        nombreLinges: parseInt(rec.nombreLinges) || 0,
        typebac: rec.typebac || "BLANC",
        typeCollecte: rec.typeCollecte || "BLANC",
        observations: rec.observation || "initialisation dans le systeme",
      };
      const result = bac ? await updateBac(bac.id, changements) : await addBac(payload);
      if (!result.success) throw new Error(result.error);
      toast(bac ? t("bacs.update_success") : t("bacs.create_success"));
      setForm(null);
      if (bac) { setSelected(null); setViewMode("list"); }
      await fetchBacs();
      if (onglet === "tri") chargerBacsTri();
    } catch (err) {
      erreur(err);
    } finally {
      setIsSaving(false);
    }
  };

  const supprimer = async (id) => {
    const res = await deleteBac(id);
    if (!res.success) throw new Error(res.error);
    setBacLingesCount((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const confirmDelete = async () => {
    const cible = deleteTarget;
    setDeleteTarget(null);
    try {
      await supprimer(cible.id);
      if (selected?.id === cible.id) { setSelected(null); setViewMode("list"); }
      toast(t("bacs.delete_success"));
    } catch (err) {
      erreur(err);
    }
  };

  const handleBulkDelete = async (lignes) => {
    if (!lignes.length || bulkDeleting) return;
    const ok = await Swal.fire({
      title: t("bacs.delete_confirm"), text: `${lignes.length} bac(s)`, icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33", confirmButtonText: t("bacs.delete_confirm_yes"), cancelButtonText: t("bacs.delete_confirm_no"),
    });
    if (!ok.isConfirmed) return;
    setBulkDeleting(true);
    try {
      const { deleted, failed } = await deleteMany(lignes, (id) => supprimer(id));
      sel.keepOnly(failed);
      if (selected && deleted.includes(selected.id)) setSelected(null);
      if (failed.length) erreur({ message: `${deleted.length} / ${lignes.length}` });
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleExportExcel = (lignes) => {
    const source = Array.isArray(lignes) ? lignes : list.sorted;
    if (!source.length) return;
    exportExcel({
      fileName: "bacs",
      sheetName: t("bacs.title"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const voirTracking = (linge) => { if (linge) navigate(`/tracking?code=${linge.codeBarre}`); };

  const Jauge = ({ bac }) => {
    const poids = Number(bac.poids) || 0;
    const capacite = Number(bac.capacite_max) || 0;
    const ratio = capacite > 0 ? Math.min(poids / capacite, 1) : 0;
    const couleur = ratio >= 1 ? "#ef4444" : ratio >= 0.8 ? "#f59e0b" : "var(--teal-500)";
    return (
      <div style={{ minWidth: 120 }}>
        <span style={{ fontWeight: 700 }}>{poids}</span> / {capacite} kg
        <div className="kit-gauge"><span style={{ width: `${ratio * 100}%`, background: couleur }} /></div>
      </div>
    );
  };

  const TABLE_COLUMNS = {
    reference: { label: t("bacs.reference"), sortable: true, render: (b) => (
      <>
        <strong>{b.reference || "—"}</strong>
        {b.sourceDonnee === "EXTERNE" && <span className="kit-tag">CUBIX</span>}
        {b.designation && <div className="kit-muted">{b.designation}</div>}
        {b.code && <div><Code>{b.code}</Code></div>}
      </>
    ) },
    code: { label: t("bacs.code"), sortable: true, render: (b) => <Code>{b.code}</Code> },
    usage: { label: t("bacs.usage", "Usage"), sortable: true, align: "center", render: (b) => <Badge variant={b.usage === "TRI" ? "info" : "secondary"}>{libelleUsageBac(t, b.usage)}</Badge> },
    etat: { label: t("bacs.status"), sortable: true, align: "center", render: (b) => <StatutBadge value={b.etat} /> },
    dateCreation: { label: t("bacs.date_creation"), sortable: true, render: (b) => fmtDate(b.dateCreation) },
    poids: { label: `${t("bacs.weight")} / ${t("bacs.capacity")}`, sortable: true, render: (b) => <Jauge bac={b} /> },
    typeCollecte: { label: t("bacs.type"), sortable: true, align: "center", render: (b) => <StatutBadge value={b.typeCollecte} /> },
    linges: {
      label: t("bacs.linges_count"), sortable: true, align: "center",
      render: (b) => (bacLingesCount[b.id] !== undefined ? <Badge variant="info">{bacLingesCount[b.id]}</Badge> : <span className="kit-muted">…</span>),
    },
  };

  const terme = filtreTri.recherche.trim().toLowerCase();
  const bacsTriFiltres = !terme ? bacsTri : bacsTri.filter((b) =>
    [b.reference, b.code, b.categorie, t(`categories.${b.categorie}`, b.categorie || "")]
      .some((v) => String(v || "").toLowerCase().includes(terme)));

  const kg = (v) => (v != null && v !== "" ? `${Number(v).toFixed(2)} kg` : "—");

  const TRI_COLUMNS = {
    reference: TABLE_COLUMNS.reference,
    categorie: { label: t("bacs.category", "Catégorie"), render: (b) => (b.categorie ? <Badge variant="info">{t(`categories.${b.categorie}`, b.categorie)}</Badge> : "—") },
    groupeLavage: { label: t("groupe_lavage.label", "Groupe"), align: "center", render: (b) => <GroupeLavageBadge groupe={b.groupeLavage} /> },
    etat: { label: t("bacs.status"), align: "center", render: (b) => <StatutBadge value={b.etat} /> },
    nombreLinges: { label: t("bacs.linges_count"), align: "center", render: (b) => <strong>{b.nombreLinges ?? 0}</strong> },
    poids: { label: t("bacs.declared_weight", "Poids déclaré"), align: "right", render: (b) => kg(b.poids) },
    poidsBalance: { label: t("bacs.scale_weight", "Poids balance"), align: "right", render: (b) => kg(b.poidsBalance) },
  };

  const LINGE_COLUMNS = {
    codeBarre: { label: t("bacs.code"), render: (l) => <Code>{l.codeBarre || l.codeSuivi || "N/A"}</Code> },
    categorie: { label: t("bacs.type"), render: (l) => l.categorie || "Non catégorisé" },
    etat: { label: t("bacs.status"), render: (l) => <EtatLingeBadge value={l.etat} /> },
    poids: { label: t("bacs.weight"), align: "right", render: (l) => `${l.poids || 0} kg` },
    rfidTag: { label: "RFID", render: (l) => (l.rfidTag ? <Code>{l.rfidTag}</Code> : "—") },
    observations: { label: t("bacs.observations"), render: (l) => l.observations || "—" },
  };

  return (
    <Page>
      {showImportCubix && (
        <ImportCubixModal
          title={t("bacs.import_cubix", "Importer depuis CUBIX")}
          fetchPage={bacImportService.getAImporter}
          importer={bacImportService.importer}
          onClose={() => setShowImportCubix(false)}
          onImporte={handleRefresh}
        />
      )}
      {viewMode === "list" && (
        <Tabs
          value={onglet}
          onChange={changerOnglet}
          items={[
            { value: "tous", label: t("bacs.tab_all", "Tous les bacs"), icon: <Boxes size={15} />, count: bacs?.length ?? 0 },
            { value: "tri", label: t("bacs.tab_tri", "Bacs de tri"), icon: <Layers size={15} />, count: onglet === "tri" ? bacsTri.length : undefined },
          ]}
        />
      )}

      {viewMode === "list" && onglet === "tri" && (
        <>
          <ActionBar>
            <ActionButton icon={IconAjouter} label={t("bacs.new_tri", "Nouveau bac de tri")} variant="ajouter" onClick={openCreate} />
            <ActionButton icon={IconDetails} label={t("bacs.view_linges", "Voir les linges")} variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={IconModifier} label={t("common.edit")} variant="modifier" disabled={!selected} onClick={() => openEdit(selected)} />
            <BarcodeLabel item={selected} type="bac" variant="action" />
            <ActionButton
              icon={<RefreshCw size={18} className={chargementTri ? "animate-spin" : ""} />}
              label={t("common.refresh")}
              variant="details"
              onClick={chargerBacsTri}
            />
          </ActionBar>

          <FilterPanel>
            <FilterRow>
              <FilterText label={t("common.search")} value={filtreTri.recherche} onChange={(v) => setFiltreTri((f) => ({ ...f, recherche: v }))} />
              <FilterSelect
                label={t("bacs.status")}
                value={filtreTri.etat}
                onChange={(v) => setFiltreTri((f) => ({ ...f, etat: v }))}
                allLabel={t("common.all")}
                options={Object.keys(ETATS_BAC_TRI).map((v) => ({ value: v, label: libelleEtatBac(t, v) }))}
              />
              <FilterSelect
                label={t("bacs.category", "Catégorie")}
                value={filtreTri.categorie}
                onChange={(v) => setFiltreTri((f) => ({ ...f, categorie: v }))}
                allLabel={t("common.all")}
                options={CATEGORIES_LINGE.map((c) => ({ value: c, label: t(`categories.${c}`, c) }))}
              />
            </FilterRow>
          </FilterPanel>

          <ListSection>
            <DataTable
              columns={TRI_COLUMNS}
              rows={bacsTriFiltres}
              rowKey={(b) => b.id ?? b.code ?? b.reference}
              activeId={selected?.id}
              onRowClick={(b) => setSelected(selected?.id === b.id ? null : b)}
              onRowDoubleClick={openDetails}
              loading={chargementTri && !bacsTri.length}
              loadingText={t("common.loading")}
              emptyText={t("bacs.no_tri", "Aucun bac de tri. Créez-en un avec « Nouveau bac de tri ».")}
            />
          </ListSection>
        </>
      )}

      {viewMode === "list" && onglet === "tous" && (
        <>
          <ActionBar>
            <ActionButton icon={IconAjouter} label={t("bacs.new")} variant="ajouter" onClick={openCreate} />
            {modeCubix && <ActionButton icon={Download} label={t("bacs.import_cubix", "Importer depuis CUBIX")} variant="ajouter" onClick={() => setShowImportCubix(true)} />}
            <ActionButton icon={IconDetails} label={t("bacs.view_linges", "Voir les linges")} variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={IconModifier} label={t("common.edit")} variant="modifier" disabled={!selected} onClick={() => openEdit(selected)} />
            <ActionButton icon={IconSupprimer} label={t("common.delete")} variant="supprimer" disabled={!selected} onClick={() => setDeleteTarget(selected)} />
            <BarcodeLabel item={selected} type="bac" variant="action" />
            <ActionButton
              icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />}
              label={t("bacs.refresh", t("common.refresh"))}
              variant="details"
              onClick={handleRefresh}
            />
          </ActionBar>

          <FilterPanel>
            <FilterRow>
              <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
              <FilterText label={t("common.search")} value={draft.searchTerm} onChange={(v) => setFilter("searchTerm", v)} onEnter={list.apply} />
              {list.isColVisible("typeCollecte") && (
                <FilterSelect
                  label={t("bacs.type")}
                  value={draft.typeCollecte}
                  onChange={(v) => setFilter("typeCollecte", v)}
                  allLabel={t("common.all")}
                  options={["BLANC", "INFECTE", "MIXTE"].map((v) => ({ value: v, label: statutLabel(v) }))}
                />
              )}
              <FilterActions
                onSearch={list.apply}
                count={list.sorted.length}
                onExcel={() => handleExportExcel()}
                onReset={list.reset}
                onColumns={() => setShowColumnSettings(true)}
              />
            </FilterRow>
          </FilterPanel>

          <ListSection
            selection={sel}
            unit="bac"
            units="bacs"
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
              onRowClick={(b) => setSelected(selected?.id === b.id ? null : b)}
              onRowDoubleClick={openDetails}
              loading={isBacsLoading && !bacs?.length}
              loadingText={t("common.loading")}
              emptyText={draft.searchTerm ? t("bacs.no_match") : t("bacs.no_data")}
            />
            <Pagination total={list.sorted.length} page={list.page} totalPages={list.totalPages} pageSize={list.pageSize} onPage={list.setPage} unit="bac(s)" />
          </ListSection>
        </>
      )}

      {viewMode === "details" && selected && (
        <DetailsPage
          onBack={() => setViewMode("list")}
          eyebrow={t("bacs.title")}
          title={`${selected.reference || `#${selected.id}`}${selected.code ? ` · ${selected.code}` : ""}`}
          badge={<StatutBadge value={selected.typeCollecte} />}
          actions={(
            <>
              <BarcodeLabel item={selected} type="bac" variant="action" />
              <DetailsButton icon={Pencil} onClick={() => openEdit(selected)}>{t("common.edit")}</DetailsButton>
              <DetailsButton icon={Trash2} variant="danger" onClick={() => setDeleteTarget(selected)}>{t("common.delete")}</DetailsButton>
            </>
          )}
        >
          <KpiTiles items={[
            { label: t("bacs.linges_count"), value: isLingesLoading ? "…" : bacLinges.length, tone: "blue" },
            selected.usage === "TRI"
              ? { label: t("bacs.weights", "Poids déclaré / balance"), value: `${kg(selected.poids)} / ${kg(selected.poidsBalance)}`, tone: "green" }
              : { label: t("bacs.weight"), value: `${Number(selected.poids) || 0} / ${Number(selected.capacite_max) || 0} kg`, tone: "green" },
            { label: t("bacs.status"), value: statutLabel(selected.etat), tone: "amber" },
            { label: t("bacs.date_creation"), value: fmtDate(selected.dateCreation), tone: "violet" },
          ]} />

          {(selected.designation || selected.sourceDonnee === "EXTERNE") && (
            <DetailCard title={t("modal.identification", "Identification")}>
              <InfoList items={[
                selected.designation && { label: t("machines.designation", "Désignation"), value: selected.designation },
                selected.sourceDonnee === "EXTERNE" && { label: t("machines.source", "Source"), value: "CUBIX" },
                selected.idExterne && { label: t("machines.external_id", "ID externe"), value: selected.idExterne },
              ].filter(Boolean)} />
            </DetailCard>
          )}

          {estBacDechargement(selected) && (
            <DetailCard title={libelleSourceBac(t, selected)}>
              <InfoList items={[
                { label: t("bacs.declared_quantity", "Quantité déclarée"), value: selected.quantiteDeclaree ?? "—" },
                ...listeQuantites(selected).map((q) => ({ label: t(`categories.${q.categorie}`, q.categorie), value: q.quantite })),
              ]} />
            </DetailCard>
          )}

          <DetailCard title={t("bacs.view_linges", "Linges du bac")}>
            <ActionBar>
              <ActionButton icon={IconDetails} label={t("bacs.details_linge")} variant="details" disabled={!selectedLinge} onClick={() => setLingeDetail(selectedLinge)} />
              <ActionButton icon={History} label={t("bacs.history")} variant="imprimer" disabled={!selectedLinge} onClick={() => voirTracking(selectedLinge)} />
            </ActionBar>
            <DataTable
              columns={LINGE_COLUMNS}
              rows={bacLinges}
              rowKey={(l) => l.id}
              activeId={selectedLinge?.id}
              onRowClick={(l) => setSelectedLinge(selectedLinge?.id === l.id ? null : l)}
              onRowDoubleClick={(l) => setLingeDetail(l)}
              loading={isLingesLoading}
              loadingText={t("common.loading")}
              emptyText={t("bacs.no_linge")}
            />
          </DetailCard>

          {selected.observations && (
            <DetailCard title={t("bacs.observations")}>
              <p className="avd-text">{selected.observations}</p>
            </DetailCard>
          )}
        </DetailsPage>
      )}

      {lingeDetail && (
        <Modal
          size="md"
          title={t("bacs.details_linge")}
          subtitle={selected?.reference ? `${t("bacs.reference")} · ${selected.reference}` : undefined}
          onClose={() => setLingeDetail(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => voirTracking(lingeDetail)}>{t("bacs.history")}</Button>
              <Button onClick={() => setLingeDetail(null)}>{t("common.close")}</Button>
            </>
          )}
        >
          <div style={{ marginBottom: 12 }}><EtatLingeBadge value={lingeDetail.etat} /></div>
          <InfoList items={[
            { label: "ID", value: lingeDetail.id },
            { label: t("bacs.code"), value: lingeDetail.codeBarre },
            { label: "RFID", value: lingeDetail.rfidTag },
            { label: t("bacs.type"), value: lingeDetail.categorie },
            { label: t("bacs.weight"), value: `${lingeDetail.poids || 0} kg` },
            { label: t("bacs.reference"), value: selected?.reference },
            { label: t("bacs.date_creation"), value: lingeDetail.dateCreation ? new Date(lingeDetail.dateCreation).toLocaleString("fr-FR") : null },
          ]} />
        </Modal>
      )}

      {form && (
        <Modal
          className="kit-std-form"
          size="md"
          title={form.bac ? `${t("bacs.edit")} #${form.bac.id}` : t("bacs.new")}
          onClose={isSaving ? undefined : () => setForm(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setForm(null)} disabled={isSaving}>{t("common.cancel")}</Button>
              <Button type="submit" form="bac-form" disabled={isSaving}>{isSaving ? t("common.saving") : t("common.save")}</Button>
            </>
          )}
        >
          <form id="bac-form" onSubmit={handleSave}>
            <FormGrid>
              {form.bac && (
                <FormField
                  label={<>{t("bacs.code")} {form.bac.sourceDonnee === "EXTERNE" && <Badge variant="info">CUBIX</Badge>}</>}
                  hint={form.bac.sourceDonnee === "EXTERNE" ? t("bacs.cubix_readonly", "Géré par CUBIX : lecture seule.") : undefined}
                >
                  <input value={form.rec.code} onChange={(e) => setRec({ code: e.target.value })} disabled={form.bac.sourceDonnee === "EXTERNE"} />
                </FormField>
              )}
              {form.bac && (
                <FormField
                  label={<>{t("machines.designation", "Désignation")} {form.bac.sourceDonnee === "EXTERNE" && <Badge variant="info">CUBIX</Badge>}</>}
                >
                  <input value={form.rec.designation} onChange={(e) => setRec({ designation: e.target.value })} disabled={form.bac.sourceDonnee === "EXTERNE"} />
                </FormField>
              )}
              <FormField label={t("bacs.reference")} required={!form.bac} hint={form.bac ? undefined : t("bacs.reference_hint", "20 caractères maximum, unique.")}>
                <input value={form.rec.reference} onChange={(e) => setRec({ reference: e.target.value })} placeholder="ex: BAC-001" maxLength={20} required={!form.bac} disabled={!!form.bac} />
              </FormField>
              <FormField label={t("bacs.usage", "Usage")}>
                <select value={form.rec.usage} onChange={(e) => changerUsage(e.target.value)}>
                  {Object.keys(USAGES_BAC).map((v) => <option key={v} value={v}>{libelleUsageBac(t, v)}</option>)}
                </select>
              </FormField>
              {form.bac && (
                <FormField label={t("bacs.scale_weight", "Poids balance")} hint={t("bacs.scale_weight_hint", "Renseigné lors de la pesée.")}>
                  <input value={form.rec.poidsBalance != null ? `${Number(form.rec.poidsBalance).toFixed(2)} kg` : "—"} readOnly disabled />
                </FormField>
              )}
              <FormField label={t("bacs.current_weight")}>
                <input type="number" step="0.1" value={form.rec.poids} onChange={(e) => setRec({ poids: e.target.value })} placeholder="0" disabled={form.rec.usage === "TRI" || !!form.bac} />
              </FormField>
              <FormField label={t("bacs.max_capacity")}>
                <input type="number" step="0.1" value={form.rec.capacite_max} onChange={(e) => setRec({ capacite_max: e.target.value })} placeholder="10" />
              </FormField>
              {form.rec.usage === "TRI" || form.bac ? (
                <FormField label={t("bacs.status")}>
                  <input value={libelleEtatBac(t, form.rec.etat || "VIDE")} readOnly disabled />
                </FormField>
              ) : (
                <FormField label={t("bacs.status")}>
                  <select value={form.rec.etat} onChange={(e) => setRec({ etat: e.target.value })}>
                    {["EN_RECEPTION", "EN_ATTENTE_COLLECTE", "COLLECTE_EN_COURS", "COLLECTE_TERMINEE"].map((v) => <option key={v} value={v}>{statutLabel(v)}</option>)}
                  </select>
                </FormField>
              )}
              <FormField label={t("bacs.type_bac")}>
                <select value={form.rec.typebac} onChange={(e) => setRec({ typebac: e.target.value })}>
                  {["BLANC", "INFECTE"].map((v) => <option key={v} value={v}>{statutLabel(v)}</option>)}
                </select>
              </FormField>
              <FormField label={t("bacs.type_collecte")}>
                <select value={form.rec.typeCollecte} onChange={(e) => setRec({ typeCollecte: e.target.value })}>
                  {["BLANC", "INFECTE", "MIXTE"].map((v) => <option key={v} value={v}>{statutLabel(v)}</option>)}
                </select>
              </FormField>
              <FormField label={t("bacs.observations")} span>
                <TextArea value={form.rec.observation} onChange={(v) => setRec({ observation: v })} placeholder={t("bacs.observations")} />
              </FormField>
            </FormGrid>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t("bacs.delete_confirm")}
          message={t("bacs.delete_confirm_text")}
          details={<><strong>{deleteTarget.reference}</strong>{deleteTarget.code ? ` — ${deleteTarget.code}` : ""}</>}
          confirmLabel={t("bacs.delete_confirm_yes")}
          cancelLabel={t("bacs.delete_confirm_no")}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
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
