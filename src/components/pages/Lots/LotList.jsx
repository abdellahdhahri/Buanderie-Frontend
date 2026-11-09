import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import JsBarcode from "jsbarcode";
import { RefreshCw, Pencil, Trash2, Eye } from "lucide-react";
import BarcodeLabel from "../../BarcodeLabel";
import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";
import { CategoryPicker } from "../../ui/CategoryPicker";
import {
  Page, PageHeader, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterActions,
  ListSection, DataTable, Pagination, Badge,
  Modal, Button, FormField, ConfirmDialog,
  DetailsPage, DetailsButton, KpiTiles, DetailCard, DetailGrid, InfoList,
  ColumnSettingsModal, useListPage, useRowSelection, deleteMany, exportExcel,
  RowActions, RowButton, FormGrid, Code,
} from "../../kit";
import { IconAjouter, IconDetails, IconModifier, IconSupprimer } from "../../kit/ActionIcons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const TYPE_COLLECTE = [
  { value: "BLANC", label: "Blanc" },
  { value: "INFECTE", label: "Infecté" },
];

const ETAT_LOT = ["EN_RECEPTION", "EN_ATTENTE_COLLECTE", "EN_TRI", "PRET_LAVAGE", "PRET_SECHAGE", "TERMINE"];

const VARIANTS = {
  BLANC: "info", INFECTE: "danger", EN_RECEPTION: "warning", EN_ATTENTE_COLLECTE: "secondary",
  EN_TRI: "info", PRET_LAVAGE: "info", PRET_SECHAGE: "info", TERMINE: "success",
};

const COLUMNS_DEFAULT = [
  { key: "codeLot", label: "Code", visible: true, searchable: true },
  { key: "categorie", label: "Catégorie", visible: true, searchable: true },
  { key: "typeCollecte", label: "Type de collecte", visible: true, searchable: true },
  { key: "etat", label: "Statut", visible: true, searchable: true },
  { key: "dateCreation", label: "Date de création", visible: true, searchable: true },
  { key: "poidsActuel", label: "Capacité", visible: true, searchable: false },
  { key: "actions", label: "Actions", visible: true, searchable: false },
];

const codeLot = (l) => l.codeLot || `LOT-${l.id}`;

function Barcode({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, { format: "CODE128", height: 50, fontSize: 13, margin: 4 });
    } catch (err) {
      console.error("Code-barres invalide :", err);
    }
  }, [value]);
  return <svg ref={ref} />;
}
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : "—");

export default function LotList() {
  const { t } = useTranslation();
  const [lots, setLots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const fetchLots = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/lots`);
      if (response.ok) setLots(await response.json());
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLots(); }, []);

  const statutLabel = (s) => (s ? t(`lot_status.${s}`, s) : t("lot_status.Non défini", "Non défini"));
  const categorieLabel = (c) => (c ? t(`categories.${c}`, c) : "N/A");
  const StatutBadge = ({ value }) => <Badge variant={VARIANTS[value] || "secondary"}>{statutLabel(value)}</Badge>;

  const columns = useMemo(() => COLUMNS_DEFAULT.map((c) => ({
    ...c,
    label: {
      codeLot: t("lot.code"), categorie: t("lot.category"), typeCollecte: t("lot.type_collecte"), etat: t("lot.status"),
      dateCreation: t("lot.date_creation"), poidsActuel: t("lot.capacity"), actions: t("common.actions"),
    }[c.key] || c.label,
  })), [t]);

  const searchValue = (l, key) => {
    switch (key) {
      case "codeLot": return codeLot(l);
      case "categorie": return categorieLabel(l.categorie);
      case "typeCollecte":
      case "etat": return statutLabel(l[key]);
      case "dateCreation": return l.dateCreation ? fmtDate(l.dateCreation) : "";
      case "poidsActuel": return `${l.poidsActuel || 0} / ${l.capaciteMax || 0} kg`;
      case "actions": return "";
      default: return l[key] ?? "";
    }
  };
  const sortValue = (l, key) => {
    if (key === "poidsActuel") return Number(l.poidsActuel) || 0;
    if (key === "dateCreation") return l.dateCreation ? new Date(l.dateCreation).getTime() : 0;
    return String(searchValue(l, key)).toLowerCase();
  };

  const list = useListPage({
    rows: lots,
    columns,
    getSearchValue: searchValue,
    getSortValue: sortValue,
    filters: {
      typeCollecte: { initial: "all", column: "typeCollecte", test: (l, v) => v === "all" || l.typeCollecte === v },
      etat: { initial: "all", column: "etat", test: (l, v) => v === "all" || l.etat === v },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const openDetails = (l) => { if (l) { setSelected(l); setViewMode("details"); } };
  const openCreate = () => setForm({ lot: null, rec: { categorie: "", typeCollecte: "", capaciteMax: "" } });
  const openEdit = (l) => {
    if (!l) return;
    setForm({ lot: l, rec: { categorie: l.categorie || "", typeCollecte: l.typeCollecte || "", capaciteMax: l.capaciteMax || "" } });
  };
  const setRec = (patch) => setForm((f) => ({ ...f, rec: { ...f.rec, ...patch } }));

  const toast = (text) => Swal.fire({ title: "✅", text, icon: "success", timer: 1500, showConfirmButton: false });
  const erreur = () => Swal.fire({ title: "❌", text: t("lot.error_text"), icon: "error" });

  const handleSave = async (e) => {
    e.preventDefault();
    const { lot, rec } = form;
    if (!rec.categorie) {
      Swal.fire({ title: t("lot.categorie_required"), text: t("lot.categorie_required_text"), icon: "warning" });
      return;
    }
    if (!rec.typeCollecte) {
      Swal.fire({ title: t("lot.type_collecte_required"), text: t("lot.type_collecte_required_text"), icon: "warning" });
      return;
    }
    setIsSaving(true);
    try {
      const donnees = { typeCollecte: rec.typeCollecte, categorie: rec.categorie, capaciteMax: parseFloat(rec.capaciteMax) || 10 };
      const url = lot ? `${API_URL}/api/lots/${lot.id}` : `${API_URL}/api/lots?${new URLSearchParams(donnees).toString()}`;
      const response = await fetch(url, {
        method: lot ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        ...(lot ? { body: JSON.stringify(donnees) } : {}),
      });
      if (!response.ok) {
        const texte = await response.text();
        let message = texte;
        try { message = JSON.parse(texte).message || texte; } catch { message = texte; }
        throw new Error(message);
      }
      const data = await response.json();
      if (lot) {
        setLots((prev) => prev.map((r) => (r.id === data.id ? data : r)));
        toast(t("lot.update_success"));
        setSelected(null);
        setViewMode("list");
      } else {
        setLots((prev) => [data, ...prev]);
        toast(t("lot.create_success"));
      }
      setForm(null);
      fetchLots();
    } catch (err) {
      console.error("Erreur:", err);
      erreur();
    } finally {
      setIsSaving(false);
    }
  };

  const supprimer = async (id) => {
    const response = await fetch(`${API_URL}/api/lots/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await response.text());
    setLots((prev) => prev.filter((r) => r.id !== id));
  };

  const confirmDelete = async () => {
    const cible = deleteTarget;
    setDeleteTarget(null);
    try {
      await supprimer(cible.id);
      if (selected?.id === cible.id) { setSelected(null); setViewMode("list"); }
      toast(t("lot.delete_success"));
    } catch (err) {
      console.error("Erreur suppression:", err);
      erreur();
    }
  };

  const handleBulkDelete = async (lignes) => {
    if (!lignes.length || bulkDeleting) return;
    const ok = await Swal.fire({
      title: t("lot.delete_confirm"), text: `${lignes.length} lot(s)`, icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33", confirmButtonText: t("lot.delete_confirm_yes"), cancelButtonText: t("lot.delete_confirm_no"),
    });
    if (!ok.isConfirmed) return;
    setBulkDeleting(true);
    try {
      const { deleted, failed } = await deleteMany(lignes, (id) => supprimer(id));
      sel.keepOnly(failed);
      if (selected && deleted.includes(selected.id)) setSelected(null);
      if (failed.length) erreur();
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleExportExcel = (lignes) => {
    const source = Array.isArray(lignes) ? lignes : list.sorted;
    if (!source.length) return;
    exportExcel({
      fileName: "lots",
      sheetName: t("lot.title"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const TABLE_COLUMNS = {
    codeLot: { label: t("lot.code"), sortable: true, render: (l) => <Code>{codeLot(l)}</Code> },
    categorie: { label: t("lot.category"), sortable: true, render: (l) => <Badge variant="default">{categorieLabel(l.categorie)}</Badge> },
    typeCollecte: { label: t("lot.type_collecte"), sortable: true, align: "center", render: (l) => <StatutBadge value={l.typeCollecte} /> },
    etat: { label: t("lot.status"), sortable: true, align: "center", render: (l) => <StatutBadge value={l.etat} /> },
    dateCreation: { label: t("lot.date_creation"), sortable: true, render: (l) => fmtDate(l.dateCreation) },
    poidsActuel: {
      label: t("lot.capacity"), sortable: true,
      render: (l) => {
        const ratio = Number(l.capaciteMax) > 0 ? Math.min((Number(l.poidsActuel) || 0) / Number(l.capaciteMax), 1) : 0;
        return (
          <div style={{ minWidth: 110 }}>
            <strong>{l.poidsActuel || 0} kg</strong> <span className="kit-muted">/ {l.capaciteMax || 0} kg</span>
            <div className="kit-gauge"><span style={{ width: `${ratio * 100}%`, background: ratio >= 1 ? "#ef4444" : "var(--teal-500)" }} /></div>
          </div>
        );
      },
    },
    actions: {
      label: t("common.actions"), align: "center",
      render: (l) => (
        <RowActions>
          <RowButton icon={Eye} title={t("lot.details")} onClick={() => openDetails(l)} />
          <BarcodeLabel item={l} type="lot" variant="icon" />
          <RowButton icon={Pencil} title={t("common.edit")} onClick={() => openEdit(l)} />
          <RowButton icon={Trash2} tone="danger" title={t("common.delete")} onClick={() => setDeleteTarget(l)} />
        </RowActions>
      ),
    },
  };

  return (
    <Page>
      {viewMode === "list" && (
        <>
          <PageHeader
            icon={<PageHeaderIcon size={40} />}
            title={t("lot.title")}
            subtitle={t("lot.subtitle")}
            total={list.sorted.length}
            onIconClick={() => setShowColumnSettings(true)}
          />

          <ActionBar>
            <ActionButton icon={IconAjouter} label={t("lot.new")} variant="ajouter" onClick={openCreate} />
            <ActionButton icon={IconDetails} label={t("lot.details")} variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={IconModifier} label={t("common.edit")} variant="modifier" disabled={!selected} onClick={() => openEdit(selected)} />
            <ActionButton icon={IconSupprimer} label={t("common.delete")} variant="supprimer" disabled={!selected} onClick={() => setDeleteTarget(selected)} />
            <BarcodeLabel item={selected} type="lot" variant="action" />
            <ActionButton icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />} label={t("common.refresh")} variant="details" onClick={fetchLots} />
          </ActionBar>

          <FilterPanel>
            <FilterRow>
              <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
              <FilterText
                label={t("common.search")}
                placeholder={t("lot.search_placeholder")}
                value={draft.searchTerm}
                onChange={(v) => setFilter("searchTerm", v)}
                onEnter={list.apply}
              />
              {list.isColVisible("typeCollecte") && (
                <FilterSelect
                  label={t("lot.type_collecte")}
                  value={draft.typeCollecte}
                  onChange={(v) => setFilter("typeCollecte", v)}
                  allLabel={t("common.all")}
                  options={TYPE_COLLECTE.map((x) => ({ value: x.value, label: statutLabel(x.value) }))}
                />
              )}
              {list.isColVisible("etat") && (
                <FilterSelect
                  label={t("lot.status")}
                  value={draft.etat}
                  onChange={(v) => setFilter("etat", v)}
                  allLabel={t("common.all")}
                  options={ETAT_LOT.map((v) => ({ value: v, label: statutLabel(v) }))}
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
            unit="lot"
            units="lots"
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
              onRowClick={(l) => setSelected(selected?.id === l.id ? null : l)}
              onRowDoubleClick={openDetails}
              loading={isLoading && !lots.length}
              loadingText={t("common.loading")}
              emptyText={draft.searchTerm ? t("lot.no_match") : t("lot.no_data")}
            />
            <Pagination total={list.sorted.length} page={list.page} totalPages={list.totalPages} pageSize={list.pageSize} onPage={list.setPage} unit="lot(s)" />
          </ListSection>
        </>
      )}

      {viewMode === "details" && selected && (
        <DetailsPage
          onBack={() => setViewMode("list")}
          eyebrow={t("lot.title")}
          title={`${codeLot(selected)} · ${categorieLabel(selected.categorie)}`}
          badge={<StatutBadge value={selected.etat} />}
          actions={(
            <>
              <BarcodeLabel item={selected} type="lot" variant="action" />
              <DetailsButton icon={Pencil} onClick={() => openEdit(selected)}>{t("common.edit")}</DetailsButton>
              <DetailsButton icon={Trash2} variant="danger" onClick={() => setDeleteTarget(selected)}>{t("common.delete")}</DetailsButton>
            </>
          )}
        >
          <KpiTiles items={[
            { label: t("lot.capacity"), value: `${selected.capaciteMax || 0} kg`, tone: "blue" },
            { label: t("bacs.current_weight", "Poids actuel"), value: `${selected.poidsActuel || 0} kg`, tone: "green" },
            { label: t("lot.type_collecte"), value: statutLabel(selected.typeCollecte), tone: "amber" },
          ]} />
          <DetailGrid>
            <DetailCard title={t("modal.identification", "Identification")}>
              <InfoList items={[
                { label: t("lot.code"), value: codeLot(selected) },
                { label: t("lot.category"), value: categorieLabel(selected.categorie) },
                { label: t("lot.status"), value: statutLabel(selected.etat) },
                { label: t("lot.date_creation"), value: fmtDate(selected.dateCreation) },
              ]} />
            </DetailCard>
            <DetailCard title={t("bacs.print_code", "Code-barres")}>
              <div style={{ display: "flex", justifyContent: "center", background: "#fff", borderRadius: 10, padding: 8 }}>
                <Barcode value={codeLot(selected)} />
              </div>
            </DetailCard>
          </DetailGrid>
        </DetailsPage>
      )}

      {form && (
        <Modal
          className="kit-std-form"
          size="md"
          title={form.lot ? `${t("lot.edit")} #${form.lot.id}` : t("lot.new")}
          onClose={isSaving ? undefined : () => setForm(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setForm(null)} disabled={isSaving}>{t("common.cancel")}</Button>
              <Button type="submit" form="lot-form" disabled={isSaving}>{isSaving ? t("common.saving") : t("common.save")}</Button>
            </>
          )}
        >
          <form id="lot-form" onSubmit={handleSave}>
            <FormGrid>
              {form.lot && (
                <FormField label={t("lot.code")}>
                  <input value={codeLot(form.lot)} disabled />
                </FormField>
              )}
              <FormField label={t("lot.category")} required span>
                <CategoryPicker value={form.rec.categorie} onChange={(categorie) => setRec({ categorie })} />
              </FormField>
              <FormField label={t("lot.type_collecte")} required>
                <select value={form.rec.typeCollecte} onChange={(e) => setRec({ typeCollecte: e.target.value })} required>
                  <option value="">{t("lot.select_type")}</option>
                  {TYPE_COLLECTE.map((x) => <option key={x.value} value={x.value}>{statutLabel(x.value)}</option>)}
                </select>
              </FormField>
              <FormField label={`${t("lot.max_capacity")} (kg)`}>
                <input type="number" step="0.1" value={form.rec.capaciteMax} onChange={(e) => setRec({ capaciteMax: e.target.value })} placeholder="10" />
              </FormField>
              {form.lot && (
                <FormField label={t("lot.current_status")}>
                  <div><StatutBadge value={form.lot.etat} /></div>
                </FormField>
              )}
            </FormGrid>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t("lot.delete_confirm")}
          message={t("lot.delete_confirm_text")}
          details={<strong>{codeLot(deleteTarget)}</strong>}
          confirmLabel={t("lot.delete_confirm_yes")}
          cancelLabel={t("lot.delete_confirm_no")}
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
