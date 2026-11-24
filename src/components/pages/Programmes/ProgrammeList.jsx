import React, { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "../../kit/dialogueApi";
import { RefreshCw, Pencil, Trash2, Droplets, Wind, Star, ShieldPlus, Check } from "lucide-react";
import { ProgrammeContext } from "../../../contextes/ProgrammeContext";
import { CategoryPicker } from "../../ui/CategoryPicker";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import {
  Page, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterActions,
  ListSection, DataTable, Pagination, Badge,
  Modal, Button, FormField, TextArea, ConfirmDialog,
  DetailsPage, DetailsButton, KpiTiles, DetailCard, DetailGrid, InfoList, DetailText,
  ColumnSettingsModal, useListPage, useRowSelection, exportExcel,
  Tabs, FormGrid, Code, QuickStats,
} from "../../kit";
import { IconAjouter, IconDetails, IconModifier, IconSupprimer } from "../../kit/ActionIcons";
import GroupeLavageBadge, { GROUPES_LAVAGE } from "../../utils/shared/GroupeLavageBadge";
import "./Programmes.css";

const VIDE = { typeProgramme: "LAVAGE", nom: "", temperatureCelsius: "", dureeMinutes: "", vitesseEssorageRpm: "", niveauHumidite: "", description: "", categories: [], parDefaut: false, groupeLavage: "" };

const TYPES_PROGRAMME = [
  { value: "LAVAGE", Icon: Droplets, tone: "info" },
  { value: "DESINFECTION", Icon: ShieldPlus, tone: "danger" },
];
const typeDe = (p) => (p?.type === "DESINFECTION" ? "DESINFECTION" : "LAVAGE");

const COLUMNS_DEFAULT = [
  { key: "id", label: "ID", visible: true, searchable: true },
  { key: "nom", label: "Nom", visible: true, searchable: true },
  { key: "type", label: "Type", visible: true, searchable: true },
  { key: "temperatureCelsius", label: "Température", visible: true, searchable: false },
  { key: "dureeMinutes", label: "Durée", visible: true, searchable: false },
  { key: "parametre", label: "Essorage / Humidité", visible: true, searchable: false },
  { key: "groupeLavage", label: "Groupe", visible: true, searchable: true },
  { key: "categories", label: "Catégories", visible: true, searchable: true },
  { key: "parDefaut", label: "Par défaut", visible: true, searchable: false },
  { key: "description", label: "Description", visible: false, searchable: true },
];

const peutEtreParDefaut = (type) => !type || type === "LAVAGE";

const moyenne = (liste, champ) => (liste.length ? Math.round(liste.reduce((acc, p) => acc + (p[champ] || 0), 0) / liste.length) : 0);

export default function ProgrammeList() {
  const { t } = useTranslation();
  const {
    programmesLavage, programmesSechage, loadProgrammesLavage, loadProgrammesSechage,
    createProgrammeLavage, updateProgrammeLavage, deleteProgrammeLavage, definirProgrammeLavageParDefaut,
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
  const [defautCible, setDefautCible] = useState(null);
  const [defautEnCours, setDefautEnCours] = useState(false);

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
      parDefaut: t("programmes.default_label", "Par défaut"), type: t("programmes.type_label"),
      groupeLavage: t("groupe_lavage.label", "Groupe"),
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
      case "parDefaut": return p.parDefaut ? t("programmes.default_label", "Par défaut") : "";
      case "type": return lavage ? t(`programmes.type_${typeDe(p)}`) : t("programmes.sechage");
      default: return p[key] ?? "";
    }
  };
  const sortValue = (p, key) => {
    if (key === "id") return Number(p.id) || 0;
    if (key === "temperatureCelsius" || key === "dureeMinutes") return Number(p[key]) || 0;
    if (key === "parametre") return Number(parametre(p)) || 0;
    if (key === "parDefaut") return p.parDefaut ? 0 : 1;
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
      typeProgramme: { initial: "all", column: "type", test: (p, v) => v === "all" || !lavage || typeDe(p) === v },
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
        typeProgramme: typeDe(p),
        nom: p.nom || "", temperatureCelsius: p.temperatureCelsius || "", dureeMinutes: p.dureeMinutes || "",
        vitesseEssorageRpm: p.vitesseEssorageRpm || "", niveauHumidite: p.niveauHumidite || "",
        description: p.description || "", categories: p.categories || [],
        parDefaut: !!p.parDefaut,
        groupeLavage: p.groupeLavage || "",
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
    const payload = {
      type: lavage ? rec.typeProgramme : (programme?.type || mode),
      nom: rec.nom.trim(),
      temperatureCelsius: parseInt(rec.temperatureCelsius) || null,
      dureeMinutes: parseInt(rec.dureeMinutes) || null,
      description: rec.description || null,
      categories: rec.categories || [],
      groupeLavage: rec.groupeLavage || null,
    };
    if (lavage) payload.vitesseEssorageRpm = parseInt(rec.vitesseEssorageRpm) || null;
    else payload.niveauHumidite = parseInt(rec.niveauHumidite) || null;
    const aDefinirParDefaut = lavage && peutEtreParDefaut(payload.type) && rec.parDefaut && !programme?.parDefaut;
    setIsSaving(true);
    try {
      if (programme) {
        await (lavage ? updateProgrammeLavage : updateProgrammeSechage)(programme.id, payload);
        if (aDefinirParDefaut) await definirProgrammeLavageParDefaut(programme.id);
        Swal.fire(t("common.success"), t("programmes.update_success"), "success");
        setSelected(null);
        setViewMode("list");
      } else {
        const cree = await (lavage ? createProgrammeLavage : createProgrammeSechage)(payload);
        if (aDefinirParDefaut && cree?.id != null) await definirProgrammeLavageParDefaut(cree.id);
        Swal.fire(t("common.success"), t("programmes.create_success"), "success");
      }
      await loadData();
      setForm(null);
    } catch (error) {
      await loadData();
      Swal.fire(t("common.error"), error.response?.data?.message || error.message || t("programmes.error_text"), "error");
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

  const confirmerDefaut = async () => {
    const cible = defautCible;
    setDefautEnCours(true);
    try {
      await definirProgrammeLavageParDefaut(cible.id);
      setDefautCible(null);
      await loadData();
      setSelected((s) => (s && s.id === cible.id ? { ...s, parDefaut: true } : s));
      Swal.fire(t("common.success"), t("programmes.default_success", "{{nom}} est maintenant le programme par défaut.", { nom: cible.nom }), "success");
    } catch (error) {
      Swal.fire(t("common.error"), error.response?.data?.message || error.message || t("programmes.error_text"), "error");
    } finally {
      setDefautEnCours(false);
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
    type: {
      label: t("programmes.type_label"), sortable: true, align: "center",
      render: (p) => {
        const ty = TYPES_PROGRAMME.find((x) => x.value === typeDe(p));
        return <Badge variant={ty.tone}><ty.Icon size={11} style={{ marginRight: 4, verticalAlign: -1 }} />{t(`programmes.type_${ty.value}`)}</Badge>;
      },
    },
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
    groupeLavage: { label: t("groupe_lavage.label", "Groupe"), sortable: true, align: "center", render: (p) => <GroupeLavageBadge groupe={p.groupeLavage} vide={<span className="kit-muted">—</span>} /> },
    categories: { label: t("programmes.categories_label"), sortable: true, render: (p) => <Categories liste={p.categories} /> },
    parDefaut: {
      label: t("programmes.default_label", "Par défaut"), sortable: true, align: "center",
      render: (p) => (p.parDefaut ? <Badge variant="warning"><Star size={11} fill="currentColor" style={{ marginRight: 4, verticalAlign: -1 }} />{t("programmes.default_label", "Par défaut")}</Badge> : <span className="kit-muted">—</span>),
    },
    description: { label: t("programmes.description"), sortable: true, render: (p) => p.description || "—" },
  };

  const defautAutorise = lavage && form?.rec?.typeProgramme === "LAVAGE";
  const typeVerrouille = Boolean(form?.programme?.parDefaut);
  const changerType = (value) => {
    if (typeVerrouille && value !== "LAVAGE") return;
    setRec(value === "DESINFECTION" ? { typeProgramme: value, parDefaut: false } : { typeProgramme: value });
  };
  const colonnesVisibles = list.visibleColumns.filter((c) => lavage || c.key !== "type");

  return (
    <Page>
      {viewMode === "list" && (
        <>
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
              {lavage && list.isColVisible("type") && (
                <FilterSelect
                  label={t("programmes.type_label")}
                  value={draft.typeProgramme}
                  onChange={(v) => setFilter("typeProgramme", v)}
                  allLabel={t("programmes.all_types")}
                  options={TYPES_PROGRAMME.map((x) => ({ value: x.value, label: t(`programmes.type_${x.value}`) }))}
                />
              )}
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
              visible={colonnesVisibles}
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
          badge={lavage && typeDe(selected) === "DESINFECTION"
            ? <Badge variant="danger"><ShieldPlus size={11} style={{ marginRight: 4, verticalAlign: -1 }} />{t("programmes.type_DESINFECTION")}</Badge>
            : selected.parDefaut ? <Badge variant="warning"><Star size={11} fill="currentColor" style={{ marginRight: 4, verticalAlign: -1 }} />{t("programmes.default_label", "Par défaut")}</Badge> : undefined}
          actions={(
            <>
              {lavage && peutEtreParDefaut(selected.type) && !selected.parDefaut && (
                <DetailsButton icon={Star} onClick={() => setDefautCible(selected)}>{t("programmes.set_default", "Définir par défaut")}</DetailsButton>
              )}
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
              <InfoList items={[
                { label: t("programmes.id"), value: selected.id },
                { label: t("programmes.type_label"), value: lavage ? t(`programmes.type_${typeDe(selected)}`) : t("programmes.sechage") },
                ...(lavage ? [{ label: t("programmes.default_label", "Par défaut"), value: selected.parDefaut ? t("common.yes", "Oui") : t("common.no", "Non") }] : []),
              ]} />
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
              {lavage && (
                <FormField label={t("programmes.type_label")} required span hint={typeVerrouille ? t("programmes.type_locked_default") : undefined}>
                  <div className="prg-types" role="radiogroup" aria-label={t("programmes.type_label")}>
                    {TYPES_PROGRAMME.map(({ value, Icon }) => {
                      const actif = form.rec.typeProgramme === value;
                      const bloque = typeVerrouille && value !== "LAVAGE";
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={actif}
                          disabled={bloque || isSaving}
                          className={`prg-type prg-type--${value.toLowerCase()} ${actif ? "is-active" : ""}`}
                          onClick={() => changerType(value)}
                        >
                          <span className="prg-type__icon"><Icon size={20} /></span>
                          <span className="prg-type__text">
                            <strong>{t(`programmes.type_${value}`)}</strong>
                            <small>{t(`programmes.type_${value}_hint`)}</small>
                          </span>
                          {actif && <span className="prg-type__check"><Check size={13} strokeWidth={3} /></span>}
                        </button>
                      );
                    })}
                  </div>
                </FormField>
              )}
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
              <FormField label={t("groupe_lavage.label", "Groupe")} span>
                <select value={form.rec.groupeLavage || ""} onChange={(e) => setRec({ groupeLavage: e.target.value })}>
                  <option value="">{t("groupe_lavage.aucun", "Aucun")}</option>
                  {GROUPES_LAVAGE.map((g) => <option key={g} value={g}>{t(`groupe_lavage.${g}`, g)}</option>)}
                </select>
              </FormField>
              {lavage && (
                <FormField
                  label={t("programmes.default_label", "Par défaut")}
                  span
                  hint={!defautAutorise
                    ? t("programmes.default_disabled_hint", "Un programme de désinfection ne peut pas être le programme par défaut.")
                    : form.programme?.parDefaut
                      ? t("programmes.default_current_hint", "C'est le programme par défaut actuel. Définissez-en un autre pour le remplacer.")
                      : t("programmes.default_hint", "Utilisé pour les catégories sans programme de lavage. Remplace l'ancien programme par défaut.")}
                >
                  <label style={{ display: "flex", alignItems: "center", gap: 8, height: 38, cursor: defautAutorise && !form.programme?.parDefaut ? "pointer" : "not-allowed", opacity: defautAutorise ? 1 : 0.55 }}>
                    <input
                      type="checkbox"
                      style={{ width: "auto" }}
                      checked={defautAutorise && !!form.rec.parDefaut}
                      disabled={!defautAutorise || !!form.programme?.parDefaut}
                      onChange={(e) => setRec({ parDefaut: e.target.checked })}
                    />
                    {t("programmes.default_checkbox", "Programme par défaut")}
                  </label>
                </FormField>
              )}
              <FormField
                label={t("programmes.categories_placeholder")}
                span
                hint={t("programmes.categories_optional_hint")}
              >
                <CategoryPicker
                  multiple
                  value={form.rec.categories}
                  onChange={(categories) => setRec({ categories })}
                />
              </FormField>
            </FormGrid>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!defautCible}
        tone="success"
        title={t("programmes.set_default", "Définir par défaut")}
        message={t("programmes.set_default_confirm", "Ce programme sera utilisé pour les catégories sans programme de lavage. L'ancien programme par défaut ne le sera plus.")}
        details={<strong>{defautCible?.nom}</strong>}
        confirmLabel={t("programmes.set_default", "Définir par défaut")}
        cancelLabel={t("common.cancel")}
        busy={defautEnCours}
        onConfirm={confirmerDefaut}
        onClose={() => setDefautCible(null)}
      />

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
            ...(lavage ? [{ label: t("programmes.stats_desinfection"), value: programmes.filter((p) => typeDe(p) === "DESINFECTION").length, color: "#dc2626" }] : []),
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
