import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { RefreshCw, Pencil, Trash2, Ban, BedDouble } from "lucide-react";
import BarcodeLabel from "../../BarcodeLabel";
import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";
import { lireErreur } from "../../../services/integrationService";
import { useIntegration } from "../../../hooks/useIntegration";
import { useCircuitInfecte } from "../../../hooks/useEstablishment";
import { BadgeImporte, BadgeInactif } from "../Arsenal/ArsenalEmplacements";
import {
  Page, PageHeader, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterActions,
  ListSection, DataTable, Pagination, Badge,
  Modal, Button, FormField,
  DetailsPage, DetailsButton, KpiTiles, DetailCard, DetailAlert,
  ColumnSettingsModal, useListPage, useRowSelection, exportExcel,
  RowActions, RowButton, FormGrid, Code, QuickStats, tk,
} from "../../kit";
import { IconAjouter, IconDetails, IconModifier, IconSupprimer } from "../../kit/ActionIcons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";
const JSON_HEADERS = { "Content-Type": "application/json" };
const TYPES_LIT = ["SIMPLE", "DOUBLE", "KING"];
const CHAMBRE_VIDE = { code: "", codeBarre: "", serviceId: "", actif: true, creerLitParDefaut: false };
const LIT_VIDE = { chambreId: "", code: "", reference: "", description: "", type: "SIMPLE", actif: true };

const COLUMNS_DEFAULT = [
  { key: "code", label: "Code", visible: true, searchable: true },
  { key: "codeBarre", label: "Code-barres", visible: true, searchable: true },
  { key: "service", label: "Service", visible: true, searchable: true },
  { key: "source", label: "Origine", visible: false, searchable: false },
  { key: "actions", label: "Actions", visible: true, searchable: false },
];

const Check = ({ checked, onChange, disabled, children, title }) => (
  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1 }} title={title}>
    <input type="checkbox" style={{ width: "auto" }} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    {children}
  </label>
);

export default function ChambreList() {
  const { t } = useTranslation();
  const { estImporte } = useIntegration();
  const chambresImportees = estImporte("CHAMBRE");
  const litsImportes = estImporte("LIT");
  const circuitInfecte = useCircuitInfecte();
  const infectionImportee = circuitInfecte && estImporte("LIT_INFECTE");

  const [chambres, setChambres] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rafraichir, setRafraichir] = useState(0);
  const [tous, setTous] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [lits, setLits] = useState([]);
  const [isLitsLoading, setIsLitsLoading] = useState(false);
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [litEdition, setLitEdition] = useState(null);
  const [litForm, setLitForm] = useState(LIT_VIDE);
  const [savingLit, setSavingLit] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/services`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const liste = data.content || data._embedded?.services || data;
        setServices(Array.isArray(liste) ? liste : []);
      })
      .catch(() => setServices([]));
  }, []);

  useEffect(() => {
    let actif = true;
    fetch(`${API_URL}/api/chambres${tous ? "?tous=true" : ""}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!actif) return;
        setChambres(Array.isArray(data)
          ? data.map((c) => ({ id: c.id, cle: c.cle, code: c.code, serviceId: c.serviceId, codeBarre: c.codeBarre, actif: c.actif !== false, source: c.source }))
          : []);
      })
      .catch(() => actif && setChambres([]))
      .finally(() => actif && setIsLoading(false));
    return () => { actif = false; };
  }, [tous, rafraichir]);

  const fetchChambres = useCallback(() => {
    setIsLoading(true);
    setRafraichir((n) => n + 1);
  }, []);

  const fetchLits = useCallback(async (chambreId) => {
    setIsLitsLoading(true);
    setLits([]);
    try {
      const response = await fetch(`${API_URL}/api/lits/chambre/${chambreId}${tous ? "?tous=true" : ""}`);
      if (response.ok) {
        const data = await response.json();
        setLits(Array.isArray(data) ? data : []);
      }
    } catch {
      setLits([]);
    } finally {
      setIsLitsLoading(false);
    }
  }, [tous]);

  const serviceNom = useCallback((serviceId) => {
    const s = services.find((x) => x.id === serviceId);
    return s ? s.code : t("chambre.not_assigned");
  }, [services, t]);

  const lectureSeule = (c) => c?.source === "EXTERNE";
  const peutDesactiver = (c) => c && !lectureSeule(c) && c.actif !== false;

  const columns = useMemo(() => COLUMNS_DEFAULT.map((c) => ({
    ...c,
    label: { code: t("chambre.code"), codeBarre: t("chambre.code_barre"), service: t("chambre.service"), source: t("machines.source", "Source"), actions: t("chambre.actions") }[c.key] || c.label,
  })), [t]);

  const searchValue = (c, key) => {
    switch (key) {
      case "service": return serviceNom(c.serviceId);
      case "source": return lectureSeule(c) ? t("integration.imported", "Importé") : "";
      case "actions": return "";
      default: return c[key] ?? "";
    }
  };

  const usedServices = useMemo(() => {
    const ids = new Set(chambres.map((c) => c.serviceId).filter(Boolean));
    return services.filter((s) => ids.has(s.id));
  }, [chambres, services]);

  const list = useListPage({
    rows: chambres,
    columns,
    getSearchValue: searchValue,
    getSortValue: (c, key) => String(searchValue(c, key)).toLowerCase(),
    filters: {
      service: {
        initial: "all", column: "service",
        test: (c, v) => v === "all" || (v === "none" ? !c.serviceId : String(c.serviceId) === v),
      },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const openDetails = (c) => {
    if (!c) return;
    setSelected(c);
    setViewMode("details");
    fetchLits(c.id);
  };

  const openForm = (c) => setForm({
    chambre: c,
    rec: c
      ? { ...CHAMBRE_VIDE, code: c.code || "", codeBarre: c.codeBarre || "", serviceId: c.serviceId || "", actif: c.actif !== false }
      : { ...CHAMBRE_VIDE, serviceId: services[0]?.id ?? "" },
  });
  const setRec = (patch) => setForm((f) => ({ ...f, rec: { ...f.rec, ...patch } }));

  const erreur = (err) => Swal.fire({ title: t("chambre.alerts.error"), text: err.message, icon: "error" });
  const toast = (title) => Swal.fire({ title, icon: "success", timer: 1500, showConfirmButton: false });

  const handleSave = async (e) => {
    e.preventDefault();
    const { chambre, rec } = form;
    const importee = lectureSeule(chambre);
    if (!importee && !rec.code?.trim()) {
      Swal.fire({ title: t("chambre.alerts.code_required"), text: t("chambre.alerts.code_required_text"), icon: "warning" });
      return;
    }
    setIsSaving(true);
    try {
      const serviceId = rec.serviceId ? parseInt(rec.serviceId) : null;
      const champs = { code: rec.code.trim(), codeBarre: rec.codeBarre.trim() || null, serviceId, actif: rec.actif };
      const payload = !chambre ? { ...champs, creerLitParDefaut: rec.creerLitParDefaut } : importee ? { serviceId } : champs;
      const response = await fetch(chambre ? `${API_URL}/api/chambres/${chambre.id}` : `${API_URL}/api/chambres`, {
        method: chambre ? "PUT" : "POST", headers: JSON_HEADERS, body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await lireErreur(response, t("chambre.alerts.error")));
      toast(t(chambre ? "chambre.alerts.updated" : "chambre.alerts.created"));
      if (chambre && selected?.id === chambre.id) setSelected({ ...selected, ...champs, ...(importee ? { code: selected.code, codeBarre: selected.codeBarre } : {}) });
      setForm(null);
      fetchChambres();
    } catch (err) {
      erreur(err);
    } finally {
      setIsSaving(false);
    }
  };

  const desactiver = async (c) => {
    if (!peutDesactiver(c)) return;
    const result = await Swal.fire({
      title: t("chambre.alerts.delete_confirm"),
      text: t("chambre.alerts.delete_confirm_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: t("chambre.alerts.delete_yes"),
      cancelButtonText: t("chambre.alerts.delete_no"),
    });
    if (!result.isConfirmed) return;
    try {
      const response = await fetch(`${API_URL}/api/chambres/${c.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await lireErreur(response, t("chambre.alerts.error")));
      if (selected?.id === c.id) { setSelected(null); setViewMode("list"); }
      fetchChambres();
      toast(t("chambre.alerts.deleted"));
    } catch (err) {
      erreur(err);
    }
  };

  const ouvrirLit = (lit) => {
    setLitEdition(lit || "nouveau");
    setLitForm(lit
      ? { chambreId: lit.chambreId, code: lit.code || "", reference: lit.reference || "", description: lit.description || "", type: lit.type || "SIMPLE", actif: lit.actif !== false }
      : { ...LIT_VIDE, chambreId: selected.id });
  };

  const enregistrerLit = async (e) => {
    e.preventDefault();
    setSavingLit(true);
    try {
      const nouveau = litEdition === "nouveau";
      const payload = {
        chambreId: Number(litForm.chambreId),
        code: litForm.code.trim(),
        reference: litForm.reference.trim(),
        description: litForm.description.trim(),
        type: litForm.type.trim(),
        actif: litForm.actif,
        ...(nouveau ? { infecte: false } : {}),
      };
      const response = await fetch(nouveau ? `${API_URL}/api/lits` : `${API_URL}/api/lits/${litEdition.id}`, {
        method: nouveau ? "POST" : "PUT", headers: JSON_HEADERS, body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await lireErreur(response, t("chambre.alerts.error")));
      setLitEdition(null);
      fetchLits(selected.id);
      toast(t("chambre.bed_saved", "Lit enregistré"));
    } catch (err) {
      erreur(err);
    } finally {
      setSavingLit(false);
    }
  };

  const desactiverLit = async (lit) => {
    const result = await Swal.fire({
      title: t("chambre.bed_disable_confirm", "Désactiver ce lit ?"),
      text: lit.code,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: t("chambre.disable_bed", "Désactiver le lit"),
      cancelButtonText: t("chambre.alerts.delete_no"),
    });
    if (!result.isConfirmed) return;
    try {
      const response = await fetch(`${API_URL}/api/lits/${lit.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await lireErreur(response, t("chambre.alerts.error")));
      fetchLits(selected.id);
    } catch (err) {
      erreur(err);
    }
  };

  const basculerInfection = async (lit, infecte) => {
    try {
      const response = await fetch(`${API_URL}/api/lits/${lit.id}/infection`, {
        method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ infecte }),
      });
      if (!response.ok) throw new Error(await lireErreur(response, t("chambre.alerts.error")));
      const maj = await response.json().catch(() => null);
      setLits((prev) => prev.map((l) => (l.id === lit.id ? { ...l, ...(maj || { infecte }) } : l)));
    } catch (err) {
      erreur(err);
    }
  };

  const handleExportExcel = (lignes) => {
    const source = Array.isArray(lignes) ? lignes : list.sorted;
    if (!source.length) return;
    exportExcel({
      fileName: "chambres",
      sheetName: t("chambre.title"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const TABLE_COLUMNS = {
    code: { label: t("chambre.code"), sortable: true, render: (c) => <><strong>{c.code}</strong><BadgeImporte item={c} /><BadgeInactif item={c} /></> },
    codeBarre: { label: t("chambre.code_barre"), sortable: true, render: (c) => <Code>{c.codeBarre}</Code> },
    service: { label: t("chambre.service"), sortable: true, render: (c) => <Badge variant={c.serviceId ? "info" : "warning"}>{serviceNom(c.serviceId)}</Badge> },
    source: { label: t("machines.source", "Source"), sortable: true, render: (c) => searchValue(c, "source") || "—" },
    actions: {
      label: t("chambre.actions"), align: "center",
      render: (c) => (
        <RowActions>
          <RowButton icon={BedDouble} title={t("chambre.show_beds")} onClick={() => openDetails(c)} />
          <BarcodeLabel item={c} type="chambre" variant="icon" />
          <RowButton icon={Pencil} title={t("chambre.edit")} onClick={() => openForm(c)} />
          <RowButton icon={Trash2} tone="danger" title={t("chambre.delete")} disabled={!peutDesactiver(c)} onClick={() => desactiver(c)} />
        </RowActions>
      ),
    },
  };

  const etatLit = (l) => (l.etat === 0 ? { label: t("chambre.free"), variant: "success" } : l.etat === 2 ? { label: t("chambre.occupied"), variant: "warning" } : { label: t("chambre.unknown"), variant: "secondary" });

  const LIT_COLUMNS = {
    code: {
      label: t("chambre.code"),
      render: (l) => (
        <div>
          <strong>{l.code || `LIT-${l.id}`}</strong><BadgeImporte item={l} /><BadgeInactif item={l} />
          <small style={{ display: "block", color: "var(--slate-500)" }}>{l.description || t("chambre.standard_bed")}{l.type ? ` · ${l.type}` : ""}</small>
        </div>
      ),
    },
    reference: { label: t("chambre.bed_reference", "Référence"), render: (l) => <Code>{l.reference || `#${String(l.id).padStart(4, "0")}`}</Code> },
    etat: { label: t("common.status", "État"), align: "center", render: (l) => <Badge variant={etatLit(l).variant}>{etatLit(l).label}</Badge> },
    ...(circuitInfecte ? {
      infecte: {
        label: t("chambre.infected"), align: "center",
        render: (l) => (
          <span onClick={(e) => e.stopPropagation()}>
            <Check
              checked={!!l.infecte}
              disabled={infectionImportee}
              title={infectionImportee ? t("chambre.infection_locked", "L'état d'infection est synchronisé depuis le système externe") : undefined}
              onChange={(v) => basculerInfection(l, v)}
            >
              {l.infecte ? <Badge variant="danger">{t("chambre.infected")}</Badge> : null}
            </Check>
          </span>
        ),
      },
    } : {}),
    actions: {
      label: t("chambre.actions"), align: "center",
      render: (l) => (
        <RowActions>
          <BarcodeLabel item={l} type="lit" ctx={{ chambre: selected?.code }} variant="icon" />
          {l.source === "EXTERNE" ? <Badge variant="secondary">{t("integration.read_only", "Lecture seule")}</Badge> : (
            <>
              <RowButton icon={Pencil} title={t("chambre.edit_bed", "Modifier le lit")} onClick={() => ouvrirLit(l)} />
              {l.actif !== false && <RowButton icon={Ban} tone="danger" title={t("chambre.disable_bed", "Désactiver le lit")} onClick={() => desactiverLit(l)} />}
            </>
          )}
        </RowActions>
      ),
    },
  };

  const kpis = {
    total: chambres.length,
    servicesCovered: new Set(chambres.filter((c) => c.serviceId).map((c) => c.serviceId)).size,
    withBarcode: chambres.filter((c) => c.codeBarre).length,
    unassigned: chambres.filter((c) => !c.serviceId).length,
  };
  const bedStats = {
    total: lits.length,
    occupied: lits.filter((l) => l.etat === 2).length,
    free: lits.filter((l) => l.etat === 0).length,
    infected: lits.filter((l) => l.infecte).length,
  };

  return (
    <Page>
      {viewMode === "list" && (
        <>
          <PageHeader
            icon={<PageHeaderIcon size={40} />}
            title={t("chambre.title")}
            subtitle={t("chambre.subtitle")}
            total={list.sorted.length}
            onIconClick={() => setShowColumnSettings(true)}
          />

          <ActionBar>
            {!chambresImportees && <ActionButton icon={IconAjouter} label={t("chambre.new")} variant="ajouter" onClick={() => openForm(null)} />}
            <ActionButton icon={IconDetails} label={t("chambre.show_beds")} variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={IconModifier} label={t("chambre.edit")} variant="modifier" disabled={!selected} onClick={() => openForm(selected)} />
            <ActionButton icon={IconSupprimer} label={t("chambre.delete")} variant="supprimer" disabled={!peutDesactiver(selected)} onClick={() => desactiver(selected)} />
            <BarcodeLabel item={selected} type="chambre" variant="action" />
            <ActionButton icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />} label={t("common.refresh")} variant="details" onClick={fetchChambres} />
          </ActionBar>

          <FilterPanel>
            <FilterRow>
              <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
              <FilterText
                label={t("common.search")}
                placeholder={t("chambre.search_placeholder")}
                value={draft.searchTerm}
                onChange={(v) => setFilter("searchTerm", v)}
                onEnter={list.apply}
              />
              {list.isColVisible("service") && (
                <FilterSelect
                  label={t("chambre.service")}
                  value={draft.service}
                  onChange={(v) => setFilter("service", v)}
                  allLabel={t("chambre.all_services", "Tous les services")}
                  options={[{ value: "none", label: t("chambre.not_assigned") }, ...usedServices.map((s) => ({ value: String(s.id), label: s.code }))]}
                />
              )}
              <FilterSelect
                label={t("common.status", "Statut")}
                value={tous ? "tous" : "actifs"}
                onChange={(v) => { setIsLoading(true); setTous(v === "tous"); }}
                allLabel={null}
                options={[
                  { value: "actifs", label: t("common.active", "Actives") },
                  { value: "tous", label: t("chambre.show_inactive", "Afficher les inactives") },
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

          <ListSection selection={sel} unit="chambre" units="chambres" bulkActions={[{ label: tk("exportExcel", "Exporter Excel"), onClick: (l) => handleExportExcel(l) }]}>
            <DataTable
              columns={TABLE_COLUMNS}
              visible={list.visibleColumns}
              rows={list.paginated}
              sort={list.sort}
              onSort={list.toggleSort}
              selection={sel}
              activeId={selected?.id}
              onRowClick={(c) => setSelected(selected?.id === c.id ? null : c)}
              onRowDoubleClick={openDetails}
              rowClassName={(c) => (c.actif === false ? "kit-row-inactive" : "")}
              loading={isLoading && !chambres.length}
              loadingText={t("common.loading")}
              emptyText={draft.searchTerm || draft.service !== "all"
                ? `${t("chambre.no_match")} — ${t("chambre.empty_search_hint", "Essayez un autre code ou retirez le filtre de service.")}`
                : `${t("chambre.no_data")} — ${t("chambre.empty_hint", "Créez votre première chambre pour commencer.")}`}
            />
            <Pagination total={list.sorted.length} page={list.page} totalPages={list.totalPages} pageSize={list.pageSize} onPage={list.setPage} unit={t("chambre.pagination.rooms", "chambre(s)")} />
          </ListSection>
        </>
      )}

      {viewMode === "details" && selected && (
        <DetailsPage
          onBack={() => setViewMode("list")}
          eyebrow={t("chambre.title")}
          title={`${selected.code} · ${serviceNom(selected.serviceId)}`}
          badge={<span><BadgeImporte item={selected} /><BadgeInactif item={selected} /></span>}
          actions={(
            <>
              <BarcodeLabel item={selected} type="chambre" variant="action" />
              <DetailsButton icon={Pencil} onClick={() => openForm(selected)}>{t("chambre.edit")}</DetailsButton>
              {peutDesactiver(selected) && <DetailsButton icon={Trash2} variant="danger" onClick={() => desactiver(selected)}>{t("chambre.delete")}</DetailsButton>}
            </>
          )}
        >
          <KpiTiles items={[
            { label: t("chambre.beds_total", "Lits"), value: bedStats.total, tone: "blue" },
            { label: t("chambre.free"), value: bedStats.free, tone: "green" },
            { label: t("chambre.occupied"), value: bedStats.occupied, tone: "amber" },
            circuitInfecte && { label: t("chambre.infected"), value: bedStats.infected, tone: "violet" },
          ].filter(Boolean)} />

          <DetailCard title={t("chambre.beds_total", "Lits")}>
            {infectionImportee && (
              <DetailAlert title={t("integration.read_only", "Lecture seule")}>
                <p>{t("chambre.infection_locked", "L'état d'infection est synchronisé depuis le système externe")}</p>
              </DetailAlert>
            )}
            {!litsImportes && selected.actif !== false && (
              <ActionBar>
                <ActionButton icon={IconAjouter} label={t("chambre.new_bed", "Ajouter un lit")} variant="ajouter" onClick={() => ouvrirLit(null)} />
              </ActionBar>
            )}
            <DataTable
              columns={LIT_COLUMNS}
              rows={lits}
              rowClassName={(l) => (l.actif === false ? "kit-row-inactive" : "")}
              loading={isLitsLoading}
              loadingText={t("common.loading")}
              emptyText={t("chambre.no_beds", "Aucun lit")}
            />
          </DetailCard>
        </DetailsPage>
      )}

      {form && (
        <Modal
          className="kit-std-form"
          size="md"
          title={form.chambre ? `${t("chambre.modal.edit_title")} #${form.chambre.id}` : t("chambre.modal.new_title")}
          onClose={isSaving ? undefined : () => setForm(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setForm(null)} disabled={isSaving}>{t("common.cancel")}</Button>
              <Button type="submit" form="chambre-form" disabled={isSaving}>{isSaving ? t("common.saving") : t("common.save")}</Button>
            </>
          )}
        >
          {lectureSeule(form.chambre) && <div className="kit-modal-summary">{t("chambre.form.imported_hint", "Chambre importée : seul le service est modifiable.")}</div>}
          <form id="chambre-form" onSubmit={handleSave}>
            <FormGrid>
              <FormField label={t("chambre.form.code_label")} required={!lectureSeule(form.chambre)}>
                <input value={form.rec.code} onChange={(e) => setRec({ code: e.target.value.toUpperCase() })} placeholder={t("chambre.form.code_placeholder")} required={!lectureSeule(form.chambre)} disabled={lectureSeule(form.chambre)} />
              </FormField>
              <FormField label={t("chambre.code_barre")}>
                <input value={form.rec.codeBarre} onChange={(e) => setRec({ codeBarre: e.target.value })} placeholder={form.chambre ? "" : t("chambre.form.barcode_auto", "Généré si vide")} disabled={lectureSeule(form.chambre)} />
              </FormField>
              <FormField label={t("chambre.form.service_label")} span>
                <select value={form.rec.serviceId || ""} onChange={(e) => setRec({ serviceId: e.target.value ? parseInt(e.target.value) : "" })}>
                  <option value="">{t("chambre.form.no_service")}</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
                </select>
              </FormField>
              <FormField span>
                <Check checked={form.rec.actif} disabled={lectureSeule(form.chambre)} onChange={(v) => setRec({ actif: v })}>{t("common.active", "Actif")}</Check>
              </FormField>
              {!form.chambre && (
                <FormField span>
                  <Check checked={form.rec.creerLitParDefaut} onChange={(v) => setRec({ creerLitParDefaut: v })}>
                    {t("chambre.form.single_bed", "Créer un lit unique avec cette chambre (hôtel)")}
                  </Check>
                </FormField>
              )}
            </FormGrid>
          </form>
        </Modal>
      )}

      {litEdition && (
        <Modal
          className="kit-std-form"
          size="md"
          title={litEdition === "nouveau" ? t("chambre.new_bed", "Ajouter un lit") : `${t("chambre.edit_bed", "Modifier le lit")} #${litEdition.id}`}
          subtitle={selected?.code}
          onClose={savingLit ? undefined : () => setLitEdition(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setLitEdition(null)} disabled={savingLit}>{t("common.cancel")}</Button>
              <Button type="submit" form="lit-form" disabled={savingLit}>{savingLit ? t("common.saving") : t("common.save")}</Button>
            </>
          )}
        >
          <form id="lit-form" onSubmit={enregistrerLit}>
            <FormGrid>
              <FormField label={t("chambre.code")} required={litEdition === "nouveau"}>
                <input value={litForm.code} onChange={(e) => setLitForm({ ...litForm, code: e.target.value })} required={litEdition === "nouveau"} />
              </FormField>
              <FormField label={t("chambre.bed_reference", "Référence")}>
                <input value={litForm.reference} maxLength={20} onChange={(e) => setLitForm({ ...litForm, reference: e.target.value })} />
              </FormField>
              <FormField label={t("chambre.bed_description", "Description")}>
                <input value={litForm.description} onChange={(e) => setLitForm({ ...litForm, description: e.target.value })} />
              </FormField>
              <FormField label={t("chambre.bed_type", "Type")}>
                <input value={litForm.type} maxLength={20} list="types-lit" onChange={(e) => setLitForm({ ...litForm, type: e.target.value })} />
                <datalist id="types-lit">{TYPES_LIT.map((ty) => <option key={ty} value={ty} />)}</datalist>
              </FormField>
              <FormField span>
                <Check checked={litForm.actif} onChange={(v) => setLitForm({ ...litForm, actif: v })}>{t("common.active", "Actif")}</Check>
              </FormField>
            </FormGrid>
          </form>
        </Modal>
      )}

      {showStats && (
        <QuickStats
          title={t("chambre.title")}
          subtitle={`${chambres.length} chambre(s)`}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t("chambre.kpi_total", "Chambres"), value: kpis.total },
            { label: t("chambre.kpi_services", "Services couverts"), value: kpis.servicesCovered, color: "#3b82f6" },
            { label: t("chambre.kpi_barcode", "Étiquetées"), value: kpis.withBarcode, color: "#10b981" },
            { label: t("chambre.kpi_unassigned", "Sans service"), value: kpis.unassigned, color: "#f59e0b" },
          ]}
          classements={[{
            title: t("chambre.service"),
            items: Object.entries(chambres.reduce((acc, c) => { const k = serviceNom(c.serviceId); acc[k] = (acc[k] || 0) + 1; return acc; }, {}))
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
