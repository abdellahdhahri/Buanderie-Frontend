import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { RefreshCw, Pencil, Trash2, Eye, History } from "lucide-react";
import BarcodeLabel from "../../BarcodeLabel";
import { useBac } from "../../../contextes/BacContext";
import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";
import {
  Page, PageHeader, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterActions,
  ListSection, DataTable, Pagination, Badge,
  Modal, Button, FormField, TextArea, ConfirmDialog,
  DetailsPage, DetailsButton, KpiTiles, DetailCard, InfoList,
  ColumnSettingsModal, useListPage, useRowSelection, deleteMany, exportExcel,
  RowActions, RowButton, FormGrid, Code,
} from "../../kit";
import { IconAjouter, IconDetails, IconModifier, IconSupprimer } from "../../kit/ActionIcons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const VIDE = {
  code: "", reference: "", etat: "EN_RECEPTION", poids: "", capacite_max: "",
  nombreLinges: 0, typeCollecte: "BLANC", typebac: "BLANC", observation: "",
};

const STATUTS_BAC = {
  BLANC: "info", INFECTE: "danger", MIXTE: "warning", EN_RECEPTION: "warning",
  EN_ATTENTE_COLLECTE: "secondary", COLLECTE_EN_COURS: "info", COLLECTE_TERMINEE: "success",
};

const ETATS_LINGE = {
  COLLECTE: "warning", EN_LAVAGE: "info", PROPRE_PRET: "success", RECEPTIONNE: "success", DISTRIBUE: "success",
  EN_SECHAGE_REPASSAGE: "info", STOCKE: "secondary", PRET_LIVRAISON: "success", EN_TRI: "info",
  LAVE: "success", SECHE: "success", SALE: "danger",
};

const COLUMNS_DEFAULT = [
  { key: "reference", label: "Référence", visible: true, searchable: true },
  { key: "code", label: "Code", visible: false, searchable: true },
  { key: "dateCreation", label: "Date de création", visible: true, searchable: true },
  { key: "poids", label: "Poids / Capacité", visible: true, searchable: false },
  { key: "typeCollecte", label: "Type", visible: true, searchable: true },
  { key: "linges", label: "Linges", visible: true, searchable: false },
  { key: "actions", label: "Actions", visible: true, searchable: false },
];

const estSacInfecte = (bac) => bac.numeroSac?.toUpperCase().startsWith("SAC")
  || bac.code?.toUpperCase().startsWith("SAC")
  || bac.typebac === "INFECTE";

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : "—");

export default function BacList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bacs, loading: isBacsLoading, fetchBacs, addBac, updateBac, deleteBac } = useBac();

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
      if (estSacInfecte(bac)) {
        const numeroSac = bac.numeroSac || bac.code;
        const response = await fetch(`${API_URL}/api/sacs-infectes/detail?numeroSac=${encodeURIComponent(numeroSac)}`);
        if (response.ok) {
          const data = await response.json();
          items = (data.items || []).map((item, index) => ({
            id: `sac-item-${data.id}-${index}`,
            codeBarre: `${data.numeroSac}-${item.categorie}`,
            categorie: item.categorie,
            quantiteDeclaree: item.quantiteDeclaree,
            quantiteComptee: item.quantiteComptee,
            ecart: item.ecart,
            isSacItem: true,
            etat: data.etat || "DECLARE",
            poids: null,
            rfidTag: null,
            sacNumero: data.numeroSac,
            agentCollecteNom: data.agentCollecteNom,
          }));
        }
      } else {
        const response = await fetch(`${API_URL}/api/bacs/bacs/${bac.id}/linges`);
        if (response.ok) {
          const data = await response.json();
          items = Array.isArray(data) ? data : data.content || [];
        }
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
      poids: `${t("bacs.weight")} / ${t("bacs.capacity")}`, typeCollecte: t("bacs.type"),
      linges: t("bacs.linges_count"), actions: t("common.actions"),
    }[c.key] || c.label,
  })), [t]);

  const searchValue = (b, key) => {
    switch (key) {
      case "dateCreation": return b.dateCreation ? fmtDate(b.dateCreation) : "";
      case "poids": return `${Number(b.poids) || 0} / ${Number(b.capacite_max) || 0} kg`;
      case "typeCollecte": return statutLabel(b.typeCollecte);
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

  const openCreate = () => setForm({ bac: null, rec: { ...VIDE } });
  const openEdit = (bac) => {
    if (!bac) return;
    setForm({
      bac,
      rec: {
        code: bac.code || "", reference: bac.reference || "", etat: bac.etat || "EN_RECEPTION",
        poids: bac.poids || "", capacite_max: bac.capacite_max || "", nombreLinges: bac.nombreLinges || 0,
        typebac: bac.typebac || "BLANC", typeCollecte: bac.typeCollecte || "BLANC", observation: bac.observations || "",
      },
    });
  };
  const setRec = (patch) => setForm((f) => ({ ...f, rec: { ...f.rec, ...patch } }));

  const toast = (text) => Swal.fire({ title: "✅", text, icon: "success", timer: 1500, showConfirmButton: false });
  const erreur = (err) => Swal.fire({ title: "❌", text: err?.message || t("bacs.error_text"), icon: "error" });

  const handleSave = async (e) => {
    e.preventDefault();
    const { bac, rec } = form;
    if (!rec.reference?.trim()) {
      Swal.fire({ title: t("bacs.reference_required"), text: t("bacs.reference_required_text"), icon: "warning" });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        reference: rec.reference.trim(),
        etat: rec.etat || "EN_RECEPTION",
        poids: parseFloat(rec.poids) || 0,
        capacite_max: parseFloat(rec.capacite_max) || 10,
        nombreLinges: parseInt(rec.nombreLinges) || 0,
        typebac: rec.typebac || "BLANC",
        typeCollecte: rec.typeCollecte || "BLANC",
        observations: rec.observation || "initialisation dans le systeme",
      };
      const result = bac ? await updateBac(bac.id, payload) : await addBac(payload);
      if (!result.success) throw new Error(result.error);
      toast(bac ? t("bacs.update_success") : t("bacs.create_success"));
      setForm(null);
      if (bac) { setSelected(null); setViewMode("list"); }
      await fetchBacs();
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
    reference: { label: t("bacs.reference"), sortable: true, render: (b) => <><strong>{b.reference || "—"}</strong>{b.code && <div><Code>{b.code}</Code></div>}</> },
    code: { label: t("bacs.code"), sortable: true, render: (b) => <Code>{b.code}</Code> },
    dateCreation: { label: t("bacs.date_creation"), sortable: true, render: (b) => fmtDate(b.dateCreation) },
    poids: { label: `${t("bacs.weight")} / ${t("bacs.capacity")}`, sortable: true, render: (b) => <Jauge bac={b} /> },
    typeCollecte: { label: t("bacs.type"), sortable: true, align: "center", render: (b) => <StatutBadge value={b.typeCollecte} /> },
    linges: {
      label: t("bacs.linges_count"), sortable: true, align: "center",
      render: (b) => (bacLingesCount[b.id] !== undefined ? <Badge variant="info">{bacLingesCount[b.id]}</Badge> : <span className="kit-muted">…</span>),
    },
    actions: {
      label: t("common.actions"), align: "center",
      render: (b) => (
        <RowActions>
          <RowButton icon={Eye} title={t("bacs.view_linges", "Voir les linges")} onClick={() => openDetails(b)} />
          <BarcodeLabel item={b} type="bac" variant="icon" />
          <RowButton icon={Pencil} title={t("common.edit")} onClick={() => openEdit(b)} />
          <RowButton icon={Trash2} tone="danger" title={t("common.delete")} onClick={() => setDeleteTarget(b)} />
        </RowActions>
      ),
    },
  };

  const LINGE_COLUMNS = {
    codeBarre: { label: t("bacs.code"), render: (l) => <Code>{l.codeBarre || l.codeSuivi || "N/A"}</Code> },
    categorie: { label: t("bacs.type"), render: (l) => l.categorie || "Non catégorisé" },
    etat: { label: t("bacs.status"), render: (l) => <EtatLingeBadge value={l.etat} /> },
    poids: { label: t("bacs.weight"), align: "right", render: (l) => (l.isSacItem ? `${l.quantiteComptee ?? 0} / ${l.quantiteDeclaree ?? 0}` : `${l.poids || 0} kg`) },
    rfidTag: { label: "RFID", render: (l) => (l.rfidTag ? <Code>{l.rfidTag}</Code> : "—") },
    observations: { label: t("bacs.observations"), render: (l) => l.observations || "—" },
  };

  return (
    <Page>
      {viewMode === "list" && (
        <>
          <PageHeader
            icon={<PageHeaderIcon size={40} />}
            title={t("bacs.title")}
            subtitle={t("bacs.subtitle")}
            total={list.sorted.length}
            onIconClick={() => setShowColumnSettings(true)}
          />

          <ActionBar>
            <ActionButton icon={IconAjouter} label={t("bacs.new")} variant="ajouter" onClick={openCreate} />
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
            { label: t("bacs.weight"), value: `${Number(selected.poids) || 0} / ${Number(selected.capacite_max) || 0} kg`, tone: "green" },
            { label: t("bacs.status"), value: statutLabel(selected.etat), tone: "amber" },
            { label: t("bacs.date_creation"), value: fmtDate(selected.dateCreation), tone: "violet" },
          ]} />

          <DetailCard title={t("bacs.view_linges", "Linges du bac")}>
            <ActionBar>
              <ActionButton icon={IconDetails} label={t("bacs.details_linge")} variant="details" disabled={!selectedLinge} onClick={() => setLingeDetail(selectedLinge)} />
              <ActionButton icon={History} label={t("bacs.history")} variant="imprimer" disabled={!selectedLinge || selectedLinge.isSacItem} onClick={() => voirTracking(selectedLinge)} />
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
              {!lingeDetail.isSacItem && <Button variant="secondary" onClick={() => voirTracking(lingeDetail)}>{t("bacs.history")}</Button>}
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
                <FormField label={t("bacs.code")}>
                  <input value={form.rec.code} disabled />
                </FormField>
              )}
              <FormField label={t("bacs.reference")} required>
                <input value={form.rec.reference} onChange={(e) => setRec({ reference: e.target.value })} placeholder="ex: BAC-001" required />
              </FormField>
              <FormField label={t("bacs.current_weight")}>
                <input type="number" step="0.1" value={form.rec.poids} onChange={(e) => setRec({ poids: e.target.value })} placeholder="0" />
              </FormField>
              <FormField label={t("bacs.max_capacity")}>
                <input type="number" step="0.1" value={form.rec.capacite_max} onChange={(e) => setRec({ capacite_max: e.target.value })} placeholder="10" />
              </FormField>
              <FormField label={t("bacs.status")}>
                <select value={form.rec.etat} onChange={(e) => setRec({ etat: e.target.value })}>
                  {["EN_RECEPTION", "EN_ATTENTE_COLLECTE", "COLLECTE_EN_COURS", "COLLECTE_TERMINEE"].map((v) => <option key={v} value={v}>{statutLabel(v)}</option>)}
                </select>
              </FormField>
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
