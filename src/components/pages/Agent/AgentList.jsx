import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Eye, Printer, UserCheck, CheckCircle, XCircle } from "lucide-react";

import BadgeModal from "../../ui/modals/BadgeModal";
import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";

import {
  Page, PageHeader, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterActions,
  ListSection, DataTable, Pagination, Badge, PersonCell,
  DetailsPage, DetailsButton, KpiTiles, DetailCard, DetailGrid, InfoList, PersonBlock,
  ColumnSettingsModal, useListPage, useRowSelection, exportExcel,
  RowActions, RowButton, Code,
} from "../../kit";
import { IconDetails } from "../../kit/ActionIcons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";
const PAGE_SERVEUR = 500;

const AGENT_STATIQUE = {
  id: "agent-statique",
  matricule: "P0002065",
  nom: "AMER",
  prenom: "MONTASSER",
  nomPrenom: "AMER MONTASSER",
  fonction: "STÉRILISATION",
  service: "Buanderie",
  codeBarre: "P0002065",
  pointeuseActif: true,
  administrateur: false,
  photo: null,
};
const avecAgentStatique = (liste) => (liste.some((a) => a.codeBarre === AGENT_STATIQUE.codeBarre) ? liste : [AGENT_STATIQUE, ...liste]);

const estActif = (v) => v === true || v === 1 || v === "1" || v === "true";
const nomAgent = (a) => a.nomPrenom || `${a.prenom || ""} ${a.nom || ""}`.trim() || a.matricule || `Agent #${a.id}`;
const fonctionAgent = (a) => a.fonctionCode || a.fonction || "";
const serviceAgent = (a) => a.serviceCode || a.service || "";

const COLUMNS_DEFAULT = [
  { key: "matricule", label: "Matricule", visible: true, searchable: true },
  { key: "nomPrenom", label: "Nom & Prénom", visible: true, searchable: true },
  { key: "fonction", label: "Fonction", visible: true, searchable: true },
  { key: "service", label: "Service", visible: true, searchable: true },
  { key: "codeBarre", label: "Code Barre", visible: true, searchable: true },
  { key: "pointeuseActif", label: "Pointeuse active", visible: false, searchable: false },
  { key: "administrateur", label: "Administrateur", visible: false, searchable: false },
  { key: "actions", label: "Actions", visible: true, searchable: false },
];

const searchValue = (a, key) => {
  switch (key) {
    case "nomPrenom": return nomAgent(a);
    case "fonction": return fonctionAgent(a);
    case "service": return serviceAgent(a);
    case "pointeuseActif":
    case "administrateur": return estActif(a[key]) ? "Oui" : "Non";
    case "actions": return "";
    default: return a[key] ?? "";
  }
};
const sortValue = (a, key) => String(searchValue(a, key)).toLowerCase();

const StatutBadge = ({ actif }) => (
  <Badge variant={estActif(actif) ? "success" : "danger"}>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      {estActif(actif) ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {estActif(actif) ? "Actif" : "Inactif"}
    </span>
  </Badge>
);

export default function AgentList() {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [badgeEmployee, setBadgeEmployee] = useState(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const fetchAgents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tous = [];
      let page = 0;
      let totalPages = 1;
      do {
        const response = await fetch(`${API_URL}/api/sqlserver/agents?page=${page}&size=${PAGE_SERVEUR}`);
        if (!response.ok) throw new Error(`Erreur chargement agents (${response.status})`);
        const data = await response.json();
        if (Array.isArray(data)) { tous.push(...data); break; }
        tous.push(...(Array.isArray(data.content) ? data.content : []));
        totalPages = data.totalPages ?? 1;
        page += 1;
      } while (page < totalPages);
      setAgents(avecAgentStatique(tous));
    } catch (err) {
      console.error("Erreur chargement agents :", err);
      setAgents([AGENT_STATIQUE]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  const services = useMemo(
    () => [...new Set(agents.map(serviceAgent).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")),
    [agents]
  );

  const list = useListPage({
    rows: agents,
    columns: COLUMNS_DEFAULT,
    getSearchValue: searchValue,
    getSortValue: sortValue,
    pageSize: 20,
    filters: {
      service: { initial: "all", column: "service", test: (a, v) => v === "all" || serviceAgent(a) === v },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const handleRowClick = (a) => setSelected(selected?.id === a.id ? null : a);
  const openDetails = (a) => { if (a) { setSelected(a); setViewMode("details"); } };

  const openBadgeModal = (a) => {
    if (!a) return;
    setBadgeEmployee({
      nom: a.nom || "",
      prenom: a.prenom || "",
      fonction: fonctionAgent(a),
      matricule: a.matricule || "",
      service: serviceAgent(a),
      codeBarre: a.codeBarre || "",
      photo: a.photo || null,
    });
  };

  const handleExportExcel = (lignes) => {
    const source = Array.isArray(lignes) ? lignes : list.sorted;
    if (!source.length) return;
    exportExcel({
      fileName: "agents",
      sheetName: "Agents",
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: source,
      getValue: searchValue,
    });
  };

  const TABLE_COLUMNS = {
    matricule: { label: "Matricule", sortable: true, render: (a) => <Code>{a.matricule}</Code> },
    nomPrenom: {
      label: "Nom & Prénom", sortable: true,
      render: (a) => <PersonCell id={a.id} nom={a.nom} prenom={a.prenom} label={nomAgent(a)} sub={fonctionAgent(a)} />,
    },
    fonction: { label: "Fonction", sortable: true, render: (a) => fonctionAgent(a) || "—" },
    service: { label: "Service", sortable: true, render: (a) => (serviceAgent(a) ? <Badge variant="info">{serviceAgent(a)}</Badge> : "—") },
    codeBarre: { label: "Code Barre", sortable: true, render: (a) => <Code>{a.codeBarre}</Code> },
    pointeuseActif: { label: "Pointeuse active", sortable: true, render: (a) => <StatutBadge actif={a.pointeuseActif} /> },
    administrateur: { label: "Administrateur", sortable: true, render: (a) => <StatutBadge actif={a.administrateur} /> },
    actions: {
      label: "Actions", align: "center",
      render: (a) => (
        <RowActions>
          <RowButton icon={Printer} title="Imprimer le badge" onClick={() => openBadgeModal(a)} />
          <RowButton icon={Eye} title="Voir les détails" onClick={() => openDetails(a)} />
        </RowActions>
      ),
    },
  };

  return (
    <Page>
      {viewMode === "list" && (
        <>
          <PageHeader
            icon={<PageHeaderIcon size={40} section="params" icon={<UserCheck />} />}
            title="Gestion des Agents"
            subtitle="Consultez et gérez les agents de l'entreprise"
            total={list.sorted.length}
            onIconClick={() => setShowColumnSettings(true)}
          />

          <ActionBar>
            <ActionButton
              icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />}
              label="Actualiser"
              variant="details"
              disabled={isLoading}
              onClick={fetchAgents}
            />
            <ActionButton icon={IconDetails} label="Détails" variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={Printer} label="Badge" variant="imprimer" disabled={!selected} onClick={() => openBadgeModal(selected)} />
          </ActionBar>

          <FilterPanel>
            <FilterRow>
              <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
              <FilterText
                label="Recherche"
                placeholder="Matricule, nom, prénom, fonction, service..."
                value={draft.searchTerm}
                onChange={(v) => setFilter("searchTerm", v)}
                onEnter={list.apply}
              />
              {list.isColVisible("service") && (
                <FilterSelect
                  label="Service"
                  value={draft.service}
                  onChange={(v) => setFilter("service", v)}
                  options={services.map((s) => ({ value: s, label: s }))}
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
            unit="agent"
            units="agents"
            bulkActions={[{ label: "Exporter Excel", onClick: (l) => handleExportExcel(l) }]}
          >
            <DataTable
              columns={TABLE_COLUMNS}
              visible={list.visibleColumns}
              rows={list.paginated}
              sort={list.sort}
              onSort={list.toggleSort}
              selection={sel}
              activeId={selected?.id}
              onRowClick={handleRowClick}
              onRowDoubleClick={openDetails}
              loading={isLoading && !agents.length}
              error={error}
              emptyText="Aucun agent trouvé"
            />
            <Pagination
              total={list.sorted.length}
              page={list.page}
              totalPages={list.totalPages}
              pageSize={list.pageSize}
              onPage={list.setPage}
              unit="agent(s)"
            />
          </ListSection>
        </>
      )}

      {viewMode === "details" && selected && (
        <DetailsPage
          onBack={() => setViewMode("list")}
          eyebrow="Agent"
          title={`${selected.matricule || `#${selected.id}`} · ${nomAgent(selected)}`}
          badge={serviceAgent(selected) ? <Badge variant="info" style={{ padding: "10px 18px", fontSize: "0.85rem" }}>{serviceAgent(selected)}</Badge> : null}
          actions={<DetailsButton icon={Printer} onClick={() => openBadgeModal(selected)}>Imprimer le badge</DetailsButton>}
        >
          <KpiTiles items={[
            { label: "Fonction", value: fonctionAgent(selected) || "—", tone: "blue" },
            { label: "Pointeuse", value: estActif(selected.pointeuseActif) ? "Active" : "Inactive", tone: estActif(selected.pointeuseActif) ? "green" : "amber" },
            { label: "Administrateur", value: estActif(selected.administrateur) ? "Oui" : "Non", tone: "violet" },
          ]} />
          <DetailGrid>
            <DetailCard title="Personne">
              <PersonBlock id={selected.id} nom={selected.nom} prenom={selected.prenom} name={nomAgent(selected)} sub={fonctionAgent(selected)} />
              <InfoList items={[
                { label: "Nom", value: selected.nom },
                { label: "Prénom", value: selected.prenom },
                { label: "Service", value: serviceAgent(selected) },
              ]} />
            </DetailCard>
            <DetailCard title="Identification">
              <InfoList items={[
                { label: "ID", value: selected.id },
                { label: "Matricule", value: selected.matricule },
                { label: "Code Barre", value: selected.codeBarre },
                { label: "Pointeuse active", value: <StatutBadge actif={selected.pointeuseActif} /> },
                { label: "Administrateur", value: <StatutBadge actif={selected.administrateur} /> },
              ]} />
            </DetailCard>
          </DetailGrid>
        </DetailsPage>
      )}

      <BadgeModal isOpen={!!badgeEmployee} onClose={() => setBadgeEmployee(null)} employee={badgeEmployee} />

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
