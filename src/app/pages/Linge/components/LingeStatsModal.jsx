import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { BarChart3, FileSpreadsheet, Filter } from "lucide-react";
import { Modal } from "../../../components/ui/modal";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import { ETAT_BADGE_VARIANTS } from "../lingeConstants";

// Couleur de chaque état, alignée sur les badges du tableau
const VARIANT_COLORS = {
  destructive: "#e03131",
  info: "#0ea5e9",
  success: "#0ca678",
  warning: "#e67700",
  secondary: "#64748b",
};
const etatColor = (etat) => VARIANT_COLORS[ETAT_BADGE_VARIANTS[etat]] || VARIANT_COLORS.secondary;

function Tile({ label, value, hint, color }) {
  return (
    <div className="relative overflow-hidden rounded-[16px] border border-slate-200/70 bg-white px-4 py-3.5">
      <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-[0.08]" style={{ background: color }} />
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">{label}</p>
      <p className="text-2xl font-extrabold text-slate-800 tabular-nums mt-0.5">{value}</p>
      {hint && <p className="text-[11px] text-slate-500 truncate">{hint}</p>}
    </div>
  );
}

function BarList({ title, items, total, renderLabel, colorOf, iconOf, limit }) {
  const shown = limit ? items.slice(0, limit) : items;
  const rest = limit ? items.slice(limit).reduce((s, x) => s + x.count, 0) : 0;
  const max = Math.max(1, ...items.map((x) => x.count));
  return (
    <section className="rounded-[16px] border border-slate-200/70 bg-white p-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{title}</h4>
      {shown.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">—</p>
      ) : (
        <div className="space-y-2.5">
          {shown.map((x, i) => {
            const color = colorOf(x.key);
            const Icon = iconOf?.(x.key);
            const pct = total ? Math.round((x.count / total) * 100) : 0;
            return (
              <div key={String(x.key)} className="flex items-center gap-2.5">
                {Icon ? (
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ color, background: `${color}14` }}>
                    <Icon className="w-4 h-4" strokeWidth={1.9} />
                  </span>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 ml-1" style={{ background: color }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] font-semibold text-slate-700 truncate">{renderLabel(x.key)}</span>
                    <span className="text-[13px] tabular-nums whitespace-nowrap">
                      <b className="text-slate-800">{x.count}</b>
                      <span className="text-slate-400 text-[11px] ml-1.5">{pct}%</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: color }}
                      initial={{ width: 0 }} animate={{ width: `${(x.count / max) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.03 }} />
                  </div>
                </div>
              </div>
            );
          })}
          {rest > 0 && <p className="text-[11px] text-slate-400 pt-1">+ {rest} …</p>}
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 📊 STATISTIQUES DE LA SÉLECTION (tous les linges correspondant aux filtres)
// ═══════════════════════════════════════════════════════════════════════════
export function LingeStatsModal({ isOpen, onClose, stats, loading, error, filterChips, getServiceName, onExport, exporting }) {
  const { t } = useTranslation();
  const fmt = (n, d = 0) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="info"
      icon={<BarChart3 className="w-5 h-5" />}
      title={t("linge.stats.title", "Statistiques des linges")}
      subtitle={t("linge.stats.subtitle", "Calculées sur tous les linges correspondant aux filtres, toutes pages confondues.")}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50">
            {t("common.close", "Fermer")}
          </button>
          <button type="button" onClick={onExport} disabled={loading || exporting || !stats?.total}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-bold text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
            <FileSpreadsheet className="w-4 h-4" /> {t("linge.export.button", "Exporter en Excel")}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filtres appliqués */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          {filterChips.length ? filterChips.map((c) => (
            <span key={c} className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/70 text-[11px] font-semibold text-teal-700">{c}</span>
          )) : (
            <span className="text-xs text-slate-500">{t("linge.stats.no_filter", "Aucun filtre : tous les linges")}</span>
          )}
        </div>

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        ) : loading || !stats ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-[84px] rounded-[16px] bg-slate-100 animate-pulse" />)}</div>
            <div className="grid md:grid-cols-2 gap-3">{[1, 2].map((i) => <div key={i} className="h-56 rounded-[16px] bg-slate-100 animate-pulse" />)}</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Tile label={t("linge.stats.total", "Linges")} value={fmt(stats.total)} color="#0d9488"
                hint={t("linge.stats.with_wearer", "{{count}} avec porteur", { count: stats.avecPorteur })} />
              <Tile label={t("linge.stats.total_weight", "Poids total (kg)")} value={fmt(stats.poidsTotal, 1)} color="#0ea5e9"
                hint={`${t("linge.stats.avg", "Moyenne")} ${fmt(stats.poidsMoyen, 2)} kg`} />
              <Tile label={t("linge.stats.rfid", "Avec tag RFID")} value={`${stats.rfidPct}%`} color="#6741d9"
                hint={`${fmt(stats.rfid)} / ${fmt(stats.total)}`} />
              <Tile label={t("linge.stats.avg_lifespan", "Durée de vie moyenne")} value={fmt(stats.dureeMoyenne, 1)} color="#e67700"
                hint={stats.sansService ? t("linge.stats.no_service_count", "{{count}} sans service", { count: stats.sansService }) : t("linge.stats.all_assigned", "Tous rattachés à un service")} />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <BarList title={t("linge.stats.by_status", "Par état")} items={stats.parEtat} total={stats.total}
                renderLabel={(k) => t(`linge_etat.${k}`, k)} colorOf={etatColor} />
              <BarList title={t("linge.stats.by_category", "Par catégorie")} items={stats.parCategorie} total={stats.total}
                renderLabel={(k) => t(`categories.${k}`, k)} colorOf={(k) => getCategorieMeta(k).accent} iconOf={(k) => getCategorieMeta(k).Icon} />
            </div>

            <BarList title={t("linge.stats.by_service", "Par service")} items={stats.parService} total={stats.total} limit={8}
              renderLabel={(id) => (id ? getServiceName(id) : t("linge.unassigned", "Non assigné"))}
              colorOf={(id) => (id ? "#0d9488" : "#94a3b8")} />
          </>
        )}
      </div>
    </Modal>
  );
}
