import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { RefreshCw, Pencil, Ban, Eye, History, Printer } from "lucide-react";
import { printLabel } from "../../../utils/labels";
import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";
import { arsenalService, getServices } from "../../../services/arsenalService";
import { useIntegration } from "../../../hooks/useIntegration";
import { ArsenalEmplacements, BadgeImporte, BadgeInactif } from "./ArsenalEmplacements";
import {
  Page, PageHeader, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterActions,
  ListSection, DataTable, Pagination, Badge,
  Modal, Button, FormField, InfoList,
  DetailsPage, DetailsButton, KpiTiles, DetailCard,
  ColumnSettingsModal, useListPage, useRowSelection, exportExcel,
  Tabs, RowActions, RowButton, FormGrid, Code, tk,
} from "../../kit";
import { IconAjouter, IconDetails, IconModifier, IconSupprimer } from "../../kit/ActionIcons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const ETATS_LINGE = {
  COLLECTE: "warning", EN_LAVAGE: "info", PROPRE_PRET: "success", RECEPTIONNE: "success", DISTRIBUE: "success",
  EN_SECHAGE_REPASSAGE: "info", STOCKE: "secondary", PRET_LIVRAISON: "success", EN_TRI: "info",
  LAVE: "success", SECHE: "success", SALE: "danger",
};

const COLUMNS_DEFAULT = [
  { key: "code", label: "Code", visible: true, searchable: true },
  { key: "nom", label: "Nom", visible: true, searchable: true },
  { key: "service", label: "Service", visible: true, searchable: true },
  { key: "source", label: "Origine", visible: false, searchable: false },
  { key: "actions", label: "Actions", visible: true, searchable: false },
];

const codeArsenal = (a) => a.code || `ARS-${a.id}`;

export default function ArsenalList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { estImporte } = useIntegration();
  const arsenauxImportes = estImporte("ARSENAL");

  const [arsenals, setArsenals] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rafraichir, setRafraichir] = useState(0);
  const [tous, setTous] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [onglet, setOnglet] = useState("linges");
  const [linges, setLinges] = useState([]);
  const [isLingesLoading, setIsLingesLoading] = useState(false);
  const [selectedLinge, setSelectedLinge] = useState(null);
  const [lingeDetail, setLingeDetail] = useState(null);
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  useEffect(() => {
    getServices().then(setServices).catch(() => setServices([]));
  }, []);

  useEffect(() => {
    let actif = true;
    arsenalService.getAll(tous)
      .then((data) => actif && setArsenals(Array.isArray(data) ? data : []))
      .catch((err) => actif && Swal.fire({ title: t("common.error"), text: err.message, icon: "error" }))
      .finally(() => actif && setIsLoading(false));
    return () => { actif = false; };
  }, [tous, rafraichir, t]);

  const fetchArsenals = useCallback(() => {
    setIsLoading(true);
    setRafraichir((n) => n + 1);
  }, []);

  const fetchLinges = async (id) => {
    setIsLingesLoading(true);
    setLinges([]);
    try {
      const response = await fetch(`${API_URL}/api/Arsenals/arsenals/${id}/linges`);
      if (response.ok) {
        const data = await response.json();
        setLinges(Array.isArray(data) ? data : data.content || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLingesLoading(false);
    }
  };

  const serviceNom = useCallback((serviceId) => {
    const service = Array.isArray(services) ? services.find((s) => s.id === serviceId) : null;
    return service ? service.code : t("arsenal.unassigned");
  }, [services, t]);

  const imprimer = (a) => a && printLabel("arsenal", { ...a, serviceNom: serviceNom(a.serviceId) }, { t });
  const lectureSeule = (a) => a?.source === "EXTERNE";

  const columns = useMemo(() => COLUMNS_DEFAULT.map((c) => ({
    ...c,
    label: { code: t("arsenal.code"), nom: t("arsenal.name"), service: t("arsenal.service"), source: t("machines.source", "Source"), actions: t("common.actions") }[c.key] || c.label,
  })), [t]);

  const searchValue = (a, key) => {
    switch (key) {
      case "code": return codeArsenal(a);
      case "service": return serviceNom(a.serviceId);
      case "source": return a.source === "EXTERNE" ? t("integration.imported", "Importé") : "";
      case "actions": return "";
      default: return a[key] ?? "";
    }
  };

  const list = useListPage({
    rows: arsenals,
    columns,
    getSearchValue: searchValue,
    getSortValue: (a, key) => String(searchValue(a, key)).toLowerCase(),
    filters: {
      service: { initial: "all", column: "service", test: (a, v) => v === "all" || String(a.serviceId) === v },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const openDetails = (a) => {
    if (!a) return;
    setSelected(a);
    setSelectedLinge(null);
    setOnglet("linges");
    setViewMode("details");
    fetchLinges(a.id);
  };

  const openForm = (a) => setForm({
    arsenal: a,
    rec: a
      ? { code: a.code || "", nom: a.nom || "", serviceId: a.serviceId || "" }
      : { code: "", nom: "", serviceId: services[0]?.id ?? "" },
  });
  const setRec = (patch) => setForm((f) => ({ ...f, rec: { ...f.rec, ...patch } }));

  const handleSave = async (e) => {
    e.preventDefault();
    const { arsenal, rec } = form;
    const importe = lectureSeule(arsenal);
    if (!importe && !rec.nom?.trim()) {
      Swal.fire({ title: t("arsenal.errors.name_required"), text: t("arsenal.errors.name_required_text"), icon: "warning" });
      return;
    }
    setIsSaving(true);
    try {
      const serviceId = rec.serviceId ? parseInt(rec.serviceId) : null;
      const payload = importe ? { serviceId } : { code: rec.code?.trim() || undefined, nom: rec.nom.trim(), serviceId };
      const data = arsenal ? await arsenalService.update(arsenal.id, payload) : await arsenalService.create(payload);
      setArsenals((prev) => (arsenal ? prev.map((r) => (r.id === data.id ? data : r)) : [data, ...prev]));
      if (arsenal && selected?.id === data.id) setSelected(data);
      Swal.fire({ title: arsenal ? t("arsenal.success.updated") : t("arsenal.success.created"), icon: "success", timer: 1500, showConfirmButton: false });
      setForm(null);
      fetchArsenals();
    } catch (err) {
      Swal.fire({ title: t("common.error"), text: err.message, icon: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const desactiver = async (a) => {
    if (!a || lectureSeule(a) || a.actif === false) return;
    const result = await Swal.fire({
      title: t("arsenal.delete_confirm_title"),
      text: t("arsenal.delete_confirm_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: t("arsenal.delete_confirm_yes"),
      cancelButtonText: t("common.cancel"),
    });
    if (!result.isConfirmed) return;
    try {
      await arsenalService.desactiver(a.id);
      setSelected(null);
      setViewMode("list");
      fetchArsenals();
      Swal.fire({ title: t("arsenal.success.deleted"), icon: "success", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: t("common.error"), text: err.message, icon: "error" });
    }
  };

  const handleExportExcel = (lignes) => {
    const source = Array.isArray(lignes) ? lignes : list.sorted;
    if (!source.length) return;
    exportExcel({
      fileName: "arsenaux",
      sheetName: t("arsenal.title"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const EtatLingeBadge = ({ value }) => (
    <Badge variant={ETATS_LINGE[value] || "secondary"}>{value ? t(`linge_etat.${value}`, value) : t("arsenal.status_undefined")}</Badge>
  );

  const TABLE_COLUMNS = {
    code: { label: t("arsenal.code"), sortable: true, render: (a) => <Code>{codeArsenal(a)}</Code> },
    nom: { label: t("arsenal.name"), sortable: true, render: (a) => <><strong>{a.nom}</strong><BadgeImporte item={a} /><BadgeInactif item={a} /></> },
    service: { label: t("arsenal.service"), sortable: true, render: (a) => <Badge variant={a.serviceId ? "info" : "secondary"}>{serviceNom(a.serviceId)}</Badge> },
    source: { label: t("machines.source", "Source"), sortable: true, render: (a) => searchValue(a, "source") || "—" },
    actions: {
      label: t("common.actions"), align: "center",
      render: (a) => (
        <RowActions>
          <RowButton icon={Eye} title={t("arsenal.show_linens")} onClick={() => openDetails(a)} />
          <RowButton icon={Printer} title={t("arsenal.print_code")} onClick={() => imprimer(a)} />
          <RowButton icon={Pencil} title={t("common.edit")} onClick={() => openForm(a)} />
          <RowButton icon={Ban} tone="danger" title={t("common.delete")} disabled={lectureSeule(a) || a.actif === false} onClick={() => desactiver(a)} />
        </RowActions>
      ),
    },
  };

  const LINGE_COLUMNS = {
    codeBarre: { label: t("arsenal.tracking_code"), render: (l) => <Code>{l.codeBarre || l.codeSuivi || "N/A"}</Code> },
    categorie: { label: t("common.category"), render: (l) => l.categorie || t("arsenal.uncategorized") },
    etat: { label: t("common.status"), render: (l) => <EtatLingeBadge value={l.etat} /> },
    poids: { label: t("common.weight"), align: "right", render: (l) => `${l.poids || 0} kg` },
    rfidTag: { label: t("arsenal.rfid_tag"), render: (l) => (l.rfidTag ? <Code>{l.rfidTag}</Code> : "—") },
  };

  const voirTracking = (l) => l && navigate(`/tracking?code=${l.codeBarre}`);

  return (
    <Page>
      {viewMode === "list" && (
        <>
          <PageHeader
            icon={<PageHeaderIcon size={40} />}
            title={t("arsenal.title")}
            subtitle={t("arsenal.subtitle")}
            total={list.sorted.length}
            onIconClick={() => setShowColumnSettings(true)}
          />

          <ActionBar>
            {!arsenauxImportes && <ActionButton icon={IconAjouter} label={t("arsenal.new")} variant="ajouter" onClick={() => openForm(null)} />}
            <ActionButton icon={IconDetails} label={t("arsenal.show_linens")} variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={IconModifier} label={t("common.edit")} variant="modifier" disabled={!selected} onClick={() => openForm(selected)} />
            <ActionButton icon={IconSupprimer} label={t("common.delete")} variant="supprimer" disabled={!selected || lectureSeule(selected) || selected.actif === false} onClick={() => desactiver(selected)} />
            <ActionButton icon={Printer} label={t("arsenal.print_code")} variant="imprimer" disabled={!selected} onClick={() => imprimer(selected)} />
            <ActionButton icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />} label={t("common.refresh")} variant="details" onClick={fetchArsenals} />
          </ActionBar>

          <FilterPanel>
            <FilterRow>
              <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
              <FilterText
                label={t("common.search")}
                placeholder={t("arsenal.search_placeholder")}
                value={draft.searchTerm}
                onChange={(v) => setFilter("searchTerm", v)}
                onEnter={list.apply}
              />
              {list.isColVisible("service") && (
                <FilterSelect
                  label={t("arsenal.service")}
                  value={draft.service}
                  onChange={(v) => setFilter("service", v)}
                  allLabel={t("common.all")}
                  options={services.map((s) => ({ value: String(s.id), label: s.code }))}
                />
              )}
              <FilterSelect
                label={t("common.status", "Statut")}
                value={tous ? "tous" : "actifs"}
                onChange={(v) => { setIsLoading(true); setTous(v === "tous"); }}
                allLabel={null}
                options={[
                  { value: "actifs", label: t("common.active", "Actifs") },
                  { value: "tous", label: t("arsenal.show_inactive", "Afficher les inactifs") },
                ]}
              />
              <FilterActions
                onSearch={list.apply}
                count={list.sorted.length}
                onExcel={() => handleExportExcel()}
                onReset={list.reset}
                onColumns={() => setShowColumnSettings(true)}
              />
            </FilterRow>
          </FilterPanel>

          <ListSection selection={sel} unit="arsenal" units="arsenaux" bulkActions={[{ label: tk("exportExcel", "Exporter Excel"), onClick: (l) => handleExportExcel(l) }]}>
            <DataTable
              columns={TABLE_COLUMNS}
              visible={list.visibleColumns}
              rows={list.paginated}
              sort={list.sort}
              onSort={list.toggleSort}
              selection={sel}
              activeId={selected?.id}
              onRowClick={(a) => setSelected(selected?.id === a.id ? null : a)}
              onRowDoubleClick={openDetails}
              rowClassName={(a) => (a.actif === false ? "kit-row-inactive" : "")}
              loading={isLoading && !arsenals.length}
              loadingText={t("common.loading")}
              emptyText={draft.searchTerm ? t("arsenal.no_match") : t("arsenal.no_data")}
            />
            <Pagination total={list.sorted.length} page={list.page} totalPages={list.totalPages} pageSize={list.pageSize} onPage={list.setPage} unit="arsenal(aux)" />
          </ListSection>
        </>
      )}

      {viewMode === "details" && selected && (
        <DetailsPage
          onBack={() => setViewMode("list")}
          eyebrow={t("arsenal.arsenal")}
          title={`${codeArsenal(selected)} · ${selected.nom}`}
          badge={<span><BadgeImporte item={selected} /><BadgeInactif item={selected} /></span>}
          actions={(
            <>
              <DetailsButton icon={Printer} onClick={() => imprimer(selected)}>{t("arsenal.print_code")}</DetailsButton>
              <DetailsButton icon={Pencil} onClick={() => openForm(selected)}>{t("common.edit")}</DetailsButton>
              {!lectureSeule(selected) && selected.actif !== false && (
                <DetailsButton icon={Ban} variant="danger" onClick={() => desactiver(selected)}>{t("common.delete")}</DetailsButton>
              )}
            </>
          )}
        >
          <KpiTiles items={[
            { label: t("arsenal.items"), value: isLingesLoading ? "…" : linges.length, tone: "blue" },
            { label: t("arsenal.service"), value: serviceNom(selected.serviceId), tone: "green" },
            { label: t("machines.source", "Source"), value: lectureSeule(selected) ? t("integration.imported", "Importé") : t("services_page.manual", "Manuel"), tone: "violet" },
          ]} />
          <div className="kit-toolbar">
            <Tabs
              value={onglet}
              onChange={setOnglet}
              items={[
                { value: "linges", label: t("arsenal.linens_of"), count: linges.length },
                { value: "emplacements", label: t("arsenal.locations", "Emplacements") },
              ]}
            />
          </div>
          <DetailCard>
            {onglet === "linges" ? (
              <>
                <ActionBar>
                  <ActionButton icon={IconDetails} label={t("arsenal.linen_details")} variant="details" disabled={!selectedLinge} onClick={() => setLingeDetail(selectedLinge)} />
                  <ActionButton icon={History} label={t("bacs.history", "Historique")} variant="imprimer" disabled={!selectedLinge} onClick={() => voirTracking(selectedLinge)} />
                </ActionBar>
                <DataTable
                  columns={LINGE_COLUMNS}
                  rows={linges}
                  activeId={selectedLinge?.id}
                  onRowClick={(l) => setSelectedLinge(selectedLinge?.id === l.id ? null : l)}
                  onRowDoubleClick={setLingeDetail}
                  loading={isLingesLoading}
                  loadingText={t("common.loading")}
                  emptyText={t("common.no_items", "Aucun linge")}
                />
              </>
            ) : (
              <ArsenalEmplacements arsenal={selected} tous={tous} />
            )}
          </DetailCard>
        </DetailsPage>
      )}

      {lingeDetail && (
        <Modal
          size="md"
          title={t("arsenal.linen_details")}
          subtitle={selected?.nom ? `${t("arsenal.arsenal")} · ${selected.nom}` : undefined}
          onClose={() => setLingeDetail(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => voirTracking(lingeDetail)}>{t("bacs.history", "Historique")}</Button>
              <Button onClick={() => setLingeDetail(null)}>{t("common.close")}</Button>
            </>
          )}
        >
          <div style={{ marginBottom: 12 }}><EtatLingeBadge value={lingeDetail.etat} /></div>
          <InfoList items={[
            { label: t("common.id"), value: lingeDetail.id },
            { label: t("arsenal.tracking_code"), value: lingeDetail.codeBarre },
            { label: t("arsenal.rfid_tag"), value: lingeDetail.rfidTag },
            { label: t("common.category"), value: lingeDetail.categorie },
            { label: t("common.weight"), value: `${lingeDetail.poids || 0} kg` },
            { label: t("common.creation_date"), value: lingeDetail.dateCreation ? new Date(lingeDetail.dateCreation).toLocaleString("fr-FR") : null },
          ]} />
        </Modal>
      )}

      {form && (
        <Modal
          className="kit-std-form"
          size="md"
          title={form.arsenal ? `${t("arsenal.edit")} #${form.arsenal.id}` : t("arsenal.new")}
          onClose={isSaving ? undefined : () => setForm(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setForm(null)} disabled={isSaving}>{t("common.cancel")}</Button>
              <Button type="submit" form="arsenal-form" disabled={isSaving}>{isSaving ? t("common.saving") : t("common.save")}</Button>
            </>
          )}
        >
          <form id="arsenal-form" onSubmit={handleSave}>
            <FormGrid>
              <FormField
                label={t("common.code")}
                hint={lectureSeule(form.arsenal) ? t("arsenal.imported_hint", "Arsenal importé : seul le service est modifiable.") : t("arsenal.code_hint")}
              >
                <input value={form.rec.code} onChange={(e) => setRec({ code: e.target.value.toUpperCase() })} placeholder={t("arsenal.code_placeholder")} disabled={lectureSeule(form.arsenal)} />
              </FormField>
              <FormField label={t("common.name")} required={!lectureSeule(form.arsenal)}>
                <input value={form.rec.nom} onChange={(e) => setRec({ nom: e.target.value })} placeholder={t("arsenal.name_placeholder")} required={!lectureSeule(form.arsenal)} disabled={lectureSeule(form.arsenal)} />
              </FormField>
              <FormField label={t("arsenal.service")} span>
                <select value={form.rec.serviceId || ""} onChange={(e) => setRec({ serviceId: e.target.value ? parseInt(e.target.value) : "" })}>
                  <option value="">{t("arsenal.no_service")}</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
                </select>
              </FormField>
            </FormGrid>
          </form>
        </Modal>
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
