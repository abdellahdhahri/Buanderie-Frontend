import React, { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { RefreshCw, Pencil, Trash2, Droplets, Wind } from "lucide-react";
import { ProgrammeContext } from "../../../contextes/ProgrammeContext";
import { CategoryPicker } from "../../ui/CategoryPicker";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";
import {
  Page, PageHeader, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterActions,
  ListSection, DataTable, Pagination, Badge,
  Modal, Button, FormField, TextArea, ConfirmDialog,
  DetailsPage, DetailsButton, KpiTiles, DetailCard, DetailGrid, InfoList, DetailText,
  ColumnSettingsModal, useListPage, useRowSelection, exportExcel,
  Tabs, RowActions, RowButton, FormGrid, Code, QuickStats,
} from "../../kit";
import { IconAjouter, IconDetails, IconModifier, IconSupprimer } from "../../kit/ActionIcons";

const VIDE = { nom: "", temperatureCelsius: "", dureeMinutes: "", vitesseEssorageRpm: "", niveauHumidite: "", description: "", categories: [] };

const COLUMNS_DEFAULT = [
  { key: "id", label: "ID", visible: true, searchable: true },
  { key: "nom", label: "Nom", visible: true, searchable: true },
  { key: "temperatureCelsius", label: "Température", visible: true, searchable: false },
  { key: "dureeMinutes", label: "Durée", visible: true, searchable: false },
  { key: "parametre", label: "Essorage / Humidité", visible: true, searchable: false },
  { key: "categories", label: "Catégories", visible: true, searchable: true },
  { key: "description", label: "Description", visible: false, searchable: true },
  { key: "actions", label: "Actions", visible: true, searchable: false },
];

const moyenne = (liste, champ) => (liste.length ? Math.round(liste.reduce((acc, p) => acc + (p[champ] || 0), 0) / liste.length) : 0);

export default function ProgrammeList() {
  const { t } = useTranslation();
  const {
    programmesLavage, programmesSechage, loadProgrammesLavage, loadProgrammesSechage,
    createProgrammeLavage, updateProgrammeLavage, deleteProgrammeLavage,
    createProgrammeSechage, updateProgrammeSechage, deleteProgrammeSechage,
    isLoading, setLoading,
  } = useContext(ProgrammeContext);

  const [mode, setMode] = useState("LAVAGE");
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const lavage = mode === "LAVAGE";

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadProgrammesLavage(), loadProgrammesSechage()]);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const programmes = (lavage ? programmesLavage : programmesSechage) || [];
  const categorieLabel = (c) => t(`categories.${c}`, c);

  const columns = useMemo(() => COLUMNS_DEFAULT.map((c) => ({
    ...c,
    label: {
      id: t("programmes.id"), nom: t("programmes.name"), temperatureCelsius: t("programmes.temperature_label"),
      dureeMinutes: t("programmes.duration_label"), parametre: lavage ? t("programmes.spin_label") : t("programmes.humidity_label"),
      categories: t("programmes.categories_label"), description: t("programmes.description"), actions: t("programmes.actions"),
    }[c.key] || c.label,
  })), [t, lavage]);

  const parametre = (p) => (lavage ? p.vitesseEssorageRpm : p.niveauHumidite);
  const searchValue = (p, key) => {
    switch (key) {
      case "temperatureCelsius": return p.temperatureCelsius != null ? `${p.temperatureCelsius}°C` : "";
      case "dureeMinutes": return p.dureeMinutes != null ? `${p.dureeMinutes} min` : "";
      case "parametre": return parametre(p) != null ? `${parametre(p)} ${lavage ? "RPM" : "%"}` : "";
      case "categories": return (p.categories || []).map(categorieLabel).join(", ");
      case "actions": return "";
      default: return p[key] ?? "";
    }
  };
  const sortValue = (p, key) => {
    if (key === "id") return Number(p.id) || 0;
    if (key === "temperatureCelsius" || key === "dureeMinutes") return Number(p[key]) || 0;
    if (key === "parametre") return Number(parametre(p)) || 0;
    return String(searchValue(p, key)).toLowerCase();
  };

  const toutesCategories = useMemo(() => [...new Set(programmes.flatMap((p) => p.categories || []))], [programmes]);

  const list = useListPage({
    rows: programmes,
    columns,
    getSearchValue: searchValue,
    getSortValue: sortValue,
    filters: {
      categorie: { initial: "all", column: "categories", test: (p, v) => v === "all" || (p.categories || []).includes(v) },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const changeMode = (m) => { setMode(m); setSelected(null); setViewMode("list"); list.setPage(1); };
  const openDetails = (p) => { if (p) { setSelected(p); setViewMode("details"); } };
  const openCreate = () => setForm({ programme: null, rec: { ...VIDE } });
  const openEdit = (p) => {
    if (!p) return;
    setForm({
      programme: p,
      rec: {
        nom: p.nom || "", temperatureCelsius: p.temperatureCelsius || "", dureeMinutes: p.dureeMinutes || "",
        vitesseEssorageRpm: p.vitesseEssorageRpm || "", niveauHumidite: p.niveauHumidite || "",
        description: p.description || "", categories: p.categories || [],
      },
    });
  };
  const setRec = (patch) => setForm((f) => ({ ...f, rec: { ...f.rec, ...patch } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { programme, rec } = form;
    if (!rec.nom.trim()) {
      Swal.fire(t("common.error"), t("programmes.name_required"), "error");
      return;
    }
    if (rec.categories.length === 0) {
      Swal.fire(t("common.error"), t("programmes.categories_required"), "error");
      return;
    }
    const payload = {
      type: programme?.type || mode,
      nom: rec.nom.trim(),
      temperatureCelsius: parseInt(rec.temperatureCelsius) || null,
      dureeMinutes: parseInt(rec.dureeMinutes) || null,
      description: rec.description || null,
      categories: rec.categories || [],
    };
    if (lavage) payload.vitesseEssorageRpm = parseInt(rec.vitesseEssorageRpm) || null;
    else payload.niveauHumidite = parseInt(rec.niveauHumidite) || null;
    setIsSaving(true);
    try {
      if (programme) {
        await (lavage ? updateProgrammeLavage : updateProgrammeSechage)(programme.id, payload);
        Swal.fire(t("common.success"), t("programmes.update_success"), "success");
        setSelected(null);
        setViewMode("list");
      } else {
        await (lavage ? createProgrammeLavage : createProgrammeSechage)(payload);
        Swal.fire(t("common.success"), t("programmes.create_success"), "success");
      }
      await loadData();
      setForm(null);
    } catch (error) {
      Swal.fire(t("common.error"), error.message || t("programmes.error_text"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    const cible = deleteTarget;
    setDeleteTarget(null);
    try {
      await (lavage ? deleteProgrammeLavage : deleteProgrammeSechage)(cible.id);
      await loadData();
      setSelected(null);
      setViewMode("list");
      Swal.fire(t("common.success"), t("programmes.delete_success"), "success");
    } catch (error) {
      Swal.fire(t("common.error"), error.message || t("programmes.error_text"), "error");
    }
  };

  const handleExportExcel = (lignes) => {
    const source = Array.isArray(lignes) ? lignes : list.sorted;
    if (!source.length) return;
    exportExcel({
      fileName: `programmes_${mode.toLowerCase()}`,
      sheetName: lavage ? t("programmes.lavage") : t("programmes.sechage"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const Categories = ({ liste, max = 3 }) => {
    if (!liste?.length) return <span className="kit-muted">{t("programmes.no_categories")}</span>;
    const affichees = max ? liste.slice(0, max) : liste;
    return (
      <div className="kit-chips">
        {affichees.map((cat) => {
          const { Icon, accent } = getCategorieMeta(cat);
          return (
            <span key={cat} className="kit-chip">
              <Icon size={12} color={accent} /> {categorieLabel(cat)}
            </span>
          );
        })}
        {max && liste.length > max && <span className="kit-chip">+{liste.length - max}</span>}
      </div>
    );
  };

  const TABLE_COLUMNS = {
    id: { label: t("programmes.id"), sortable: true, render: (p) => <Code>#{p.id}</Code> },
    nom: {
      label: t("programmes.name"), sortable: true,
      render: (p) => (
        <div>
          <strong>{p.nom}</strong>
          {p.description && <small style={{ display: "block", color: "var(--slate-500)" }}>{p.description}</small>}
        </div>
      ),
    },
    temperatureCelsius: { label: t("programmes.temperature_label"), sortable: true, align: "center", render: (p) => <Badge variant="danger">{p.temperatureCelsius || "—"}°C</Badge> },
    dureeMinutes: { label: t("programmes.duration_label"), sortable: true, align: "center", render: (p) => <Badge variant="info">{p.dureeMinutes || "—"} min</Badge> },
    parametre: {
      label: lavage ? t("programmes.spin_label") : t("programmes.humidity_label"), sortable: true, align: "center",
      render: (p) => <Badge variant="default">{parametre(p) || "—"} {lavage ? "RPM" : "%"}</Badge>,
    },
    categories: { label: t("programmes.categories_label"), sortable: true, render: (p) => <Categories liste={p.categories} /> },
    description: { label: t("programmes.description"), sortable: true, render: (p) => p.description || "—" },
    actions: {
      label: t("programmes.actions"), align: "center",
      render: (p) => (
        <RowActions>
          <RowButton icon={Pencil} title={t("programmes.edit")} onClick={() => openEdit(p)} />
          <RowButton icon={Trash2} tone="danger" title={t("programmes.delete")} onClick={() => setDeleteTarget(p)} />
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
            title={lavage ? t("programmes.title_lavage") : t("programmes.title_sechage")}
            subtitle={lavage ? t("programmes.subtitle_lavage") : t("programmes.subtitle_sechage")}
            total={list.sorted.length}
            onIconClick={() => setShowColumnSettings(true)}
          />

          <ActionBar>
            <ActionButton icon={IconAjouter} label={lavage ? t("programmes.new_lavage") : t("programmes.new_sechage")} variant="ajouter" onClick={openCreate} />
            <ActionButton icon={IconDetails} label={t("common.details")} variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={IconModifier} label={t("programmes.edit")} variant="modifier" disabled={!selected} onClick={() => openEdit(selected)} />
            <ActionButton icon={IconSupprimer} label={t("programmes.delete")} variant="supprimer" disabled={!selected} onClick={() => setDeleteTarget(selected)} />
            <ActionButton icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />} label={t("programmes.refresh")} variant="details" onClick={loadData} />
          </ActionBar>

          <div className="kit-toolbar">
            <Tabs
              value={mode}
              onChange={changeMode}
              items={[
                { value: "LAVAGE", icon: <Droplets size={16} />, label: t("programmes.lavage"), count: programmesLavage?.length || 0 },
                { value: "SECHAGE", icon: <Wind size={16} />, label: t("programmes.sechage"), count: programmesSechage?.length || 0 },
              ]}
            />
          </div>

          <FilterPanel>
            <FilterRow>
              <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
              <FilterText
                label={t("common.search")}
                placeholder={t("programmes.search_placeholder")}
                value={draft.searchTerm}
                onChange={(v) => setFilter("searchTerm", v)}
                onEnter={list.apply}
              />
              {list.isColVisible("categories") && (
                <FilterSelect
                  label={t("programmes.categories_label")}
                  value={draft.categorie}
                  onChange={(v) => setFilter("categorie", v)}
                  allLabel={t("programmes.all_categories")}
                  options={toutesCategories.map((c) => ({ value: c, label: categorieLabel(c) }))}
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
            unit="programme"
            units="programmes"
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
              onRowDoubleClick={openDetails}
              loading={isLoading && !programmes.length}
              loadingText={t("programmes.loading")}
              emptyText={draft.searchTerm ? t("programmes.no_match") : t("programmes.no_data")}
            />
            <Pagination total={list.sorted.length} page={list.page} totalPages={list.totalPages} pageSize={list.pageSize} onPage={list.setPage} unit="programme(s)" />
          </ListSection>
        </>
      )}

      {viewMode === "details" && selected && (
        <DetailsPage
          onBack={() => setViewMode("list")}
          eyebrow={lavage ? t("programmes.lavage") : t("programmes.sechage")}
          title={`#${selected.id} · ${selected.nom}`}
          actions={(
            <>
              <DetailsButton icon={Pencil} onClick={() => openEdit(selected)}>{t("programmes.edit")}</DetailsButton>
              <DetailsButton icon={Trash2} variant="danger" onClick={() => setDeleteTarget(selected)}>{t("programmes.delete")}</DetailsButton>
            </>
          )}
        >
          <KpiTiles items={[
            { label: t("programmes.temperature_label"), value: `${selected.temperatureCelsius || "—"}°C`, tone: "amber" },
            { label: t("programmes.duration_label"), value: `${selected.dureeMinutes || "—"} min`, tone: "blue" },
            { label: lavage ? t("programmes.spin_label") : t("programmes.humidity_label"), value: `${parametre(selected) || "—"} ${lavage ? "RPM" : "%"}`, tone: "green" },
          ]} />
          <DetailGrid>
            <DetailCard title={t("programmes.categories_label")}>
              <Categories liste={selected.categories} max={0} />
            </DetailCard>
            <DetailCard title={t("programmes.description")}>
              <DetailText>{selected.description}</DetailText>
              <InfoList items={[{ label: t("programmes.id"), value: selected.id }, { label: "Type", value: selected.type || mode }]} />
            </DetailCard>
          </DetailGrid>
        </DetailsPage>
      )}

      {form && (
        <Modal
          className="kit-std-form"
          size="md"
          title={form.programme
            ? (lavage ? t("programmes.edit_lavage") : t("programmes.edit_sechage"))
            : (lavage ? t("programmes.new_lavage") : t("programmes.new_sechage"))}
          onClose={isSaving ? undefined : () => setForm(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setForm(null)} disabled={isSaving}>{t("common.cancel")}</Button>
              <Button type="submit" form="programme-form" disabled={isSaving}>{isSaving ? t("common.saving") : t("programmes.save")}</Button>
            </>
          )}
        >
          <form id="programme-form" onSubmit={handleSubmit}>
            <FormGrid>
              <FormField label={t("programmes.name")} required span>
                <input value={form.rec.nom} onChange={(e) => setRec({ nom: e.target.value.toUpperCase() })} placeholder={t("programmes.name_placeholder")} required />
              </FormField>
              <FormField label={t("programmes.temperature")}>
                <input type="number" min="0" max="100" value={form.rec.temperatureCelsius} onChange={(e) => setRec({ temperatureCelsius: e.target.value })} placeholder={t("programmes.temperature_placeholder")} />
              </FormField>
              <FormField label={t("programmes.duration")}>
                <input type="number" min="1" value={form.rec.dureeMinutes} onChange={(e) => setRec({ dureeMinutes: e.target.value })} placeholder={t("programmes.duration_placeholder")} />
              </FormField>
              {lavage ? (
                <FormField label={t("programmes.spin_speed")}>
                  <input type="number" min="0" value={form.rec.vitesseEssorageRpm} onChange={(e) => setRec({ vitesseEssorageRpm: e.target.value })} placeholder={t("programmes.spin_speed_placeholder")} />
                </FormField>
              ) : (
                <FormField label={t("programmes.humidity")}>
                  <input type="number" min="0" max="100" value={form.rec.niveauHumidite} onChange={(e) => setRec({ niveauHumidite: e.target.value })} placeholder={t("programmes.humidity_placeholder")} />
                </FormField>
              )}
              <FormField label={t("programmes.description")} span>
                <TextArea value={form.rec.description} onChange={(v) => setRec({ description: v })} placeholder={t("programmes.description_placeholder")} />
              </FormField>
              <FormField label={t("programmes.categories_placeholder")} required span error={form.rec.categories.length === 0 ? t("programmes.categories_error") : null}>
                <CategoryPicker
                  multiple
                  value={form.rec.categories}
                  onChange={(categories) => setRec({ categories })}
                  invalid={form.rec.categories.length === 0}
                />
              </FormField>
            </FormGrid>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t("programmes.delete_confirm")}
          message={t("programmes.delete_confirm_text")}
          details={<strong>{deleteTarget.nom}</strong>}
          confirmLabel={t("programmes.delete_confirm_yes")}
          cancelLabel={t("programmes.delete_confirm_no")}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {showStats && (
        <QuickStats
          title={lavage ? t("programmes.title_lavage") : t("programmes.title_sechage")}
          subtitle={`${programmes.length} programme(s)`}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t("programmes.stats_total"), value: programmes.length },
            { label: t("programmes.stats_avg_temp"), value: `${moyenne(programmes, "temperatureCelsius")}°C`, color: "#ef4444" },
            { label: t("programmes.stats_avg_duration"), value: `${moyenne(programmes, "dureeMinutes")} min`, color: "#3b82f6" },
            { label: t("programmes.stats_categories"), value: toutesCategories.length, color: "#8b5cf6" },
          ]}
          classements={[{ title: t("programmes.categories_label"), items: toutesCategories.map((c) => ({ label: categorieLabel(c), value: programmes.filter((p) => (p.categories || []).includes(c)).length })).sort((a, b) => b.value - a.value) }]}
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
