import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge, DataTable, DetailAlert, DetailCard, DetailsPage, InfoList, KpiTiles } from "../../kit";
import { ETATS_REMISE, dateRemise, detailRemise, quantites } from "../../../services/historiqueRemiseService";
import BarreProgression from "./BarreProgression";
import "./HistoriqueRemises.css";

const formatDate = (v) => (v ? new Date(v).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

export default function DetailRemise({ id, onBack }) {
  const { t } = useTranslation();
  const [remise, setRemise] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let vivant = true;
    setChargement(true);
    setErreur(null);
    detailRemise(id)
      .then((d) => { if (vivant) setRemise(d); })
      .catch((e) => { if (vivant) setErreur(e.message); })
      .finally(() => { if (vivant) setChargement(false); });
    return () => { vivant = false; };
  }, [id]);

  const items = remise?.items || [];
  const totaux = items.reduce(
    (acc, i) => {
      const q = quantites(i);
      return { collectee: acc.collectee + q.collectee, remise: acc.remise + q.remise, restante: acc.restante + q.restante };
    },
    { collectee: 0, remise: 0, restante: 0 }
  );
  const etat = ETATS_REMISE[remise?.etat];
  const cloturee = remise?.cloturee ?? remise?.etat === "COMPLETEE";

  const COLONNES = {
    categorie: { label: t("historique_remises.category", "Catégorie"), render: (i) => <strong>{t(`categories.${i.categorie}`, i.categorie || "—")}</strong> },
    collectee: { label: t("historique_remises.collected", "Collectée"), align: "center", render: (i) => quantites(i).collectee },
    remise: { label: t("historique_remises.delivered", "Remise"), align: "center", render: (i) => quantites(i).remise },
    restante: {
      label: t("historique_remises.remaining", "Restante"), align: "center",
      render: (i) => { const r = quantites(i).restante; return <span className={`hr-restant ${r > 0 ? "" : "is-zero"}`}>{r}</span>; },
    },
    progression: {
      label: t("historique_remises.progress", "Progression"),
      render: (i) => { const q = quantites(i); return <BarreProgression remise={q.remise} collectee={q.collectee} />; },
    },
  };

  return (
    <DetailsPage
      onBack={onBack}
      eyebrow={t("historique_remises.details", "Détail de la livraison")}
      title={remise ? `${remise.numeroLivraison || `#${remise.id}`}` : `#${id}`}
      badge={etat ? <Badge variant={etat.variant}>{etat.label}</Badge> : undefined}
    >
      {erreur ? (
        <DetailAlert icon={<AlertTriangle size={16} />} title={t("common.error", "Erreur")}>{erreur}</DetailAlert>
      ) : (
        <>
          <KpiTiles items={[
            { label: t("historique_remises.collected", "Collectée"), value: totaux.collectee, tone: "blue" },
            { label: t("historique_remises.delivered", "Remise"), value: totaux.remise, tone: "green" },
            { label: t("historique_remises.remaining", "Restante"), value: totaux.restante, tone: "amber" },
          ]} />
          <DetailCard title={t("historique_remises.header", "En-tête")}>
            <InfoList items={[
              { label: t("historique_remises.number", "N° livraison"), value: remise?.numeroLivraison },
              { label: t("historique_remises.date", "Date"), value: formatDate(dateRemise(remise)) },
              { label: t("historique_remises.service", "Service"), value: remise?.serviceNom },
              { label: t("historique_remises.agent", "Agent"), value: remise?.personnelNom },
              { label: t("historique_remises.collecte", "N° collecte"), value: remise?.numeroCollecte },
              { label: t("historique_remises.state", "État"), value: etat ? <Badge variant={etat.variant}>{etat.label}</Badge> : remise?.etat },
              {
                label: t("historique_remises.closed", "Clôturée"),
                value: cloturee
                  ? <Badge variant="success"><CheckCircle2 size={11} style={{ marginRight: 4, verticalAlign: -1 }} />{t("common.yes", "Oui")}</Badge>
                  : <Badge variant="secondary">{t("common.no", "Non")}</Badge>,
              },
            ]} />
          </DetailCard>
          <DetailCard title={`${t("historique_remises.items", "Détail par catégorie")} · ${items.length}`}>
            <DataTable
              columns={COLONNES}
              rows={items}
              rowKey={(i, idx) => i.id ?? i.categorie ?? idx}
              loading={chargement}
              loadingText={t("common.loading", "Chargement…")}
              emptyText={t("common.no_data", "Aucune donnée")}
            />
            {items.length > 0 && (
              <div className="hr-total-bar" role="group" aria-label={t("historique_remises.total", "Total")}>
                <span>{t("historique_remises.total", "Total")}</span>
                <span>{t("historique_remises.collected", "Collectée")} : <strong>{totaux.collectee}</strong></span>
                <span>{t("historique_remises.delivered", "Remise")} : <strong>{totaux.remise}</strong></span>
                <span>{t("historique_remises.remaining", "Restante")} : <strong>{totaux.restante}</strong></span>
                <BarreProgression remise={totaux.remise} collectee={totaux.collectee} />
              </div>
            )}
          </DetailCard>
        </>
      )}
    </DetailsPage>
  );
}
