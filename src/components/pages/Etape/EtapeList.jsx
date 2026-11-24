import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "../../kit/dialogueApi";
import { RefreshCw, Pencil, Trash2, Users, BarChart3, Printer, UserMinus, Loader2, Clock } from "lucide-react";
import { useEtape, EtapeProvider } from "../../../contextes/EtapeContext";
import BadgeModal from "../../ui/modals/BadgeModal";
import BarcodeLabel from "../../BarcodeLabel";
import { fetchStatistiquesPersonnel, getTypeOperationInfo } from "../../../services/statistiqueService";
import {
  Page, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterActions,
  ListSection, DataTable, Pagination, Badge, PersonCell,
  Modal, Button, FormField, ConfirmDialog,
  DetailsPage, DetailsButton, KpiTiles, DetailCard,
  ColumnSettingsModal, useListPage, useRowSelection, exportExcel,
  Tabs, FormGrid, Code, tk,
} from "../../kit";
import { IconAjouter, IconDetails, IconModifier, IconSupprimer } from "../../kit/ActionIcons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const COLUMNS_DEFAULT = [
  { key: "nom", label: "Étape", visible: true, searchable: true },
  { key: "codeBarre", label: "Code-barres", visible: true, searchable: true },
  { key: "zone", label: "Zone", visible: true, searchable: true },
  { key: "categorie", label: "Catégorie", visible: false, searchable: true },
  { key: "ordre", label: "Ordre", visible: true, searchable: false },
];

const zoneVariant = (zone = "") => {
  const z = zone.toLowerCase();
  if (z.includes("sale")) return "warning";
  if (z.includes("propre")) return "success";
  return "default";
};

const lireToken = () => {
  const brut = localStorage.getItem("auth");
  if (!brut) return "";
  try { return JSON.parse(brut).token || ""; } catch { return brut; }
};

function AjoutPersonnelModal({ etape, onClose, onAdded }) {
  const { t } = useTranslation();
  const { addPersonnelToEtape } = useEtape();
  const [recherche, setRecherche] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [choisi, setChoisi] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const timer = useRef(null);

  const chercher = useCallback(async (query) => {
    if (!query || query.length < 2) { setSuggestions([]); return; }
    setIsSearching(true);
    try {
      const token = lireToken();
      const response = await fetch(`${API_URL}/api/personnel?actifs=true`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) { setSuggestions([]); return; }
      const data = await response.json();
      const liste = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.content) ? data.content : [];
      const q = query.toLowerCase();
      setSuggestions(liste
        .map((p) => ({
          id: p.id, nom: p.nom ?? "", prenom: p.prenom ?? "",
          nomPrenom: p.nomPrenom ?? `${p.nom ?? ""} ${p.prenom ?? ""}`.trim(),
          matricule: p.matricule ?? p.codeBarre, codeBarre: p.codeBarre, fonction: p.fonction,
        }))
        .filter((p) => [p.nom, p.prenom, p.codeBarre, p.matricule].some((v) => v?.toLowerCase().includes(q)))
        .slice(0, 20));
    } catch (error) {
      console.error("Erreur recherche personnels:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (choisi && recherche === `${choisi.nom} ${choisi.prenom || ""}`.trim()) return undefined;
    timer.current = setTimeout(() => chercher(recherche), 300);
    return () => clearTimeout(timer.current);
  }, [recherche, chercher, choisi]);

  const ajouter = async () => {
    if (!choisi) {
      Swal.fire({ icon: "warning", title: t("etapes.select_personnel"), text: t("etapes.select_personnel_text"), timer: 1500, showConfirmButton: false });
      return;
    }
    setIsAdding(true);
    try {
      await addPersonnelToEtape(etape.id, choisi.id);
      onAdded?.();
      onClose();
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Modal
      className="kit-std-form"
      size="sm"
      title={t("etapes.add_personnel")}
      subtitle={etape.nom}
      onClose={isAdding ? undefined : onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={isAdding}>{t("common.cancel")}</Button>
          <Button onClick={ajouter} disabled={isAdding || !choisi}>{isAdding ? t("common.saving") : t("etapes.add")}</Button>
        </>
      )}
    >
      <FormField label={t("etapes.search_personnel")} hint={isSearching ? t("common.loading") : null}>
        <input
          value={recherche}
          onChange={(e) => { setRecherche(e.target.value); setChoisi(null); }}
          placeholder={t("etapes.search_personnel_placeholder")}
          autoFocus
        />
      </FormField>
      {suggestions.length > 0 && !choisi && (
        <div className="kit-ss__menu" style={{ position: "static", maxHeight: 260, overflowY: "auto", marginTop: 8 }}>
          {suggestions.map((p) => (
            <button
              key={p.id}
              type="button"
              className="kit-ss__option"
              style={{ width: "100%", textAlign: "left", display: "block", padding: "8px 12px", background: "none", border: "none", cursor: "pointer" }}
              onClick={() => { setChoisi(p); setRecherche(`${p.nom} ${p.prenom || ""}`.trim()); setSuggestions([]); }}
            >
              <PersonCell id={p.id} nom={p.nom} prenom={p.prenom} label={p.nomPrenom} sub={p.codeBarre || p.matricule} />
            </button>
          ))}
        </div>
      )}
      {recherche.length >= 2 && !suggestions.length && !isSearching && !choisi && (
        <p className="kit-muted" style={{ marginTop: 8 }}>{t("etapes.no_personnel_found")}</p>
      )}
      {choisi && (
        <div className="kit-modal-summary">
          <PersonCell id={choisi.id} nom={choisi.nom} prenom={choisi.prenom} label={choisi.nomPrenom} sub={choisi.codeBarre} />
        </div>
      )}
    </Modal>
  );
}

function OngletPersonnel({ etape }) {
  const { t } = useTranslation();
  const { personnels, associations, removePersonnelFromEtape, loadPersonnels, loading } = useEtape();
  const [recherche, setRecherche] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [badgeEmployee, setBadgeEmployee] = useState(null);
  const [selected, setSelected] = useState(null);

  const rafraichir = () => loadPersonnels(etape.id);

  const retirer = async (p) => {
    if (!p) return;
    const res = await Swal.fire({
      title: t("etapes.remove_personnel"),
      text: `${t("etapes.remove_personnel_text")} ${p.nom} ${p.prenom || ""} ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: t("etapes.remove_confirm"),
      cancelButtonText: t("common.cancel"),
    });
    if (!res.isConfirmed) return;
    const assoc = associations.find((a) => a.personnelId === p.id && a.lingeEtapeId === etape.id);
    if (assoc) {
      await removePersonnelFromEtape(assoc.id, etape.id);
      setSelected(null);
      rafraichir();
    }
  };

  const badge = (p) => p && setBadgeEmployee({
    nom: p.nom,
    prenom: p.prenom || "",
    matricule: p.matricule || p.codeBarre,
    fonction: p.fonction || "Agent Buanderie",
    service: etape.nom || etape.zone || "",
    photo: p.photo || null,
  });

  const lignes = useMemo(() => {
    const q = recherche.toLowerCase();
    return personnels.filter((p) => !q || [p.nom, p.prenom, p.codeBarre, p.matricule].some((v) => v?.toLowerCase().includes(q)));
  }, [personnels, recherche]);

  const COLONNES = {
    codeBarre: { label: t("etapes.code"), render: (p) => <Code>{p.codeBarre || p.matricule}</Code> },
    nom: { label: `${t("etapes.last_name")} / ${t("etapes.first_name")}`, render: (p) => <PersonCell id={p.id} nom={p.prenom} prenom={p.nom} label={`${p.nom || ""} ${p.prenom || ""}`.trim()} sub={p.fonction} /> },
  };

  return (
    <>
      <ActionBar>
        <ActionButton icon={IconAjouter} label={t("etapes.add_personnel")} variant="ajouter" onClick={() => setShowAdd(true)} />
        <ActionButton icon={Printer} label={t("etapes.print_label")} variant="imprimer" disabled={!selected} onClick={() => badge(selected)} />
        <ActionButton icon={UserMinus} label={t("etapes.remove")} variant="supprimer" disabled={!selected} onClick={() => retirer(selected)} />
        <ActionButton icon={<RefreshCw size={18} className={loading ? "animate-spin" : ""} />} label={t("common.refresh")} variant="details" onClick={rafraichir} />
      </ActionBar>
      <FilterPanel>
        <FilterRow>
          <FilterText label={t("common.search")} placeholder={t("etapes.search_personnel")} value={recherche} onChange={setRecherche} />
        </FilterRow>
      </FilterPanel>
      <DataTable
        columns={COLONNES}
        rows={lignes}
        activeId={selected?.id}
        onRowClick={(p) => setSelected(selected?.id === p.id ? null : p)}
        loading={loading}
        loadingText={t("common.loading")}
        emptyText={`${t("etapes.no_personnel")} — ${t("etapes.no_personnel_text")}`}
      />
      {showAdd && <AjoutPersonnelModal etape={etape} onClose={() => setShowAdd(false)} onAdded={rafraichir} />}
      <BadgeModal isOpen={!!badgeEmployee} onClose={() => setBadgeEmployee(null)} employee={badgeEmployee} />
    </>
  );
}

function OngletRendement() {
  const { personnels } = useEtape();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);

  const charger = useCallback(async () => {
    if (!personnels?.length) { setStats([]); return; }
    setLoading(true);
    setError(null);
    try {
      const ids = new Set(personnels.map((p) => p.id));
      const toutes = await fetchStatistiquesPersonnel();
      setStats(toutes.filter((s) => ids.has(s.personnelId)).sort((a, b) => b.totalOperations - a.totalOperations));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [personnels]);

  useEffect(() => { charger(); }, [charger]);

  const medailles = { 0: "🥇", 1: "🥈", 2: "🥉" };
  const COLONNES = {
    rang: { label: "#", align: "center", render: (s) => medailles[stats.indexOf(s)] || stats.indexOf(s) + 1 },
    agent: { label: "Agent", render: (s) => <PersonCell id={s.personnelId} nom={s.nomPrenom} label={s.nomPrenom} sub={s.matricule} /> },
    cadence: { label: "Cadence", align: "center", render: (s) => (s.moyenneParJour != null ? `${s.moyenneParJour}/j` : "—") },
    total: { label: "Total", align: "right", render: (s) => <strong>{s.totalOperations}</strong> },
  };
  const total = stats.reduce((n, s) => n + s.totalOperations, 0);
  const types = Object.entries(detail?.operationsParType || {}).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <ActionBar>
        <ActionButton icon={<RefreshCw size={18} className={loading ? "animate-spin" : ""} />} label="Actualiser" variant="details" onClick={charger} />
        <span className="kit-count-pill" style={{ marginLeft: "auto" }}>{total} opérations · {stats.length} agent{stats.length > 1 ? "s" : ""}</span>
      </ActionBar>
      <DataTable
        columns={COLONNES}
        rows={stats}
        rowKey={(s) => s.personnelId}
        onRowClick={setDetail}
        loading={loading}
        error={error}
        emptyText="Aucune donnée de rendement"
      />
      {detail && (
        <Modal size="sm" title={detail.nomPrenom} subtitle={detail.matricule} icon={<BarChart3 size={20} />} onClose={() => setDetail(null)}>
          {types.length === 0 ? <p className="kit-muted">Aucun détail disponible</p> : types.map(([type, count]) => {
            const info = getTypeOperationInfo(type);
            const pct = detail.totalOperations > 0 ? Math.round((count / detail.totalOperations) * 100) : 0;
            return (
              <div key={type} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem" }}>
                  <span>{info.emoji} {info.label}</span>
                  <strong>{count} <span className="kit-muted">({pct}%)</span></strong>
                </div>
                <div className="kit-gauge"><span style={{ width: `${pct}%`, background: info.color }} /></div>
              </div>
            );
          })}
          {(detail.premiereOperation || detail.derniereOperation) && (
            <p className="kit-muted" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: ".8rem" }}>
              <Clock size={14} /> {detail.premiereOperation?.slice(0, 10)} → {detail.derniereOperation?.slice(0, 10)}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}

function EtapeListInner() {
  const { t } = useTranslation();
  const { etapes, personnels, loading, createNewEtape, updateExistingEtape, deleteExistingEtape, loadEtapes, loadPersonnels } = useEtape();

  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [onglet, setOnglet] = useState("personnel");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const columns = useMemo(() => COLUMNS_DEFAULT.map((c) => ({
    ...c,
    label: {
      nom: t("etapes.step"), codeBarre: t("etapes.barcode"), zone: t("etapes.zone"),
      categorie: t("etapes.category"), ordre: t("etapes.order"), actions: t("common.actions"),
    }[c.key] || c.label,
  })), [t]);

  const searchValue = (e, key) => (key === "actions" ? "" : e[key] ?? "");
  const sortValue = (e, key) => (key === "ordre" ? (e.ordre === null || e.ordre === undefined || e.ordre === "" ? Number.MAX_SAFE_INTEGER : Number(e.ordre)) : String(e[key] ?? "").toLowerCase());
  const zones = useMemo(() => [...new Set(etapes.map((e) => e.zone).filter(Boolean))], [etapes]);

  const list = useListPage({
    rows: etapes,
    columns,
    getSearchValue: searchValue,
    getSortValue: sortValue,
    filters: {
      zone: { initial: "all", column: "zone", test: (e, v) => v === "all" || e.zone === v },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const openDetails = async (etape) => {
    if (!etape) return;
    setSelected(etape);
    setOnglet("personnel");
    setViewMode("details");
    await loadPersonnels(etape.id);
  };

  const openForm = (etape) => setForm({ etape, rec: { nom: etape?.nom || "", zone: etape?.zone || "", categorie: etape?.categorie || "" } });
  const setRec = (patch) => setForm((f) => ({ ...f, rec: { ...f.rec, ...patch } }));

  const handleSave = async (e) => {
    e.preventDefault();
    const { etape, rec } = form;
    if (!rec.nom.trim()) {
      Swal.fire({ icon: "warning", title: t("etapes.name_required"), text: t("etapes.name_required_text"), timer: 1500, showConfirmButton: false });
      return;
    }
    setSaving(true);
    try {
      if (etape) {
        await updateExistingEtape(etape.id, { ...rec, codeBarre: etape.codeBarre, ordre: etape.ordre });
        if (selected?.id === etape.id) setSelected({ ...selected, ...rec });
      } else {
        await createNewEtape(rec);
      }
      setForm(null);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const cible = deleteTarget;
    setDeleteTarget(null);
    await deleteExistingEtape(cible.id);
    if (selected?.id === cible.id) { setSelected(null); setViewMode("list"); }
  };

  const handleExportExcel = (lignes) => {
    const source = Array.isArray(lignes) ? lignes : list.sorted;
    if (!source.length) return;
    exportExcel({
      fileName: "etapes",
      sheetName: t("etapes.title"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const TABLE_COLUMNS = {
    nom: {
      label: t("etapes.step"), sortable: true,
      render: (e) => <div><strong>{e.nom}</strong>{e.categorie && <small style={{ display: "block", color: "var(--slate-500)" }}>{e.categorie}</small>}</div>,
    },
    codeBarre: { label: t("etapes.barcode"), sortable: true, render: (e) => <Code>{e.codeBarre}</Code> },
    zone: { label: t("etapes.zone"), sortable: true, render: (e) => <Badge variant={zoneVariant(e.zone)}>{e.zone || t("etapes.zone_undefined")}</Badge> },
    categorie: { label: t("etapes.category"), sortable: true, render: (e) => e.categorie || "—" },
    ordre: { label: t("etapes.order"), sortable: true, align: "center", render: (e) => <strong>{e.ordre ?? "—"}</strong> },
  };

  return (
    <Page>
      {viewMode === "list" && (
        <>
          <ActionBar>
            <ActionButton icon={IconAjouter} label={t("etapes.new_step")} variant="ajouter" onClick={() => openForm(null)} />
            <ActionButton icon={IconDetails} label={t("etapes.view_personnel")} variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={IconModifier} label={t("common.edit")} variant="modifier" disabled={!selected} onClick={() => openForm(selected)} />
            <ActionButton icon={IconSupprimer} label={t("common.delete")} variant="supprimer" disabled={!selected} onClick={() => setDeleteTarget(selected)} />
            <BarcodeLabel item={selected} type="etape" variant="action" />
            <ActionButton icon={<RefreshCw size={18} className={loading ? "animate-spin" : ""} />} label={t("common.refresh")} variant="details" onClick={loadEtapes} />
          </ActionBar>

          <FilterPanel>
            <FilterRow>
              <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
              <FilterText
                label={t("common.search")}
                placeholder={t("etapes.search_placeholder")}
                value={draft.searchTerm}
                onChange={(v) => setFilter("searchTerm", v)}
                onEnter={list.apply}
              />
              {list.isColVisible("zone") && zones.length > 0 && (
                <FilterSelect label={t("etapes.zone")} value={draft.zone} onChange={(v) => setFilter("zone", v)} allLabel={t("common.all")} options={zones.map((z) => ({ value: z, label: z }))} />
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

          <ListSection selection={sel} unit="étape" units="étapes" bulkActions={[{ label: tk("exportExcel", "Exporter Excel"), onClick: (l) => handleExportExcel(l) }]}>
            <DataTable
              columns={TABLE_COLUMNS}
              visible={list.visibleColumns}
              rows={list.paginated}
              sort={list.sort}
              onSort={list.toggleSort}
              selection={sel}
              activeId={selected?.id}
              onRowClick={(e) => setSelected(selected?.id === e.id ? null : e)}
              onRowDoubleClick={openDetails}
              loading={loading && !etapes.length}
              loadingText={t("common.loading")}
              emptyText={draft.searchTerm ? t("etapes.no_match") : t("etapes.no_data")}
            />
            <Pagination total={list.sorted.length} page={list.page} totalPages={list.totalPages} pageSize={list.pageSize} onPage={list.setPage} unit="étape(s)" />
          </ListSection>
        </>
      )}

      {viewMode === "details" && selected && (
        <DetailsPage
          onBack={() => setViewMode("list")}
          eyebrow={t("etapes.step")}
          title={selected.nom}
          badge={<Badge variant={zoneVariant(selected.zone)} style={{ padding: "10px 18px", fontSize: "0.85rem" }}>{selected.zone || t("etapes.zone_undefined")}</Badge>}
          actions={(
            <>
              <BarcodeLabel item={selected} type="etape" variant="action" />
              <DetailsButton icon={Pencil} onClick={() => openForm(selected)}>{t("common.edit")}</DetailsButton>
              <DetailsButton icon={Trash2} variant="danger" onClick={() => setDeleteTarget(selected)}>{t("common.delete")}</DetailsButton>
            </>
          )}
        >
          <KpiTiles items={[
            { label: t("etapes.personnel_count"), value: personnels.length, tone: "blue" },
            { label: t("etapes.barcode"), value: selected.codeBarre || "—", tone: "violet" },
            { label: t("etapes.category"), value: selected.categorie || t("etapes.uncategorized"), tone: "green" },
            { label: t("etapes.order"), value: selected.ordre ?? "—", tone: "amber" },
          ]} />
          <div className="kit-toolbar">
            <Tabs
              value={onglet}
              onChange={setOnglet}
              items={[
                { value: "personnel", icon: <Users size={16} />, label: `${t("etapes.personnel_count")}s`, count: personnels.length },
                { value: "stats", icon: <BarChart3 size={16} />, label: "Rendement" },
              ]}
            />
          </div>
          <DetailCard>
            {onglet === "personnel" ? <OngletPersonnel etape={selected} /> : <OngletRendement />}
          </DetailCard>
        </DetailsPage>
      )}

      {form && (
        <Modal
          className="kit-std-form"
          size="sm"
          title={form.etape ? t("etapes.edit_step") : t("etapes.new_step")}
          onClose={saving ? undefined : () => setForm(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>{t("common.cancel")}</Button>
              <Button type="submit" form="etape-form" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : null} {t("common.save")}
              </Button>
            </>
          )}
        >
          <form id="etape-form" onSubmit={handleSave}>
            <FormGrid columns={1}>
              <FormField label={t("etapes.name")} required>
                <input value={form.rec.nom} onChange={(e) => setRec({ nom: e.target.value })} placeholder={t("etapes.name_placeholder")} />
              </FormField>
              <FormField label={t("etapes.zone")}>
                <input value={form.rec.zone} onChange={(e) => setRec({ zone: e.target.value })} placeholder={t("etapes.zone_placeholder")} list="etape-zones" />
                <datalist id="etape-zones">{zones.map((z) => <option key={z} value={z} />)}</datalist>
              </FormField>
              <FormField label={t("etapes.category")}>
                <input value={form.rec.categorie} onChange={(e) => setRec({ categorie: e.target.value })} placeholder={t("etapes.category_placeholder")} />
              </FormField>
            </FormGrid>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t("etapes.delete_step")}
          message={t("etapes.delete_step_text")}
          details={<strong>{deleteTarget.nom}</strong>}
          confirmLabel={t("etapes.delete_confirm")}
          cancelLabel={t("common.cancel")}
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

export default function EtapeList() {
  return (
    <EtapeProvider>
      <EtapeListInner />
    </EtapeProvider>
  );
}
