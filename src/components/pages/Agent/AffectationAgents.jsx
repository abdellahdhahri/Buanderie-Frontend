import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Building2 } from "lucide-react";
import { useServiceContext } from "../../../contextes/ServiceContext";
import {
  fetchAssociationsEtapes,
  fetchPersonnelFiche,
  affecterService,
} from "../../../services/affectationServiceService";
import {
  Page, ActionBar, ActionButton, FilterPanel, FilterRow, FilterSelect, FilterText, FilterActions,
  ListSection, QuickStats, DataTable, Pagination, Badge, PersonCell, Code, useListPage, useRowSelection,
} from "../../kit";

const TAILLE_LOT = 8;
const COULEURS = ["info", "success", "warning", "default"];

const lireServiceAffectation = (p) => {
  const v = p?.serviceAffectationID ?? p?.serviceAffectationId ?? p?.ServiceAffectationID ?? p?.serviceAffectation?.id ?? null;
  return v === undefined || v === null || v === "" ? null : Number(v);
};

const aChampAffectation = (o) => !!o && ("serviceAffectationID" in o || "serviceAffectationId" in o || "serviceAffectation" in o);

const nomEtape = (a) =>
  a.lingeEtapeNom || a.etapeNom || a.lingeEtapeLibelle || a.lingeEtape?.nom || a.lingeEtape?.libelle || a.etape?.nom || (a.lingeEtapeId ? `Étape #${a.lingeEtapeId}` : "");

const regrouper = (associations) => {
  const agents = new Map();
  (Array.isArray(associations) ? associations : []).forEach((a) => {
    const p = a.personnel || {};
    const id = a.personnelId ?? p.id;
    if (id === undefined || id === null) return;
    if (!agents.has(id)) {
      agents.set(id, {
        id,
        nom: a.personnelNom ?? p.nom ?? a.nom ?? "",
        prenom: a.personnelPrenom ?? p.prenom ?? a.prenom ?? "",
        matricule: a.personnelMatricule ?? p.matricule ?? a.matricule ?? a.codeBarre ?? "",
        etapes: [],
        serviceAffectationId: lireServiceAffectation(p) ?? lireServiceAffectation(a),
        connu: aChampAffectation(p) || aChampAffectation(a),
      });
    }
    const agent = agents.get(id);
    const etape = nomEtape(a);
    if (etape && !agent.etapes.includes(etape)) agent.etapes.push(etape);
  });
  return [...agents.values()];
};

const nomComplet = (a) => `${a.nom || ""} ${a.prenom || ""}`.trim() || `Agent #${a.id}`;

const COLUMNS = [
  { key: "nomPrenom", label: "Nom Prénom", visible: true, searchable: true },
  { key: "matricule", label: "Matricule", visible: true, searchable: true },
  { key: "etapes", label: "Étape(s) affectée(s)", visible: true, searchable: false },
  { key: "service", label: "Service d'affectation", visible: true, searchable: false },
];

const valeurRecherche = (a, key) => {
  if (key === "nomPrenom") return nomComplet(a);
  if (key === "etapes") return a.etapes.join(" ");
  if (key === "service") return a.serviceAffectationId ?? "";
  return a[key] ?? "";
};

export default function AffectationAgents() {
  const { services } = useServiceContext();
  const [agents, setAgents] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(() => new Set());
  const [cibleMasse, setCibleMasse] = useState("");
  const [masseEnCours, setMasseEnCours] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const servicesTries = useMemo(
    () => [...services].filter((s) => s.actif !== false).sort((a, b) => String(a.nom).localeCompare(String(b.nom), "fr")),
    [services]
  );
  const serviceParId = useMemo(() => new Map(services.map((s) => [Number(s.id), s])), [services]);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const liste = regrouper(await fetchAssociationsEtapes());
      setAgents(liste);
      const inconnus = liste.filter((a) => !a.connu);
      for (let i = 0; i < inconnus.length; i += TAILLE_LOT) {
        const lot = inconnus.slice(i, i + TAILLE_LOT);
        const fiches = await Promise.all(lot.map((a) => fetchPersonnelFiche(a.id).catch(() => null)));
        const maj = new Map();
        lot.forEach((a, k) => {
          const fiche = fiches[k];
          if (fiche) {
            maj.set(a.id, {
              serviceAffectationId: lireServiceAffectation(fiche),
              nom: a.nom || fiche.nom || "",
              prenom: a.prenom || fiche.prenom || "",
              matricule: a.matricule || fiche.matricule || fiche.codeBarre || "",
              connu: true,
            });
          }
        });
        setAgents((prev) => prev.map((a) => (maj.has(a.id) ? { ...a, ...maj.get(a.id) } : a)));
      }
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(charger, 0);
    return () => clearTimeout(id);
  }, [charger]);

  const list = useListPage({
    rows: agents,
    columns: COLUMNS,
    getSearchValue: valeurRecherche,
    getSortValue: valeurRecherche,
    pageSize: 20,
    defaultSort: (a, b) => nomComplet(a).localeCompare(nomComplet(b), "fr"),
    filters: {
      affectation: { initial: "all", test: (a, v) => v === "all" || (v === "sans" && !a.serviceAffectationId) },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const marquer = (id, actif) =>
    setEnCours((prev) => {
      const next = new Set(prev);
      if (actif) next.add(id); else next.delete(id);
      return next;
    });

  const appliquer = async (agent, serviceId) => {
    const ancien = agent.serviceAffectationId;
    const nouveau = serviceId ? Number(serviceId) : null;
    if (ancien === nouveau) return true;
    setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, serviceAffectationId: nouveau } : a)));
    marquer(agent.id, true);
    try {
      await affecterService(agent.id, nouveau);
      return true;
    } catch (e) {
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, serviceAffectationId: ancien } : a)));
      toast.error(`${nomComplet(agent)} : ${e.message}`);
      return false;
    } finally {
      marquer(agent.id, false);
    }
  };

  const changerUn = async (agent, valeur) => {
    const ok = await appliquer(agent, valeur);
    if (ok) {
      const s = serviceParId.get(Number(valeur));
      toast.success(valeur ? `${nomComplet(agent)} affecté à ${s?.nom || "ce service"}` : `Affectation retirée pour ${nomComplet(agent)}`);
    }
  };

  const affecterSelection = async () => {
    const cibles = sel.checkedItems;
    if (!cibles.length) return;
    setMasseEnCours(true);
    let reussis = 0;
    let echecs = 0;
    for (const agent of cibles) {
      const ok = await appliquer(agent, cibleMasse);
      if (ok) reussis += 1; else echecs += 1;
    }
    setMasseEnCours(false);
    sel.clear();
    const resume = `${reussis} affecté(s), ${echecs} en erreur`;
    if (echecs) toast.warning(resume); else toast.success(resume);
  };

  const nbSans = useMemo(() => agents.filter((a) => !a.serviceAffectationId).length, [agents]);

  const COLONNES_TABLE = {
    nomPrenom: {
      label: "Nom Prénom", sortable: true,
      render: (a) => <PersonCell id={a.id} nom={a.nom} prenom={a.prenom} label={nomComplet(a)} />,
    },
    matricule: { label: "Matricule", sortable: true, render: (a) => (a.matricule ? <Code>{a.matricule}</Code> : "—") },
    etapes: {
      label: "Étape(s) affectée(s)",
      render: (a) => (
        <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 6 }}>
          {a.etapes.length
            ? a.etapes.map((e, i) => <Badge key={e} variant={COULEURS[i % COULEURS.length]}>{e}</Badge>)
            : "—"}
        </span>
      ),
    },
    service: {
      label: "Service d'affectation",
      render: (a) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }} onClick={(e) => e.stopPropagation()}>
          <select
            className="form-select"
            style={{ minWidth: 190, borderLeft: a.serviceAffectationId ? "4px solid #0794a4" : "4px solid #cbd5e1" }}
            value={a.serviceAffectationId ?? ""}
            disabled={enCours.has(a.id) || masseEnCours || !a.connu}
            onChange={(e) => changerUn(a, e.target.value)}
          >
            <option value="">Aucune affectation</option>
            {servicesTries.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            {a.serviceAffectationId && !serviceParId.has(a.serviceAffectationId) && (
              <option value={a.serviceAffectationId}>Service #{a.serviceAffectationId}</option>
            )}
          </select>
          {enCours.has(a.id) && <RefreshCw size={14} className="animate-spin" />}
        </span>
      ),
    },
  };

  return (
    <Page>
      <ActionBar>
        <ActionButton
          icon={<RefreshCw size={18} className={chargement ? "animate-spin" : ""} />}
          label="Actualiser"
          variant="details"
          disabled={chargement}
          onClick={charger}
        />
      </ActionBar>

      <FilterPanel>
        <FilterRow>
          <FilterText
            label="Recherche"
            placeholder="Nom ou matricule..."
            value={draft.searchTerm}
            onChange={(v) => setFilter("searchTerm", v)}
            onEnter={list.apply}
          />
          <FilterSelect
            label="Affectation"
            value={draft.affectation}
            onChange={(v) => setFilter("affectation", v)}
            allLabel="Tous"
            options={[{ value: "sans", label: "Sans service d'affectation" }]}
          />
          <FilterActions onSearch={list.apply} count={list.sorted.length} onReset={list.reset} onStats={() => setShowStats(true)} />
        </FilterRow>
      </FilterPanel>

      {sel.count > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 14px", margin: "8px 0", borderRadius: 12, background: "#e9f8fa", border: "1px solid #b6e6ec" }}>
          <strong>{sel.count} agent(s) sélectionné(s)</strong>
          <select className="form-select" style={{ minWidth: 200 }} value={cibleMasse} onChange={(e) => setCibleMasse(e.target.value)} disabled={masseEnCours}>
            <option value="">Aucune affectation</option>
            {servicesTries.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
          <ActionButton
            icon={<Building2 size={18} />}
            label="Affecter la sélection à…"
            variant="ajouter"
            disabled={masseEnCours}
            onClick={affecterSelection}
          />
        </div>
      )}

      <ListSection selection={sel} unit="agent" units="agents">
        <DataTable
          columns={COLONNES_TABLE}
          visible={list.visibleColumns}
          rows={list.paginated}
          sort={list.sort}
          onSort={list.toggleSort}
          selection={sel}
          loading={chargement && !agents.length}
          error={erreur}
          emptyText="Aucun agent affecté à une étape. Passez d'abord par l'affectation personnel ↔ étape."
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
      {showStats && (
        <QuickStats
          title="Affectation des agents"
          subtitle={`${agents.length} agent(s) sur le parcours`}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: "Agents sur le parcours", value: agents.length },
            { label: "Avec service d'affectation", value: agents.length - nbSans, color: "#10b981" },
            { label: "Sans service d'affectation", value: nbSans, color: "#f59e0b" },
          ]}
          repartitions={[
            {
              title: "Affectation",
              items: [
                { label: "Avec service", value: agents.length - nbSans, color: "#10b981" },
                { label: "Sans service", value: nbSans, color: "#f59e0b" },
              ],
            },
          ]}
        />
      )}
    </Page>
  );
}
