import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "../../kit/dialogueApi";
import { RefreshCw } from "lucide-react";
import {
  Page, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterActions,
  ListSection, DataTable, Pagination, Badge,
  Modal, Button, FormField, FormGrid, ConfirmDialog,
  ColumnSettingsModal, useListPage, useRowSelection, exportExcel,
  Code,
} from "../../kit";
import { IconAjouter, IconModifier, IconSupprimer } from "../../kit/ActionIcons";
import {
  TYPES_PRODUIT, listerProduits, creerProduit, modifierProduit, supprimerProduit,
} from "../../../services/produitNettoyageService";

const VIDE = {
  designation: "", codeBarre: "", dosage: "", dilution: "", volumeTotal: "", concentrationActive: "",
  dureeUtilisationApresOuverture: "", temperatureStockage: "", typeProduit: "LIQUIDE", actif: true,
};

const COLUMNS_DEFAULT = [
  { key: "id", label: "ID", visible: false, searchable: false },
  { key: "designation", label: "Désignation", visible: true, searchable: true },
  { key: "codeBarre", label: "Code-barres", visible: true, searchable: true },
  { key: "typeProduit", label: "Type", visible: true, searchable: true },
  { key: "dosage", label: "Dosage", visible: true, searchable: true },
  { key: "dilution", label: "Dilution", visible: true, searchable: true },
  { key: "volumeTotal", label: "Volume total", visible: true, searchable: false },
  { key: "concentrationActive", label: "Concentration active", visible: false, searchable: false },
  { key: "dureeUtilisationApresOuverture", label: "Durée après ouverture", visible: true, searchable: false },
  { key: "temperatureStockage", label: "Stockage", visible: true, searchable: false },
  { key: "actif", label: "Statut", visible: true, searchable: false },
];

const num = (v) => (v === "" || v == null ? null : Number(v));
const texte = (v) => (v === "" || v == null ? null : String(v).trim());

export default function ProduitNettoyageList() {
  const { t } = useTranslation();
  const [produits, setProduits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tous, setTous] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const charger = async (inclureTous = tous) => {
    setIsLoading(true);
    try {
      setProduits(await listerProduits(inclureTous));
    } catch (err) {
      Swal.fire(t("common.error"), err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { charger(tous); }, [tous]);

  const columns = useMemo(() => COLUMNS_DEFAULT.map((c) => ({
    ...c,
    label: {
      designation: t("produits.designation", "Désignation"),
      codeBarre: t("produits.code_barre", "Code-barres"),
      typeProduit: t("produits.type", "Type"),
      dosage: t("produits.dosage", "Dosage"),
      dilution: t("produits.dilution", "Dilution"),
      volumeTotal: t("produits.volume_total", "Volume total"),
      concentrationActive: t("produits.concentration_active", "Concentration active"),
      dureeUtilisationApresOuverture: t("produits.duree_ouverture", "Durée après ouverture"),
      temperatureStockage: t("produits.temperature_stockage", "Stockage"),
      actif: t("produits.statut", "Statut"),
      actions: t("common.actions", "Actions"),
    }[c.key] || c.label,
  })), [t]);

  const searchValue = (p, key) => {
    if (key === "actions") return "";
    if (key === "actif") return p.actif === false ? "désactivé" : "actif";
    return p[key] ?? "";
  };
  const sortValue = (p, key) => {
    if (["id", "volumeTotal", "concentrationActive", "dureeUtilisationApresOuverture", "temperatureStockage"].includes(key)) return Number(p[key]) || 0;
    return String(searchValue(p, key)).toLowerCase();
  };

  const list = useListPage({
    rows: produits,
    columns,
    getSearchValue: searchValue,
    getSortValue: sortValue,
    filters: {
      typeProduit: { initial: "all", column: "typeProduit", test: (p, v) => v === "all" || p.typeProduit === v },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const openCreate = () => setForm({ produit: null, rec: { ...VIDE } });
  const openEdit = (p) => {
    if (!p) return;
    setForm({
      produit: p,
      rec: {
        designation: p.designation || "", codeBarre: p.codeBarre || "", dosage: p.dosage ?? "", dilution: p.dilution ?? "",
        volumeTotal: p.volumeTotal ?? "", concentrationActive: p.concentrationActive ?? "",
        dureeUtilisationApresOuverture: p.dureeUtilisationApresOuverture ?? "", temperatureStockage: p.temperatureStockage ?? "",
        typeProduit: p.typeProduit || "LIQUIDE", actif: p.actif !== false,
      },
    });
  };
  const setRec = (patch) => setForm((f) => ({ ...f, rec: { ...f.rec, ...patch } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { produit, rec } = form;
    if (!rec.designation.trim()) {
      Swal.fire(t("common.error"), t("produits.designation_required", "La désignation est obligatoire."), "error");
      return;
    }
    const payload = {
      designation: rec.designation.trim(),
      codeBarre: texte(rec.codeBarre),
      dosage: texte(rec.dosage),
      dilution: texte(rec.dilution),
      volumeTotal: num(rec.volumeTotal),
      concentrationActive: num(rec.concentrationActive),
      dureeUtilisationApresOuverture: num(rec.dureeUtilisationApresOuverture),
      temperatureStockage: num(rec.temperatureStockage),
      typeProduit: rec.typeProduit || null,
      actif: rec.actif,
    };
    setIsSaving(true);
    try {
      if (produit) await modifierProduit(produit.id, payload);
      else await creerProduit(payload);
      setForm(null);
      setSelected(null);
      await charger();
      Swal.fire(t("common.success"), produit ? t("produits.update_success", "Produit modifié.") : t("produits.create_success", "Produit créé."), "success");
    } catch (err) {
      Swal.fire(t("common.error"), err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    const cible = deleteTarget;
    setDeleteTarget(null);
    try {
      await supprimerProduit(cible.id);
      setSelected(null);
      await charger();
      Swal.fire(t("common.success"), t("produits.delete_success", "Produit supprimé."), "success");
    } catch (err) {
      Swal.fire(t("common.error"), err.message, "error");
    }
  };

  const handleExportExcel = (lignes) => {
    const source = Array.isArray(lignes) ? lignes : list.sorted;
    if (!source.length) return;
    exportExcel({
      fileName: "produits_nettoyage",
      sheetName: t("produits.title", "Produits de nettoyage"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const TABLE_COLUMNS = {
    id: { label: "ID", sortable: true, render: (p) => <Code>#{p.id}</Code> },
    designation: { label: t("produits.designation", "Désignation"), sortable: true, render: (p) => <strong>{p.designation}</strong> },
    codeBarre: { label: t("produits.code_barre", "Code-barres"), sortable: true, render: (p) => (p.codeBarre ? <Code>{p.codeBarre}</Code> : "—") },
    typeProduit: { label: t("produits.type", "Type"), sortable: true, align: "center", render: (p) => (p.typeProduit ? <Badge variant="info">{p.typeProduit}</Badge> : "—") },
    dosage: { label: t("produits.dosage", "Dosage"), sortable: true, render: (p) => p.dosage ?? "—" },
    dilution: { label: t("produits.dilution", "Dilution"), sortable: true, render: (p) => p.dilution ?? "—" },
    volumeTotal: { label: t("produits.volume_total", "Volume total"), sortable: true, align: "right", render: (p) => p.volumeTotal ?? "—" },
    concentrationActive: { label: t("produits.concentration_active", "Concentration active"), sortable: true, align: "right", render: (p) => p.concentrationActive ?? "—" },
    dureeUtilisationApresOuverture: {
      label: t("produits.duree_ouverture", "Durée après ouverture"), sortable: true, align: "center",
      render: (p) => (p.dureeUtilisationApresOuverture != null ? `${p.dureeUtilisationApresOuverture} ${t("produits.jours", "j")}` : "—"),
    },
    temperatureStockage: { label: t("produits.temperature_stockage", "Stockage"), sortable: true, align: "center", render: (p) => (p.temperatureStockage != null ? `${p.temperatureStockage}°C` : "—") },
    actif: {
      label: t("produits.statut", "Statut"), sortable: true, align: "center",
      render: (p) => <Badge variant={p.actif === false ? "secondary" : "success"}>{p.actif === false ? t("produits.inactive", "Désactivé") : t("produits.active", "Actif")}</Badge>,
    },
  };

  return (
    <Page>
      <ActionBar>
        <ActionButton icon={IconAjouter} label={t("produits.new", "Nouveau produit")} variant="ajouter" onClick={openCreate} />
        <ActionButton icon={IconModifier} label={t("common.edit", "Modifier")} variant="modifier" disabled={!selected} onClick={() => openEdit(selected)} />
        <ActionButton icon={IconSupprimer} label={t("common.delete", "Supprimer")} variant="supprimer" disabled={!selected} onClick={() => setDeleteTarget(selected)} />
        <ActionButton icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />} label={t("common.refresh", "Actualiser")} variant="details" onClick={() => charger()} />
      </ActionBar>

      <FilterPanel>
        <FilterRow>
          <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
          <FilterText
            label={t("common.search", "Recherche")}
            placeholder={t("produits.search_placeholder", "Désignation, code-barres…")}
            value={draft.searchTerm}
            onChange={(v) => setFilter("searchTerm", v)}
            onEnter={list.apply}
          />
          <FilterSelect
            label={t("produits.type", "Type")}
            value={draft.typeProduit}
            onChange={(v) => setFilter("typeProduit", v)}
            allLabel={t("common.all", "Tous")}
            options={TYPES_PRODUIT.map((x) => ({ value: x, label: x }))}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "end", height: 38, cursor: "pointer" }}>
            <input type="checkbox" style={{ width: "auto" }} checked={tous} onChange={(e) => setTous(e.target.checked)} />
            {t("produits.show_inactive", "Afficher les désactivés")}
          </label>
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
        unit="produit"
        units="produits"
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
          onRowClick={(p) => setSelected(selected?.id === p.id ? null : p)}
          onRowDoubleClick={openEdit}
          loading={isLoading && !produits.length}
          loadingText={t("common.loading", "Chargement…")}
          emptyText={t("common.no_data", "Aucune donnée")}
        />
        <Pagination total={list.sorted.length} page={list.page} totalPages={list.totalPages} pageSize={list.pageSize} onPage={list.setPage} unit="produit(s)" />
      </ListSection>

      {form && (
        <Modal
          className="kit-std-form"
          size="md"
          title={form.produit ? t("produits.edit", "Modifier le produit") : t("produits.new", "Nouveau produit")}
          onClose={isSaving ? undefined : () => setForm(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setForm(null)} disabled={isSaving}>{t("common.cancel", "Annuler")}</Button>
              <Button type="submit" form="produit-form" disabled={isSaving}>{isSaving ? t("common.saving", "Enregistrement…") : t("common.save", "Enregistrer")}</Button>
            </>
          )}
        >
          <form id="produit-form" onSubmit={handleSubmit}>
            <FormGrid>
              <FormField label={t("produits.designation", "Désignation")} required span>
                <input value={form.rec.designation} onChange={(e) => setRec({ designation: e.target.value })} required />
              </FormField>
              <FormField label={t("produits.code_barre", "Code-barres")}>
                <input value={form.rec.codeBarre} onChange={(e) => setRec({ codeBarre: e.target.value })} />
              </FormField>
              <FormField label={t("produits.type", "Type")}>
                <select value={form.rec.typeProduit} onChange={(e) => setRec({ typeProduit: e.target.value })}>
                  {TYPES_PRODUIT.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </FormField>
              <FormField label={t("produits.dosage", "Dosage")}>
                <input value={form.rec.dosage} onChange={(e) => setRec({ dosage: e.target.value })} />
              </FormField>
              <FormField label={t("produits.dilution", "Dilution")}>
                <input value={form.rec.dilution} onChange={(e) => setRec({ dilution: e.target.value })} />
              </FormField>
              <FormField label={t("produits.volume_total", "Volume total")}>
                <input type="number" min="0" step="any" value={form.rec.volumeTotal} onChange={(e) => setRec({ volumeTotal: e.target.value })} />
              </FormField>
              <FormField label={t("produits.concentration_active", "Concentration active")}>
                <input type="number" min="0" step="any" value={form.rec.concentrationActive} onChange={(e) => setRec({ concentrationActive: e.target.value })} />
              </FormField>
              <FormField label={t("produits.duree_ouverture_jours", "Durée d'utilisation après ouverture (jours)")}>
                <input type="number" min="0" value={form.rec.dureeUtilisationApresOuverture} onChange={(e) => setRec({ dureeUtilisationApresOuverture: e.target.value })} />
              </FormField>
              <FormField label={t("produits.temperature_stockage_c", "Température de stockage (°C)")}>
                <input type="number" step="any" value={form.rec.temperatureStockage} onChange={(e) => setRec({ temperatureStockage: e.target.value })} />
              </FormField>
              <FormField label={t("produits.statut", "Statut")} span>
                <label style={{ display: "flex", alignItems: "center", gap: 8, height: 38, cursor: "pointer" }}>
                  <input type="checkbox" style={{ width: "auto" }} checked={form.rec.actif} onChange={(e) => setRec({ actif: e.target.checked })} />
                  {t("produits.active", "Actif")}
                </label>
              </FormField>
            </FormGrid>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t("produits.delete_confirm", "Supprimer ce produit ?")}
          message={t("produits.delete_confirm_text", "Le produit sera supprimé ou désactivé.")}
          details={<strong>{deleteTarget.designation}</strong>}
          confirmLabel={t("common.delete", "Supprimer")}
          cancelLabel={t("common.cancel", "Annuler")}
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
