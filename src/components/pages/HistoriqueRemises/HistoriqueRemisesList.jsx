import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import {
  Page, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterDateRange, FilterActions,
  ListSection, DataTable, Pagination, Badge, Code, DetailAlert,
} from "../../kit";
import { IconDetails } from "../../kit/ActionIcons";
import { serviceService } from "../../../services/serviceService";
import { ETATS_REMISE, dateRemise, listerRemises, quantites } from "../../../services/historiqueRemiseService";
import DetailRemise from "./DetailRemise";
import "./HistoriqueRemises.css";

const TAILLE = 20;
const FILTRES_VIDES = { service: "all", agent: "", etat: "all", dateDebut: "", dateFin: "", numero: "" };

const formatDate = (v) => (v ? new Date(v).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

export default function HistoriqueRemisesList() {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(FILTRES_VIDES);
  const [applied, setApplied] = useState(FILTRES_VIDES);
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const setFilter = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const charger = useCallback(async () => {
    setIsLoading(true);
    setErreur(null);
    try {
      const res = await listerRemises({ page, size: TAILLE, ...applied });
      setData({
        content: res?.content || [],
        totalElements: res?.totalElements ?? 0,
        totalPages: res?.totalPages ?? 0,
      });
    } catch (err) {
      setErreur(err.message);
      setData({ content: [], totalElements: 0, totalPages: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [page, applied]);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    serviceService.getAll(true).then(setServices).catch(() => {});
  }, []);

  const rechercher = () => { setPage(0); setApplied(draft); };
  const reinitialiser = () => { setDraft(FILTRES_VIDES); setApplied(FILTRES_VIDES); setPage(0); setSelected(null); };

  if (detailId != null) return <DetailRemise id={detailId} onBack={() => setDetailId(null)} />;

  const COLONNES = {
    numeroLivraison: { label: t("historique_remises.number", "N° livraison"), render: (r) => <Code>{r.numeroLivraison || `#${r.id}`}</Code> },
    date: { label: t("historique_remises.date", "Date"), render: (r) => formatDate(dateRemise(r)) },
    serviceNom: { label: t("historique_remises.service", "Service"), render: (r) => r.serviceNom || "—" },
    personnelNom: { label: t("historique_remises.agent", "Agent"), render: (r) => r.personnelNom || "—" },
    numeroCollecte: { label: t("historique_remises.collecte", "N° collecte"), render: (r) => (r.numeroCollecte ? <Code>{r.numeroCollecte}</Code> : "—") },
    collectee: { label: t("historique_remises.collected", "Collectée"), align: "center", render: (r) => quantites(r).collectee },
    remise: { label: t("historique_remises.delivered", "Remise"), align: "center", render: (r) => quantites(r).remise },
    restante: {
      label: t("historique_remises.remaining", "Restante"), align: "center",
      render: (r) => { const q = quantites(r).restante; return <span className={`hr-restant ${q > 0 ? "" : "is-zero"}`}>{q}</span>; },
    },
    etat: {
      label: t("historique_remises.state", "État"), align: "center",
      render: (r) => { const e = ETATS_REMISE[r.etat]; return e ? <Badge variant={e.variant}>{e.label}</Badge> : (r.etat || "—"); },
    },
  };

  return (
    <Page>
      <ActionBar>
        <ActionButton icon={IconDetails} label={t("common.details", "Détails")} variant="details" disabled={!selected} onClick={() => setDetailId(selected.id)} />
        <ActionButton icon={<RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />} label={t("common.refresh", "Actualiser")} variant="details" onClick={charger} />
      </ActionBar>

      <FilterPanel>
        <FilterRow>
          <FilterText
            label={t("historique_remises.number", "N° livraison")}
            placeholder={t("historique_remises.number_placeholder", "Rechercher un numéro…")}
            value={draft.numero}
            onChange={(v) => setFilter("numero", v)}
            onEnter={rechercher}
          />
          <FilterSelect
            label={t("historique_remises.service", "Service")}
            value={draft.service}
            onChange={(v) => setFilter("service", v)}
            allLabel={t("common.all", "Tous")}
            options={services.map((s) => ({ value: s.id, label: s.nom || s.designation || s.libelle || `#${s.id}` }))}
          />
          <FilterText
            label={t("historique_remises.agent", "Agent")}
            value={draft.agent}
            onChange={(v) => setFilter("agent", v)}
            onEnter={rechercher}
          />
          <FilterSelect
            label={t("historique_remises.state", "État")}
            value={draft.etat}
            onChange={(v) => setFilter("etat", v)}
            allLabel={t("common.all", "Tous")}
            options={Object.entries(ETATS_REMISE).map(([value, e]) => ({ value, label: e.label }))}
          />
          <FilterDateRange from={draft.dateDebut} to={draft.dateFin} onFrom={(v) => setFilter("dateDebut", v)} onTo={(v) => setFilter("dateFin", v)} />
          <FilterActions onSearch={rechercher} count={data.totalElements} onReset={reinitialiser} />
        </FilterRow>
      </FilterPanel>

      {erreur && <DetailAlert title={t("common.error", "Erreur")}>{erreur}</DetailAlert>}

      <ListSection unit="livraison" units="livraisons">
        <DataTable
          columns={COLONNES}
          rows={data.content}
          rowKey={(r) => r.id}
          activeId={selected?.id}
          onRowClick={(r) => { setSelected(r); setDetailId(r.id); }}
          loading={isLoading && !data.content.length}
          loadingText={t("common.loading", "Chargement…")}
          emptyText={t("common.no_data", "Aucune donnée")}
        />
        <Pagination
          total={data.totalElements}
          page={page + 1}
          totalPages={data.totalPages}
          pageSize={TAILLE}
          onPage={(p) => setPage(p - 1)}
          unit="livraison(s)"
        />
      </ListSection>
    </Page>
  );
}
