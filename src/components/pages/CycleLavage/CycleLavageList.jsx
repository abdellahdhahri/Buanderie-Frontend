import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import printJS from "print-js";
import { RefreshCw, Printer, AlertTriangle } from "lucide-react";
import {
  Page, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterDateRange, FilterActions,
  ListSection, DataTable, Pagination, Badge,
  DetailsPage, DetailsButton, KpiTiles, DetailCard, DetailGrid, InfoList, DetailAlert,
  ColumnSettingsModal, useListPage, useRowSelection, exportExcel,
  Code, QuickStats, day, tk,
} from "../../kit";
import { IconDetails } from "../../kit/ActionIcons";
import { chargerItemsCycle, codeElement, libelleTypeSource } from "../../../services/lavageInfecteService";
import { produitsDuCycle } from "../../../services/produitNettoyageService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const TONS_SOURCE = { BAC: "info", BAC_INFECTE: "danger" };

const STATUTS = { TERMINE: "success", EN_COURS: "warning", EN_ATTENTE: "secondary", ANNULE: "danger" };
const ETATS_LINGE = { COLLECTE: "warning", EN_LAVAGE: "info", LAVE: "success", SECHE: "success", STOCKE: "secondary", SALE: "danger" };

const COLUMNS_DEFAULT = [
  { key: "numeroCycle", label: "N° cycle", visible: true, searchable: true },
  { key: "machine", label: "Machine", visible: true, searchable: true },
  { key: "programme", label: "Programme", visible: true, searchable: true },
  { key: "dateDebut", label: "Début", visible: true, searchable: true },
  { key: "agent", label: "Agent", visible: false, searchable: true },
  { key: "items", label: "Articles", visible: true, searchable: false },
  { key: "statut", label: "Statut", visible: true, searchable: true },
];

const formatDate = (v) => (v ? new Date(v).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const machineDe = (c) => c.machine?.code || c.machine?.reference || "N/A";

const lingesDesItems = (cycle) => (cycle.items || []).map((item, index) => ({
  id: item.id || index,
  codeBarre: item.codeBarre || `ITEM-${item.id || index}`,
  categorie: item.categorie || cycle.programmeLavage?.categories?.[0] || "Non catégorisé",
  poids: item.poidsCharge || 0,
  etat: item.etat || "COLLECTE",
  rfidTag: item.rfidTag || null,
  bacId: item.bacId ?? item.sourceId ?? null,
}));

export default function CycleLavageList() {
  const { t } = useTranslation();
  const [cycles, setCycles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [linges, setLinges] = useState([]);
  const [isLingesLoading, setIsLingesLoading] = useState(false);
  const [elements, setElements] = useState([]);
  const [elementsEtat, setElementsEtat] = useState({ chargement: false, erreur: null });
  const [produits, setProduits] = useState([]);
  const [produitsEtat, setProduitsEtat] = useState({ chargement: false, erreur: null });
  const [showStats, setShowStats] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const fetchCycles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/lavage/cycles`);
      if (response.ok) setCycles(await response.json());
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCycles(); }, []);

  const fetchElements = async (cycle) => {
    setElements([]);
    setElementsEtat({ chargement: true, erreur: null });
    try {
      setElements(await chargerItemsCycle(cycle.id));
      setElementsEtat({ chargement: false, erreur: null });
    } catch (err) {
      setElementsEtat({ chargement: false, erreur: err.message });
    }
  };

  const fetchProduits = async (cycle) => {
    setProduits([]);
    setProduitsEtat({ chargement: true, erreur: null });
    try {
      setProduits(await produitsDuCycle(cycle.id));
      setProduitsEtat({ chargement: false, erreur: null });
    } catch (err) {
      setProduitsEtat({ chargement: false, erreur: err.message });
    }
  };

  const fetchLinges = async (cycle) => {
    setIsLingesLoading(true);
    setLinges([]);
    try {
      const response = await fetch(`${API_URL}/api/lavage/cycles/${cycle.id}/linges`);
      if (response.ok) {
        const data = await response.json();
        setLinges(Array.isArray(data) ? data : data.content || data.items || data._embedded?.linges || []);
      } else if (cycle.items?.length) {
        setLinges(lingesDesItems(cycle));
      }
    } catch (err) {
      console.error("Erreur chargement linges:", err);
      if (cycle.items?.length) setLinges(lingesDesItems(cycle));
    } finally {
      setIsLingesLoading(false);
    }
  };

  const statutLabel = (s) => t(`cycles.status_${s}`, s || "—");
  const StatutBadge = ({ value }) => <Badge variant={STATUTS[value] || "secondary"}>{statutLabel(value)}</Badge>;
  const EtatBadge = ({ value }) => <Badge variant={ETATS_LINGE[value] || "secondary"}>{value ? t(`cycles.etat_${value}`, value) : t("common.undefined")}</Badge>;

  const columns = useMemo(() => COLUMNS_DEFAULT.map((c) => ({
    ...c,
    label: {
      numeroCycle: t("cycles.numero"), machine: t("cycles.machine"), programme: t("cycles.programme"),
      dateDebut: t("cycles.date_debut"), agent: t("cycles.agent"), items: t("cycles.items"),
      statut: t("cycles.status"), actions: t("cycles.actions"),
    }[c.key] || c.label,
  })), [t]);

  const searchValue = (c, key) => {
    switch (key) {
      case "numeroCycle": return c.numeroCycle || `#${c.id}`;
      case "machine": return machineDe(c);
      case "programme": return c.programmeLavage?.nom || "";
      case "dateDebut": return formatDate(c.dateDebut);
      case "agent": return c.agent?.nom || "";
      case "items": return c.items?.length || 0;
      case "statut": return statutLabel(c.statut);
      default: return "";
    }
  };
  const sortValue = (c, key) => {
    if (key === "dateDebut") return c.dateDebut ? new Date(c.dateDebut).getTime() : 0;
    if (key === "items") return c.items?.length || 0;
    return String(searchValue(c, key)).toLowerCase();
  };

  const list = useListPage({
    rows: cycles,
    columns,
    getSearchValue: searchValue,
    getSortValue: sortValue,
    defaultSort: (a, b) => (b.dateDebut ? new Date(b.dateDebut).getTime() : 0) - (a.dateDebut ? new Date(a.dateDebut).getTime() : 0),
    filters: {
      statut: { initial: "all", column: "statut", test: (c, v) => v === "all" || c.statut === v },
      dateFrom: { initial: "", column: "dateDebut", test: (c, v) => !v || (c.dateDebut && day(c.dateDebut) >= v) },
      dateTo: { initial: "", column: "dateDebut", test: (c, v) => !v || (c.dateDebut && day(c.dateDebut) <= v) },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const openDetails = (c) => {
    if (!c) return;
    setSelected(c);
    setViewMode("details");
    fetchLinges(c);
    fetchElements(c);
    fetchProduits(c);
  };

  const imprimer = (cycle) => {
    if (!cycle) return;
    const ligne = (label, valeur, sep = false) => `
      <div style="display:flex; justify-content:space-between; padding:2px 0;${sep ? " border-top:1px solid #eee; margin-top:2px; padding-top:4px;" : ""}">
        <span><strong>${label}:</strong></span><span>${valeur}</span>
      </div>`;
    printJS({
      printable: `
        <div style="width:80mm; padding:5mm; font-family:'Courier New',monospace; background:white;">
          <div style="text-align:center; border-bottom:2px solid black; padding-bottom:3mm; margin-bottom:3mm;">
            <h2 style="margin:0; font-size:14pt;">${t("cycles.print_title")}</h2>
            <p style="margin:2px 0; font-size:10pt; font-weight:bold;">${cycle.numeroCycle || `#${cycle.id}`}</p>
          </div>
          <div style="font-size:9pt; margin-bottom:3mm; border:1px solid #ddd; padding:3mm; border-radius:4px;">
            ${ligne(t("cycles.print_date"), cycle.dateDebut ? new Date(cycle.dateDebut).toLocaleDateString("fr-FR") : "N/A")}
            ${ligne(t("cycles.print_time"), cycle.dateDebut ? new Date(cycle.dateDebut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "N/A")}
            ${ligne(t("cycles.print_status"), cycle.statut ? statutLabel(cycle.statut) : "N/A")}
            ${ligne(t("cycles.print_machine"), machineDe(cycle), true)}
            ${ligne(t("cycles.print_programme"), cycle.programmeLavage?.nom || "N/A")}
            ${ligne(t("cycles.print_agent"), cycle.agent?.nom || "N/A")}
            ${ligne(t("cycles.print_items"), cycle.items?.length || 0)}
          </div>
          <div style="text-align:center; font-size:7pt; margin-top:3mm; border-top:1px solid #ddd; padding-top:2mm; color:#666;">
            ${t("cycles.print_generated")} ${new Date().toLocaleString("fr-FR")}
          </div>
        </div>`,
      type: "raw-html",
      style: "* { margin: 0; padding: 0; box-sizing: border-box; }",
      documentTitle: `Cycle_Lavage_${cycle.numeroCycle || cycle.id}`,
      css: "@page { size: 80mm auto; margin: 0; }",
    });
  };

  const handleExportExcel = (lignes) => {
    const source = Array.isArray(lignes) ? lignes : list.sorted;
    if (!source.length) return;
    exportExcel({
      fileName: "cycles_lavage",
      sheetName: t("cycles.title"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const TABLE_COLUMNS = {
    numeroCycle: { label: t("cycles.numero"), sortable: true, render: (c) => <Code>{c.numeroCycle || `#${c.id}`}</Code> },
    machine: { label: t("cycles.machine"), sortable: true, render: (c) => <strong>{machineDe(c)}</strong> },
    programme: {
      label: t("cycles.programme"), sortable: true,
      render: (c) => (
        <div>
          {c.programmeLavage?.nom || "—"}
          {c.programmeLavage && (
            <small style={{ display: "block", color: "var(--slate-500)" }}>
              {c.programmeLavage.temperatureCelsius || 0}°C · {c.programmeLavage.dureeMinutes || 0} min
            </small>
          )}
        </div>
      ),
    },
    dateDebut: { label: t("cycles.date_debut"), sortable: true, render: (c) => formatDate(c.dateDebut) },
    agent: { label: t("cycles.agent"), sortable: true, render: (c) => c.agent?.nom || "—" },
    items: { label: t("cycles.items"), sortable: true, align: "center", render: (c) => <Badge variant="info">{c.items?.length || 0}</Badge> },
    statut: { label: t("cycles.status"), sortable: true, align: "center", render: (c) => <StatutBadge value={c.statut} /> },
  };

  const LINGE_COLUMNS = {
    codeBarre: { label: t("cycles.code"), render: (l) => <Code>{l.codeBarre || "N/A"}</Code> },
    categorie: { label: t("cycles.categories"), render: (l) => t(`categories.${l.categorie}`, l.categorie || "Non catégorisé") },
    etat: { label: t("cycles.status"), render: (l) => <EtatBadge value={l.etat} /> },
    poids: { label: t("cycles.capacity"), align: "right", render: (l) => `${l.poids || 0} kg` },
    rfidTag: { label: "RFID", render: (l) => (l.rfidTag ? <Code>{l.rfidTag}</Code> : "—") },
    bacId: { label: t("tri.bac", "Bac"), render: (l) => (l.bacId ? `#${l.bacId}` : "—") },
  };

  const PRODUIT_COLUMNS = {
    designation: { label: t("produits.designation", "Désignation"), render: (p) => <strong>{p.designation || p.produit?.designation || "—"}</strong> },
    codeBarre: { label: t("produits.code_barre", "Code-barres"), render: (p) => <Code>{p.codeBarre || p.produit?.codeBarre || "—"}</Code> },
    dosage: { label: t("produits.dosage", "Dosage"), render: (p) => p.dosage ?? p.produit?.dosage ?? "—" },
  };

  const ELEMENT_COLUMNS = {
    type: {
      label: t("lavage_infecte.items_type"),
      render: (e) => <Badge variant={TONS_SOURCE[e.typeSource] || "secondary"}>{libelleTypeSource(t, e.typeSource)}</Badge>,
    },
    code: { label: t("lavage_infecte.items_source"), render: (e) => <Code>{codeElement(e)}</Code> },
    categorie: { label: t("cycles.categories"), render: (e) => (e.categorie ? t(`categories.${e.categorie}`, e.categorie) : "—") },
    quantite: { label: t("lavage_infecte.items_quantity"), align: "center", render: (e) => e.quantite ?? e.quantiteDeclaree ?? e.nbPieces ?? "—" },
    poids: { label: t("lavage_infecte.items_weight"), align: "right", render: (e) => (e.poidsCharge != null || e.poids != null ? `${Number(e.poidsCharge ?? e.poids).toFixed(1)} kg` : "—") },
  };

  const parStatut = Object.keys(STATUTS).map((s, i) => ({ label: statutLabel(s), value: list.sorted.filter((c) => c.statut === s).length, color: ["#10b981", "#f59e0b", "#64748b", "#ef4444"][i] }));
  const compter = (fn) => Object.entries(list.sorted.reduce((acc, c) => { const k = fn(c); if (k) acc[k] = (acc[k] || 0) + 1; return acc; }, {}))
    .map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const prog = selected?.programmeLavage;

  return (
    <Page>
      {viewMode === "list" && (
        <>
          <ActionBar>
            <ActionButton icon={IconDetails} label={t("cycles.details")} variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={Printer} label={t("cycles.print")} variant="imprimer" disabled={!selected} onClick={() => imprimer(selected)} />
            <ActionButton icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />} label={t("common.refresh")} variant="details" onClick={fetchCycles} />
          </ActionBar>

          <FilterPanel>
            <FilterRow>
              {list.isColVisible("statut") && (
                <FilterSelect
                  label={t("cycles.status")}
                  value={draft.statut}
                  onChange={(v) => setFilter("statut", v)}
                  allLabel={t("cycles.all_status")}
                  options={Object.keys(STATUTS).map((s) => ({ value: s, label: statutLabel(s) }))}
                />
              )}
              <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
              <FilterText
                label={t("common.search")}
                placeholder={t("cycles.search_placeholder")}
                value={draft.searchTerm}
                onChange={(v) => setFilter("searchTerm", v)}
                onEnter={list.apply}
              />
              {list.isColVisible("dateDebut") && (
                <FilterDateRange from={draft.dateFrom} to={draft.dateTo} onFrom={(v) => setFilter("dateFrom", v)} onTo={(v) => setFilter("dateTo", v)} />
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

          <ListSection selection={sel} unit="cycle" units="cycles" bulkActions={[{ label: tk("exportExcel", "Exporter Excel"), onClick: (l) => handleExportExcel(l) }]}>
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
              loading={isLoading && !cycles.length}
              loadingText={t("cycles.loading")}
              emptyText={t("common.no_data")}
            />
            <Pagination total={list.sorted.length} page={list.page} totalPages={list.totalPages} pageSize={list.pageSize} onPage={list.setPage} unit="cycle(s)" />
          </ListSection>
        </>
      )}

      {viewMode === "details" && selected && (
        <DetailsPage
          onBack={() => setViewMode("list")}
          eyebrow={t("cycles.cycle_details")}
          title={`${selected.numeroCycle || `#${selected.id}`} · ${machineDe(selected)}`}
          badge={<StatutBadge value={selected.statut} />}
          actions={<DetailsButton icon={Printer} onClick={() => imprimer(selected)}>{t("cycles.print")}</DetailsButton>}
        >
          <KpiTiles items={[
            { label: t("cycles.temperature"), value: `${prog?.temperatureCelsius || 0}°C`, tone: "amber" },
            { label: t("cycles.duration"), value: `${prog?.dureeMinutes || 0} min`, tone: "blue" },
            { label: t("cycles.items"), value: selected.items?.length || linges.length, tone: "green" },
          ]} />
          <DetailGrid>
            <DetailCard title={t("cycles.machine")}>
              <InfoList items={[
                { label: t("cycles.code"), value: selected.machine?.code },
                { label: t("cycles.reference"), value: selected.machine?.reference },
                { label: t("cycles.type"), value: selected.machine?.type },
                { label: t("cycles.capacity"), value: `${selected.machine?.capaciteKg || 0} kg` },
              ]} />
            </DetailCard>
            <DetailCard title={t("cycles.programme")}>
              <InfoList items={[
                { label: t("cycles.name"), value: prog?.nom },
                { label: t("cycles.spin_speed"), value: prog?.vitesseEssorageRpm ? `${prog.vitesseEssorageRpm} RPM` : null },
                { label: t("cycles.categories"), value: (prog?.categories || []).map((c) => t(`categories.${c}`, c)).join(", ") || null },
              ]} />
            </DetailCard>
            <DetailCard title={t("modal.execution", "Exécution")}>
              <InfoList items={[
                { label: t("cycles.date_debut"), value: formatDate(selected.dateDebut) },
                { label: t("cycles.agent"), value: selected.agent?.nom },
              ]} />
            </DetailCard>
          </DetailGrid>
          <DetailCard title={`${t("lavage_infecte.items_source")} · ${elements.length}`}>
            {elementsEtat.erreur ? (
              <DetailAlert icon={<AlertTriangle size={16} />} title={t("common.error", "Erreur")}>{elementsEtat.erreur}</DetailAlert>
            ) : (
              <DataTable
                columns={ELEMENT_COLUMNS}
                rows={elements}
                rowKey={(e) => e.id ?? `${e.typeSource}-${e.sourceId ?? codeElement(e)}`}
                loading={elementsEtat.chargement}
                loadingText={t("cycles.loading")}
                emptyText={t("lavage_infecte.no_items")}
              />
            )}
          </DetailCard>
          <DetailCard title={`${t("produits.used", "Produits utilisés")} · ${produits.length}`}>
            {produitsEtat.erreur ? (
              <DetailAlert icon={<AlertTriangle size={16} />} title={t("common.error", "Erreur")}>{produitsEtat.erreur}</DetailAlert>
            ) : (
              <DataTable
                columns={PRODUIT_COLUMNS}
                rows={produits}
                rowKey={(p, i) => p.id ?? p.produitId ?? i}
                loading={produitsEtat.chargement}
                loadingText={t("cycles.loading")}
                emptyText={t("produits.none_used", "Aucun produit utilisé")}
              />
            )}
          </DetailCard>
          <DetailCard title={`${linges.length} ${t("cycles.linges_count")}`}>
            <DataTable
              columns={LINGE_COLUMNS}
              rows={linges}
              rowKey={(l) => l.lingeId || l.id || l.codeBarre}
              loading={isLingesLoading}
              loadingText={t("cycles.loading")}
              emptyText={t("common.no_items", "Aucun linge")}
            />
          </DetailCard>
        </DetailsPage>
      )}

      {showStats && (
        <QuickStats
          title={t("cycles.title")}
          subtitle={`${list.sorted.length} cycle(s)`}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: tk("total", "Total"), value: list.sorted.length },
            { label: t("cycles.items"), value: list.sorted.reduce((n, c) => n + (c.items?.length || 0), 0), color: "#3b82f6" },
            { label: t("cycles.status_TERMINE"), value: parStatut[0].value, color: "#10b981" },
            { label: t("cycles.status_EN_COURS"), value: parStatut[1].value, color: "#f59e0b" },
          ]}
          repartitions={[{ title: t("cycles.status"), items: parStatut }]}
          classements={[
            { title: t("cycles.machine"), items: compter(machineDe) },
            { title: t("cycles.programme"), items: compter((c) => c.programmeLavage?.nom) },
          ]}
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
