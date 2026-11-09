import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { RefreshCw, Pencil, Trash2, Eye, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import BarcodeLabel from "../../BarcodeLabel";
import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";
import {
  Page, PageHeader, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterDateRange, FilterActions,
  ListSection, DataTable, Pagination, Badge,
  Modal, Button, FormField, TextArea, ConfirmDialog,
  DetailsPage, DetailsButton, KpiTiles, DetailCard, DetailGrid, InfoList,
  ColumnSettingsModal, useListPage, useRowSelection, deleteMany, exportExcel,
  RowActions, RowButton, FormGrid, Code, day, tk,
} from "../../kit";
import { IconAjouter, IconDetails, IconModifier, IconSupprimer } from "../../kit/ActionIcons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const ETATS = {
  DECLARE: "warning", EN_ATTENTE_RECEPTION: "warning", RECEPTIONNE: "info", EN_LAVAGE: "info",
  LAVE: "success", VERIFIE: "success", CONCORDE: "success", NON_CONCORDE: "danger", DETRUIT: "secondary",
};

const VIDE = {
  numeroSac: "", etat: "DECLARE", collecteId: "", agentCollecteNom: "", agentCollecteMatricule: "",
  serviceNom: "", chambre: "", quantiteDeclaree: "", observations: "", items: [],
};

const COLUMNS_DEFAULT = [
  { key: "numeroSac", label: "N° de sac", visible: true, searchable: true },
  { key: "dateCollecte", label: "Date de collecte", visible: true, searchable: true },
  { key: "agentCollecteNom", label: "Agent", visible: true, searchable: true },
  { key: "serviceNom", label: "Service", visible: true, searchable: true },
  { key: "chambre", label: "Chambre", visible: false, searchable: true },
  { key: "quantiteDeclaree", label: "Quantité", visible: true, searchable: false },
  { key: "etat", label: "État", visible: true, searchable: true },
  { key: "actions", label: "Actions", visible: true, searchable: false },
];

const pourEtiquette = (sac) => (sac ? { ...sac, code: sac.numeroSac, numeroSac: sac.numeroSac } : null);
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("fr-FR") : "—");
const fmtHeure = (v) => (v ? new Date(v).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "");

export default function SacInfecteList() {
  const { t } = useTranslation();
  const [sacs, setSacs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [detail, setDetail] = useState(null);
  const [items, setItems] = useState([]);
  const [isItemsLoading, setIsItemsLoading] = useState(false);
  const [itemDetail, setItemDetail] = useState(null);
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const fetchSacs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/sacs-infectes`);
      if (response.ok) setSacs(await response.json());
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSacs(); }, []);

  const fetchDetail = async (sac) => {
    setIsItemsLoading(true);
    setItems([]);
    setDetail(sac);
    try {
      const response = await fetch(`${API_URL}/api/sacs-infectes/detail?numeroSac=${encodeURIComponent(sac.numeroSac)}`);
      if (response.ok) {
        const data = await response.json();
        setDetail(data);
        setItems((data.items || []).map((item, index) => ({
          id: `sac-item-${data.id}-${index}`,
          categorie: item.categorie,
          quantiteDeclaree: item.quantiteDeclaree,
          quantiteComptee: item.quantiteComptee,
          ecart: item.ecart,
          etat: data.etat,
          numeroSac: data.numeroSac,
          agentCollecteNom: data.agentCollecteNom,
          dateCollecte: data.dateCollecte,
        })));
      }
    } catch (err) {
      console.error("Erreur chargement détail:", err);
    } finally {
      setIsItemsLoading(false);
    }
  };

  const etatLabel = (e) => (e ? t(`sac_infecte.etat.${e}`, e) : t("sac_infecte.etat.Non défini", "Non défini"));
  const EtatBadge = ({ value }) => <Badge variant={ETATS[value] || "secondary"}>{etatLabel(value)}</Badge>;
  const Concordance = ({ ecart }) => {
    if (ecart === 0 || ecart === null || ecart === undefined) {
      return ecart === 0 || ecart === null
        ? <Badge variant="success"><CheckCircle size={12} /> {t("sac_infecte.concordance.conforme")}</Badge>
        : <Badge variant="secondary"><Clock size={12} /> {t("sac_infecte.concordance.en_attente")}</Badge>;
    }
    return <Badge variant="danger"><AlertTriangle size={12} /> {t("sac_infecte.concordance.ecart")}: {ecart}</Badge>;
  };

  const columns = useMemo(() => COLUMNS_DEFAULT.map((c) => ({
    ...c,
    label: {
      numeroSac: t("sac_infecte.numero_sac"), dateCollecte: t("sac_infecte.date_collecte"), agentCollecteNom: t("sac_infecte.agent"),
      serviceNom: t("sac_infecte.service"), chambre: t("sac_infecte.chambre"), quantiteDeclaree: t("sac_infecte.quantite"),
      etat: t("sac_infecte.etat_label"), actions: t("common.actions"),
    }[c.key] || c.label,
  })), [t]);

  const searchValue = (s, key) => {
    switch (key) {
      case "dateCollecte": return s.dateCollecte ? fmtDate(s.dateCollecte) : "";
      case "etat": return etatLabel(s.etat);
      case "actions": return "";
      default: return s[key] ?? "";
    }
  };
  const sortValue = (s, key) => {
    if (key === "quantiteDeclaree") return Number(s.quantiteDeclaree) || 0;
    if (key === "dateCollecte") return s.dateCollecte ? new Date(s.dateCollecte).getTime() : 0;
    return String(searchValue(s, key)).toLowerCase();
  };

  const list = useListPage({
    rows: sacs,
    columns,
    getSearchValue: searchValue,
    getSortValue: sortValue,
    filters: {
      etat: { initial: "all", column: "etat", test: (s, v) => v === "all" || s.etat === v },
      dateFrom: { initial: "", column: "dateCollecte", test: (s, v) => !v || day(s.dateCollecte) >= v },
      dateTo: { initial: "", column: "dateCollecte", test: (s, v) => !v || day(s.dateCollecte) <= v },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const openDetails = (sac) => {
    if (!sac) return;
    setSelected(sac);
    setViewMode("details");
    fetchDetail(sac);
  };

  const openForm = (sac) => setForm({
    sac,
    rec: sac ? {
      numeroSac: sac.numeroSac || "", etat: sac.etat || "DECLARE", collecteId: sac.collecteId || "",
      agentCollecteNom: sac.agentCollecteNom || "", agentCollecteMatricule: sac.agentCollecteMatricule || "",
      serviceNom: sac.serviceNom || "", chambre: sac.chambre || "", quantiteDeclaree: sac.quantiteDeclaree || "",
      observations: sac.observations || "", items: sac.items || [],
    } : { ...VIDE },
  });
  const setRec = (patch) => setForm((f) => ({ ...f, rec: { ...f.rec, ...patch } }));

  const toast = (text) => Swal.fire({ title: "✅", text, icon: "success", timer: 1500, showConfirmButton: false });
  const erreur = (err) => Swal.fire({ title: "❌", text: err?.message || t("sac_infecte.error_text"), icon: "error" });

  const handleSave = async (e) => {
    e.preventDefault();
    const { sac, rec } = form;
    if (!rec.numeroSac?.trim()) {
      Swal.fire({ title: t("sac_infecte.numero_required"), text: t("sac_infecte.numero_required_text"), icon: "warning" });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        numeroSac: rec.numeroSac.trim(),
        etat: rec.etat || "DECLARE",
        collecteId: rec.collecteId ? parseInt(rec.collecteId) : null,
        agentCollecteNom: rec.agentCollecteNom || null,
        agentCollecteMatricule: rec.agentCollecteMatricule || null,
        serviceNom: rec.serviceNom || null,
        chambre: rec.chambre || null,
        quantiteDeclaree: parseInt(rec.quantiteDeclaree) || 0,
        observations: rec.observations || null,
        items: rec.items || [],
      };
      const response = await fetch(sac ? `${API_URL}/api/sacs-infectes/${sac.id}` : `${API_URL}/api/sacs-infectes`, {
        method: sac ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const texte = await response.text();
        let message = texte;
        try { message = JSON.parse(texte).message || texte; } catch { message = texte; }
        throw new Error(message);
      }
      const data = await response.json();
      setSacs((prev) => (sac ? prev.map((r) => (r.id === data.id ? data : r)) : [data, ...prev]));
      toast(sac ? t("sac_infecte.update_success") : t("sac_infecte.create_success"));
      if (sac) { setSelected(null); setViewMode("list"); }
      setForm(null);
      fetchSacs();
    } catch (err) {
      erreur(err);
    } finally {
      setIsSaving(false);
    }
  };

  const supprimer = async (id) => {
    const response = await fetch(`${API_URL}/api/sacs-infectes/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await response.text());
    setSacs((prev) => prev.filter((r) => r.id !== id));
  };

  const confirmDelete = async () => {
    const cible = deleteTarget;
    setDeleteTarget(null);
    try {
      await supprimer(cible.id);
      if (selected?.id === cible.id) { setSelected(null); setViewMode("list"); }
      toast(t("sac_infecte.delete_success"));
    } catch (err) {
      console.error("Erreur suppression:", err);
      erreur();
    }
  };

  const handleBulkDelete = async (lignes) => {
    if (!lignes.length || bulkDeleting) return;
    const ok = await Swal.fire({
      title: t("sac_infecte.delete_confirm"), text: `${lignes.length} sac(s)`, icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33", confirmButtonText: t("sac_infecte.delete_confirm_yes"), cancelButtonText: t("sac_infecte.delete_confirm_no"),
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
      fileName: "sacs_infectes",
      sheetName: t("sac_infecte.title"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const TABLE_COLUMNS = {
    numeroSac: {
      label: t("sac_infecte.numero_sac"), sortable: true,
      render: (s) => (
        <div>
          <Code>{s.numeroSac}</Code>
          <small style={{ display: "block", color: "var(--slate-500)" }}>ID #{s.id} · {s.collecteId ? `Collecte #${s.collecteId}` : "Sans collecte"}</small>
        </div>
      ),
    },
    dateCollecte: {
      label: t("sac_infecte.date_collecte"), sortable: true,
      render: (s) => <div>{fmtDate(s.dateCollecte)}<small style={{ display: "block", color: "var(--slate-500)" }}>{fmtHeure(s.dateCollecte)}</small></div>,
    },
    agentCollecteNom: { label: t("sac_infecte.agent"), sortable: true, render: (s) => s.agentCollecteNom || "—" },
    serviceNom: { label: t("sac_infecte.service"), sortable: true, render: (s) => (s.serviceNom ? <Badge variant="info">{s.serviceNom}</Badge> : "—") },
    chambre: { label: t("sac_infecte.chambre"), sortable: true, render: (s) => s.chambre || "—" },
    quantiteDeclaree: {
      label: t("sac_infecte.quantite"), sortable: true, align: "center",
      render: (s) => (
        <div>
          <strong>{s.quantiteDeclaree ?? 0}</strong>
          <small style={{ display: "block", color: "var(--slate-500)" }}>{s.items?.length ?? 0} {t("sac_infecte.items_count")}</small>
          {s.ecart !== null && s.ecart !== undefined && s.ecart !== 0 && <Badge variant="danger">{t("sac_infecte.ecart")}: {s.ecart}</Badge>}
        </div>
      ),
    },
    etat: { label: t("sac_infecte.etat_label"), sortable: true, align: "center", render: (s) => <EtatBadge value={s.etat} /> },
    actions: {
      label: t("common.actions"), align: "center",
      render: (s) => (
        <RowActions>
          <RowButton icon={Eye} title={t("sac_infecte.details_item")} onClick={() => openDetails(s)} />
          <BarcodeLabel item={pourEtiquette(s)} type="sac" variant="icon" />
          <RowButton icon={Pencil} title={t("common.edit")} onClick={() => openForm(s)} />
          <RowButton icon={Trash2} tone="danger" title={t("common.delete")} onClick={() => setDeleteTarget(s)} />
        </RowActions>
      ),
    },
  };

  const ITEM_COLUMNS = {
    categorie: { label: t("sac_infecte.categorie"), render: (i) => <strong>{t(`categories.${i.categorie}`, i.categorie)}</strong> },
    quantiteDeclaree: { label: t("sac_infecte.quantite_declaree"), align: "center", render: (i) => i.quantiteDeclaree ?? "—" },
    quantiteComptee: { label: t("sac_infecte.quantite_comptee"), align: "center", render: (i) => i.quantiteComptee ?? "—" },
    ecart: { label: t("sac_infecte.ecart"), align: "center", render: (i) => <Concordance ecart={i.ecart} /> },
  };

  const sac = detail || selected;

  return (
    <Page>
      {viewMode === "list" && (
        <>
          <PageHeader
            icon={<PageHeaderIcon size={40} />}
            title={t("sac_infecte.title")}
            subtitle={t("sac_infecte.subtitle")}
            total={list.sorted.length}
            onIconClick={() => setShowColumnSettings(true)}
          />

          <ActionBar>
            <ActionButton icon={IconAjouter} label={t("sac_infecte.new")} variant="ajouter" onClick={() => openForm(null)} />
            <ActionButton icon={IconDetails} label={t("common.details")} variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={IconModifier} label={t("common.edit")} variant="modifier" disabled={!selected} onClick={() => openForm(selected)} />
            <ActionButton icon={IconSupprimer} label={t("common.delete")} variant="supprimer" disabled={!selected} onClick={() => setDeleteTarget(selected)} />
            <BarcodeLabel item={pourEtiquette(selected)} type="sac" variant="action" />
            <ActionButton icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />} label={t("common.refresh")} variant="details" onClick={fetchSacs} />
          </ActionBar>

          <FilterPanel>
            <FilterRow>
              {list.isColVisible("etat") && (
                <FilterSelect
                  label={t("sac_infecte.etat_label")}
                  value={draft.etat}
                  onChange={(v) => setFilter("etat", v)}
                  allLabel={t("sac_infecte.filter.all")}
                  options={Object.keys(ETATS).map((v) => ({ value: v, label: etatLabel(v) }))}
                />
              )}
              <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
              <FilterText
                label={t("common.search")}
                placeholder={t("sac_infecte.search_placeholder")}
                value={draft.searchTerm}
                onChange={(v) => setFilter("searchTerm", v)}
                onEnter={list.apply}
              />
              {list.isColVisible("dateCollecte") && (
                <FilterDateRange from={draft.dateFrom} to={draft.dateTo} onFrom={(v) => setFilter("dateFrom", v)} onTo={(v) => setFilter("dateTo", v)} />
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
            unit="sac"
            units="sacs"
            bulkActions={[
              { label: tk("exportExcel", "Exporter Excel"), onClick: (l) => handleExportExcel(l) },
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
              onRowClick={(s) => setSelected(selected?.id === s.id ? null : s)}
              onRowDoubleClick={openDetails}
              loading={isLoading && !sacs.length}
              loadingText={t("common.loading")}
              emptyText={draft.searchTerm || draft.etat !== "all" ? t("sac_infecte.no_match") : t("sac_infecte.no_data")}
            />
            <Pagination total={list.sorted.length} page={list.page} totalPages={list.totalPages} pageSize={list.pageSize} onPage={list.setPage} unit="sac(s)" />
          </ListSection>
        </>
      )}

      {viewMode === "details" && sac && (
        <DetailsPage
          onBack={() => setViewMode("list")}
          eyebrow={t("sac_infecte.title")}
          title={`${sac.numeroSac}${sac.serviceNom ? ` · ${sac.serviceNom}` : ""}${sac.chambre ? ` · ${t("sac_infecte.chambre")} ${sac.chambre}` : ""}`}
          badge={<EtatBadge value={sac.etat} />}
          actions={(
            <>
              <BarcodeLabel item={pourEtiquette(sac)} type="sac" variant="action" />
              <DetailsButton icon={Pencil} onClick={() => openForm(selected)}>{t("common.edit")}</DetailsButton>
              <DetailsButton icon={Trash2} variant="danger" onClick={() => setDeleteTarget(selected)}>{t("common.delete")}</DetailsButton>
            </>
          )}
        >
          <KpiTiles items={[
            { label: t("sac_infecte.quantite_declaree"), value: sac.quantiteDeclaree ?? 0, tone: "blue" },
            { label: t("sac_infecte.quantite_comptee"), value: sac.quantiteCompteePostLavage ?? "—", tone: "green" },
            { label: t("sac_infecte.ecart"), value: sac.ecart ?? "—", tone: sac.ecart ? "amber" : "violet" },
          ]} />
          <DetailGrid>
            <DetailCard title={t("modal.collection", "Collecte")}>
              <InfoList items={[
                { label: t("sac_infecte.agent"), value: sac.agentCollecteNom },
                { label: t("sac_infecte.agent_matricule"), value: sac.agentCollecteMatricule },
                { label: t("sac_infecte.date_collecte"), value: sac.dateCollecte ? new Date(sac.dateCollecte).toLocaleString("fr-FR") : null },
                { label: t("sac_infecte.collecte_id"), value: sac.collecteId },
              ]} />
            </DetailCard>
            <DetailCard title={t("sac_infecte.observations")}>
              <p className="avd-text">{sac.observations || "—"}</p>
            </DetailCard>
          </DetailGrid>
          <DetailCard title={t("sac_infecte.items_count")}>
            <DataTable
              columns={ITEM_COLUMNS}
              rows={items}
              onRowDoubleClick={setItemDetail}
              onRowClick={setItemDetail}
              loading={isItemsLoading}
              loadingText={t("common.loading")}
              emptyText={t("sac_infecte.no_items")}
            />
          </DetailCard>
        </DetailsPage>
      )}

      {itemDetail && (
        <Modal
          size="sm"
          title={t("sac_infecte.details_item")}
          subtitle={`${t("sac_infecte.numero_sac")} · ${itemDetail.numeroSac}`}
          onClose={() => setItemDetail(null)}
          footer={<Button onClick={() => setItemDetail(null)}>{t("common.close")}</Button>}
        >
          <div style={{ marginBottom: 12 }}><Concordance ecart={itemDetail.ecart} /></div>
          <InfoList items={[
            { label: t("sac_infecte.categorie"), value: t(`categories.${itemDetail.categorie}`, itemDetail.categorie) },
            { label: t("sac_infecte.quantite_declaree"), value: itemDetail.quantiteDeclaree ?? 0 },
            { label: t("sac_infecte.quantite_comptee"), value: itemDetail.quantiteComptee },
            { label: t("sac_infecte.ecart"), value: itemDetail.ecart },
            { label: t("sac_infecte.agent"), value: itemDetail.agentCollecteNom },
            { label: t("sac_infecte.date_collecte"), value: itemDetail.dateCollecte ? new Date(itemDetail.dateCollecte).toLocaleString("fr-FR") : null },
          ]} />
        </Modal>
      )}

      {form && (
        <Modal
          className="kit-std-form"
          size="md"
          title={form.sac ? `${t("sac_infecte.edit")} #${form.sac.id}` : t("sac_infecte.new")}
          onClose={isSaving ? undefined : () => setForm(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setForm(null)} disabled={isSaving}>{t("common.cancel")}</Button>
              <Button type="submit" form="sac-form" disabled={isSaving}>{isSaving ? t("common.saving") : t("common.save")}</Button>
            </>
          )}
        >
          <form id="sac-form" onSubmit={handleSave}>
            <FormGrid>
              <FormField label={t("sac_infecte.numero_sac")} required>
                <input value={form.rec.numeroSac} onChange={(e) => setRec({ numeroSac: e.target.value.toUpperCase() })} placeholder="SAC-001" required />
              </FormField>
              <FormField label={t("sac_infecte.etat_label")}>
                <select value={form.rec.etat} onChange={(e) => setRec({ etat: e.target.value })}>
                  {Object.keys(ETATS).filter((v) => v !== "EN_ATTENTE_RECEPTION").map((v) => <option key={v} value={v}>{etatLabel(v)}</option>)}
                </select>
              </FormField>
              <FormField label={t("sac_infecte.collecte_id")}>
                <input type="number" value={form.rec.collecteId} onChange={(e) => setRec({ collecteId: e.target.value })} />
              </FormField>
              <FormField label={t("sac_infecte.quantite_declaree")}>
                <input type="number" min="0" value={form.rec.quantiteDeclaree} onChange={(e) => setRec({ quantiteDeclaree: e.target.value })} />
              </FormField>
              <FormField label={t("sac_infecte.agent_nom")}>
                <input value={form.rec.agentCollecteNom} onChange={(e) => setRec({ agentCollecteNom: e.target.value })} />
              </FormField>
              <FormField label={t("sac_infecte.agent_matricule")}>
                <input value={form.rec.agentCollecteMatricule} onChange={(e) => setRec({ agentCollecteMatricule: e.target.value })} />
              </FormField>
              <FormField label={t("sac_infecte.service")}>
                <input value={form.rec.serviceNom} onChange={(e) => setRec({ serviceNom: e.target.value })} />
              </FormField>
              <FormField label={t("sac_infecte.chambre")}>
                <input value={form.rec.chambre} onChange={(e) => setRec({ chambre: e.target.value })} />
              </FormField>
              <FormField label={t("sac_infecte.observations")} span>
                <TextArea value={form.rec.observations} onChange={(v) => setRec({ observations: v })} placeholder={t("sac_infecte.observations")} />
              </FormField>
            </FormGrid>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t("sac_infecte.delete_confirm")}
          message={t("sac_infecte.delete_confirm_text")}
          details={<strong>{deleteTarget.numeroSac}</strong>}
          confirmLabel={t("sac_infecte.delete_confirm_yes")}
          cancelLabel={t("sac_infecte.delete_confirm_no")}
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
