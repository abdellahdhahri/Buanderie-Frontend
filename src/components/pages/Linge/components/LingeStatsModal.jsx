import React from "react";
import { useTranslation } from "react-i18next";
import { FileSpreadsheet } from "lucide-react";
import { StatsModal, StatsContent, Button, DetailAlert } from "../../../kit";
import { ETAT_BADGE_VARIANTS } from "../lingeConstants";

const VARIANT_COLORS = { danger: "#e03131", info: "#0ea5e9", success: "#0ca678", warning: "#e67700", secondary: "#64748b" };
const etatColor = (etat) => VARIANT_COLORS[ETAT_BADGE_VARIANTS[etat]] || VARIANT_COLORS.secondary;

export function LingeStatsModal({ isOpen, onClose, stats, loading, error, filterChips, getServiceName, onExport, exporting }) {
  const { t } = useTranslation();
  if (!isOpen) return null;
  const fmt = (n, d = 0) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 });

  return (
    <StatsModal
      open
      title={t("linge.stats.title", "Statistiques des linges")}
      subtitle={t("linge.stats.subtitle", "Calculées sur tous les linges correspondant aux filtres, toutes pages confondues.")}
      onClose={onClose}
    >
      <div className="kit-toolbar">
        <div className="kit-chips">
          {filterChips.length
            ? filterChips.map((c) => <span key={c} className="kit-chip kit-chip--teal">{c}</span>)
            : <span className="kit-chip">{t("linge.stats.no_filter", "Aucun filtre : tous les linges")}</span>}
        </div>
        <Button variant="success" icon={<FileSpreadsheet size={16} />} onClick={onExport} disabled={loading || exporting || !stats?.total}>
          {t("linge.export.button", "Exporter en Excel")}
        </Button>
      </div>

      {error ? (
        <DetailAlert title={error} />
      ) : loading || !stats ? (
        <p className="kit-muted" style={{ textAlign: "center", padding: 24 }}>{t("common.loading")}</p>
      ) : (
        <StatsContent
          kpis={[
            { label: t("linge.stats.total", "Linges"), value: fmt(stats.total), color: "#0d9488" },
            { label: t("linge.stats.total_weight", "Poids total (kg)"), value: fmt(stats.poidsTotal, 1), color: "#0ea5e9" },
            { label: t("linge.stats.rfid", "Avec tag RFID"), value: `${stats.rfidPct}%`, color: "#6741d9" },
            { label: t("linge.stats.avg_lifespan", "Durée de vie moyenne"), value: fmt(stats.dureeMoyenne, 1), color: "#e67700" },
            { label: t("linge.stats.with_wearer", "{{count}} avec porteur", { count: "" }).trim() || "Avec porteur", value: fmt(stats.avecPorteur), color: "#3b82f6" },
            { label: t("linge.stats.no_service_count", "{{count}} sans service", { count: "" }).trim() || "Sans service", value: fmt(stats.sansService), color: "#94a3b8" },
          ]}
          repartitions={[{
            title: t("linge.stats.by_status", "Par état"),
            items: stats.parEtat.map((x) => ({ label: t(`linge_etat.${x.key}`, x.key), value: x.count, color: etatColor(x.key) })),
          }]}
          classements={[
            { title: t("linge.stats.by_category", "Par catégorie"), items: stats.parCategorie.map((x) => ({ label: t(`categories.${x.key}`, x.key), value: x.count })), max: 12 },
            { title: t("linge.stats.by_service", "Par service"), items: stats.parService.map((x) => ({ label: x.key ? getServiceName(x.key) : t("linge.unassigned", "Non assigné"), value: x.count })), max: 8 },
          ]}
        />
      )}
    </StatsModal>
  );
}
