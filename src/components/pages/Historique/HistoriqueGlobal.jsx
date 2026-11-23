import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Swal from "../../kit/dialogueApi";
import { RefreshCw, Trash2, Eye, ArrowRight, History, User, Clock } from "lucide-react";
import { ServiceContext } from "../../../contextes/ServiceContext";
import { getSetting } from "../../../utils/appSettings";
import { fetchGlobalHistory, fetchPersonnelsByIds, fetchPersonnelById, formatDate } from "../../../services/historiqueGlobalService";
import {
  Page, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterDateRange, FilterActions,
  ListSection, DataTable, Pagination, Badge, PersonName,
  Modal, Button, InfoList, DetailCard, DetailText,
  ColumnSettingsModal, useListPage, useRowSelection, exportExcel,
  RowActions, RowButton, Code, QuickStats, day, tk,
} from "../../kit";
import { IconDetails, IconSupprimer } from "../../kit/ActionIcons";
import { useOperations, AVEC_OBSERVATIONS } from "../../../hooks/useOperations";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";
const COLUMNS_STORAGE_KEY = "historique.columns";

const ETATS = {
  LIVRE: "success", COLLECTE: "warning", RECEPTION: "info", EN_TRI: "info", EN_LAVAGE: "info", LAVE: "success",
  EN_SECHAGE: "info", SECHE: "success", PLIE: "secondary", STOCKE: "secondary", MANQUANT: "danger", HORS_SERVICE: "danger",
  PROPRE_PRET: "success", PRET_LIVRAISON: "success", RECEPTIONNE: "success", DISTRIBUE: "success",
};

const COULEURS_ETAPES = {
  COLLECTE: "#8b5cf6",
  RECEPTION: "#f59e0b",
  TRI: "#ec4899",
  LAVAGE: "#3b82f6",
  SECHAGE: "#14b8a6",
  PLIAGE: "#a855f7",
  STOCKAGE: "#10b981",
  DISTRIBUTION: "#ef4444",
};

const COLUMNS_DEFAULT = [
  { key: "date", label: "Date / heure", visible: true, searchable: true },
  { key: "linge", label: "Code linge", visible: true, searchable: true },
  { key: "service", label: "Service", visible: true, searchable: true },
  { key: "etat", label: "État", visible: false, searchable: true },
  { key: "operation", label: "Opération", visible: true, searchable: true },
  { key: "agent", label: "Agent", visible: true, searchable: true },
  { key: "observations", label: "Observations", visible: true, searchable: true },
  { key: "actions", label: "Actions", visible: true, searchable: false },
];

const colonnesSauvegardees = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(COLUMNS_STORAGE_KEY));
    if (Array.isArray(saved)) return COLUMNS_DEFAULT.map((c) => ({ ...c, ...(saved.find((s) => s.key === c.key) || {}) }));
  } catch {
    return COLUMNS_DEFAULT;
  }
  return COLUMNS_DEFAULT;
};

function nomPersonnel(p) {
  if (!p) return null;
  const nom = p.nomPrenom || p.nom_prenom || p.nomComplet || p.fullName;
  if (nom) return nom;
  const complet = `${p.nom || p.lastName || ""} ${p.prenom || p.firstName || ""}`.trim();
  return complet || p.matricule || p.code || null;
}

const codeLinge = (e) => e.linge?.codeBarre || e.codeLinge || e.lingeId || "N/A";

export default function HistoriqueGlobal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { services } = useContext(ServiceContext);
  const { operations, libelle } = useOperations();
  const size = Number(getSetting("display.pageSize")) || 10;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reload, setReload] = useState(0);
  const [personnels, setPersonnels] = useState({});
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const result = await fetchGlobalHistory({ page, size, sortBy: "dateOperation", direction: "desc" }, controller.signal);
        if (!result) return;
        setHistory(result.data);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
        const ids = [...new Set(result.data.map((e) => e.personnelId).filter((id) => id != null))];
        if (ids.length) {
          const resultat = await fetchPersonnelsByIds(ids).catch(() => ({}));
          const entrees = Array.isArray(resultat)
            ? resultat.map((p) => [p?.id ?? p?.personnelId, p])
            : Object.entries(resultat || {});
          const cache = {};
          entrees.forEach(([id, p]) => {
            if (id != null && p) cache[id] = nomPersonnel(p) || `ID: ${id}`;
          });
          setPersonnels((prev) => ({ ...prev, ...cache }));
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Erreur chargement historique :", error);
          setHistory([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [page, size, reload]);

  const chargerPersonnel = useCallback(async (id) => {
    if (!id || personnels[id]) return;
    try {
      const p = await fetchPersonnelById(id);
      setPersonnels((prev) => ({ ...prev, [id]: nomPersonnel(p) || `ID: ${id}` }));
    } catch {
      setPersonnels((prev) => ({ ...prev, [id]: `ID: ${id}` }));
    }
  }, [personnels]);

  const agentDe = (e) => {
    if (!e.personnelId) return e.typeOperation?.startsWith("FIN_") ? "Système" : "N/A";
    return personnels[e.personnelId] || `ID: ${e.personnelId}`;
  };

  const serviceDe = (e) => {
    const direct = e.serviceNom || e.serviceCode || e.linge?.serviceNom || e.linge?.serviceCode;
    if (direct) return direct;
    const id = e.linge?.serviceId ?? e.serviceId;
    if (id == null) return "";
    const s = (services || []).find((x) => String(x.id) === String(id));
    return s ? (s.code || s.nom || s.libelle || "") : "";
  };

  const etatLabel = (etat) => (etat ? t(`historique.etat.${etat}`, etat) : "—");
  const operationLabel = (op) => libelle(op, t(`historique.type.${op}`, op || "—"));
  const couleurOperation = (op) => {
    const etape = operations.find((o) => o.typeOperation === op)?.etape;
    return COULEURS_ETAPES[etape] || COULEURS_ETAPES[op] || "#64748b";
  };
  const typesOperations = operations.length
    ? operations.map((o) => o.typeOperation)
    : [...new Set(history.map((e) => e.typeOperation).filter(Boolean))];

  const EtatBadge = ({ etat }) => <Badge variant={ETATS[etat] || "secondary"}>{etatLabel(etat)}</Badge>;
  const Operation = ({ op, entree }) => {
    const detailEtat = op === AVEC_OBSERVATIONS ? entree?.observations : null;
    return (
      <span className="kit-op-wrap">
        <span className="kit-op-pill" style={{ "--op": couleurOperation(op) }}>
          <i />{operationLabel(op)}
        </span>
        {detailEtat && <small className="kit-op-note">{detailEtat}</small>}
      </span>
    );
  };

  const columns = useMemo(() => {
    const labels = {
      date: t("historique.date_time"), linge: t("historique.linen_code"), service: t("common.service"),
      etat: t("historique.state"), operation: t("historique.operation"), agent: t("historique.agent"),
      observations: t("historique.observations"), actions: t("common.actions"),
    };
    return colonnesSauvegardees().map((c) => ({ ...c, label: labels[c.key] || c.label }));
  }, [t]);

  const searchValue = (e, key) => {
    switch (key) {
      case "date": return formatDate(e.dateOperation);
      case "linge": return codeLinge(e);
      case "service": return serviceDe(e);
      case "etat": return etatLabel(e.etatApres || e.etat);
      case "operation": return [operationLabel(e.typeOperation), e.typeOperation === AVEC_OBSERVATIONS ? e.observations : ""].filter(Boolean).join(" · ");
      case "agent": return agentDe(e);
      case "observations": return e.observations || e.remarques || "";
      default: return "";
    }
  };
  const sortValue = (e, key) => (key === "date" ? new Date(e.dateOperation || 0).getTime() : String(searchValue(e, key)).toLowerCase());

  const list = useListPage({
    rows: history,
    columns,
    getSearchValue: searchValue,
    getSortValue: sortValue,
    pageSize: 1000,
    filters: {
      etat: { initial: "all", test: (e, v) => v === "all" || e.etatApres === v },
      operation: { initial: "all", column: "operation", test: (e, v) => v === "all" || e.typeOperation === v },
      dateFrom: { initial: "", column: "date", test: (e, v) => !v || day(e.dateOperation) >= v },
      dateTo: { initial: "", column: "date", test: (e, v) => !v || day(e.dateOperation) <= v },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  useEffect(() => {
    try {
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(list.columnSettings.map(({ key, visible, searchable }) => ({ key, visible, searchable }))));
    } catch (err) {
      console.warn("Colonnes non sauvegardées :", err);
    }
  }, [list.columnSettings]);

  const ouvrirDetail = (e) => {
    if (!e) return;
    setDetail(e);
    chargerPersonnel(e.personnelId);
  };

  const confirmDelete = async () => {
    const cible = deleteTarget;
    setDeleteTarget(null);
    try {
      const response = await fetch(`${API_URL}/api/historique/${cible.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
      if (selected?.id === cible.id) setSelected(null);
      if (detail?.id === cible.id) setDetail(null);
      setReload((n) => n + 1);
      Swal.fire({ title: "✅", text: t("historique.delete_success"), icon: "success", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ title: "❌", text: t("historique.delete_error"), icon: "error" });
    }
  };

  const handleExportExcel = (lignes) => {
    const source = Array.isArray(lignes) ? lignes : list.sorted;
    if (!source.length) return;
    exportExcel({
      fileName: "historique",
      sheetName: t("historique.title"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const voirLinge = (e) => {
    if (!e) return;
    const code = codeLinge(e);
    if (!code || code === "N/A") {
      Swal.fire({ title: t("historique.no_linen_code", "Code du linge introuvable"), icon: "warning" });
      return;
    }
    setDetail(null);
    navigate(`/tracking?code=${encodeURIComponent(code)}`);
  };

  const TABLE_COLUMNS = {
    date: {
      label: t("historique.date_time"), sortable: true,
      render: (e) => {
        const d = e.dateOperation ? new Date(e.dateOperation) : null;
        return d ? (
          <div className="kit-datetime">
            <strong>{d.toLocaleDateString("fr-FR")}</strong>
            <small><Clock size={11} /> {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</small>
          </div>
        ) : "—";
      },
    },
    linge: { label: t("historique.linen_code"), sortable: true, render: (e) => <Code>{codeLinge(e)}</Code> },
    service: { label: t("common.service"), sortable: true, render: (e) => serviceDe(e) || <span className="kit-muted">—</span> },
    etat: { label: t("historique.state"), sortable: true, render: (e) => <EtatBadge etat={e.etatApres || e.etat} /> },
    operation: { label: t("historique.operation"), sortable: true, render: (e) => <Operation op={e.typeOperation} entree={e} /> },
    agent: {
      label: t("historique.agent"), sortable: true,
      render: (e) => (e.personnelId ? <PersonName name={agentDe(e)} strong={false} /> : <span className="kit-muted" style={{ fontStyle: "italic" }}>{agentDe(e)}</span>),
    },
    observations: {
      label: t("historique.observations"),
      tdProps: (e) => ({ title: e.observations || e.remarques || "", style: { maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }),
      render: (e) => e.observations || e.remarques || <span className="kit-muted">—</span>,
    },
    actions: {
      label: t("common.actions"), align: "center",
      render: (e) => (
        <RowActions>
          <RowButton icon={Eye} title={t("historique.movement_details")} onClick={() => ouvrirDetail(e)} />
          <RowButton icon={History} title={t("linge.history", "Historique du linge")} onClick={() => voirLinge(e)} />
          <RowButton icon={Trash2} tone="danger" title={t("common.delete")} onClick={() => setDeleteTarget(e)} />
        </RowActions>
      ),
    },
  };

  const compter = (fn) => Object.entries(list.sorted.reduce((acc, e) => { const k = fn(e); if (k) acc[k] = (acc[k] || 0) + 1; return acc; }, {}))
    .map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  return (
    <Page>
      <ActionBar>
        <ActionButton icon={IconDetails} label={t("historique.movement_details")} variant="details" disabled={!selected} onClick={() => ouvrirDetail(selected)} />
        <ActionButton icon={History} label={t("linge.history", "Historique du linge")} variant="imprimer" disabled={!selected} onClick={() => voirLinge(selected)} />
        <ActionButton icon={IconSupprimer} label={t("common.delete")} variant="supprimer" disabled={!selected} onClick={() => setDeleteTarget(selected)} />
        <ActionButton icon={<RefreshCw size={18} className={loading ? "animate-spin" : ""} />} label={t("common.refresh")} variant="details" onClick={() => setReload((n) => n + 1)} />
      </ActionBar>

      <FilterPanel>
        <FilterRow>
          <FilterSelect
            label={t("historique.state")}
            value={draft.etat}
            onChange={(v) => setFilter("etat", v)}
            allLabel={t("historique.all_states")}
            options={["LIVRE", "COLLECTE", "LAVE", "SECHE", "PLIE", "STOCKE"].map((v) => ({ value: v, label: etatLabel(v) }))}
          />
          {list.isColVisible("operation") && (
            <FilterSelect
              label={t("historique.operation")}
              value={draft.operation}
              onChange={(v) => setFilter("operation", v)}
              allLabel={t("historique.all_types")}
              options={typesOperations.map((v) => ({ value: v, label: operationLabel(v) }))}
            />
          )}
          <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
          <FilterText
            label={t("common.search")}
            placeholder={t("historique.search_placeholder")}
            value={draft.searchTerm}
            onChange={(v) => setFilter("searchTerm", v)}
            onEnter={list.apply}
          />
        </FilterRow>
        <FilterRow>
          {list.isColVisible("date") && (
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

      <ListSection selection={sel} unit="mouvement" units="mouvements" bulkActions={[{ label: tk("exportExcel", "Exporter Excel"), onClick: (l) => handleExportExcel(l) }]}>
        <DataTable
          columns={TABLE_COLUMNS}
          visible={list.visibleColumns}
          rows={list.sorted}
          sort={list.sort}
          onSort={list.toggleSort}
          selection={sel}
          activeId={selected?.id}
          onRowClick={(e) => setSelected(selected?.id === e.id ? null : e)}
          onRowDoubleClick={ouvrirDetail}
          loading={loading}
          loadingText={t("common.loading")}
          emptyText={t("historique.no_history")}
        />
        <Pagination
          total={totalItems}
          page={page + 1}
          totalPages={Math.max(totalPages, 1)}
          pageSize={size}
          onPage={(p) => setPage(p - 1)}
          unit={t("historique.entries_found")}
        />
      </ListSection>

      {detail && (
        <Modal
          size="md"
          icon={<History size={20} />}
          title={t("historique.movement_details")}
          subtitle={`#${detail.id} · ${formatDate(detail.dateOperation)}`}
          onClose={() => setDetail(null)}
          footer={(
            <>
              <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setDeleteTarget(detail)}>{t("common.delete")}</Button>
              <Button variant="secondary" icon={<History size={16} />} onClick={() => voirLinge(detail)}>{t("linge.history", "Historique du linge")}</Button>
              <Button onClick={() => setDetail(null)}>{t("common.close")}</Button>
            </>
          )}
        >
          <div className="kit-transition">
            <div className="kit-transition__step">
              <small>{t("historique.state_before")}</small>
              <EtatBadge etat={detail.etatAvant} />
            </div>
            <div className="kit-transition__arrow" style={{ "--op": couleurOperation(detail.typeOperation) }}>
              <Operation op={detail.typeOperation} entree={detail} />
              <ArrowRight size={18} />
            </div>
            <div className="kit-transition__step">
              <small>{t("historique.state_after")}</small>
              <EtatBadge etat={detail.etatApres} />
            </div>
          </div>
          <DetailCard title={t("modal.identification", "Identification")}>
            <InfoList items={[
              { label: t("common.id"), value: detail.id },
              { label: t("historique.linen_code"), value: <Code>{codeLinge(detail)}</Code> },
              { label: t("common.service"), value: serviceDe(detail) || "—" },
              { label: t("historique.agent"), value: <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><User size={14} /> {agentDe(detail)}</span> },
              { label: t("historique.date_time"), value: formatDate(detail.dateOperation) },
            ]} />
          </DetailCard>
          <DetailCard title={t("historique.observations")}>
            <DetailText>{detail.observations || detail.remarques}</DetailText>
          </DetailCard>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          size="sm"
          tone="danger"
          title={t("historique.delete_confirm_title")}
          onClose={() => setDeleteTarget(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t("common.cancel")}</Button>
              <Button variant="danger" onClick={confirmDelete}>{t("historique.delete_confirm_yes")}</Button>
            </>
          )}
        >
          <p>{t("historique.delete_confirm_text")}</p>
          <div className="kit-modal-summary"><Code>{codeLinge(deleteTarget)}</Code> · {operationLabel(deleteTarget.typeOperation)} · {formatDate(deleteTarget.dateOperation)}</div>
        </Modal>
      )}

      {showStats && (
        <QuickStats
          title={t("historique.title")}
          subtitle={`${list.sorted.length} mouvement(s) · page ${page + 1} / ${Math.max(totalPages, 1)}`}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t("historique.entries_found"), value: list.sorted.length },
            { label: t("historique.linen_code"), value: new Set(list.sorted.map(codeLinge)).size, color: "#3b82f6" },
            { label: t("historique.agent"), value: new Set(list.sorted.map((e) => e.personnelId).filter(Boolean)).size, color: "#8b5cf6" },
          ]}
          repartitions={[{
            title: t("historique.operation"),
            items: typesOperations.map((op) => ({ label: operationLabel(op), value: list.sorted.filter((e) => e.typeOperation === op).length, color: couleurOperation(op) })).filter((i) => i.value > 0),
          }]}
          classements={[
            { title: t("historique.agent"), personnel: true, items: compter((e) => (e.personnelId ? agentDe(e) : null)) },
            { title: t("common.service"), items: compter(serviceDe) },
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
